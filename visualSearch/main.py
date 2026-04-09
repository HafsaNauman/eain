# import faiss
# import torch
# import numpy as np
# import requests
# import json
# import io
# import os
# import threading
# import boto3
# from typing import List
# from fastapi import FastAPI, UploadFile, File, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from PIL import Image
# from transformers import CLIPProcessor, CLIPModel
# from pydantic import BaseModel

# app = FastAPI(title="EAIN Visual Search ML Service")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ── Config ──────────────────────────────────────────────────────────────────
# DATA_DIR   = os.getenv("DATA_DIR", ".")
# MODEL_DIR  = os.getenv("MODEL_DIR", "./model")
# INDEX_FILE = os.path.join(DATA_DIR, "faiss.index")
# MAP_FILE   = os.path.join(DATA_DIR, "id_map.json")
# DIM        = 512
# device     = "cpu"
# _lock      = threading.Lock()

# print("Loading CLIP model...")
# model     = CLIPModel.from_pretrained(MODEL_DIR).to(device)
# model.eval()
# processor = CLIPProcessor.from_pretrained(MODEL_DIR)


# print("✅ Model ready")

# def get_s3_client():
#     key    = os.getenv("DO_SPACES_KEY")
#     secret = os.getenv("DO_SPACES_SECRET")
#     region = os.getenv("DO_SPACES_REGION")
#     if not key or not secret or not region:
#         return None
#     return boto3.client(
#         "s3",
#         region_name=region,
#         endpoint_url=f"https://{region}.digitaloceanspaces.com",
#         aws_access_key_id=key,
#         aws_secret_access_key=secret,
#     )

# def download_from_spaces():
#     s3     = get_s3_client()
#     bucket = os.getenv("DO_SPACES_BUCKET")
#     if not s3 or not bucket:
#         return
#     print("☁️  Checking DO Spaces for existing index files...")
#     for fname, dest in [("faiss.index", INDEX_FILE), ("id_map.json", MAP_FILE)]:
#         try:
#             s3.download_file(bucket, fname, dest)
#             print(f"☁️  ✅ Downloaded {fname}")
#         except Exception as e:
#             print(f"☁️  ⚠️  Could not download {fname} (first run?): {e}")

# def upload_to_spaces():
#     s3     = get_s3_client()
#     bucket = os.getenv("DO_SPACES_BUCKET")
#     if not s3 or not bucket:
#         return
#     try:
#         s3.upload_file(INDEX_FILE, bucket, "faiss.index")
#         s3.upload_file(MAP_FILE,   bucket, "id_map.json")
#         print("☁️  ✅ Backed up index to DO Spaces")
#     except Exception as e:
#         print(f"☁️  ❌ Failed to backup to DO Spaces: {e}")

# # ── Background initialisation ────────────────────────────────────────────────
# def _init():
#     """Runs in a daemon thread so uvicorn can bind and pass health checks
#     while the model is still downloading."""
#     global model, processor, index, id_map, _ready, _init_error
#     try:
#         # 1. Load / download CLIP model
#         if os.path.isfile(os.path.join(MODEL_DIR, "config.json")):
#             print(f"Loading CLIP from local path: {MODEL_DIR}")
#             model     = CLIPModel.from_pretrained(MODEL_DIR).to(device)
#             processor = CLIPProcessor.from_pretrained(MODEL_DIR)
#         else:
#             print(f"Downloading CLIP from HuggingFace: {CLIP_MODEL}")
#             model     = CLIPModel.from_pretrained(CLIP_MODEL).to(device)
#             processor = CLIPProcessor.from_pretrained(CLIP_MODEL)
#         model.eval()
#         print("✅ CLIP model ready")

#         # 2. Sync index files from DO Spaces
#         download_from_spaces()

#         # 3. Load or create FAISS index
#         if os.path.exists(INDEX_FILE):
#             index = faiss.read_index(INDEX_FILE)
#             print(f"✅ FAISS index loaded: {index.ntotal} vectors")
#         else:
#             index = faiss.IndexFlatIP(DIM)
#             print("⚠️  Empty FAISS index created")

