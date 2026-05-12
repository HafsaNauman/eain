"""
run_sitting9.py
EAIN Recommender — Sitting 9: Pairwise Prompt Design & LLM Labelling
Run from:  recommender_system/
Usage:     python run_sitting9.py [--provider openai|ollama|mock]

Providers:
  --provider openai   Uses OpenAI API  (needs OPENAI_API_KEY in .env)
  --provider ollama   Uses local Ollama (llama3 / mistral — free, offline)
  --provider mock     Generates rule-based labels (no API needed, for testing)

Outputs:
  cache/llm_pairs_batch1.json   200 pairwise labels
  results/sitting9_stats.json   consistency report
"""

import sys, json, ast, random, time, argparse, re
import pandas as pd
import numpy as np
from pathlib import Path
from itertools import combinations

sys.path.insert(0, str(Path(__file__).parent))
from prompts.pairwise_prompt import (
    SYSTEM_PROMPT, build_pairwise_prompt
)

# ── Optional imports (only needed for their provider) ───────────
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import requests as _requests
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

# ── Paths ────────────────────────────────────────────────────────
DATA    = Path("data")
CACHE   = Path("cache")
RESULTS = Path("results")
for p in [CACHE, RESULTS]:
    p.mkdir(exist_ok=True)

# ── Args ─────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--provider", default="mock",
                    choices=["openai", "ollama", "mock"])
parser.add_argument("--model",    default="",
                    help="Model name override (e.g. gpt-4o-mini, llama3)")
parser.add_argument("--n_users",  type=int, default=20,
                    help="How many archetype users to sample")
parser.add_argument("--n_pairs",  type=int, default=10,
                    help="Pairs per user")
args = parser.parse_args()

PROVIDER = args.provider
N_USERS  = args.n_users
N_PAIRS  = args.n_pairs
TARGET   = N_USERS * N_PAIRS  # 200

print("=" * 60)
print(f"SITTING 9 — PAIRWISE LLM LABELLING")
print("=" * 60)
print(f"Provider : {PROVIDER}")
print(f"Users    : {N_USERS}")
print(f"Pairs/user: {N_PAIRS}")
print(f"Target   : {TARGET} labels\n")

# ── Load data ────────────────────────────────────────────────────
df_items    = pd.read_csv(DATA / "eain_items.csv")
df_items["tags"] = df_items["tags"].apply(ast.literal_eval)

with open(DATA / "user_archetypes.json") as f:
    archetypes = json.load(f)

all_items    = df_items.to_dict("records")
all_item_ids = [it["listing_id"] for it in all_items]

print(f"Loaded {len(all_items)} items, {len(archetypes)} archetypes\n")

# ────────────────────────────────────────────────────────────────
#  LLM CLIENT SETUP
# ────────────────────────────────────────────────────────────────
def call_openai(prompt: str, system: str, model: str = "gpt-4o-mini") -> str:
    """Call OpenAI API. Needs OPENAI_API_KEY in .env"""
    try:
        from dotenv import load_dotenv
        load_dotenv("../.env")
        import os
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    except Exception:
        client = OpenAI()

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system",  "content": system},
            {"role": "user",    "content": prompt},
        ],
        temperature=0.3,
        max_tokens=300,
        response_format={"type": "json_object"},
    )
    return resp.choices[0].message.content


