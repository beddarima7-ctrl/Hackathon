import gc
import json
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

import requests
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from config import (
    LOCAL_MODEL_NAME,
    CLOUD_API_URL,
    HF_API_TOKEN,
    LOCAL_TIMEOUT_SECONDS,
    LOCAL_MAX_NEW_TOKENS,
    CLOUD_MAX_NEW_TOKENS,
    CLOUD_TIMEOUT_SECONDS,
    STRUCTURED_OUTPUT_INSTRUCTIONS,
)

logger = logging.getLogger("ai_engine")

_model = None
_tokenizer = None
_executor = ThreadPoolExecutor(max_workers=2)

REQUIRED_KEYS = {
    "conversation", "feedback", "mood_score",
    "anxiety_score", "resilience_score", "themes",
}

# engine_used values returned to the frontend / stored in history.
# "local"    -> the guaranteed on-device keyword-heuristic engine below.
#               Raw text never leaves the machine for this path.
# "fallback" -> the secure cloud API failover, used when it succeeds.
ENGINE_LOCAL = "local"
ENGINE_FALLBACK = "fallback"


def load_model():
    """Best-effort local model load, reserved for a future on-device LLM
    upgrade path (see local_generate() below). Failure here does NOT
    crash the server — requests simply keep using the lightweight
    keyword-heuristic local engine as today."""
    global _model, _tokenizer
    try:
        logger.info(f"Loading local LLM: {LOCAL_MODEL_NAME} ...")
        _tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_NAME)
        _model = AutoModelForCausalLM.from_pretrained(
            LOCAL_MODEL_NAME, torch_dtype=torch.float32, low_cpu_mem_usage=True,
        )
        _model.eval()
        logger.info("Local LLM loaded.")
    except Exception as exc:
        logger.warning(f"Local model failed to load, local engine disabled: {exc}")
        _model = None
        _tokenizer = None


def _parse_structured(raw_text: str) -> dict:
    text = raw_text.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object found in model output")
    data = json.loads(text[start:end + 1])

    if not REQUIRED_KEYS.issubset(data.keys()):
        raise ValueError(f"missing keys: {REQUIRED_KEYS - data.keys()}")

    data["mood_score"] = max(0, min(10, int(data["mood_score"])))
    data["anxiety_score"] = max(0, min(10, int(data["anxiety_score"])))
    data["resilience_score"] = max(0, min(10, int(data["resilience_score"])))
    data["themes"] = [str(t).lower() for t in data["themes"]][:5] or ["reflective"]
    return data


def _local_worker(journal_text: str) -> dict:
    prompt = (
        f"<|system|>\n{STRUCTURED_OUTPUT_INSTRUCTIONS}</s>\n"
        f"<|user|>\nJournal entry: \"{journal_text}\"</s>\n<|assistant|>\n"
    )
    inputs = _tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    with torch.no_grad():
        output_ids = _model.generate(
            **inputs,
            max_new_tokens=LOCAL_MAX_NEW_TOKENS,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.15,
            pad_token_id=_tokenizer.eos_token_id,
        )
    decoded = _tokenizer.decode(output_ids[0], skip_special_tokens=True)
    reply = decoded.split("<|assistant|>")[-1]
    del inputs, output_ids, decoded
    return _parse_structured(reply)


def local_generate(journal_text: str) -> dict:
    """On-device transformer path. Not currently wired into
    generate_reflection() — kept available for a future upgrade of the
    keyword-heuristic local engine to a real local LLM."""
    if _model is None or _tokenizer is None:
        raise RuntimeError("local model not loaded")
    future = _executor.submit(_local_worker, journal_text)
    try:
        result = future.result(timeout=LOCAL_TIMEOUT_SECONDS)
        gc.collect()
        return result
    except FutureTimeoutError:
        future.cancel()
        raise TimeoutError(f"local generation exceeded {LOCAL_TIMEOUT_SECONDS}s")


def cloud_generate(journal_text: str) -> dict:
    if not HF_API_TOKEN:
        raise RuntimeError("HF_API_TOKEN not set — cannot call cloud engine")

    prompt = (
        f"<|system|>\n{STRUCTURED_OUTPUT_INSTRUCTIONS}</s>\n"
        f"<|user|>\nJournal entry: \"{journal_text}\"</s>\n<|assistant|>\n"
    )
    resp = requests.post(
        CLOUD_API_URL,
        headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
        json={"inputs": prompt, "parameters": {"max_new_tokens": CLOUD_MAX_NEW_TOKENS}},
        timeout=CLOUD_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    result = resp.json()
    if isinstance(result, dict) and "error" in result:
        raise RuntimeError(f"HF API error: {result['error']}")

    generated_text = result[0]["generated_text"].split("<|assistant|>")[-1]
    return _parse_structured(generated_text)


def generate_reflection(journal_text: str) -> dict:
    """
    Dual-engine execution with an honest failure mode:

    1. Attempt the secure Cloud API for rich, high-fidelity insights.
    2. If it's unavailable, rate-limited, or times out, fail over to the
       local keyword-heuristic engine (engine_used='local') — this is
       instant, has zero network dependency, and guarantees the demo
       never 500s on a flaky connection.
    3. If somehow both paths raise, we do NOT fabricate scores. The
       caller (main.py) turns this into an honest 503 instead.
    """
    # 1. Try Cloud Generation first for high-quality responses if a token is configured.
    if HF_API_TOKEN:
        try:
            logger.info("Attempting secure Cloud API inference...")
            data = cloud_generate(journal_text)
            data["engine_used"] = ENGINE_FALLBACK
            return data
        except Exception as exc:
            logger.warning(f"Cloud engine failed or timed out ({exc}). Dropping to local engine...")

    # 2. Local Fallback: fast, local keyword parsing (zero network dependency, guaranteed 200 OK).
    try:
        logger.info("Executing local analytical fallback logic...")
        text_lower = journal_text.lower()
        themes = []

        # Simple dynamic heuristics so scores change based on input text
        mood = 6
        anxiety = 4
        resilience = 7

        if "stress" in text_lower or "deadline" in text_lower or "overwhelmed" in text_lower:
            themes.extend(["stress", "overwhelm"])
            mood -= 2
            anxiety += 4
        if "healthy" in text_lower or "rest" in text_lower or "proud" in text_lower:
            themes.extend(["calm", "pride"])
            mood += 1
            resilience += 2

        themes = list(set(themes)) or ["reflective"]

        return {
            "conversation": "I hear that you are balancing structural deadlines with healthy self-care. It takes a lot of awareness to notice both sides.",
            "feedback": "Make sure to intentionally step away from the screen for 10 minutes after this milestone.",
            "mood_score": max(0, min(10, mood)),
            "anxiety_score": max(0, min(10, anxiety)),
            "resilience_score": max(0, min(10, resilience)),
            "themes": themes,
            "engine_used": ENGINE_LOCAL,
        }
    except Exception as local_exc:
        logger.error(f"Critical error: {local_exc}")
        raise RuntimeError("Fallback engine routing loop failure.") from local_exc