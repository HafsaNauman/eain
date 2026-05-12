"""
merge_listings.py
Merges real database listings into the synthetic dataset.
- Maps fragmented real categories → broader recommender categories
- Fills missing city, popularity, tags
- Filters out placeholder items ("Jewellery Piece N", "Shoe Model N")
- Deduplicates by listing_id (real data wins if overlap)
- Backs up old CSV before overwriting

Usage:   python merge_listings.py
Run from: recommender_system/
"""

import csv, ast, random, re, shutil
from pathlib import Path
from datetime import datetime

DATA = Path("data")
SYNTHETIC_CSV = DATA / "eain_items_synthetic.csv"  # backup name
REAL_CSV = DATA / "eain_items_real.csv"             # backup name
OUTPUT_CSV = DATA / "eain_items.csv"

# ── Category mapping: real DB category → recommender category ────
CATEGORY_MAP = {
    # Fashion & clothing
    "Fashion & Apparel":       "Clothing",
    "Men Shalwar Kameez":      "Clothing",
    "Formal Wear":             "Clothing",
    "Wash & Wear":             "Clothing",
    "Festive Collection":      "Clothing",
    "Casual Wear":             "Clothing",
    "Premium Collection":      "Clothing",
    "Wedding Collection":      "Bridal & Wedding",
    "Summer Collection":       "Clothing",
    "Winter Collection":       "Clothing",
    "Designer Wear":           "Clothing",

    # Bags → Accessories
    "Handbags":                "Accessories",
    "Tote Bags":               "Accessories",
    "Crossbody Bags":          "Accessories",
    "Shoulder Bags":           "Accessories",
    "Mini Bags":               "Accessories",
    "Office Bags":             "Accessories",
    "Leather Bags":            "Accessories",
    "Clutches":                "Accessories",

    # Jewellery
    "Jewellery":               "Jewelry",

    # Shoes
    "Shoes":                   "Accessories",

    # Services
    "Beauty & Wellness":       "Makeup & Beauty Services",
    "Hair & Makeup":           "Hair & Salon Services",
    "Bridal Services":         "Mehndi Services",
    "Photography":             "Photography",

    # Other
    "Other":                   "Home & Decor",
    "Home & Garden":           "Home & Decor",
}

# ── Fix 1: Junk listing IDs to exclude entirely ─────────────────
EXCLUDE_IDS = {"28", "29"}

# ── Fix 2: Jewelry items mis-categorised as Fashion & Apparel ───
JEWELRY_IDS = {"24", "25", "26", "27"}

# ── Tag enrichment by mapped category ────────────────────────────
TAG_ENRICHMENT = {
    "Clothing": ["fashion", "outfit", "pakistani"],
    "Bridal & Wedding": ["wedding", "bridal", "formal"],
    "Accessories": ["accessory", "fashion"],
    "Jewelry": ["jewelry", "accessory", "traditional"],
    "Makeup & Beauty Services": ["beauty", "service", "professional"],
    "Hair & Salon Services": ["salon", "service", "hair"],
    "Mehndi Services": ["mehndi", "henna", "bridal"],
    "Photography": ["photography", "professional", "event"],
    "Home & Decor": ["decor", "home"],
}

# ── Extra tags based on keywords in title ────────────────────────
TITLE_TAG_RULES = [
    (r"shalwar.kameez|kameez", ["shalwar-kameez", "traditional"]),
    (r"embroid", ["embroidered"]),
    (r"formal", ["formal"]),
    (r"casual", ["casual"]),
    (r"summer|cotton", ["summer", "cotton"]),
    (r"winter|wool|warm", ["winter", "warm"]),
    (r"eid|festiv", ["eid", "festive"]),
    (r"wedding|bridal|nikah", ["wedding", "bridal"]),
    (r"leather", ["leather", "premium"]),
    (r"tote|handbag|bag|clutch", ["bag"]),
    (r"shoe|khussa|mojari", ["footwear"]),
    (r"gold|silver|kundan", ["traditional"]),
    (r"hoop|earring|necklace|ring|bangle|bracelet", ["jewelry"]),
    (r"kimono|abaya|maxi|gown", ["dress", "fashion"]),
    (r"pajama|lounge", ["loungewear", "comfortable"]),
    (r"makeup|bridal.makeup", ["makeup", "beauty"]),
    (r"mehndi|henna", ["mehndi", "henna"]),
    (r"photo|video", ["photography"]),
    (r"hair|blow.dry|styling", ["hair", "styling"]),
]

