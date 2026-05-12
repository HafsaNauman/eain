"""
recommender/noise_controller.py
EAIN Recommender — Sitting 18
NoiseController: filters item embeddings whose augmented text diverges
too much from the item's base CLIP/FAISS embedding, using:
  - Cosine similarity threshold (tau)
  - Moving-average threshold (tau_MA)
  - N-reference neighbourhood check
"""

from __future__ import annotations
import numpy as np
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class NoiseConfig:
    tau:         float = 0.30   # hard cosine threshold (below = noisy)
    tau_ma_n:    int   = 5      # moving-average window
    tau_ma_bias: float = 0.05   # subtract from MA for adaptive threshold
    n_reference: int   = 5      # neighbourhood reference count
    n_ref_min:   float = 0.20   # min avg similarity to neighbours


class NoiseController:
    """
    Filters augmented item embeddings against their base embeddings.

    Strategy:
      1. Compute cosine similarity between base_emb and aug_emb per item.
      2. Flag items where sim < tau (hard threshold).
      3. Flag items where sim < moving_average - tau_ma_bias (adaptive).
      4. Flag items where avg sim to N nearest neighbours < n_ref_min.
      5. Keep items that pass ALL three checks.
    """

    def __init__(self, config: NoiseConfig | None = None):
        self.cfg = config or NoiseConfig()

    # ── internal helpers ──────────────────────────────────────────
    @staticmethod
    def _cosine_sim(a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Row-wise cosine similarity between two (N, D) arrays."""
        a = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-9)
        b = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-9)
        return (a * b).sum(axis=1)

    @staticmethod
    def _moving_average(arr: np.ndarray, w: int) -> np.ndarray:
        """Simple centred moving average with edge padding."""
        kernel = np.ones(w) / w
        return np.convolve(arr, kernel, mode="same")

    def _neighbourhood_sim(self, embs: np.ndarray, k: int) -> np.ndarray:
        """Average cosine similarity to k nearest neighbours (excluding self)."""
        normed = embs / (np.linalg.norm(embs, axis=1, keepdims=True) + 1e-9)
        sim_mat = normed @ normed.T                 # (N, N)
        np.fill_diagonal(sim_mat, -1)               # exclude self
        topk    = np.sort(sim_mat, axis=1)[:, -k:]  # top-k per row
        return topk.mean(axis=1)

    # ── main API ──────────────────────────────────────────────────
    def filter(self,
               base_embs: np.ndarray,
               aug_embs:  np.ndarray,
               item_ids:  list[str]) -> dict:
        """
        Filter augmented embeddings against base embeddings.

        Args:
            base_embs : (N, D) base item embeddings (CLIP / retriever)
            aug_embs  : (N, D) augmented item embeddings (ProfileEmbedder)
            item_ids  : list of item id strings

        Returns dict with keys:
            filtered_embs   : (M, D) embeddings that passed all checks
            filtered_ids    : list of M item ids
            kept_mask       : bool array (N,)
            stats           : dict of counts
            per_item        : list of {item_id, sim, ma_threshold,
                              neigh_sim, kept} per item
        """
        N = len(item_ids)
        assert base_embs.shape[0] == N
        assert aug_embs.shape[0]  == N

        # 1. Direct cosine similarity (base vs augmented)
        sims = self._cosine_sim(base_embs, aug_embs)

        # 2. Moving-average adaptive threshold
        ma_thresh = self._moving_average(sims, self.cfg.tau_ma_n) - self.cfg.tau_ma_bias

        # 3. Neighbourhood similarity in augmented space
        neigh_sims = self._neighbourhood_sim(aug_embs, self.cfg.n_reference)

        # Masks
        hard_mask  = sims      >= self.cfg.tau
        ma_mask    = sims      >= ma_thresh
        neigh_mask = neigh_sims >= self.cfg.n_ref_min
        kept_mask  = hard_mask & ma_mask & neigh_mask

        filtered_embs = aug_embs[kept_mask]
        filtered_ids  = [iid for iid, k in zip(item_ids, kept_mask) if k]

        stats = {
            "total":            N,
            "kept":             int(kept_mask.sum()),
            "removed":          int((~kept_mask).sum()),
            "removed_hard":     int((~hard_mask).sum()),
            "removed_ma":       int((~ma_mask).sum()),
            "removed_neigh":    int((~neigh_mask).sum()),
            "mean_sim":         round(float(sims.mean()), 4),
            "min_sim":          round(float(sims.min()),  4),
            "max_sim":          round(float(sims.max()),  4),
        }

        per_item = [
            {
                "item_id":      iid,
                "sim":          round(float(s), 4),
                "ma_threshold": round(float(m), 4),
                "neigh_sim":    round(float(ns), 4),
                "kept":         bool(k),
            }
            for iid, s, m, ns, k in zip(item_ids, sims, ma_thresh,
                                          neigh_sims, kept_mask)
        ]

        return {
            "filtered_embs": filtered_embs,
            "filtered_ids":  filtered_ids,
            "kept_mask":     kept_mask,
            "stats":         stats,
            "per_item":      per_item,
        }

    def blend_fallback(self,
                       base_embs: np.ndarray,
                       aug_embs:  np.ndarray,
                       kept_mask: np.ndarray,
                       alpha: float = 0.7) -> np.ndarray:
        """
        For removed items, blend base + aug embeddings instead of discarding.
        alpha: weight on aug_emb (0=base only, 1=aug only)
        Returns (N, D) embeddings for ALL items.
        """
        blended = alpha * aug_embs + (1 - alpha) * base_embs
        blended /= (np.linalg.norm(blended, axis=1, keepdims=True) + 1e-9)
        # Use pure aug for kept items, blended for noisy items
        result = aug_embs.copy()
        result[~kept_mask] = blended[~kept_mask]
        return result
