"""
run_sitting4.py
EAIN Recommender — Sitting 4: Synthetic Interaction Matrix
Duration: 2.5 hours
Goal: Generate seed interaction data used before real deployment data exists.

Tasks:
  1. Load eain_items.csv + user_archetypes.json
  2. Generate 200-500 synthetic users (instances of archetypes)
  3. Sample interactions: impression, click, save, cart_add, order/booking
  4. Add timestamps over a 2-3 month range
  5. Save interaction table + events table
  6. Inspect sparsity

Outputs:
  data/eain_interactions_synthetic.csv
  data/eain_interactions_events.csv
  results/sitting4_stats.json

Success check:
  Sparse enough to resemble cold-start, not empty.
"""

import random, json, ast
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta

# ── Config ────────────────────────────────────────────────────────
N_USERS          = 300          # synthetic user instances
INTERACTION_DAYS = 75           # ~2.5 months of history
START_DATE       = datetime(2026, 2, 1)
RANDOM_SEED      = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

DATA    = Path("data")
RESULTS = Path("results")
RESULTS.mkdir(exist_ok=True)

# ── Event weights (prob of each action given impression) ──────────
EVENT_PROBS = {
    "impression": 1.00,
    "click":      0.25,
    "save":       0.10,
    "cart_add":   0.06,
    "order":      0.03,
}

# ── Load data ─────────────────────────────────────────────────────
df_items = pd.read_csv(DATA / "eain_items.csv")

# Clean: remove junk items
EXCLUDE_IDS = ["28", "29"]
df_items = df_items[~df_items["listing_id"].astype(str).isin(EXCLUDE_IDS)].copy()
df_items["listing_id"] = df_items["listing_id"].astype(str)

# Fix category for jewelry items
JEWELRY_IDS = ["24", "25", "26", "27"]
df_items.loc[df_items["listing_id"].isin(JEWELRY_IDS), "category"] = "Jewelry"

# Normalize tags
def parse_tags(t):
    try:
        return ast.literal_eval(str(t)) if t else []
    except Exception:
        return []

df_items["tags_list"] = df_items["tags"].apply(parse_tags)

with open(DATA / "user_archetypes.json") as f:
    archetypes = json.load(f)

all_items = df_items.to_dict("records")
arch_map  = {a["archetype_id"]: a for a in archetypes}
print(f"Items loaded  : {len(all_items)}")
print(f"Archetypes    : {len(archetypes)}")

# ── Archetype assignment ──────────────────────────────────────────
# Distribute 300 users across 13 archetypes proportionally
arch_ids   = [a["archetype_id"] for a in archetypes]
user_archs = [arch_ids[i % len(arch_ids)] for i in range(N_USERS)]
random.shuffle(user_archs)

# ── Interaction scoring ───────────────────────────────────────────
def item_relevance(item: dict, arch: dict) -> float:
    """Score 0-1 how relevant an item is to an archetype."""
    score = 0.0
    pref_cats = arch.get("preferred_categories", [])
    pref_tags = set(arch.get("tags_affinity", []))
    pb        = arch.get("price_band_bias", "mid")
    city      = arch.get("city_preference", "")

    if item.get("category") in pref_cats:
        score += 0.40
    item_tags = set(item.get("tags_list", []))
    overlap   = len(pref_tags & item_tags)
    score    += min(overlap * 0.08, 0.24)
    if item.get("price_band") == pb:
        score += 0.20
    if item.get("city") == city:
        score += 0.10
    # popularity boost (small)
    pop = float(item.get("popularity_count", 0) or 0)
    score += min(pop / 200.0, 0.06)
    return min(score + random.uniform(-0.05, 0.05), 1.0)

# ── Generate interactions ─────────────────────────────────────────
interactions = []   # simplified table: user_id, item_id, event, timestamp, score
events       = []   # full event log

print(f"\nGenerating interactions for {N_USERS} users...")

