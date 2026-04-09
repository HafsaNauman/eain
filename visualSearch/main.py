import faiss
import torch
import numpy as np
import requests
import json
import io
import os
import threading
import boto3
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from pydantic import BaseModel

app = FastAPI(title="EAIN Visual Search ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR   = os.getenv("DATA_DIR", ".")
MODEL_DIR  = os.getenv("MODEL_DIR", "./model")
INDEX_FILE = os.path.join(DATA_DIR, "faiss.index")
MAP_FILE   = os.path.join(DATA_DIR, "id_map.json")
CLIP_MODEL = os.getenv("CLIP_MODEL", "openai/clip-vit-base-patch32")
DIM        = 512
device     = "cpu"
_lock      = threading.Lock()

# Load from local model dir if it exists, otherwise download from HuggingFace
if os.path.isdir(MODEL_DIR):
    print(f"Loading CLIP model from local path: {MODEL_DIR}")
    model     = CLIPModel.from_pretrained(MODEL_DIR).to(device)
    processor = CLIPProcessor.from_pretrained(MODEL_DIR)
else:
    print(f"Local model dir not found. Downloading CLIP model from HuggingFace: {CLIP_MODEL}")
    model     = CLIPModel.from_pretrained(CLIP_MODEL).to(device)
    processor = CLIPProcessor.from_pretrained(CLIP_MODEL)
model.eval()


print("✅ Model ready")

def get_s3_client():
    key = os.getenv("DO_SPACES_KEY")
    secret = os.getenv("DO_SPACES_SECRET")
    region = os.getenv("DO_SPACES_REGION")
    if not key or not secret or not region:
        return None
    return boto3.client('s3',
                        region_name=region,
                        endpoint_url=f"https://{region}.digitaloceanspaces.com",
                        aws_access_key_id=key,
                        aws_secret_access_key=secret)

def download_from_spaces():
    s3 = get_s3_client()
    bucket = os.getenv("DO_SPACES_BUCKET")
    if not s3 or not bucket:
        return
    
    print("☁️ Checking DO Spaces for existing index files...")
    # Using boto3 HeadObject to check existence, but download_file is safe with exceptions
    try:
        s3.download_file(bucket, "faiss.index", INDEX_FILE)
        print("☁️ ✅ Downloaded faiss.index")
    except Exception as e:
        print(f"☁️ ⚠️ Could not download faiss.index (Might be first run): {e}")
        
    try:
        s3.download_file(bucket, "id_map.json", MAP_FILE)
        print("☁️ ✅ Downloaded id_map.json")
    except Exception as e:
        print(f"☁️ ⚠️ Could not download id_map.json: {e}")

def upload_to_spaces():
    s3 = get_s3_client()
    bucket = os.getenv("DO_SPACES_BUCKET")
    if not s3 or not bucket:
        return
        
    try:
        s3.upload_file(INDEX_FILE, bucket, "faiss.index")
        s3.upload_file(MAP_FILE, bucket, "id_map.json")
        print("☁️ ✅ Successfully backed up index to DO Spaces")
    except Exception as e:
        print(f"☁️ ❌ Failed to backup to DO Spaces: {e}")

# Attempt to sync from cloud on startup
download_from_spaces()

if os.path.exists(INDEX_FILE):
    index = faiss.read_index(INDEX_FILE)
    print(f"✅ FAISS index loaded: {index.ntotal} vectors")
else:
    index = faiss.IndexFlatIP(DIM)
    print("⚠️  Empty FAISS index created")

if os.path.exists(MAP_FILE):
    with open(MAP_FILE) as f:
        id_map = json.load(f)
    print(f"✅ id_map loaded: {len(id_map)} entries")
else:
    id_map = {}
    print("⚠️  Empty id_map created")

def _save():
    faiss.write_index(index, INDEX_FILE)
    with open(MAP_FILE, "w") as f:
        json.dump(id_map, f)
    
    # Upload to DO spaces in the background to not slow down the API request
    threading.Thread(target=upload_to_spaces).start()

def _embed(image: Image.Image) -> np.ndarray:
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        # same embedding path as notebook: vision → pooler → projection
        vision_out = model.vision_model(pixel_values=inputs["pixel_values"])
        pooled     = vision_out.pooler_output
        feat       = model.visual_projection(pooled)
    feat = feat.cpu().numpy().astype(np.float32)
    feat /= np.linalg.norm(feat, axis=1, keepdims=True)
    return feat   # shape (1, 512)

@app.get("/health")
def health():
    return {"status": "ok", "vectors_indexed": index.ntotal}

class IndexRequest(BaseModel):
    listing_id: str
    image_url: str

@app.post("/index-listing")
async def index_listing(data: IndexRequest):
    try:
        r = requests.get(data.image_url, timeout=15)
        r.raise_for_status()
        image = Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image fetch failed: {e}")

    emb = _embed(image)

    with _lock:
        index.add(emb)
        pos = index.ntotal - 1
        id_map[str(pos)] = data.listing_id
        _save()

    return {"status": "indexed", "position": pos, "listing_id": data.listing_id}

@app.post("/visual-search")
async def visual_search(file: UploadFile = File(...), top_k: int = 10):
    if index.ntotal == 0:
        raise HTTPException(status_code=503, detail="Index empty. Index listings first.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    emb = _embed(image)
    k   = min(top_k, index.ntotal)
    D, I = index.search(emb, k)

    results = [
        {"listing_id": id_map.get(str(idx), None), "score": float(score)}
        for score, idx in zip(D[0], I[0])
        if str(idx) in id_map
    ]
    return {"results": results}

class BulkItem(BaseModel):
    listing_id: str
    image_url: str

@app.post("/bulk-index")
async def bulk_index(items: List[BulkItem]):
    indexed, errors = 0, []
    for item in items:
        try:
            r = requests.get(item.image_url, timeout=15)
            r.raise_for_status()
            image = Image.open(io.BytesIO(r.content)).convert("RGB")
            emb   = _embed(image)
            with _lock:
                index.add(emb)
                id_map[str(index.ntotal - 1)] = item.listing_id
            indexed += 1
        except Exception as e:
            errors.append({"listing_id": item.listing_id, "error": str(e)})
    _save()
    return {"indexed": indexed, "errors": errors, "total": index.ntotal}