#         # 4. Load or create id_map
#         if os.path.exists(MAP_FILE):
#             with open(MAP_FILE) as f:
#                 id_map = json.load(f)
#             print(f"✅ id_map loaded: {len(id_map)} entries")
#         else:
#             id_map = {}
#             print("⚠️  Empty id_map created")

#         _ready = True
#         print("🚀 Service fully initialised")
#     except Exception as e:
#         _init_error = str(e)
#         print(f"❌ Init failed: {e}")

# # Start init in background — uvicorn stays responsive immediately
# threading.Thread(target=_init, daemon=True).start()

# # ── Helpers ──────────────────────────────────────────────────────────────────
# def _require_ready():
#     if not _ready:
#         if _init_error:
#             raise HTTPException(status_code=500, detail=f"Startup failed: {_init_error}")
#         raise HTTPException(status_code=503, detail="Model is still loading, please retry in a moment.")

# def _save():
#     faiss.write_index(index, INDEX_FILE)
#     with open(MAP_FILE, "w") as f:
#         json.dump(id_map, f)
#     threading.Thread(target=upload_to_spaces).start()

# def _embed(image: Image.Image) -> np.ndarray:
#     inputs = processor(images=image, return_tensors="pt").to(device)
#     with torch.no_grad():
#         vision_out = model.vision_model(pixel_values=inputs["pixel_values"])
#         pooled     = vision_out.pooler_output
#         feat       = model.visual_projection(pooled)
#     feat = feat.cpu().numpy().astype(np.float32)
#     feat /= np.linalg.norm(feat, axis=1, keepdims=True)
#     return feat  # shape (1, 512)

# # ── Routes ───────────────────────────────────────────────────────────────────
# @app.get("/health")
# def health():
#     if not _ready:
#         msg = _init_error or "initialising"
#         return JSONResponse({"status": msg}, status_code=503)
#     return {"status": "ok", "vectors_indexed": index.ntotal}

# class IndexRequest(BaseModel):
#     listing_id: str
#     image_url:  str

# @app.post("/index-listing")
# async def index_listing(data: IndexRequest):
#     _require_ready()
#     try:
#         r = requests.get(data.image_url, timeout=15)
#         r.raise_for_status()
#         image = Image.open(io.BytesIO(r.content)).convert("RGB")
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Image fetch failed: {e}")

#     emb = _embed(image)
#     with _lock:
#         index.add(emb)
#         pos = index.ntotal - 1
#         id_map[str(pos)] = data.listing_id
#         _save()

#     return {"status": "indexed", "position": pos, "listing_id": data.listing_id}

# @app.post("/visual-search")
# async def visual_search(file: UploadFile = File(...), top_k: int = 10):
#     _require_ready()
#     if index.ntotal == 0:
#         raise HTTPException(status_code=503, detail="Index empty. Index listings first.")

#     try:
#         contents = await file.read()
#         image = Image.open(io.BytesIO(contents)).convert("RGB")
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

#     emb  = _embed(image)
#     k    = min(top_k, index.ntotal)
#     D, I = index.search(emb, k)

#     results = [
#         {"listing_id": id_map.get(str(idx), None), "score": float(score)}
#         for score, idx in zip(D[0], I[0])
#         if str(idx) in id_map
#     ]
#     return {"results": results}

# class BulkItem(BaseModel):
#     listing_id: str
#     image_url:  str

# @app.post("/bulk-index")
# async def bulk_index(items: List[BulkItem]):
#     _require_ready()
#     indexed, errors = 0, []
#     for item in items:
#         try:
#             r = requests.get(item.image_url, timeout=15)
#             r.raise_for_status()
#             image = Image.open(io.BytesIO(r.content)).convert("RGB")
#             emb   = _embed(image)
#             with _lock:
#                 index.add(emb)
#                 id_map[str(index.ntotal - 1)] = item.listing_id
#             indexed += 1
#         except Exception as e:
#             errors.append({"listing_id": item.listing_id, "error": str(e)})
#     _save()
#     return {"indexed": indexed, "errors": errors, "total": index.ntotal}



