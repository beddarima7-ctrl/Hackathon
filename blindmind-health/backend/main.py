import gc
import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from threading import Lock

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import MAX_INPUT_CHARS, HISTORY_FILE, HISTORY_RETENTION_DAYS
from ai_engine import load_model, generate_reflection
from zk_crypto import generate_zk_commitment, generate_salt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(title="BlindMind Health — Dual-Engine AI + ZK Layer", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_history_lock = Lock()
_history_path = Path(HISTORY_FILE)


@app.on_event("startup")
async def startup():
    load_model()


class JournalRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_INPUT_CHARS)


class ReflectionResponse(BaseModel):
    conversation: str
    feedback: str
    mood_score: int
    anxiety_score: int
    resilience_score: int
    themes: list[str]
    engine_used: str
    commitment_hash: str
    salt: str
    disclaimer: str


def _load_history() -> list[dict]:
    if not _history_path.exists():
        return []
    try:
        return json.loads(_history_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save_history(records: list[dict]) -> None:
    _history_path.write_text(json.dumps(records, indent=2), encoding="utf-8")


def _append_history(mood: int, anxiety: int, resilience: int, themes: list[str], commitment_hash: str) -> None:
    """Stores ONLY aggregate numeric scores + categorical themes + hash.
    Raw journal text is never written here."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=HISTORY_RETENTION_DAYS)
    with _history_lock:
        records = _load_history()
        records = [
            r for r in records
            if datetime.fromisoformat(r["timestamp_utc"]) > cutoff
        ]
        records.append({
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "mood_score": mood,
            "anxiety_score": anxiety,
            "resilience_score": resilience,
            "themes": themes,
            "commitment_hash": commitment_hash,
        })
        _save_history(records)


@app.post("/reflect", response_model=ReflectionResponse)
async def reflect(payload: JournalRequest):
    journal_text = payload.text.strip()
    if not journal_text:
        raise HTTPException(status_code=400, detail="Journal text cannot be empty.")

    try:
        result = generate_reflection(journal_text)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Both local and cloud engines failed — no data was fabricated. ({exc})",
        )
    finally:
        journal_text = None
        del payload
        gc.collect()

    salt = generate_salt()
    commitment_hash = generate_zk_commitment(
        result["mood_score"], result["anxiety_score"], result["resilience_score"], salt,
    )

    _append_history(
        result["mood_score"], result["anxiety_score"], result["resilience_score"],
        result["themes"], commitment_hash,
    )

    return ReflectionResponse(
        conversation=result["conversation"],
        feedback=result["feedback"],
        mood_score=result["mood_score"],
        anxiety_score=result["anxiety_score"],
        resilience_score=result["resilience_score"],
        themes=result["themes"],
        engine_used=result["engine_used"],
        commitment_hash=commitment_hash,
        salt=salt,
        disclaimer=(
            "This is a supportive journaling companion, not a licensed "
            "therapist. If you're in crisis, please reach out to a mental "
            "health professional or crisis line."
        ),
    )


@app.get("/history")
async def get_history():
    return _load_history()


@app.get("/health")
async def health():
    return {"status": "ok"}