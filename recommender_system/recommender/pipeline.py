"""
recommender/pipeline.py
EAIN Recommender — Sitting 19
Full end-to-end recommender pipeline with ensemble scoring.

Ensemble score (per item i for user u):
  S(u,i) = w_emb * sim_emb(u,i)
          + w_pop * log_popularity(i)
          + w_ce  * cf_score(u,i)          [if CF available]
          + w_ctx * context_boost(i, query) [if text/visual query]
"""

from __future__ import annotations
import json, time, re, logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

logger = logging.getLogger("eain.pipeline")

# ─────────────────────────────────────────────────────────────────
# Ensemble weights
# ─────────────────────────────────────────────────────────────────
@dataclass
class EnsembleWeights:
    w_emb: float = 0.50   # profile-embedding cosine similarity
    w_pop: float = 0.15   # log-normalised popularity
    w_ce:  float = 0.20   # collaborative-filter / CF score
    w_ctx: float = 0.15   # context / query similarity

    def as_array(self):
        return np.array([self.w_emb, self.w_pop, self.w_ce, self.w_ctx],
                         dtype=np.float32)


# ─────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────
@dataclass
class PipelineConfig:
    top_k:           int   = 10
    min_score:       float = 0.0
    embedding_model: str   = "sentence-transformers/all-roberta-large-v1"
    device:          str   = "cpu"
    weights:         EnsembleWeights = field(default_factory=EnsembleWeights)
    # Fallback flags
    fallback_pop_only: bool = True   # return popularity ranking if embeddings fail
    diversity_lambda:  float = 0.0   # 0=pure score, >0=MMR diversity


# ─────────────────────────────────────────────────────────────────
# Ensemble scorer
# ─────────────────────────────────────────────────────────────────
def ensemble_score(
    emb_sims:    np.ndarray,   # (N,)  cosine similarity user-profile vs item
    pop_scores:  np.ndarray,   # (N,)  log-normalised popularity
    cf_scores:   np.ndarray,   # (N,)  CF model score (zeros if unavailable)
    ctx_scores:  np.ndarray,   # (N,)  context/query similarity (zeros if no query)
    weights:     EnsembleWeights,
) -> np.ndarray:
    """Weighted linear ensemble of four scoring signals → (N,) float32."""
    # Min-max normalise each signal to [0,1] independently
    def _norm(arr: np.ndarray) -> np.ndarray:
        lo, hi = arr.min(), arr.max()
        if hi - lo < 1e-9:
            return np.zeros_like(arr)
        return (arr - lo) / (hi - lo)

    s_emb = _norm(emb_sims)
    s_pop = _norm(pop_scores)
    s_ce  = _norm(cf_scores)
    s_ctx = _norm(ctx_scores)

    return (weights.w_emb * s_emb
           + weights.w_pop * s_pop
           + weights.w_ce  * s_ce
           + weights.w_ctx * s_ctx).astype(np.float32)


def _mmr_rerank(scores: np.ndarray,
                item_embs: np.ndarray,
                top_k: int,
                lam: float) -> list[int]:
    """
    Maximal Marginal Relevance reranking for diversity.
    lam=0 → pure score order. lam=1 → pure diversity.
    """
    candidates = list(np.argsort(scores)[::-1])
    selected   = []
    while len(selected) < top_k and candidates:
        if not selected:
            best = candidates.pop(0)
        else:
            sel_embs = item_embs[selected]                   # (k, D)
            mmr_scores = []
            for idx in candidates:
                rel  = scores[idx]
                sim  = float((item_embs[idx] @ sel_embs.T).max())
                mmr  = (1 - lam) * rel - lam * sim
                mmr_scores.append(mmr)
            best_pos = int(np.argmax(mmr_scores))
            best     = candidates.pop(best_pos)
        selected.append(best)
    return selected


