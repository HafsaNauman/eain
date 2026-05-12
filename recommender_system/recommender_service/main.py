"""
recommender_service/main.py
EAIN Recommender — Sitting 20
FastAPI service exposing the final recommender pipeline.
Embedding model: sentence-transformers/all-MiniLM-L6-v2 (384-dim, ~90MB)

Endpoints:
- GET  /health
- POST /recommend/for-you
- GET  /recommend/similar/{listing_id}
- POST /recommend/voice-rerank
- POST /recommend/visual-rerank
- POST /events/log
"""

from __future__ import annotations
import os, json, ast, time
from pathlib import Path
from typing import Optional, List, Dict, Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from recommender.pipeline import EAINRecommender, PipelineConfig, EnsembleWeights

BASE_DIR = Path(__file__).resolve().parent.parent
DATA     = BASE_DIR / "data"
PORT     = int(os.getenv("PORT", "8001"))

app = FastAPI(title="EAIN Recommender Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────
# Request / response models
# ─────────────────────────────────────────────────────────────────
class ForYouRequest(BaseModel):
    user_id: Optional[str] = None
    query: Optional[str] = None
    exclude_ids: List[str] = Field(default_factory=list)
    top_k: int = 10


class VoiceRerankRequest(BaseModel):
    user_id: Optional[str] = None
    transcript: str
    top_k: int = 10


class VisualRerankRequest(BaseModel):
    user_id: Optional[str] = None
    visual_embedding: List[float]
    top_k: int = 10


class EventLogRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    listing_id: str
    event_type: str
    timestamp: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ─────────────────────────────────────────────────────────────────
# Load pipeline assets at startup
# ─────────────────────────────────────────────────────────────────
def _load_assets():
    item_embs = np.load(DATA / "item_embeddings_filtered.npy")
    user_embs = np.load(DATA / "user_profile_embeddings.npy")
    with open(DATA / "item_ids_filtered.json", encoding="utf-8") as f:
        item_ids = json.load(f)
    with open(DATA / "user_ids_embedded.json", encoding="utf-8") as f:
        user_ids = json.load(f)

    # Metadata
    df = pd.read_csv(DATA / "eain_items.csv")
    df["listing_id"] = df["listing_id"].astype(str)
    if "tags" in df.columns:
        df["tags"] = df["tags"].apply(lambda t: ast.literal_eval(t) if isinstance(t, str) else [])
    items_meta = {str(r["listing_id"]): r.to_dict() for _, r in df.iterrows()}

    # Popularity
    df_train = pd.read_csv(DATA / "train.csv")
    pop = df_train.groupby("listing_id")["event_weight"].sum().to_dict()
    pop = {str(k): float(v) for k, v in pop.items()}

    cfg = PipelineConfig(
        top_k=10,
        embedding_model="sentence-transformers/all-MiniLM-L6-v2",
        weights=EnsembleWeights(w_emb=0.50, w_pop=0.15, w_ce=0.20, w_ctx=0.15),
        # MMR diversity: selects items that are both relevant AND spread across
        # embedding space, so "For You" looks different from the flat catalog list.
        diversity_lambda=0.2,
    )

    rec = EAINRecommender(
        item_embeddings=item_embs,
        item_ids=item_ids,
        items_meta=items_meta,
        user_embeddings=user_embs,
        user_ids=user_ids,
        popularity_scores=pop,
        config=cfg,
    )
    # Pre-warm the SentenceTransformer encoder so the first voice/text-rerank
    # request is not delayed by model download (~90 MB MiniLM).
    # NOTE: similar-items calls no longer trigger this path (visual_emb is
    #       normalised directly), but voice/visual-text still need it.
    print("[INFO] Pre-loading SentenceTransformer encoder…")
    rec._get_encoder()
    print("[INFO] Encoder ready")
    return rec


recommender = None
STARTUP_OK = False
STARTUP_ERROR = "loading"

import threading
def _background_load():
    global recommender, STARTUP_OK, STARTUP_ERROR
    try:
        recommender = _load_assets()
        STARTUP_OK = True
        STARTUP_ERROR = None
        print("[OK] Recommender ready")
    except Exception as e:
        STARTUP_ERROR = str(e)
        print(f"[ERR] Load failed: {e}")

threading.Thread(target=_background_load, daemon=True).start()

# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────
def _ensure_ready():
    if not STARTUP_OK or recommender is None:
        raise HTTPException(status_code=503, detail=f"Service not ready: {STARTUP_ERROR}")


def _serialize_result(res: dict) -> dict:
    return {
        "status": "ok",
        "user_id": res.get("user_id"),
        "query": res.get("query"),
        "top_k": res.get("top_k"),
        "latency_ms": res.get("latency_ms"),
        "method": res.get("method"),
        "results": res.get("results", []),
    }


# ─────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    if STARTUP_OK:
        return {
            "status": "ok",
            "service": "eain-recommender",
            "vectors_indexed": len(recommender.item_ids),
            "users_indexed": len(recommender.user_ids),
        }
    return {"status": "initialising", "error": STARTUP_ERROR}


@app.post("/recommend/for-you")
def recommend_for_you(req: ForYouRequest):
    _ensure_ready()
    res = recommender.full_pipeline_recommend(
        user_id=req.user_id,
        query=req.query,
        exclude_ids=req.exclude_ids,
        top_k=req.top_k,
    )
    return _serialize_result(res)


@app.get("/recommend/similar/{listing_id}")
def recommend_similar(listing_id: str, top_k: int = 10):
    _ensure_ready()
    if listing_id not in recommender._iid_to_idx:
        raise HTTPException(status_code=404, detail=f"listing_id {listing_id} not found")
    idx = recommender._iid_to_idx[listing_id]
    visual_proxy = recommender.item_embs[idx]
    res = recommender.full_pipeline_recommend(
        visual_emb=visual_proxy,
        exclude_ids=[listing_id],
        top_k=top_k,
    )
    return _serialize_result(res)


@app.post("/recommend/voice-rerank")
def recommend_voice_rerank(req: VoiceRerankRequest):
    _ensure_ready()
    res = recommender.full_pipeline_recommend(
        user_id=req.user_id,
        query=req.transcript,
        top_k=req.top_k,
    )
    return _serialize_result(res)


@app.post("/recommend/visual-rerank")
def recommend_visual_rerank(req: VisualRerankRequest):
    _ensure_ready()
    visual = np.array(req.visual_embedding, dtype=np.float32)
    res = recommender.full_pipeline_recommend(
        user_id=req.user_id,
        visual_emb=visual,
        top_k=req.top_k,
    )
    return _serialize_result(res)


@app.post("/events/log")
def log_event(req: EventLogRequest):
    _ensure_ready()
    DATA.mkdir(parents=True, exist_ok=True)
    log_path = DATA / "events_log.jsonl"
    payload = req.model_dump()
    payload["server_ts"] = time.time()
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return {"status": "logged", "path": str(log_path.name)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("recommender_service.main:app", host="0.0.0.0", port=PORT, reload=True)
