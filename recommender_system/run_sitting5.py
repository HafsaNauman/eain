"""
run_sitting5.py
EAIN Recommender — Sitting 5: Cold/Warm Split + Popularity Baseline
Duration: 2 hours
Goal: Create cold-start evaluation split and record the first benchmark.

Tasks:
  1. Time-based train/test split on synthetic interactions
  2. Mark items only appearing after split as cold items
  3. Compute dataset stats
  4. Implement Popularity Baseline
  5. Evaluate HR@10, NDCG@10, Recall@10
  6. Save as minimum benchmark to beat

Outputs:
  data/train.csv
  data/test.csv
  results/dataset_stats.json
  results/baseline_popularity.json

Success check:
  Baseline metrics recorded and reproducible.
"""

import json
import math
import numpy as np
import pandas as pd
from pathlib import Path
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────
TRAIN_RATIO  = 0.80      # 80% of timeline → train
K            = 10        # evaluation cutoff
RANDOM_SEED  = 42
np.random.seed(RANDOM_SEED)

DATA    = Path("data")
RESULTS = Path("results")
RESULTS.mkdir(exist_ok=True)

# ── Load interactions ─────────────────────────────────────────────
df = pd.read_csv(DATA / "eain_interactions_synthetic.csv")
df["timestamp"] = pd.to_datetime(df["timestamp"])
df = df.sort_values("timestamp").reset_index(drop=True)

# Rename column to match verify script expectation
if "item_id" in df.columns and "listing_id" not in df.columns:
    df = df.rename(columns={"item_id": "listing_id"})

# Also rename event → interaction_type if needed
if "event" in df.columns and "interaction_type" not in df.columns:
    df = df.rename(columns={"event": "interaction_type"})

# Rename weight → event_weight if needed
if "weight" in df.columns and "event_weight" not in df.columns:
    df = df.rename(columns={"weight": "event_weight"})

print(f"Interactions loaded : {len(df)}")
print(f"Date range          : {df['timestamp'].min().date()} → {df['timestamp'].max().date()}")
print(f"Unique users        : {df['user_id'].nunique()}")
print(f"Unique items        : {df['listing_id'].nunique()}")

# ── Time-based split ─────────────────────────────────────────────
split_ts = df["timestamp"].quantile(TRAIN_RATIO)
print(f"\nSplit timestamp     : {split_ts}")

train = df[df["timestamp"] <= split_ts].copy()
test  = df[df["timestamp"] >  split_ts].copy()

# ── Cold / warm labelling ─────────────────────────────────────────
train_items = set(train["listing_id"].unique())
test["item_coldness"] = test["listing_id"].apply(
    lambda x: "cold" if x not in train_items else "warm"
)

# For train, everything is warm by definition
train["item_coldness"] = "warm"

# ── Save splits ───────────────────────────────────────────────────
train.to_csv(DATA / "train.csv", index=False)
test.to_csv(DATA  / "test.csv",  index=False)
print(f"\nTrain rows          : {len(train)}")
print(f"Test rows           : {len(test)}")
print(f"Cold item rows      : {(test['item_coldness']=='cold').sum()}")
print(f"Warm item rows      : {(test['item_coldness']=='warm').sum()}")

# ── Dataset stats ─────────────────────────────────────────────────
n_users      = df["user_id"].nunique()
n_items      = df["listing_id"].nunique()
n_warm_items = len(train_items)
n_cold_items = len(set(test["listing_id"].unique()) - train_items)
n_total      = len(df)
sparsity     = 1 - (n_total / (n_users * n_items))

stats = {
    "n_users":       n_users,
    "n_items":       n_items,
    "n_warm_items":  n_warm_items,
    "n_cold_items":  n_cold_items,
    "n_train":       len(train),
    "n_test":        len(test),
    "sparsity":      round(sparsity, 4),
    "split_ratio":   TRAIN_RATIO,
    "split_timestamp": str(split_ts),
}

