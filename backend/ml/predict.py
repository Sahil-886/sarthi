"""
Inference Engine for Sathi ML System
Handles game scoring + stress prediction with graceful fallback.
"""

import logging
import numpy as np
from typing import Any, Dict, List, Optional

from ml.model_registry import load_model
from ml.preprocess import extract_game_features, extract_stress_features

logger = logging.getLogger(__name__)

STRESS_LABELS = {0: "low", 1: "moderate", 2: "high"}


def _get_models():
    game_model = load_model("model_game")
    stress_model = load_model("model_stress")
    return game_model, stress_model


def predict_cognitive_score(
    game_type: str,
    metrics: Dict[str, Any],
) -> float:
    """
    Predict cognitive performance score (0-100) from raw game metrics.
    Falls back to rule-based formula if model not available.
    """
    game_model, _ = _get_models()

    if game_model is None:
        return _fallback_cognitive_score(metrics)

    features = extract_game_features(game_type, metrics).reshape(1, -1)
    score = float(game_model.predict(features)[0])
    return round(np.clip(score, 0, 100), 1)


def predict_stress(
    cognitive_score: float,
    answers: Dict[str, Any],
    history: List[float],
    game_type: str = "reaction_speed",
    reaction_time: float = 500,
    accuracy: float = 0.5,
) -> Dict[str, Any]:
    """
    Predict stress level with confidence.
    Returns: {stress_level, stress_label, confidence, cognitive_score, probabilities}
    """
    _, stress_model = _get_models()

    if stress_model is None:
        return _fallback_stress(cognitive_score, answers, history)

    features = extract_stress_features(
        cognitive_score, answers, history,
        game_type, reaction_time, accuracy
    ).reshape(1, -1)

    prediction = int(stress_model.predict(features)[0])
    probabilities = stress_model.predict_proba(features)[0].tolist()
    confidence = float(max(probabilities))

    return {
        "stress_level": prediction,
        "stress_label": STRESS_LABELS[prediction],
        "confidence": round(confidence, 4),
        "cognitive_score": round(cognitive_score, 1),
        "probabilities": {
            "low": round(probabilities[0], 4),
            "moderate": round(probabilities[1], 4) if len(probabilities) > 1 else 0,
            "high": round(probabilities[2], 4) if len(probabilities) > 2 else 0,
        },
        "model": "gradient_boosting",
    }


def predict_full_pipeline(
    game_type: str,
    raw_metrics: Dict[str, Any],
    answers: Dict[str, Any],
    history: List[float],
) -> Dict[str, Any]:
    """
    End-to-end: raw game metrics → cognitive score → stress prediction.
    This is the main entry point for the API endpoint.
    """
    cognitive_score = predict_cognitive_score(game_type, raw_metrics)

    rt = float(raw_metrics.get("reaction_time", 500))
    accuracy = float(raw_metrics.get("accuracy", 0.5))

    stress_result = predict_stress(
        cognitive_score, answers, history,
        game_type, rt, accuracy
    )

    # Composite stress score (0-100) for display
    stress_score_100 = _level_to_score(
        stress_result["stress_level"],
        stress_result["probabilities"]
    )

    return {
        **stress_result,
        "stress_score": round(stress_score_100, 1),
    }


def _level_to_score(level: int, probs: dict) -> float:
    """Convert discrete stress level + probabilities to 0-100 score."""
    weighted = (
        probs.get("low", 0) * 20 +
        probs.get("moderate", 0) * 55 +
        probs.get("high", 0) * 90
    )
    return float(np.clip(weighted, 0, 100))


def _fallback_cognitive_score(metrics: dict) -> float:
    """Rule-based fallback when model not trained yet."""
    accuracy = float(metrics.get("accuracy", 0.5))
    rt = float(metrics.get("reaction_time", 500))
    mistakes = float(metrics.get("mistakes", 2))
    acc_score = accuracy * 60
    speed_score = max(0, 20 - (rt - 300) / 100)
    mistake_penalty = mistakes * 2
    return round(np.clip(acc_score + speed_score - mistake_penalty, 0, 100), 1)


def _fallback_stress(cognitive_score: float, answers: dict, history: list) -> dict:
    """Rule-based fallback stress prediction."""
    sa = float(answers.get("stress_level", 3))
    fr = float(answers.get("frustration", False))
    hist = float(np.mean(history)) if history else cognitive_score
    delta = hist - cognitive_score

    composite = (
        0.40 * (100 - cognitive_score) / 100 +
        0.30 * (sa - 1) / 4 +
        0.20 * max(0, delta) / 100 +
        0.10 * fr
    )
    composite = float(np.clip(composite, 0, 1))

    if composite < 0.35:
        level, label = 0, "low"
    elif composite < 0.65:
        level, label = 1, "moderate"
    else:
        level, label = 2, "high"

    score_100 = composite * 100
    return {
        "stress_level": level,
        "stress_label": label,
        "confidence": 0.7,
        "cognitive_score": round(cognitive_score, 1),
        "probabilities": {"low": 0.0, "moderate": 0.0, "high": 0.0},
        "stress_score": round(score_100, 1),
        "model": "rule_based_fallback",
    }
