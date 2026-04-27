import pandas as pd
import json

# Load files
train = pd.read_csv("data/train.csv")
test  = pd.read_csv("data/test.csv")
items = pd.read_csv("data/eain_items.csv")

with open("results/dataset_stats.json") as f:
    stats = json.load(f)
with open("results/baseline_popularity.json") as f:
    baseline = json.load(f)

print("=== ITEMS ===")
print(f"Total listings:     {len(items)}")
print(f"Categories:         {items['category'].nunique()}")
print(f"Sample:\n{items[['listing_id','title_en','category','price','city']].head(3)}")

print("\n=== TRAIN ===")
print(f"Rows:               {len(train)}")
print(f"Unique users:       {train['user_id'].nunique()}")
print(f"Unique items:       {train['listing_id'].nunique()}")
print(f"Sample:\n{train[['user_id','listing_id','interaction_type','event_weight']].head(3)}")

print("\n=== TEST ===")
print(f"Rows:               {len(test)}")
print(f"Cold item rows:     {(test['item_coldness']=='cold').sum()}")
print(f"Warm item rows:     {(test['item_coldness']=='warm').sum()}")

print("\n=== BASELINE TO BEAT ===")
print(f"HR@10:     {baseline['metrics']['HR@10']}")
print(f"NDCG@10:   {baseline['metrics']['NDCG@10']}")
print(f"Recall@10: {baseline['metrics']['Recall@10']}")