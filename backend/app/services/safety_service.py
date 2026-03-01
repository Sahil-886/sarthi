"""
Safety Service — Self-Harm Detection Engine
============================================
Hybrid detection: keyword matching + escalation levels.
Risk levels: "low" | "concern" | "high"
"""
import re
import logging

logger = logging.getLogger(__name__)

# ── Keyword lists ─────────────────────────────────────────────────────────────

HIGH_RISK_PHRASES = [
    "suicide", "kill myself", "end my life", "want to die", "hurt myself",
    "self harm", "self-harm", "cut myself", "no reason to live",
    "life is meaningless", "better if i disappear", "i can't go on",
    "can't go on anymore", "don't want to be here", "better off dead",
    "khatam karna chahta", "khatam karna chahti", "jeena nahi chahta",
    "jeena nahi chahti", "marna chahta", "marna chahti",
]

CONCERN_PHRASES = [
    "worthless", "hate myself", "nobody cares about me", "completely alone",
    "all alone", "nobody understands me", "i give up", "can't take this anymore",
    "can't handle this", "breaking down", "lost all hope", "no hope",
    "exhausted with life", "tired of living", "i'm done", "so done",
    "akela hoon", "koi nahi hai", "thak gaya", "thak gayi", "toot gaya", "toot gayi",
]


def _normalise(text: str) -> str:
    """Lowercase, collapse whitespace, remove punctuation noise."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def detect_risk(text: str) -> dict:
    """
    Returns:
        {
            risk_level: "low" | "concern" | "high",
            matched_terms: list[str],
            helpline_required: bool,
        }
    """
    normalised = _normalise(text)

    matched_high = [p for p in HIGH_RISK_PHRASES if p in normalised]
    if matched_high:
        logger.warning(f"HIGH RISK detected. Matched: {matched_high}")
        return {
            "risk_level": "high",
            "matched_terms": matched_high,
            "helpline_required": True,
        }

    matched_concern = [p for p in CONCERN_PHRASES if p in normalised]
    if matched_concern:
        logger.info(f"CONCERN detected. Matched: {matched_concern}")
        return {
            "risk_level": "concern",
            "matched_terms": matched_concern,
            "helpline_required": True,
        }

    return {
        "risk_level": "low",
        "matched_terms": [],
        "helpline_required": False,
    }


def get_safety_ai_prompt_note(risk_level: str) -> str:
    """Returns a tone instruction to inject into the AI prompt."""
    if risk_level == "high":
        return (
            "\n\n⚠️ SAFETY MODE ⚠️: The user may be expressing thoughts of self-harm. "
            "Respond with extreme warmth and care. Acknowledge their pain first. "
            "Do NOT mention 'detection' or 'keywords'. "
            "Gently encourage them to talk to someone they trust or a professional. "
            "Keep response short, human, and compassionate."
        )
    if risk_level == "concern":
        return (
            "\n\nNote: The user seems to be in significant emotional distress. "
            "Be extra gentle and present. Ask one caring question."
        )
    return ""
