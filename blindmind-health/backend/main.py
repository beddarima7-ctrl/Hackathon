import hashlib
import json
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline

MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"
MAX_TOKENS_PER_CHUNK = 480
CHUNK_OVERLAP = 40

app = FastAPI(title="BlindMind Health Analyzer", version="0.1.0")

# Enables Saiem's frontend workspace container to fetch data safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading local transformer model pipeline...")
sentiment_pipeline = pipeline("sentiment-analysis", model=MODEL_NAME, tokenizer=MODEL_NAME, truncation=True)
tokenizer = sentiment_pipeline.tokenizer
print("Model attached. Server unblocked.")

class AnalysisResponse(BaseModel):
    wallet_id_hash: str
    wellness_score: int
    record_commitment_hash: str
    timestamp_utc: str
    chunks_analyzed: int

def chunk_text(raw_text: str) -> list[str]:
    token_ids = tokenizer.encode(raw_text, add_special_tokens=False)
    if not token_ids:
        raise ValueError("Input text produced empty token sequences.")
    
    chunks: list[str] = []
    start = 0
    step = MAX_TOKENS_PER_CHUNK - CHUNK_OVERLAP
    while start < len(token_ids):
        end = min(start + MAX_TOKENS_PER_CHUNK, len(token_ids))
        chunk_text_decoded = tokenizer.decode(token_ids[start:end], skip_special_tokens=True)
        chunks.append(chunk_text_decoded)
        if end == len(token_ids):
            break
        start += step
    return chunks

def compute_wellness_score(chunks: list[str]) -> int:
    results = sentiment_pipeline(chunks)
    weighted_total = 0.0
    for result in results:
        polarity = result["score"] if result["label"] == "POSITIVE" else (1.0 - result["score"])
        weighted_total += polarity
    score = round((weighted_total / len(results)) * 100)
    return max(0, min(100, score))

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(wallet_pubkey: str, file: UploadFile = File(...)):
    if file.content_type not in ("text/plain", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Sandbox only accepts plain text (.txt) files.")
    
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Target text payload is empty.")
    
    try:
        raw_text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File encoding must be clean UTF-8.")

    try:
        chunks = chunk_text(raw_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    wellness_score = compute_wellness_score(chunks)
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Rafan's Fix: Generate the hash directly from the stable text bytes.
    # This matches the Bytes<32> registerHealthAnchor structure in main.compact.
    record_commitment_hash = hashlib.sha256(raw_bytes).hexdigest()
    wallet_id_hash = hashlib.sha256(wallet_pubkey.encode("utf-8")).hexdigest()

    return AnalysisResponse(
        wallet_id_hash=wallet_id_hash,
        wellness_score=wellness_score,
        record_commitment_hash=record_commitment_hash,
        timestamp_utc=timestamp,
        chunks_analyzed=len(chunks),
    )

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_NAME}
