"""
recommender/baselines.py
EAIN Recommender — All Baselines (Sitting 6)
  1. PopularityBaseline
  2. RandomBaseline
  3. EmbeddingCosineBaseline  (TF-IDF; swap for SentenceTransformer locally)
  4. ContentBasedBaseline     (CLIP-proxy via TF-IDF; swap for real CLIP locally)
"""
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize


# ------------------------------------------------------------------ #
#  Baseline 1 — Popularity                                           #
# ------------------------------------------------------------------ #
class PopularityBaseline:
    """Recommends top-K most interacted items (same list for all users)."""

    WEIGHT_MAP = {"click": 1.0, "save": 2.0,
                  "cart_add": 3.0, "order_or_booking": 5.0}

    def fit(self, df_train: pd.DataFrame):
        self.item_scores = (
            df_train.groupby("listing_id")["event_weight"]
            .sum()
            .sort_values(ascending=False)
        )
        self.top_items = self.item_scores.index.tolist()
        return self

    def recommend(self, users, k: int = 10) -> dict:
        return {u: self.top_items[:k] for u in users}

    def recommend_full(self, users) -> dict:
        """Return full ranked list — needed for Recall@K curves."""
        return {u: self.top_items for u in users}


# ------------------------------------------------------------------ #
#  Baseline 2 — Random                                               #
# ------------------------------------------------------------------ #
class RandomBaseline:
    """Shuffles the catalog randomly for each user."""

    def __init__(self, seed: int = 42):
        self.seed = seed

    def fit(self, all_item_ids: list):
        self.all_item_ids = list(all_item_ids)
        return self

    def recommend(self, users, k: int = 10) -> dict:
        np.random.seed(self.seed)
        return {u: list(np.random.choice(self.all_item_ids,
                                         len(self.all_item_ids),
                                         replace=False)) for u in users}

    def recommend_full(self, users) -> dict:
        return self.recommend(users)


# ------------------------------------------------------------------ #
#  Shared: build item text for TF-IDF / embedding models             #
# ------------------------------------------------------------------ #
def _build_item_text(row) -> str:
    tags = " ".join(row["tags"]) if isinstance(row["tags"], list) else ""
    title_ur = str(row.get("title_ur", ""))
    desc_en  = str(row.get("description_en", ""))[:200]
    return f"{row['title_en']} {title_ur} {row['category']} {tags} {desc_en}"


def _build_tfidf_embeddings(df_items: pd.DataFrame):
    texts = [_build_item_text(r) for _, r in df_items.iterrows()]
    vec   = TfidfVectorizer(ngram_range=(1, 2), max_features=3000,
                             sublinear_tf=True)
    mat   = vec.fit_transform(texts).toarray().astype(np.float32)
    return normalize(mat, norm="l2"), vec


def _user_embedding(user_id, df_train, item_embeds, item_idx):
    rows = df_train[df_train["user_id"] == user_id]
    if rows.empty:
        return None
    ws, wt = np.zeros(item_embeds.shape[1]), 0.0
    for _, r in rows.iterrows():
        lid = r["listing_id"]
        if lid in item_idx:
            ws += item_embeds[item_idx[lid]] * r["event_weight"]
            wt += r["event_weight"]
    return ws / wt if wt > 0 else None


# ------------------------------------------------------------------ #
#  Baseline 3 — EmbeddingCosineBaseline (bilingual text)             #
# ------------------------------------------------------------------ #
class EmbeddingCosineBaseline:
    """
    User embedding = weighted avg of interacted item TF-IDF vectors.
    Recommends items by cosine similarity to user embedding.

    To use SentenceTransformer instead (on your local machine):
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        item_embeds = model.encode(item_texts, normalize_embeddings=True)
    """

    def fit(self, df_items: pd.DataFrame, df_train: pd.DataFrame):
        self.all_item_ids  = sorted(df_items["listing_id"].tolist())
        self.item_idx      = {iid: i for i, iid in enumerate(self.all_item_ids)}
        self.item_embeds, _ = _build_tfidf_embeddings(df_items)
        self.df_train       = df_train
        self.fallback       = (
            df_train.groupby("listing_id")["event_weight"]
            .sum().sort_values(ascending=False).index.tolist()
        )
        return self

    def recommend_full(self, users: list) -> dict:
        recs = {}
        for user in users:
            emb = _user_embedding(user, self.df_train,
                                  self.item_embeds, self.item_idx)
            if emb is None:
                recs[user] = self.fallback
                continue
            sims   = self.item_embeds @ emb
            ranked = np.argsort(-sims)
            recs[user] = [self.all_item_ids[i] for i in ranked]
        return recs

    def recommend(self, users, k=10) -> dict:
        return {u: r[:k] for u, r in self.recommend_full(users).items()}


# ------------------------------------------------------------------ #
#  Baseline 4 — ContentBasedBaseline (CLIP-proxy)                    #
# ------------------------------------------------------------------ #
class ContentBasedBaseline:
    """
    Category + tag + price_band content features.
    Proxy for CLIP embeddings until real image embeddings are available.

    To use real CLIP locally:
        from transformers import CLIPModel, CLIPProcessor
        # encode item images and store as clip_embedding column in df_items
    """

    def fit(self, df_items: pd.DataFrame, df_train: pd.DataFrame):
        self.all_item_ids = sorted(df_items["listing_id"].tolist())
        self.item_idx = {iid: i for i, iid in enumerate(self.all_item_ids)}
        self.df_train = df_train
        self.fallback = (
            df_train.groupby("listing_id")["event_weight"]
            .sum().sort_values(ascending=False).index.tolist()
        )

        # Content text = category + subcategory + tags + price_band + listing_type
        def content_text(row):
            tags  = " ".join(row["tags"]) if isinstance(row["tags"], list) else ""
            pb    = str(row.get("price_band", ""))
            lt    = str(row.get("listing_type", ""))
            city  = str(row.get("city", ""))
            return f"{row['category']} {tags} {pb} {lt} {city}"

        texts = [content_text(r) for _, r in df_items.iterrows()]
        vec   = TfidfVectorizer(ngram_range=(1, 1), max_features=500)
        mat   = vec.fit_transform(texts).toarray().astype(np.float32)
        self.item_embeds = normalize(mat, norm="l2")
        return self

    def recommend_full(self, users: list) -> dict:
        recs = {}
        for user in users:
            emb = _user_embedding(user, self.df_train,
                                  self.item_embeds, self.item_idx)
            if emb is None:
                recs[user] = self.fallback
                continue
            sims   = self.item_embeds @ emb
            ranked = np.argsort(-sims)
            recs[user] = [self.all_item_ids[i] for i in ranked]
        return recs

    def recommend(self, users, k=10) -> dict:
        return {u: r[:k] for u, r in self.recommend_full(users).items()}
