"""
recommender/ablation.py
EAIN Recommender — Sitting 12
Phase 2 ablation logic: trains and evaluates 3 conditions.
"""

import random
import numpy as np
import pandas as pd
import torch
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

from recommender.model   import ColdStartRecommender
from recommender.trainer import train


# ── Content feature builder ───────────────────────────────────────
def build_content_features(df_items: pd.DataFrame):
    """Build TF-IDF content tensor from item metadata."""
    def item_doc(row):
        tags = row["tags"] if isinstance(row["tags"], list) else []
        return (f"{row.get('title_en','')} {row.get('category','')} "
                f"{row.get('city','')} {row.get('price_band','')} "
                f"{chr(32).join(str(t) for t in tags)}")
    corpus = df_items.apply(item_doc, axis=1).tolist()
    tfidf  = TfidfVectorizer(max_features=512, ngram_range=(1, 2))
    mat    = tfidf.fit_transform(corpus).toarray().astype("float32")
    tensor = torch.tensor(normalize(mat), dtype=torch.float32)
    return tensor


# ── CFGAN synthetic interaction builder ───────────────────────────
def build_cfgan_interactions(cfgan_path, all_item_ids, n_cap=100):
    """
    Convert top-3 items per CFGAN vector into synthetic interaction rows.
    Returns a DataFrame with columns [user_id, listing_id, event_weight].
    """
    n_items   = len(all_item_ids)
    vecs      = np.load(cfgan_path)         # (876, n_items)
    if vecs.shape[1] != n_items:
        return pd.DataFrame(columns=["user_id", "listing_id", "event_weight"])
    n_synth   = min(vecs.shape[0], n_cap)
    rows = []
    for vi in range(n_synth):
        top3 = np.argsort(-vecs[vi])[:3]
        for item_idx in top3:
            rows.append({
                "user_id":      f"SYNTH_{vi:04d}",
                "listing_id":   all_item_ids[item_idx],
                "event_weight": float(vecs[vi][item_idx]),
            })
    return pd.DataFrame(rows)


# ── Evaluation ────────────────────────────────────────────────────
def evaluate_recall(model, df_test, df_train, user2idx,
                    all_item_ids, item_content_tensor, Ks=(5, 10, 50)):
    """Compute Recall@K for a trained model."""
    ground_truth = defaultdict(set)
    for _, row in df_test.iterrows():
        uid = row["user_id"]
        iid = str(row["listing_id"])
        if uid in user2idx:
            ground_truth[uid].add(iid)

    recall = {k: [] for k in Ks}
    model.eval()
    with torch.no_grad():
        for user_id, relevant in ground_truth.items():
            uid_idx = user2idx.get(user_id)
            if uid_idx is None:
                continue
            scores   = model.score_all_items(uid_idx, item_content_tensor)
            seen     = set(str(r["listing_id"])
                           for _, r in df_train[df_train["user_id"]==user_id].iterrows())
            ranked   = torch.argsort(scores, descending=True).tolist()
            recs_all = [all_item_ids[i] for i in ranked
                        if all_item_ids[i] not in seen]
            for k in Ks:
                hits = len(set(recs_all[:k]) & relevant)
                recall[k].append(hits / len(relevant) if relevant else 0.0)

    return {f"Recall@{k}": round(float(np.mean(recall[k])), 4) for k in Ks}


# ── Main ablation runner ───────────────────────────────────────────
def run_ablation(df_train, df_test, df_items, user2idx, item2idx,
                 all_item_ids, llm_pairs, cfgan_path, cfg_base, device):
    """
    Train and evaluate 3 ablation conditions. Returns list of result dicts.

    Conditions:
        1. No Augmentation      — warm BPR only
        2. CFGAN Only           — warm BPR + synthetic CFGAN interactions
        3. CFGAN + LLM Pairs    — warm BPR + CFGAN + augmented BPR (LLM)
    """
    n_users     = len(user2idx)
    n_items     = len(all_item_ids)
    item_ct     = build_content_features(df_items)
    content_dim = item_ct.shape[1]

    # CFGAN synthetic interactions (reused across conditions 2 & 3)
    synth_df    = pd.DataFrame()
    synth_users = []
    if cfgan_path.exists():
        synth_df    = build_cfgan_interactions(cfgan_path, all_item_ids)
        synth_users = synth_df["user_id"].unique().tolist() if not synth_df.empty else []

    conditions = [
        {
            "name":       "No Augmentation",
            "use_cfgan":  False,
            "llm_pairs":  [],
            "lambda_aug": 0.0,
        },
        {
            "name":       "CFGAN Only",
            "use_cfgan":  True,
            "llm_pairs":  [],
            "lambda_aug": 0.0,
        },
        {
            "name":       "CFGAN + LLM Pairs",
            "use_cfgan":  True,
            "llm_pairs":  llm_pairs,
            "lambda_aug": cfg_base["lambda_aug"],
        },
    ]

    results = []
    for i, cond in enumerate(conditions):
        print(f"\n  [{i+1}/{len(conditions)}] {cond['name']}...")

        if cond["use_cfgan"] and not synth_df.empty:
            train_df_c  = pd.concat([df_train, synth_df], ignore_index=True)
            all_users_c = list(user2idx.keys()) + synth_users
            u2i_c       = {uid: idx for idx, uid in enumerate(all_users_c)}
            n_users_c   = len(all_users_c)
        else:
            train_df_c = df_train
            u2i_c      = user2idx
            n_users_c  = n_users

        cfg = {**cfg_base, "lambda_aug": cond["lambda_aug"]}
        model = ColdStartRecommender(
            n_users=n_users_c, n_items=n_items,
            content_dim=content_dim,
            embed_dim=cfg["embed_dim"], dropout=cfg["dropout"],
        ).to(device)

        history = train(model, train_df_c, u2i_c, item2idx,
                        all_item_ids, item_ct, cond["llm_pairs"], cfg, device)

        metrics = evaluate_recall(model, df_test, df_train, user2idx,
                                  all_item_ids, item_ct.to(device))

        row = {"Condition": cond["name"], **metrics,
               "FinalLoss": round(history[-1]["loss"], 4)}
        results.append(row)
        print(f"     Recall@5={metrics['Recall@5']}  "
              f"Recall@10={metrics['Recall@10']}  "
              f"Recall@50={metrics['Recall@50']}")

    return results