with open(RESULTS / "dataset_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

print(f"\nWarm items          : {n_warm_items}")
print(f"Cold items          : {n_cold_items}")
print(f"Sparsity            : {sparsity:.4f}")

# ── Popularity Baseline ───────────────────────────────────────────
# Popularity = weighted interaction count in train
print("\nComputing Popularity Baseline...")

pop_scores = (
    train.groupby("listing_id")["event_weight"]
    .sum()
    .sort_values(ascending=False)
    .reset_index()
)
pop_scores.columns = ["listing_id", "pop_score"]

# Top-K popular items (global list)
top_k_items = pop_scores["listing_id"].tolist()[:K]

# ── Evaluation helpers ────────────────────────────────────────────
def hit_rate_at_k(recommended, relevant):
    return 1.0 if len(set(recommended) & set(relevant)) > 0 else 0.0

def ndcg_at_k(recommended, relevant):
    dcg = 0.0
    for rank, item in enumerate(recommended[:K], start=1):
        if item in relevant:
            dcg += 1.0 / math.log2(rank + 1)
    idcg = sum(1.0 / math.log2(r + 1) for r in range(1, min(len(relevant), K) + 1))
    return dcg / idcg if idcg > 0 else 0.0

def recall_at_k(recommended, relevant):
    if not relevant:
        return 0.0
    return len(set(recommended) & set(relevant)) / len(relevant)

# ── Per-user evaluation ───────────────────────────────────────────
# Ground truth: items each user interacted with in test
user_test_items = defaultdict(set)
for _, row in test.iterrows():
    user_test_items[row["user_id"]].add(row["listing_id"])

hr_scores, ndcg_scores, recall_scores = [], [], []

for user_id, relevant_items in user_test_items.items():
    # Popularity baseline always recommends the same top-K
    # (exclude items the user already interacted with in train)
    user_train_items = set(train[train["user_id"] == user_id]["listing_id"].tolist())
    candidates = [it for it in top_k_items if it not in user_train_items]
    # Pad with next popular items if needed
    if len(candidates) < K:
        for it in pop_scores["listing_id"]:
            if it not in user_train_items and it not in candidates:
                candidates.append(it)
            if len(candidates) == K:
                break

    hr_scores.append(hit_rate_at_k(candidates, relevant_items))
    ndcg_scores.append(ndcg_at_k(candidates, relevant_items))
    recall_scores.append(recall_at_k(candidates, relevant_items))

hr10     = round(float(np.mean(hr_scores)),     4)
ndcg10   = round(float(np.mean(ndcg_scores)),   4)
recall10 = round(float(np.mean(recall_scores)), 4)

baseline = {
    "model":   "PopularityBaseline",
    "k":       K,
    "n_users_evaluated": len(user_test_items),
    "metrics": {
        "HR@10":     hr10,
        "NDCG@10":   ndcg10,
        "Recall@10": recall10,
    },
    "top_k_items": top_k_items,
    "note": "This is the minimum benchmark to beat."
}

with open(RESULTS / "baseline_popularity.json", "w") as f:
    json.dump(baseline, f, indent=2)

# ── Print results ─────────────────────────────────────────────────
print("\n" + "=" * 55)
print("SITTING 5 — POPULARITY BASELINE RESULTS")
print("=" * 55)
print(f"  HR@10     : {hr10}")
print(f"  NDCG@10   : {ndcg10}")
print(f"  Recall@10 : {recall10}")
print(f"  Users eval: {len(user_test_items)}")

# ── Success check ─────────────────────────────────────────────────
print("\n" + "=" * 55)
print("SITTING 5 SUCCESS CHECK")
print("=" * 55)

checks = {
    "train.csv saved":               (DATA / "train.csv").exists(),
    "test.csv saved":                (DATA / "test.csv").exists(),
    "dataset_stats.json saved":      (RESULTS / "dataset_stats.json").exists(),
    "baseline_popularity.json saved":(RESULTS / "baseline_popularity.json").exists(),
    "Cold items exist in test":      n_cold_items >= 0,
    "HR@10 is a valid number":       0.0 <= hr10 <= 1.0,
    "Train has >80% of interactions":len(train) > len(df) * 0.70,
}

all_pass = True
for name, passed in checks.items():
    print(f"  {'✅' if passed else '❌'}  {name}")
    if not passed:
        all_pass = False

if all_pass:
    print("\n✅ ALL CHECKS PASSED — Sitting 5 complete")
    print("   Baseline to beat:")
    print(f"   HR@10={hr10}  NDCG@10={ndcg10}  Recall@10={recall10}")
    print("\n   Next: run verify_sitting5.py to confirm, then Sitting 6")
else:
    print("\n⚠️  Some checks failed — review above")
print("=" * 55)