import faiss
import torch
import numpy as np
import httpx
import json
import io
import os
import threading
import asyncio
import functools
from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from huggingface_hub import snapshot_download
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MODEL_DIR = "./model"
INDEX_FILE = "./faiss.index"
MAP_FILE   = "./id_map.json"
DIM        = 512
device     = "cpu"
_lock      = threading.Lock()
ml         = {}   # populated during lifespan: ml["model"], ml["processor"]

# These are set during lifespan — declared here so _save() can reference them
index: faiss.Index = None  # type: ignore
id_map: dict = {}

# ---------------------------------------------------------------------------
# DO Spaces Persistence (optional — set env vars to enable)
# In DO App Platform → Component → Environment Variables, add:
#   SPACES_KEY, SPACES_SECRET, SPACES_BUCKET
#   SPACES_REGION   (default: nyc3)
#   SPACES_ENDPOINT (default: https://nyc3.digitaloceanspaces.com)
# ---------------------------------------------------------------------------
_use_spaces = all([os.getenv("SPACES_KEY"), os.getenv("SPACES_SECRET"), os.getenv("SPACES_BUCKET")])

def _s3_client():
    import boto3
    return boto3.client(
        "s3",
        region_name=os.getenv("SPACES_REGION", "nyc3"),
        endpoint_url=os.getenv("SPACES_ENDPOINT", "https://nyc3.digitaloceanspaces.com"),
        aws_access_key_id=os.getenv("SPACES_KEY"),
        aws_secret_access_key=os.getenv("SPACES_SECRET"),
    )

def _download_from_spaces(key: str, local_path: str) -> bool:
    try:
        _s3_client().download_file(os.getenv("SPACES_BUCKET"), key, local_path)
        print(f"✅ Downloaded {key} from DO Spaces")
        return True
    except Exception as e:
        print(f"⚠️  Could not download {key} from Spaces: {e}")
        return False

def _upload_to_spaces(local_path: str, key: str):
    try:
        _s3_client().upload_file(local_path, os.getenv("SPACES_BUCKET"), key)
        print(f"✅ Uploaded {key} to DO Spaces")
    except Exception as e:
        print(f"⚠️  Could not upload {key} to Spaces: {e}")

# ---------------------------------------------------------------------------
# Model bootstrap — downloads weights from HuggingFace if not present locally
# This handles the case where the repo doesn't include pytorch_model.bin
# ---------------------------------------------------------------------------
def _ensure_weights():
    weights_exist = (
        os.path.exists(os.path.join(MODEL_DIR, "pytorch_model.bin")) or
        os.path.exists(os.path.join(MODEL_DIR, "model.safetensors"))
    )
    if not weights_exist:
        print("⬇️  Downloading CLIP weights from HuggingFace (first boot only)...")
        snapshot_download(
            repo_id="openai/clip-vit-base-patch32",
            local_dir=MODEL_DIR,
            ignore_patterns=["*.msgpack", "*.h5", "flax_model*", "tf_model*"],
        )
        print("✅ CLIP weights downloaded")

def _load_model():
    _ensure_weights()
    m = CLIPModel.from_pretrained(MODEL_DIR).to(device)
    m.eval()
    p = CLIPProcessor.from_pretrained(MODEL_DIR)
    return m, p