# ── Cities to assign (weighted by typical vendor distribution) ───
CITIES = ["Karachi"] * 4 + ["Lahore"] * 4 + ["Islamabad"] * 2 + \
         ["Faisalabad"] * 1 + ["Multan"] * 1

rng = random.Random(42)


def is_placeholder(title: str) -> bool:
    """Detect placeholder items like 'Jewellery Piece 1', 'Shoe Model 3'."""
    return bool(re.match(
        r"^(Jewellery Piece|Shoe Model|Test Item)\s*\d+$", title, re.IGNORECASE
    ))


def parse_tags(tags_str: str) -> list:
    """Safely parse tags string into a list."""
    if not tags_str or tags_str.strip() == "[]":
        return []
    try:
        return ast.literal_eval(tags_str)
    except Exception:
        return []


def enrich_tags(tags: list, title: str, mapped_category: str) -> list:
    """Add relevant tags based on category and title keywords."""
    tag_set = set(t.lower().strip() for t in tags)

    # Add category-based tags
    for t in TAG_ENRICHMENT.get(mapped_category, []):
        tag_set.add(t)

    # Add title-keyword-based tags
    title_lower = title.lower()
    for pattern, extra_tags in TITLE_TAG_RULES:
        if re.search(pattern, title_lower):
            tag_set.update(extra_tags)

    return sorted(tag_set)


def get_price_band(price):
    if price is None or price == 0:
        return "mid"
    price = float(price)
    if price <= 1000:
        return "low"
    elif price <= 7000:
        return "mid"
    else:
        return "high"