# ─────────────────────────────────────────────────────────────────
# Query encoder (Urdu / bilingual / visual)
# ─────────────────────────────────────────────────────────────────
class QueryEncoder:
    """Encodes text queries (any language) and pre-computed visual embeddings."""

    def __init__(self, model: SentenceTransformer):
        self.model = model

    def encode_text(self, query: str) -> np.ndarray:
        """Encode a text query (Urdu, English, or bilingual) → (1024,)."""
        emb = self.model.encode(
            query,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return emb.astype(np.float32)

    def encode_visual(self, visual_emb: np.ndarray) -> np.ndarray:
        """
        Accept a pre-computed visual embedding (e.g. from CLIP visual encoder).
        Normalise and return as query embedding.
        Note: must be projected to 1024-dim before passing if from CLIP (768-dim).
        """
        emb = np.array(visual_emb, dtype=np.float32).flatten()
        norm = np.linalg.norm(emb)
        return emb / (norm + 1e-9)


# ─────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────
class EAINRecommender:
    """
    End-to-end EAIN recommender pipeline.

    Inputs at init:
      - item_embeddings  : (N, 1024) filtered item embeddings
      - item_ids         : list of N item id strings
      - items_meta       : dict {item_id: item_dict} for result enrichment
      - user_embeddings  : (U, 1024) user profile embeddings
      - user_ids         : list of U user id strings
      - popularity_scores: dict {item_id: float} raw interaction counts
      - cf_matrix        : optional (U, N) CF score matrix
      - config           : PipelineConfig
    """

    def __init__(self,
                 item_embeddings:   np.ndarray,
                 item_ids:          list[str],
                 items_meta:        dict,
                 user_embeddings:   np.ndarray,
                 user_ids:          list[str],
                 popularity_scores: dict,
                 cf_matrix:         Optional[np.ndarray] = None,
                 config:            Optional[PipelineConfig] = None):

        self.cfg         = config or PipelineConfig()
        self.item_embs   = item_embeddings   # (N, 1024)
        self.item_ids    = item_ids
        self.items_meta  = items_meta
        self.user_embs   = user_embeddings   # (U, 1024)
        self.user_ids    = user_ids
        self.cf_matrix   = cf_matrix         # (U, N) or None

        self._uid_to_idx = {uid: i for i, uid in enumerate(user_ids)}
        self._iid_to_idx = {iid: i for i, iid in enumerate(item_ids)}

        # Pre-compute log-normalised popularity
        self.pop_scores = self._build_pop_scores(popularity_scores)

        # Load query encoder lazily
        self._encoder: Optional[QueryEncoder] = None

    def _get_encoder(self) -> QueryEncoder:
        if self._encoder is None:
            model = SentenceTransformer(self.cfg.embedding_model,
                                        device=self.cfg.device)
            self._encoder = QueryEncoder(model)
        return self._encoder

    def _build_pop_scores(self, raw: dict) -> np.ndarray:
        scores = np.array(
            [float(raw.get(iid, 0)) for iid in self.item_ids],
            dtype=np.float32
        )
        scores = np.log1p(scores)
        return scores

    # ── core recommend ─────────────────────────────────────────────
    def recommend(self,
                  user_id:    Optional[str]       = None,
                  query:      Optional[str]       = None,
                  visual_emb: Optional[np.ndarray]= None,
                  top_k:      Optional[int]       = None,
                  exclude_ids: Optional[list[str]]= None) -> dict:
        """
        Full pipeline recommendation.

        Args:
            user_id    : known user id (uses profile embedding)
            query      : text query — Urdu, English, or bilingual
            visual_emb : pre-computed CLIP visual embedding (numpy array)
            top_k      : override config top_k
            exclude_ids: item ids to exclude (e.g. already purchased)

        Returns dict with keys:
            results    : list of top-k {item_id, score, rank, meta}
            latency_ms : end-to-end latency in ms
            signals    : per-item score breakdown (emb, pop, ce, ctx)
            method     : description of which signals were used
        """
        t0    = time.perf_counter()
        top_k = top_k or self.cfg.top_k
        N     = len(self.item_ids)

        # ── 1. Profile embedding similarity ───────────────────────
        try:
            if user_id and user_id in self._uid_to_idx:
                uidx    = self._uid_to_idx[user_id]
                u_emb   = self.user_embs[uidx]             # (1024,)
                emb_sim = (self.item_embs @ u_emb).astype(np.float32)
                emb_ok  = True
            else:
                emb_sim = np.zeros(N, dtype=np.float32)
                emb_ok  = False
        except Exception as e:
            logger.warning(f"Embedding signal failed: {e}")
            emb_sim = np.zeros(N, dtype=np.float32)
            emb_ok  = False

        # ── 2. Context / query similarity ─────────────────────────
        try:
            ctx_sim = np.zeros(N, dtype=np.float32)
            ctx_ok  = False
            if query or visual_emb is not None:
                if query:
                    # Text query: needs the SentenceTransformer encoder
                    q_emb = self._get_encoder().encode_text(query)
                else:
                    # visual_emb is already a pre-computed embedding (e.g. item_embs[idx]).
                    # Just L2-normalise it — no model load needed.
                    v = np.array(visual_emb, dtype=np.float32).flatten()
                    q_emb = v / (np.linalg.norm(v) + 1e-9)
                ctx_sim = (self.item_embs @ q_emb).astype(np.float32)
                ctx_ok  = True
        except Exception as e:
            logger.warning(f"Context signal failed: {e}")
            ctx_sim = np.zeros(N, dtype=np.float32)
            ctx_ok  = False

        # ── 3. CF scores ───────────────────────────────────────────
        try:
            if self.cf_matrix is not None and user_id in self._uid_to_idx:
                uidx     = self._uid_to_idx[user_id]
                cf_scores = self.cf_matrix[uidx].astype(np.float32)
                cf_ok    = True
            else:
                cf_scores = np.zeros(N, dtype=np.float32)
                cf_ok     = False
        except Exception as e:
            logger.warning(f"CF signal failed: {e}")
            cf_scores = np.zeros(N, dtype=np.float32)
            cf_ok     = False

        # ── 4. Ensemble score ─────────────────────────────────────
        # Adjust weights if signals are unavailable
        w = EnsembleWeights(
            w_emb = self.cfg.weights.w_emb if emb_ok else 0.0,
            w_pop = self.cfg.weights.w_pop,
            w_ce  = self.cfg.weights.w_ce  if cf_ok  else 0.0,
            w_ctx = self.cfg.weights.w_ctx if ctx_ok else 0.0,
        )
        # Re-normalise weights to sum to 1
        total_w = w.w_emb + w.w_pop + w.w_ce + w.w_ctx
        if total_w < 1e-6:
            # Ultimate fallback: pure popularity
            final_scores = self.pop_scores.copy()
            method = "fallback:popularity_only"
        else:
            factor = 1.0 / total_w
            w.w_emb *= factor; w.w_pop *= factor
            w.w_ce  *= factor; w.w_ctx *= factor

            final_scores = ensemble_score(
                emb_sim, self.pop_scores, cf_scores, ctx_sim, w
            )
            signals_used = []
            if emb_ok:  signals_used.append(f"profile_emb(w={w.w_emb:.2f})")
            signals_used.append(               f"log_pop(w={w.w_pop:.2f})")
            if cf_ok:   signals_used.append(f"cf(w={w.w_ce:.2f})")
            if ctx_ok:  signals_used.append(f"ctx_query(w={w.w_ctx:.2f})")
            method = " + ".join(signals_used)

        # ── 5. Exclude items ──────────────────────────────────────
        if exclude_ids:
            for eid in exclude_ids:
                if eid in self._iid_to_idx:
                    final_scores[self._iid_to_idx[eid]] = -np.inf

        # ── 6. Top-K selection (with optional MMR) ────────────────
        if self.cfg.diversity_lambda > 0:
            top_indices = _mmr_rerank(
                final_scores, self.item_embs, top_k, self.cfg.diversity_lambda
            )
        else:
            top_indices = list(np.argsort(final_scores)[::-1][:top_k])

        # ── 7. Build results ──────────────────────────────────────
        results = []
        for rank, idx in enumerate(top_indices, 1):
            iid  = self.item_ids[idx]
            meta = self.items_meta.get(iid, {})
            results.append({
                "rank":    rank,
                "item_id": iid,
                "score":   round(float(final_scores[idx]), 4),
                "title":   meta.get("title_en", iid),
                "category":meta.get("category", ""),
                "price":   meta.get("price", 0),
                "signals": {
                    "emb_sim":  round(float(emb_sim[idx]),   4),
                    "pop_score":round(float(self.pop_scores[idx]), 4),
                    "cf_score": round(float(cf_scores[idx]), 4),
                    "ctx_sim":  round(float(ctx_sim[idx]),   4),
                },
            })

        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "user_id":    user_id,
            "query":      query,
            "results":    results,
            "latency_ms": latency_ms,
            "method":     method,
            "top_k":      top_k,
        }

    def full_pipeline_recommend(self, **kwargs) -> dict:
        """Alias for recommend() — explicit name used in tests."""
        return self.recommend(**kwargs)
