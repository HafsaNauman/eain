# EAIN Recommender System

Cold-start recommender for EAIN, a female-focused Pakistani marketplace.

## Main components
- Synthetic user interaction generation
- CFGAN augmentation
- Hybrid retrieval (FAISS + BM25 + popularity)
- RAG-grounded item augmentation
- LLM user profile generation
- Profile embeddings + noise control
- Ensemble ranking pipeline
- FastAPI service integration

## Key commands
```bash
python run_sitting18.py
python verify_sitting18.py
python run_sitting19.py
python verify_sitting19.py
python final_evaluation.py
uvicorn recommender_service.main:app --reload --port 8001
```

## Main endpoints
- GET /health
- POST /recommend/for-you
- GET /recommend/similar/{listing_id}
- POST /recommend/voice-rerank
- POST /recommend/visual-rerank
- POST /events/log