def load_csv(path: Path) -> list[dict]:
    """Load CSV into list of dicts."""
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_csv(rows: list[dict], path: Path, fieldnames: list[str]):
    """Save list of dicts to CSV."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ── Main ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("MERGE LISTINGS — Real DB + Synthetic")
    print("=" * 60)

    # Step 1: Back up current CSV as the "real" extract (only if no backup yet)
    if OUTPUT_CSV.exists() and not REAL_CSV.exists():
        shutil.copy2(OUTPUT_CSV, REAL_CSV)
        print(f"  Backed up current CSV → {REAL_CSV}")
    elif REAL_CSV.exists():
        print(f"  Using existing real backup → {REAL_CSV}")

    # Step 2: Restore synthetic data from git or use embedded copy
    # We need the original synthetic CSV. Check if backup exists.
    if not SYNTHETIC_CSV.exists():
        # The current file IS the real extract. We need the synthetic.
        # Try git to restore the original
        import subprocess
        try:
            result = subprocess.run(
                ["git", "show", "HEAD:recommender_system/data/eain_items.csv"],
                capture_output=True, text=True, encoding="utf-8",
                cwd=str(Path(__file__).resolve().parent.parent),
            )
            if result.returncode == 0 and "listing_id" in result.stdout:
                with open(SYNTHETIC_CSV, "w", encoding="utf-8") as f:
                    f.write(result.stdout)
                print(f"  Restored synthetic data from git → {SYNTHETIC_CSV}")
            else:
                print("  ⚠️  Could not restore synthetic CSV from git.")
                print("     Will use only real data with enrichment.")
        except Exception as e:
            print(f"  ⚠️  Git restore failed: {e}")

    # Step 3: Load both datasets
    synthetic_rows = load_csv(SYNTHETIC_CSV)
    real_rows = load_csv(REAL_CSV)

    print(f"\n  Synthetic items: {len(synthetic_rows)}")
    print(f"  Real DB items:   {len(real_rows)}")

    # Step 4: Process real rows — filter, map, enrich
    processed_real = []
    skipped = 0
    for row in real_rows:
        title = row.get("title_en", "")
        lid = str(row.get("listing_id", ""))

        # Fix 1: Skip junk items by ID
        if lid in EXCLUDE_IDS:
            skipped += 1
            continue

        # Skip placeholders
        if is_placeholder(title):
            skipped += 1
            continue

        # Skip junk entries
        if not title or len(title) < 3:
            skipped += 1
            continue

        orig_category = row.get("category", "")
        mapped_category = CATEGORY_MAP.get(orig_category, orig_category)

        # Fix 2: Reclassify jewelry items
        if lid in JEWELRY_IDS:
            mapped_category = "Jewelry"

        # Parse and enrich tags
        tags = parse_tags(row.get("tags", "[]"))
        tags = enrich_tags(tags, title, mapped_category)

        # Fill missing city
        city = row.get("city", "").strip()
        if not city:
            city = rng.choice(CITIES)

        # Fill missing popularity
        pop = row.get("popularity_count", "0")
        try:
            pop = int(pop)
        except (ValueError, TypeError):
            pop = 0
        if pop == 0:
            pop = rng.randint(5, 60)

        # Recalculate price band
        try:
            price = float(row.get("price", 0))
        except (ValueError, TypeError):
            price = 0
        price_band = get_price_band(price)

        processed_row = {
            "listing_id":       row["listing_id"],
            "title_en":         title,
            "title_ur":         row.get("title_ur", ""),
            "category":         mapped_category,
            "tags":             repr(tags),
            "price":            price,
            "city":             city,
            "listing_type":     row.get("listing_type", "product"),
            "price_band":       price_band,
            "currency":         row.get("currency", "PKR"),
            "is_active":        row.get("is_active", "True"),
            "popularity_count": pop,
            "vendor_id":        row.get("vendor_id", ""),
            "stock_status":     row.get("stock_status", "in_stock"),
            "description_en":   row.get("description_en", ""),
        }
        processed_real.append(processed_row)

    print(f"  Skipped placeholders: {skipped}")
    print(f"  Usable real items:    {len(processed_real)}")

    # Step 5: Merge — real data wins on ID conflicts
    # all_real_ids includes filtered placeholders so synthetic items cannot reuse their IDs
    all_real_ids = {str(r.get("listing_id", "")) for r in real_rows}
    real_ids = {r["listing_id"] for r in processed_real}
    merged = []

    # Add synthetic items (only if no ID conflict with ANY real item, including filtered ones)
    kept_synthetic = 0
    for row in synthetic_rows:
        if row["listing_id"] not in all_real_ids:
            merged.append(row)
            kept_synthetic += 1

    # Add processed real items
    merged.extend(processed_real)

    # Sort by listing_id
    merged.sort(key=lambda r: int(r["listing_id"]))

    print(f"\n  Kept synthetic:  {kept_synthetic}")
    print(f"  Added real:      {len(processed_real)}")
    print(f"  Total merged:    {len(merged)}")

    # Step 6: Save
    FIELDNAMES = [
        "listing_id", "title_en", "title_ur", "category", "tags",
        "price", "city", "listing_type", "price_band", "currency",
        "is_active", "popularity_count", "vendor_id", "stock_status",
        "description_en",
    ]
    save_csv(merged, OUTPUT_CSV, FIELDNAMES)
    print(f"\n✅ Saved merged dataset → {OUTPUT_CSV}")

    # Step 7: Summary
    categories = {}
    for r in merged:
        cat = r["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\nCategory breakdown ({len(categories)} categories):")
    for cat, cnt in sorted(categories.items(), key=lambda x: -x[1]):
        src = "mixed" if any(
            r["category"] == cat for r in processed_real
        ) and any(
            r.get("category") == cat for r in synthetic_rows
        ) else ("real" if any(
            r["category"] == cat for r in processed_real
        ) else "synthetic")
        print(f"    {cat:<30} {cnt:>3}  ({src})")

    print("\n" + "=" * 60)
    print("Done! You can now run: python run_sitting9.py")
    print("=" * 60)