for user_idx in range(N_USERS):
    user_id  = f"U{user_idx:04d}"
    arch_id  = user_archs[user_idx]
    arch     = arch_map[arch_id]

    # Session count varies by archetype engagement depth
    engagement = arch.get("engagement_depth", "medium")
    n_sessions = {"low": 2, "medium": 4, "high": 6}.get(engagement, 4)
    n_sessions += random.randint(-1, 2)

    for _ in range(n_sessions):
        # Random date in window
        day_offset = random.randint(0, INTERACTION_DAYS)
        session_ts = START_DATE + timedelta(days=day_offset,
                                            hours=random.randint(9, 22),
                                            minutes=random.randint(0, 59))

        # Items shown in session (5-15 impressions)
        n_shown = random.randint(5, 15)
        # Bias toward preferred category items
        pref_cats = arch.get("preferred_categories", [])
        preferred = [it for it in all_items if it.get("category") in pref_cats]
        other     = [it for it in all_items if it.get("category") not in pref_cats]

        session_items = []
        if preferred:
            session_items += random.sample(preferred, min(int(n_shown * 0.6), len(preferred)))
        remaining = n_shown - len(session_items)
        if other and remaining > 0:
            session_items += random.sample(other, min(remaining, len(other)))
        random.shuffle(session_items)

        for item in session_items:
            item_id   = str(item["listing_id"])
            relevance = item_relevance(item, arch)
            ts        = session_ts + timedelta(seconds=random.randint(0, 300))

            # Always record impression
            events.append({
                "user_id":    user_id,
                "item_id":    item_id,
                "event":      "impression",
                "timestamp":  ts.isoformat(),
                "archetype":  arch_id,
                "relevance":  round(relevance, 3),
            })

            # Cascade through events based on relevance
            if random.random() < EVENT_PROBS["click"] * relevance * 2:
                ts2 = ts + timedelta(seconds=random.randint(1, 30))
                events.append({"user_id": user_id, "item_id": item_id,
                                "event": "click", "timestamp": ts2.isoformat(),
                                "archetype": arch_id, "relevance": round(relevance, 3)})

                # Click = 0.2 weight (weak positive signal)
                interactions.append({
                    "user_id":   user_id,
                    "item_id":   item_id,
                    "weight":    0.2,
                    "event":     "click",
                    "archetype": arch_id,
                    "timestamp": ts2.isoformat(),
                })

                if random.random() < EVENT_PROBS["save"] * relevance * 2:
                    events.append({"user_id": user_id, "item_id": item_id,
                                    "event": "save", "timestamp": ts2.isoformat(),
                                    "archetype": arch_id, "relevance": round(relevance, 3)})

                if random.random() < EVENT_PROBS["cart_add"] * relevance * 2:
                    ts3 = ts2 + timedelta(seconds=random.randint(5, 60))
                    events.append({"user_id": user_id, "item_id": item_id,
                                    "event": "cart_add", "timestamp": ts3.isoformat(),
                                    "archetype": arch_id, "relevance": round(relevance, 3)})

                    if random.random() < EVENT_PROBS["order"] * relevance * 2:
                        ts4 = ts3 + timedelta(minutes=random.randint(1, 30))
                        events.append({"user_id": user_id, "item_id": item_id,
                                        "event": "order", "timestamp": ts4.isoformat(),
                                        "archetype": arch_id, "relevance": round(relevance, 3)})

                        # Strongest signal → goes to interactions table with weight=1.0
                        interactions.append({
                            "user_id":   user_id,
                            "item_id":   item_id,
                            "weight":    1.0,
                            "event":     "order",
                            "archetype": arch_id,
                            "timestamp": ts4.isoformat(),
                        })
                        continue

                # Save = 0.5 weight
                if any(e["event"] == "save" and e["user_id"] == user_id
                       and e["item_id"] == item_id for e in events[-5:]):
                    interactions.append({
                        "user_id":   user_id,
                        "item_id":   item_id,
                        "weight":    0.5,
                        "event":     "save",
                        "archetype": arch_id,
                        "timestamp": ts2.isoformat(),
                    })