def call_ollama(prompt: str, system: str,
                model: str = "llama3") -> str:
    """
    Call local Ollama. Needs Ollama running: ollama serve
    Install model first: ollama pull llama3
    """
    import requests
    payload = {
        "model":  model,
        "prompt": f"{system}\n\n{prompt}",
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.3},
    }
    resp = requests.post("http://localhost:11434/api/generate",
                         json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["response"]


def call_mock(user_profile: dict, item_a: dict, item_b: dict) -> dict:
    """
    Rule-based mock labeller — no API needed.
    Scores each item by how well it matches user preferences.
    Used for testing and when no LLM is available.
    """
    def score_item(item, profile):
        score = 0.0
        cats  = profile.get("preferred_categories", [])
        tags  = profile.get("tags_affinity", [])
        pb    = profile.get("price_band_bias", "mid")

        if item.get("category") in cats:
            score += 0.40
        item_tags = item.get("tags", [])
        overlap   = len(set(tags) & set(item_tags))
        score    += min(overlap * 0.10, 0.30)
        if item.get("price_band") == pb:
            score += 0.20
        city = profile.get("city_preference", "")
        if item.get("city", "") == city:
            score += 0.10
        return round(score + random.uniform(-0.05, 0.05), 3)

    score_a = score_item(item_a, user_profile)
    score_b = score_item(item_b, user_profile)
    preferred = "A" if score_a >= score_b else "B"
    confidence = round(abs(score_a - score_b) / max(score_a + score_b, 0.01), 3)
    confidence = min(max(confidence + random.uniform(0.1, 0.4), 0.0), 1.0)

    return {
        "preferred":          preferred,
        "confidence":         round(confidence, 3),
        "reason_en":          f"Item {preferred} better matches {user_profile.get('name','')} "
                              f"preferences in category and price band.",
        "reason_ur":          f"آئٹم {preferred} صارف کی ترجیح سے زیادہ میل کھاتا ہے۔",
        "preference_score_a": round(score_a, 3),
        "preference_score_b": round(score_b, 3),
    }


def parse_llm_output(raw: str) -> dict | None:
    """Parse LLM JSON output, return None if invalid."""
    try:
        # Strip markdown code fences if present
        clean = re.sub(r"```json|```", "", raw).strip()
        data  = json.loads(clean)
        required = {"preferred", "confidence", "reason_en"}
        if not required.issubset(data.keys()):
            return None
        if data["preferred"] not in ("A", "B"):
            return None
        if not (0.0 <= float(data["confidence"]) <= 1.0):
            return None
        return data
    except Exception:
        return None


# ────────────────────────────────────────────────────────────────
#  PAIR GENERATION
# ────────────────────────────────────────────────────────────────
def sample_pairs_for_user(archetype: dict, all_items: list,
                           n_pairs: int, rng: random.Random) -> list:
    """
    Sample n_pairs of (item_a, item_b) for one archetype.
    Strategy:
      50% — one item from preferred category, one from other (contrast pair)
      50% — both from preferred categories (fine-grained pair)
    """
    preferred_cats = archetype.get("preferred_categories", [])
    preferred = [it for it in all_items
                 if it.get("category") in preferred_cats]
    other     = [it for it in all_items
                 if it.get("category") not in preferred_cats]

    if len(preferred) < 2:
        preferred = all_items

    pairs = []
    for i in range(n_pairs):
        if i < n_pairs // 2 and len(other) > 0:
            # contrast pair
            a = rng.choice(preferred)
            b = rng.choice(other)
        else:
            # fine-grained pair
            sample = rng.sample(preferred, min(2, len(preferred)))
            a, b   = sample[0], sample[-1]
        if a["listing_id"] != b["listing_id"]:
            pairs.append((a, b))
    return pairs[:n_pairs]


# ────────────────────────────────────────────────────────────────
#  MAIN LOOP
# ────────────────────────────────────────────────────────────────
rng        = random.Random(42)
all_labels = []
errors     = 0
skipped    = 0

# Sample N_USERS archetypes (cycle if fewer than N_USERS)
sampled_archetypes = []
while len(sampled_archetypes) < N_USERS:
    sampled_archetypes.extend(archetypes)
sampled_archetypes = sampled_archetypes[:N_USERS]
rng.shuffle(sampled_archetypes)

# Default model names
MODEL_DEFAULTS = {"openai": "gpt-4o-mini", "ollama": "llama3", "mock": "mock"}
model_name = args.model or MODEL_DEFAULTS[PROVIDER]

print(f"Generating {TARGET} pairwise labels...")
print(f"Model: {model_name}\n")

for arch_i, archetype in enumerate(sampled_archetypes):
    pairs = sample_pairs_for_user(archetype, all_items, N_PAIRS, rng)

    for pair_i, (item_a, item_b) in enumerate(pairs):
        label_id = f"{archetype['archetype_id']}_pair{pair_i:02d}"

        if PROVIDER == "mock":
            result = call_mock(archetype, item_a, item_b)
            raw    = json.dumps(result)

        elif PROVIDER == "openai":
            prompt = build_pairwise_prompt(archetype, item_a, item_b)
            try:
                raw    = call_openai(prompt, SYSTEM_PROMPT, model_name)
                result = parse_llm_output(raw)
                if result is None:
                    # Retry with fallback prompt
                    prompt2 = build_pairwise_prompt(archetype, item_a, item_b,
                                                     use_fallback=True)
                    raw    = call_openai(prompt2, SYSTEM_PROMPT, model_name)
                    result = parse_llm_output(raw)
                if result is None:
                    errors += 1
                    continue
            except Exception as e:
                print(f"  ⚠️  API error on {label_id}: {e}")
                errors += 1
                continue

        elif PROVIDER == "ollama":
            prompt = build_pairwise_prompt(archetype, item_a, item_b)
            try:
                raw    = call_ollama(prompt, SYSTEM_PROMPT, model_name)
                result = parse_llm_output(raw)
                if result is None:
                    errors += 1
                    continue
            except Exception as e:
                print(f"  ⚠️  Ollama error on {label_id}: {e}")
                errors += 1
                continue

        label_record = {
            "id":           label_id,
            "archetype_id": archetype["archetype_id"],
            "archetype":    archetype.get("name", ""),
            "item_a_id":    item_a["listing_id"],
            "item_b_id":    item_b["listing_id"],
            "item_a_title": item_a.get("title_en", ""),
            "item_b_title": item_b.get("title_en", ""),
            "category_a":   item_a.get("category", ""),
            "category_b":   item_b.get("category", ""),
            "preferred":    result["preferred"],
            "confidence":   float(result["confidence"]),
            "reason_en":    result.get("reason_en", ""),
            "reason_ur":    result.get("reason_ur", ""),
            "score_a":      float(result.get("preference_score_a", 0.5)),
            "score_b":      float(result.get("preference_score_b", 0.5)),
            "provider":     PROVIDER,
            "model":        model_name,
            "timestamp":    time.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        all_labels.append(label_record)

    done = (arch_i + 1) * N_PAIRS
    print(f"  [{done:>3}/{TARGET}] Archetype {archetype['archetype_id']:>3} — "
          f"{archetype.get('name','')[:30]:<30}  ✅")

# ── Save cache ───────────────────────────────────────────────────
output = {
    "metadata": {
        "provider":    PROVIDER,
        "model":       model_name,
        "n_users":     N_USERS,
        "n_pairs":     N_PAIRS,
        "total_labels":len(all_labels),
        "errors":      errors,
        "timestamp":   time.strftime("%Y-%m-%dT%H:%M:%S"),
    },
    "labels": all_labels,
}

cache_file = CACHE / "llm_pairs_batch1.json"
with open(cache_file, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print(f"\n✅ Saved {len(all_labels)} labels → {cache_file}")

# ── Consistency analysis ─────────────────────────────────────────
print("\nConsistency Analysis...")
df_labels = pd.DataFrame(all_labels)

# 1. Confidence distribution
conf_mean = df_labels["confidence"].mean()
conf_high = (df_labels["confidence"] >= 0.6).mean()
conf_low  = (df_labels["confidence"] < 0.3).mean()

# 2. Preferred item distribution (should not be all A or all B)
pref_A = (df_labels["preferred"] == "A").mean()
pref_B = (df_labels["preferred"] == "B").mean()
balanced = 0.3 <= pref_A <= 0.7

# 3. Category coherence: preferred item should more often match user's preferred category
arch_map  = {a["archetype_id"]: a for a in archetypes}
coherent  = 0
for _, row in df_labels.iterrows():
    arch = arch_map.get(row["archetype_id"], {})
    pref_cats = arch.get("preferred_categories", [])
    chosen_cat = row["category_a"] if row["preferred"] == "A" else row["category_b"]
    if chosen_cat in pref_cats:
        coherent += 1

coherence_rate = coherent / max(len(df_labels), 1)

# 4. Reason quality: reason should not be empty
reason_quality = (df_labels["reason_en"].str.len() > 10).mean()

stats = {
    "total_labels":    len(all_labels),
    "errors":          errors,
    "success_rate":    round(len(all_labels)/max(TARGET,1), 4),
    "confidence_mean": round(conf_mean, 4),
    "high_conf_rate":  round(conf_high, 4),
    "low_conf_rate":   round(conf_low, 4),
    "preferred_A_pct": round(pref_A, 4),
    "preferred_B_pct": round(pref_B, 4),
    "balanced_split":  bool(balanced),
    "category_coherence": round(coherence_rate, 4),
    "reason_quality":  round(reason_quality, 4),
    "pass_80pct_check": bool(coherence_rate >= 0.80),
}

with open(RESULTS / "sitting9_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

# ── Sample inspection ────────────────────────────────────────────
print("\nSample outputs (5 labels):")
print("-" * 70)
for lbl in all_labels[:5]:
    print(f"  [{lbl['archetype']:>28}]  "
          f"A={lbl['item_a_title'][:20]:<20} vs "
          f"B={lbl['item_b_title'][:20]:<20}")
    print(f"   → Preferred: {lbl['preferred']}  "
          f"Confidence: {lbl['confidence']:.2f}  "
          f"Reason: {lbl['reason_en'][:60]}")
    print()

# ── Success check ────────────────────────────────────────────────
print("=" * 60)
print("SITTING 9 SUCCESS CHECK")
print("=" * 60)
checks = {
    "200 labels generated":         len(all_labels) >= TARGET * 0.90,
    "Cache file saved":              cache_file.exists(),
    "Stats file saved":              (RESULTS/"sitting9_stats.json").exists(),
    "Balanced A/B split":            balanced,
    "Category coherence >= 80%":     coherence_rate >= 0.80,
    "Reason quality >= 80%":         reason_quality >= 0.80,
    "Mean confidence > 0.40":        conf_mean > 0.40,
}
all_pass = True
for name, passed in checks.items():
    print(f"  {'✅' if passed else '❌'}  {name}")
    if not passed: all_pass = False

print(f"\n  Labels generated:    {len(all_labels)}/{TARGET}")
print(f"  Category coherence:  {coherence_rate:.1%}")
print(f"  Mean confidence:     {conf_mean:.3f}")
print(f"  Balanced split:      A={pref_A:.1%}  B={pref_B:.1%}")

if all_pass:
    print("\n✅ ALL CHECKS PASSED — Sitting 9 complete")
    print("   Next: Sitting 10 — Full LLM Augmentation (1,000+ pairs)")
else:
    print("\n⚠️  Some checks need attention — see above")
    if coherence_rate < 0.80:
        print("   Tip: Run with --provider openai for better coherence")
    if not balanced:
        print("   Tip: Prompt may be biased — try using fallback prompt")
print("=" * 60)
