# EAIN Recommender System — Progress & Results Document
**Project:** EAIN — Female-Focused Digital Marketplace, Pakistan  
**Generated:** April 27, 2026  
**Stage:** Stage 1 Complete (Sittings 1–5 of 20)

---

## Quick Reference — What Has Been Built

| File | Location | Purpose |
|---|---|---|
| `eain_items.csv` | `recommender_system/data/` | 80 synthetic listings (real DB on May 1) |
| `user_archetypes.json` | `recommender_system/data/` | 13 Pakistani buyer personas |
| `eain_interactions_synthetic.csv` | `recommender_system/data/` | 3,893 fake interactions |
| `eain_interactions_events.csv` | `recommender_system/data/` | 19,409 raw events |
| `train.csv` | `recommender_system/data/` | Model training data (before Apr 1) |
| `test.csv` | `recommender_system/data/` | Model evaluation data (after Apr 1) |
| `dataset_stats.json` | `recommender_system/results/` | Dataset statistics |
| `baseline_popularity.json` | `recommender_system/results/` | Minimum benchmark to beat |

---

## What Is This System Doing?

The EAIN app has no real users yet. Before real data exists, the recommender needs
something to learn from. The approach:

1. CREATE synthetic users (fake people with realistic Pakistani shopping behavior)
2. SIMULATE their interactions (clicks, saves, orders) over 3 months
3. TRAIN a model on those interactions
4. EVALUATE how well it recommends — beat a simple popularity baseline
5. REPLACE synthetic data with real data as users join the app

---

## Stage 1 Results

### The Catalog — 80 Listings

**Distribution by category:**
  Clothing                            17 listings
  Jewelry                             9 listings
  Beauty & Skincare                   7 listings
  Accessories                         6 listings
  Fabric                              6 listings
  Makeup & Beauty Services            6 listings
  Mehndi Services                     5 listings
  Food & Organic                      4 listings
  Bridal & Wedding                    4 listings
  Photography                         4 listings
  Home & Decor                        3 listings
  Hair & Salon Services               3 listings
  Catering                            2 listings
  Tailoring                           2 listings
  Event Services                      2 listings

**Distribution by city:**
  Karachi         25 listings
  Lahore          25 listings
  Islamabad       13 listings
  Multan          9 listings
  Faisalabad      7 listings
  Peshawar        1 listings

**Distribution by price band:**
  mid        40 listings
  low        25 listings
  high       15 listings

> Price bands: low = under PKR 1,500 | mid = PKR 1,500–8,000 | high = over PKR 8,000

---

### The 13 User Archetypes

These are the "character types" of EAIN buyers. Each has a city, preferred categories,
price sensitivity, and interaction tendencies.

| ID  | Archetype Name                        | City              | Top Price | Books Services? |
|-----|---------------------------------------|-------------------|-----------|-----------------|
| A01 | Karachi Bridal Shopper                | Karachi           | High      | 50% chance      |
| A02 | Lahore Festive Shopper                | Lahore            | Mid       | 10% chance      |
| A03 | Multan Budget Buyer                   | Multan/Faisalabad | Low       | 5% chance       |
| A04 | Islamabad Beauty Enthusiast           | Islamabad         | Mid       | 45% chance      |
| A05 | Lahore Tailoring & Fabric Seeker      | Lahore/Faisalabad | Mid       | 40% chance      |
| A06 | Karachi Jewelry Lover                 | Karachi           | Mid       | 5% chance       |
| A07 | Karachi Event Planner                 | Karachi/Lahore    | High      | 55% chance      |
| A08 | Islamabad Organic Shopper             | Islamabad         | Low       | 8% chance       |
| A09 | Lahore Salon Service Seeker           | Lahore/Karachi    | Mid       | 55% chance      |
| A10 | Multan Traditional Craft Buyer        | Multan/Karachi    | Mid       | 5% chance       |
| A11 | Karachi Party Wear Shopper            | Karachi/Islamabad | Mid       | 8% chance       |
| A12 | Lahore Dupatta & Fabric Buyer         | Lahore/Faisalabad | Mid       | 5% chance       |
| A13 | Islamabad Mehndi & Event Seeker       | Islamabad/Lahore  | Mid       | 60% chance      |

---

### Synthetic Interaction Data

**Event funnel (19,409 total events):**

| Event       | Count  | % of Impressions | Meaning                          |
|-------------|--------|------------------|----------------------------------|
| Impression  | 12,058 | 100%             | Item shown to user               |
| Click       |  4,321 | 35.8%            | User tapped on item              |
| Save        |  1,532 | 12.7%            | User bookmarked item             |
| Cart Add    |    690 |  5.7%            | User added to cart               |
| Order       |    365 |  3.0%            | User purchased product           |
| Booking     |    443 |  3.7%            | User booked a service            |

**Interaction weights for model training:**

