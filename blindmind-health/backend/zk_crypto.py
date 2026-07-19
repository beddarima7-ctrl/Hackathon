import hashlib
import secrets


def generate_salt() -> str:
    """32 hex chars = 16 bytes, cryptographically random"""
    return secrets.token_hex(16)


def generate_zk_commitment(mood: int, anxiety: int, resilience: int, salt: str = None) -> str:
    """
    Produces a SHA-256 hex commitment over (mood, anxiety, resilience, salt).
    """
    if salt is None:
        salt = generate_salt()

    for name, value in (("mood", mood), ("anxiety", anxiety), ("resilience", resilience)):
        if not isinstance(value, int) or not (0 <= value <= 10):
            raise ValueError(f"{name} must be an integer 0-10, got {value!r}")

    canonical = f"mood:{mood}|anxiety:{anxiety}|resilience:{resilience}|salt:{salt}"
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()