# ── Deduplicate interactions (keep strongest signal per user-item) ─
df_inter = pd.DataFrame(interactions)
if not df_inter.empty:
    df_inter = df_inter.sort_values("weight", ascending=False)
    df_inter = df_inter.drop_duplicates(subset=["user_id", "item_id"])
    df_inter = df_inter.sort_values(["user_id", "timestamp"])

df_events = pd.DataFrame(events)

# ── Save ──────────────────────────────────────────────────────────
df_inter.to_csv(DATA / "eain_interactions_synthetic.csv", index=False)
df_events.to_csv(DATA / "eain_interactions_events.csv",   index=False)

# ── Stats ─────────────────────────────────────────────────────────
n_users_with_data = df_inter["user_id"].nunique() if not df_inter.empty else 0
n_items_covered   = df_inter["item_id"].nunique() if not df_inter.empty else 0
n_interactions    = len(df_inter)
n_events_total    = len(df_events)
sparsity = 1 - (n_interactions / (N_USERS * len(all_items))) if n_interactions > 0 else 1.0
n_orders = len(df_events[df_events["event"] == "order"]) if not df_events.empty else 0
n_clicks = len(df_events[df_events["event"] == "click"]) if not df_events.empty else 0

stats = {
    "n_synthetic_users":    N_USERS,
    "n_users_with_interactions": n_users_with_data,
    "n_items_total":        len(all_items),
    "n_items_covered":      n_items_covered,
    "n_interactions":       n_interactions,
    "n_events_total":       n_events_total,
    "sparsity":             round(sparsity, 4),
    "n_orders":             n_orders,
    "n_clicks":             n_clicks,
    "avg_interactions_per_user": round(n_interactions / max(n_users_with_data, 1), 2),
    "avg_interactions_per_item": round(n_interactions / max(n_items_covered, 1), 2),
}

with open(RESULTS / "sitting4_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

# ── Event breakdown ───────────────────────────────────────────────
print("\n" + "=" * 55)
print("SITTING 4 — INTERACTION MATRIX STATS")
print("=" * 55)
if not df_events.empty:
    for evt, cnt in df_events["event"].value_counts().items():
        print(f"  {evt:<15} {cnt:>6} events")

print(f"\n  Interactions table : {n_interactions} rows")
print(f"  Events table       : {n_events_total} rows")
print(f"  Users with data    : {n_users_with_data}/{N_USERS}")
print(f"  Items covered      : {n_items_covered}/{len(all_items)}")
print(f"  Sparsity           : {sparsity:.4f} ({sparsity*100:.1f}%)")
print(f"  Avg inter/user     : {stats['avg_interactions_per_user']}")
print(f"  Avg inter/item     : {stats['avg_interactions_per_item']}")

# ── Success check ─────────────────────────────────────────────────
print("\n" + "=" * 55)
print("SITTING 4 SUCCESS CHECK")
print("=" * 55)
checks = {
    "≥200 synthetic users":     n_users_with_data >= 200,
    "Sparsity > 80% (cold-ish)": sparsity > 0.80,
    "Not empty (>100 inter)":   n_interactions > 100,
    "Items covered > 50%":      n_items_covered / len(all_items) > 0.50,
    "Both CSV files saved":     (DATA/"eain_interactions_synthetic.csv").exists() and
                                 (DATA/"eain_interactions_events.csv").exists(),
    "Stats file saved":         (RESULTS/"sitting4_stats.json").exists(),
}

all_pass = True
for name, passed in checks.items():
    print(f"  {'✅' if passed else '❌'}  {name}")
    if not passed: all_pass = False

if all_pass:
    print("\n✅ ALL CHECKS PASSED — Sitting 4 complete")
    print("   Next: Sitting 5 — Cold/Warm Split + Popularity Baseline")
else:
    print("\n⚠️  Some checks failed — review above")
print("=" * 55)
