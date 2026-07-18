import os

LOCAL_MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
CLOUD_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")

MAX_INPUT_CHARS = 4000
LOCAL_TIMEOUT_SECONDS = 5
LOCAL_MAX_NEW_TOKENS = 220
CLOUD_MAX_NEW_TOKENS = 250
CLOUD_TIMEOUT_SECONDS = 15

HISTORY_FILE = "history_store.json"
HISTORY_RETENTION_DAYS = 7

EMOTION_LABELS = [
    "joy", "sadness", "anxiety", "anger", "stress", "gratitude",
    "loneliness", "hope", "frustration", "calm", "overwhelm", "pride",
]

STRUCTURED_OUTPUT_INSTRUCTIONS = (
    "You are a warm, empathetic journaling companion. You are NOT a "
    "therapist and must never diagnose or give medical advice. "
    "Respond ONLY with a strict JSON object, no markdown fences, no "
    "extra text, using exactly these keys: "
    "'conversation' (2-3 sentence empathetic reflection), "
    "'feedback' (1 actionable, gentle suggestion), "
    "'mood_score' (integer 0-10), "
    "'anxiety_score' (integer 0-10), "
    "'resilience_score' (integer 0-10), "
    "'themes' (array of 2-5 lowercase single-word emotion themes)."
)