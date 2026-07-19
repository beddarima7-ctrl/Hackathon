import gc
import json
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

import requests
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from config import (
    LOCAL_MODEL_NAME, CLOUD_API_URL, HF_API_TOKEN,
    LOCAL_TIMEOUT_SECONDS, LOCAL_MAX_NEW_TOKENS,
    CLOUD_MAX_NEW_TOKENS, CLOUD_TIMEOUT_SECONDS,
    STRUCTURED_OUTPUT_INSTRUCTIONS,
)
from ooda_client import call_ooda_inference, OodaNotConfiguredError

logger = logging.getLogger("ai_engine")

_model = None
_tokenizer = None
_executor = ThreadPoolExecutor(max_workers=2)

REQUIRED_KEYS = {
    "conversation", "feedback", "mood_score",
    "anxiety_score", "resilience_score", "themes",
}

MAX_HISTORY_TURNS = 25  # bound prompt size for multi-turn context


def load_model():
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


def _extract_last_user_message(messages: list[dict]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user" and m.get("content", "").strip():
            return m["content"].strip()
    raise ValueError("messages contains no non-empty user turn")


def _build_prompt(messages: list[dict]) -> str:
    
    trimmed = messages[-MAX_HISTORY_TURNS:]
    convo_lines = [
        f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
        for m in trimmed
    ]
    convo_text = "\n".join(convo_lines)
    return (
        f"<|system|>\n{STRUCTURED_OUTPUT_INSTRUCTIONS}\n"
        f"Continue this conversation, responding to the latest user message.</s>\n"
        f"<|user|>\nConversation so far:\n{convo_text}</s>\n<|assistant|>\n"
    )


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


def _local_worker(messages: list[dict]) -> dict:
    prompt = _build_prompt(messages)
    inputs = _tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1536)
    with torch.no_grad():
        output_ids = _model.generate(
            **inputs, max_new_tokens=LOCAL_MAX_NEW_TOKENS, do_sample=True,
            temperature=0.7, top_p=0.9, repetition_penalty=1.15,
            pad_token_id=_tokenizer.eos_token_id,
        )
    decoded = _tokenizer.decode(output_ids[0], skip_special_tokens=True)
    reply = decoded.split("<|assistant|>")[-1]
    del inputs, output_ids, decoded
    return _parse_structured(reply)


def local_generate(messages: list[dict]) -> dict:
    if _model is None or _tokenizer is None:
        raise RuntimeError("local model not loaded")
    future = _executor.submit(_local_worker, messages)
    try:
        result = future.result(timeout=LOCAL_TIMEOUT_SECONDS)
        gc.collect()
        return result
    except FutureTimeoutError:
        future.cancel()
        raise TimeoutError(f"local generation exceeded {LOCAL_TIMEOUT_SECONDS}s")


def cloud_generate(messages: list[dict]) -> dict:
    if not HF_API_TOKEN:
        raise RuntimeError("HF_API_TOKEN not set")
    prompt = _build_prompt(messages)
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


def _dynamic_fallback(latest_user_text: str) -> dict:
    text_lower = latest_user_text.lower()
    themes, mood, anxiety, resilience = [], 6, 4, 7

    if any(w in text_lower for w in ("stress", "deadline", "overwhelmed")):
        themes += ["stress", "overwhelm"]
        mood -= 2
        anxiety += 4
    if any(w in text_lower for w in ("healthy", "rest", "proud", "calm")):
        themes += ["calm", "pride"]
        mood += 1
        resilience += 2
    if any(w in text_lower for w in ("sad", "down", "tired", "lonely")):
        themes += ["sadness"]
        mood -= 1
        resilience -= 1

    return {
        "conversation": "I'm having trouble reaching our AI engines right now, but I'm still listening — thank you for sharing this.",
        "feedback": "Take a moment to breathe while we reconnect to a full analysis engine.",
        "mood_score": max(0, min(10, mood)),
        "anxiety_score": max(0, min(10, anxiety)),
        "resilience_score": max(0, min(10, resilience)),
        "themes": list(set(themes)) or ["reflective"],
    }


def generate_reflection(messages: list[dict]) -> dict:
    
    if not messages:
        raise ValueError("messages must be a non-empty list")

    latest_user_text = _extract_last_user_message(messages)

    try:
        result = call_ooda_inference(latest_user_text)
        data = _parse_structured(result["content"])
        data["engine_used"] = "ooda_tee"
        return data
    except OodaNotConfiguredError:
        logger.info("OODA AI not configured, trying local engine")
    except Exception as exc:
        logger.warning(f"OODA AI call failed ({exc}), trying local engine")

    try:
        data = local_generate(messages)
        data["engine_used"] = "local"
        return data
    except Exception as exc:
        logger.warning(f"Local engine failed ({exc}), trying cloud")

    try:
        data = cloud_generate(messages)
        data["engine_used"] = "cloud"
        return data
    except Exception as exc:
        logger.warning(f"Cloud engine also failed ({exc}), using dynamic fallback")

    data = _dynamic_fallback(latest_user_text)
    data["engine_used"] = "heuristic_fallback"
    return data