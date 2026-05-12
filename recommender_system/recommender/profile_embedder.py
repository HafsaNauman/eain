"""
recommender/profile_embedder.py
EAIN Recommender — Sitting 18
ProfileEmbedder: embeds augmented item attributes and user profiles.
Model: sentence-transformers/all-roberta-large-v1 (1024-dim)
"""

from __future__ import annotations
import json
import numpy as np
import torch
from pathlib import Path
from sentence_transformers import SentenceTransformer


MODEL_NAME = "sentence-transformers/all-roberta-large-v1"
EMB_DIM    = 1024


# ─────────────────────────────────────────────────────────────────
# Item attribute text builder
# ─────────────────────────────────────────────────────────────────
ITEM_AUG_FIELDS = [
    ("style_theme",       1.5),   # (field, weight)
    ("occasion",          1.3),
    ("target_buyer",      1.0),
    ("fabric_quality",    0.8),
    ("cultural_context",  1.2),
    ("price_appeal",      0.7),
    ("unique_attributes", 1.4),
]

ITEM_BASE_FIELDS = [
    ("title_en",          2.0),
    ("category",          1.5),
    ("description_en",    1.0),
]


def build_item_text(item: dict, use_augmented: bool = True) -> str:
    """Build a rich text representation of an item for embedding."""
    parts = []
    # Base fields
    title = str(item.get("title_en", "") or "")
    cat   = str(item.get("category", "") or "")
    desc  = str(item.get("description_en", "") or "")[:200]
    tags  = item.get("tags", [])
    if isinstance(tags, list): tags = ", ".join(tags[:5])

    if title: parts.append(title)
    if cat:   parts.append(cat)
    if desc:  parts.append(desc)
    if tags:  parts.append(tags)

    # Augmented fields
    if use_augmented:
        for field, _ in ITEM_AUG_FIELDS:
            val = str(item.get(field, "") or "")
            if val and val not in ("N/A", "fashion", "casual", "stylish design"):
                parts.append(val)

    return ". ".join(p.strip() for p in parts if p.strip())


def build_user_text(profile: dict) -> str:
    """Build a text representation of a user profile for embedding."""
    parts = []
    fields = [
        "style_preference",
        "preferred_occasions",
        "category_affinity",
        "cultural_orientation",
        "brand_cues",
        "inferred_archetype",
    ]
    for f in fields:
        val = str(profile.get(f, "") or "")
        if val and val not in ("Pakistani fashion", "casual, festive",
                               "Clothing", "Pakistani",
                               "traditional, colorful",
                               "general fashion shopper"):
            parts.append(val)

    # Fallback for sparse profiles
    if not parts:
        parts.append(profile.get("inferred_archetype", "Pakistani fashion shopper"))

    return ". ".join(parts)


# ─────────────────────────────────────────────────────────────────
# ProfileEmbedder
# ─────────────────────────────────────────────────────────────────
class ProfileEmbedder:
    def __init__(self, model_name: str = MODEL_NAME, device: str = "cpu"):
        print(f"  Loading embedding model: {model_name} …")
        self.model  = SentenceTransformer(model_name, device=device)
        self.device = device
        print(f"  Model loaded. Embedding dim: {self.model.get_sentence_embedding_dimension()}")

    def embed_texts(self, texts: list[str], batch_size: int = 32,
                    show_progress: bool = True) -> np.ndarray:
        """Encode a list of texts → (N, dim) float32 numpy array."""
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return embeddings.astype(np.float32)

    def embed_items(self, items: list[dict],
                    use_augmented: bool = True) -> tuple[np.ndarray, list[str]]:
        """
        Embed all items.
        Returns (embeddings array, item_ids list).
        """
        texts    = [build_item_text(it, use_augmented) for it in items]
        item_ids = [str(it.get("listing_id", i)) for i, it in enumerate(items)]
        print(f"  Embedding {len(texts)} items …")
        embs = self.embed_texts(texts)
        return embs, item_ids

    def embed_users(self, profiles: list[dict],
                    weights: list[dict]) -> tuple[np.ndarray, list[str]]:
        """
        Embed user profiles with importance-weight blending.
        Each user gets a weighted average of dimension-specific embeddings.
        Returns (embeddings array, user_ids list).
        """
        WFIELD_TO_PROFILE = {
            "style_weight":    "style_preference",
            "occasion_weight": "preferred_occasions",
            "category_weight": "category_affinity",
            "cultural_weight": "cultural_orientation",
            "brand_weight":    "brand_cues",
        }
        weight_lookup = {w["user_id"]: w for w in weights}
        user_ids = [p["user_id"] for p in profiles]

        print(f"  Embedding {len(profiles)} user profiles (weighted sum) …")
        all_embs = []

        for prof in profiles:
            uid = prof["user_id"]
            w   = weight_lookup.get(uid, {})

            dim_texts   = []
            dim_weights = []

            for wfield, pfield in WFIELD_TO_PROFILE.items():
                val = str(prof.get(pfield, "") or "").strip()
                if not val or val in ("Pakistani fashion","casual, festive",
                                      "Clothing","Pakistani",
                                      "traditional, colorful"):
                    val = build_user_text(prof)   # fallback to full text
                wt = float(w.get(wfield, 1/5))
                dim_texts.append(val)
                dim_weights.append(wt)

            # Embed all dimension texts, then weighted sum
            dim_embs = self.embed_texts(dim_texts, batch_size=len(dim_texts),
                                        show_progress=False)
            wt_arr   = np.array(dim_weights, dtype=np.float32)
            wt_arr  /= wt_arr.sum()                         # normalise
            user_emb = (dim_embs * wt_arr[:, None]).sum(0)  # weighted sum
            user_emb /= (np.linalg.norm(user_emb) + 1e-9)  # L2 normalise
            all_embs.append(user_emb)

        return np.vstack(all_embs).astype(np.float32), user_ids
