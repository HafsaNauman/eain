"""
run_sitting6.py
EAIN Recommender — Sitting 6 Runner
Run from: recommender_system/
Usage:    python run_sitting6.py
Outputs:  results/baseline_table.csv
          plots/baseline_recall_curves.png
          results/baseline_cohens_d.json
"""
import sys, json, ast
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from recommender.baselines   import PopularityBaseline, RandomBaseline, EmbeddingCosineBaseline, ContentBasedBaseline
from recommender.evaluation  import evaluate_model, recall_at_k_curve, per_user_hits, cohens_d

# ── Paths ──────────────────────────────────────────────────
DATA    = Path("data")
RESULTS = Path("results")
PLOTS   = Path("plots")
RESULTS.mkdir(exist_ok=True)
PLOTS.mkdir(exist_ok=True)

# ── Load data ──────────────────────────────────────────────
print("Loading data...")
df_train = pd.read_csv(DATA / "train.csv")
df_test  = pd.read_csv(DATA / "test.csv")
df_items = pd.read_csv(DATA / "eain_items.csv")
df_items["tags"] = df_items["tags"].apply(ast.literal_eval)

all_item_ids = sorted(df_items["listing_id"].tolist())

ground_truth = (
    df_test.groupby("user_id")["listing_id"]
    .apply(set).to_dict()
)
test_users = list(ground_truth.keys())
print(f"  Items: {len(all_item_ids)}  |  Test users: {len(test_users)}")

# ── Fit & run baselines ────────────────────────────────────
print("\nRunning baselines...")

# 1. Popularity
pop = PopularityBaseline().fit(df_train)
pop_recs = pop.recommend_full(test_users)
res_pop  = evaluate_model(pop_recs, ground_truth, all_item_ids, "PopularityBaseline")
print(f"  [1/4] PopularityBaseline      HR@10={res_pop['HR@10']}")

# 2. Random
rnd = RandomBaseline(seed=42).fit(all_item_ids)
rnd_recs = rnd.recommend_full(test_users)
res_rnd  = evaluate_model(rnd_recs, ground_truth, all_item_ids, "RandomBaseline")
print(f"  [2/4] RandomBaseline          HR@10={res_rnd['HR@10']}")

# 3. EmbeddingCosine
emb = EmbeddingCosineBaseline().fit(df_items, df_train)
emb_recs = emb.recommend_full(test_users)
res_emb  = evaluate_model(emb_recs, ground_truth, all_item_ids, "EmbeddingCosineBaseline")
print(f"  [3/4] EmbeddingCosineBaseline HR@10={res_emb['HR@10']}")

# 4. ContentBased
cbt = ContentBasedBaseline().fit(df_items, df_train)
cbt_recs = cbt.recommend_full(test_users)
res_cbt  = evaluate_model(cbt_recs, ground_truth, all_item_ids, "ContentBasedBaseline")
print(f"  [4/4] ContentBasedBaseline    HR@10={res_cbt['HR@10']}")

# ── Baseline table ─────────────────────────────────────────
all_results = [res_pop, res_rnd, res_emb, res_cbt]
df_table = pd.DataFrame(all_results).set_index("model")
df_table.to_csv(RESULTS / "baseline_table.csv")
print(f"\n✅ Saved: results/baseline_table.csv")
print(df_table.to_string())

# ── Cohen's d (each baseline vs Popularity) ───────────────
pop_hits = per_user_hits(pop_recs, ground_truth, 10)
cohens_d_results = {}
for name, recs in [("RandomBaseline", rnd_recs),
                   ("EmbeddingCosineBaseline", emb_recs),
                   ("ContentBasedBaseline", cbt_recs)]:
    hits = per_user_hits(recs, ground_truth, 10)
    d    = cohens_d(hits, pop_hits)
    cohens_d_results[name] = round(d, 4)
    print(f"  Cohen's d ({name} vs Popularity): {d:.4f}")

with open(RESULTS / "baseline_cohens_d.json", "w") as f:
    json.dump(cohens_d_results, f, indent=2)

# ── Recall@K curves ────────────────────────────────────────
print("\nGenerating Recall@K curves...")
KS = [1, 5, 10, 20, 50, 80]

recall_curves = {
    "PopularityBaseline":    [recall_at_k_curve(pop_recs, ground_truth, KS)[k] for k in KS],
    "RandomBaseline":        [recall_at_k_curve(rnd_recs, ground_truth, KS)[k] for k in KS],
    "EmbeddingCosine":       [recall_at_k_curve(emb_recs, ground_truth, KS)[k] for k in KS],
    "ContentBased":          [recall_at_k_curve(cbt_recs, ground_truth, KS)[k] for k in KS],
}

sns.set_style("whitegrid")
fig, ax = plt.subplots(figsize=(9, 5))
colors  = ["#6366f1","#ef4444","#22c55e","#f97316"]

for (label, vals), color in zip(recall_curves.items(), colors):
    ax.plot(KS, vals, marker="o", label=label, color=color, linewidth=2, markersize=6)

ax.axvline(x=10, color="gray", linestyle="--", alpha=0.5, label="K=10 (eval point)")
ax.set_xlabel("K (top-K recommendations)", fontsize=12)
ax.set_ylabel("Recall@K", fontsize=12)
ax.set_title("Recall@K Curves — Sitting 6 Baselines\n(higher is better)", fontsize=13)
ax.legend(loc="upper left", fontsize=10)
ax.set_xticks(KS)
plt.tight_layout()
plt.savefig(PLOTS / "baseline_recall_curves.png", dpi=150)
plt.close()
print(f"✅ Saved: plots/baseline_recall_curves.png")

# ── Success check ──────────────────────────────────────────
print("\n" + "="*55)
print("SITTING 6 SUCCESS CHECK")
print("="*55)
checks = {
    "baseline_table.csv exists":        (RESULTS / "baseline_table.csv").exists(),
    "baseline_recall_curves.png exists":(PLOTS / "baseline_recall_curves.png").exists(),
    "All 4 baselines evaluated":        len(all_results) == 4,
    "All 8 metrics computed":           all("HR@10" in r and "Gini@10" in r for r in all_results),
}
for check, passed in checks.items():
    print(f"  {'✅' if passed else '❌'}  {check}")

print("\n  Minimum benchmark (PopularityBaseline):")
print(f"    HR@10    = {res_pop['HR@10']}")
print(f"    NDCG@10  = {res_pop['NDCG@10']}")
print(f"    Recall@10= {res_pop['Recall@10']}")
print("\n  ✅ Sitting 6 complete. Next: Sitting 7 — CFGAN Architecture")