# ---------------------------------------------------------------------------
# Lifespan — model loads AFTER uvicorn binds the port so health check passes
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global index, id_map

    loop = asyncio.get_event_loop()
    print("🔄 Loading CLIP model in background thread...")
    ml["model"], ml["processor"] = await loop.run_in_executor(
        None, functools.partial(_load_model)
    )
    print("✅ Model ready")

    # Pull persisted index from Spaces if configured
    if _use_spaces:
        _download_from_spaces("faiss.index", INDEX_FILE)
        _download_from_spaces("id_map.json",  MAP_FILE)

    if os.path.exists(INDEX_FILE):
        index = faiss.read_index(INDEX_FILE)
        print(f"✅ FAISS index loaded: {index.ntotal} vectors")
    else:
        index = faiss.IndexFlatIP(DIM)
        print("⚠️  Empty FAISS index created")

    if os.path.exists(MAP_FILE):
        with open(MAP_FILE) as f:
            id_map = json.load(f)
        print(f"✅ id_map loaded: {len(id_map)} entries")
    else:
        id_map = {}
        print("⚠️  Empty id_map created")

    yield   # ← app runs here

    ml.clear()

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="EAIN Visual Search ML Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _save():
    """Persist FAISS index + id_map locally and (if configured) to DO Spaces."""
    faiss.write_index(index, INDEX_FILE)
    with open(MAP_FILE, "w") as f:
        json.dump(id_map, f)
    if _use_spaces:
        _upload_to_spaces(INDEX_FILE, "faiss.index")
        _upload_to_spaces(MAP_FILE,   "id_map.json")

def _embed(image: Image.Image) -> np.ndarray:
    """Run CLIP vision encoder + projection. Returns normalised (1, 512) float32."""
    inputs = ml["processor"](images=image, return_tensors="pt").to(device)
    with torch.inference_mode():   # faster than no_grad for inference-only
        vision_out = ml["model"].vision_model(pixel_values=inputs["pixel_values"])
        pooled = vision_out.pooler_output
        feat   = ml["model"].visual_projection(pooled)
        feat   = feat.cpu().numpy().astype(np.float32)
        feat  /= np.linalg.norm(feat, axis=1, keepdims=True)
    return feat   # shape (1, 512)

def _model_ready() -> bool:
    return "model" in ml

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": _model_ready(),
        "vectors_indexed": index.ntotal if index is not None else 0,
    }


class IndexRequest(BaseModel):
    listing_id: str
    image_url: str


@app.post("/index-listing")
async def index_listing(data: IndexRequest):
    if not _model_ready():
        raise HTTPException(status_code=503, detail="Model still loading — retry in a moment")
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(data.image_url, timeout=15)
            r.raise_for_status()
        image = Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image fetch failed: {e}")

    loop = asyncio.get_event_loop()
    emb  = await loop.run_in_executor(None, _embed, image)

    with _lock:
        index.add(emb)
        pos = index.ntotal - 1
        id_map[str(pos)] = data.listing_id
        _save()

    return {"status": "indexed", "position": pos, "listing_id": data.listing_id}


@app.post("/visual-search")
async def visual_search(file: UploadFile = File(...), top_k: int = 10):
    if not _model_ready():
        raise HTTPException(status_code=503, detail="Model still loading — retry in a moment")
    if index.ntotal == 0:
        raise HTTPException(status_code=503, detail="Index empty — index some listings first")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    loop = asyncio.get_event_loop()
    emb  = await loop.run_in_executor(None, _embed, image)

    k = min(top_k, index.ntotal)
    D, I = index.search(emb, k)

    results = [
        {"listing_id": id_map.get(str(idx)), "score": float(score)}
        for score, idx in zip(D[0], I[0])
        if str(idx) in id_map
    ]
    return {"results": results}


class BulkItem(BaseModel):
    listing_id: str
    image_url: str


@app.post("/bulk-index")
async def bulk_index(items: List[BulkItem]):
    if not _model_ready():
        raise HTTPException(status_code=503, detail="Model still loading — retry in a moment")

    indexed, errors = 0, []
    loop = asyncio.get_event_loop()

    async with httpx.AsyncClient() as client:
        for item in items:
            try:
                r = await client.get(item.image_url, timeout=15)
                r.raise_for_status()
                image = Image.open(io.BytesIO(r.content)).convert("RGB")
                emb   = await loop.run_in_executor(None, _embed, image)
                with _lock:
                    index.add(emb)
                    id_map[str(index.ntotal - 1)] = item.listing_id
                indexed += 1
            except Exception as e:
                errors.append({"listing_id": item.listing_id, "error": str(e)})

    _save()
    return {"indexed": indexed, "errors": errors, "total": index.ntotal}