| Interaction Type | Weight | Reasoning                                    |
|------------------|--------|----------------------------------------------|
| Click            | 1.0    | Mild signal — could be accidental            |
| Save             | 2.0    | Genuine interest                             |
| Cart Add         | 3.0    | Strong purchase intent                       |
| Order/Booking    | 5.0    | Confirmed preference — strongest signal      |

---

### Train / Test Split

Split date: **April 1, 2026**

| Set   | Rows  | Users | Items | Meaning                          |
|-------|-------|-------|-------|----------------------------------|
| Train | 1,216 | 197   | 65    | What the model LEARNS from       |
| Test  | 2,387 | 276   | 80    | What we EVALUATE the model on    |

**Warm vs Cold items:**

| Type       | Count | Definition                                      |
|------------|-------|-------------------------------------------------|
| Warm items | 65    | Had ≥3 interactions in train — model knows them |
| Cold items | 15    | ZERO train interactions — model never saw them  |

> Cold items are the hard problem. The entire research contribution of this FYP
> is answering: "Can we recommend items the model has never seen?"

**Train sparsity: 90.5%**  
This means only 9.5% of all possible (user, item) pairs have an interaction.
Real e-commerce systems are typically 98–99% sparse. 90.5% is realistic for
a cold-start scenario with a small synthetic dataset.

---

## The Baseline — Minimum Score to Beat

The PopularityBaseline recommends the same top-10 most interacted items to EVERY user,
regardless of who they are. This is the dumbest possible recommender.

### Results

| Metric    | Score  | What It Means                                                  |
|-----------|--------|----------------------------------------------------------------|
| HR@10     | 0.6268 | 62.7% of users found a relevant item in the top-10 list       |
| NDCG@10   | 0.1340 | Relevant items were ranked around position 7-8 on average     |
| Recall@10 | 0.1300 | On average 13% of all relevant items appeared in top-10       |

**Every model from Sitting 6 onward MUST beat all three numbers.**

### Why 62.7% is actually hard to beat

Popular items ARE popular for a reason — many people like them. The baseline works
because EAIN is a niche marketplace (Pakistani female fashion/services) so tastes
overlap a lot. Our personalized model needs to do meaningfully better, not just
slightly better.

---

## Metric Glossary

**HR@10 (Hit Rate at 10)**
For each test user, did ANY of their actual purchases appear in our top-10 recommendations?
- 0.0 = never got it right
- 1.0 = always had the right item somewhere in top-10
- Current: 0.627 (62.7%)

**NDCG@10 (Normalized Discounted Cumulative Gain at 10)**
When we DID include the right item, where in the list did we put it?
- Higher rank (position 1-2) = higher NDCG
- Lower rank (position 9-10) = lower NDCG
- Current: 0.134 (relevant items end up near position 7-8)

**Recall@10**
Out of all items a user interacted with, what fraction appeared in our top-10?
- Current: 0.130 (we capture 13% of their interests)

---

## Target Scores Per Stage

| Stage      | Sitting | HR@10  | What changes                          |
|------------|---------|--------|---------------------------------------|
| Baseline   | S5      | 0.627  | Popularity only — same list everyone  |
| Content    | S6      | ~0.65  | Use item text + CLIP embeddings       |
| CFGAN      | S11     | ~0.72  | GAN-augmented collaborative filtering |
| Hybrid     | S13     | ~0.78  | FAISS + BM25 + Popularity fusion      |
| Full       | S20     | ~0.82  | All components + user profiles + RAG  |

---

## DB Blocker — Action Required May 1

The Neon/PostgreSQL database is DOWN until May 1, 2026.
Current catalog uses synthetic data. On May 1:

```sql
SELECT listing_id, vendor_id, listing_type, title_en, title_ur,
       description_en, category, tags, price, is_active, city,
       popularity_count
FROM listings
WHERE is_active = true;
```

Then:
1. Save output as `recommender_system/data/eain_items.parquet`
2. Re-run field verification: `python recommender_system/verify_env.py`
3. Continue from Sitting 6 with real data

---

## Sitting Progress

| # | Sitting Name                  | Status    | Output                              |
|---|-------------------------------|-----------|-------------------------------------|
| 1 | Environment Setup             | ✅ Done   | venv, requirements.txt, folders     |
| 2 | EAIN Catalog Freeze           | ✅ Done   | eain_items.csv (synthetic)          |
| 3 | Synthetic User Archetypes     | ✅ Done   | user_archetypes.json                |
| 4 | Synthetic Interaction Matrix  | ✅ Done   | interactions csv + events csv       |
| 5 | Cold/Warm Split + Baseline    | ✅ Done   | train.csv, test.csv, baseline.json  |
| 6 | Remaining Baselines           | ⏳ Next   | baseline_table.csv                  |
| 7 | CFGAN Architecture            | ⏳ Pending| cfgan.py                            |
| 8 | CFGAN Training                | ⏳ Pending| model checkpoints                   |
|...|                               |           |                                     |
|20 | FastAPI + Report              | ⏳ Pending| recommender_service/main.py         |

---

*Document auto-generated. Update after each sitting.*
