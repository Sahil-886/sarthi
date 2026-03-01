"""
User Personalization Baseline Engine for Sathi ML System
Computes each user's cognitive performance baseline from first 5 sessions.
Future predictions use deviation from baseline for personalization.
"""

import logging
import numpy as np
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

MIN_SESSIONS_FOR_BASELINE = 5
BASELINE_WINDOW = 5          # use first N sessions to set baseline
RECENCY_SESSIONS = 10        # recent window for trend calculation


def compute_baseline(scores: List[float]) -> Optional[Dict[str, Any]]:
    """
    Compute user baseline from first N sessions.
    Returns None if insufficient data.
    """
    if len(scores) < MIN_SESSIONS_FOR_BASELINE:
        return None

    baseline_scores = scores[:BASELINE_WINDOW]   # first 5 sessions
    mean = float(np.mean(baseline_scores))
    std = float(np.std(baseline_scores)) + 1e-6

    return {
        "baseline_mean": round(mean, 1),
        "baseline_std": round(std, 1),
        "sessions_used": len(baseline_scores),
    }


def compute_deviation(
    current_score: float,
    baseline: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Compute deviation from baseline (positive = better than usual).
    Returns adjustment factor used to tune the stress prediction.
    """
    if baseline is None:
        return {
            "deviation": 0.0,
            "deviation_pct": 0.0,
            "normalized_deviation": 0.0,
            "interpretation": "baseline_not_established",
        }

    mean = baseline["baseline_mean"]
    std = baseline["baseline_std"]

    raw_deviation = current_score - mean
    normalized = raw_deviation / std
    pct = (raw_deviation / mean * 100) if mean > 0 else 0

    if normalized > 1.5:
        interpretation = "significantly_better_than_usual"
    elif normalized > 0.5:
        interpretation = "slightly_better_than_usual"
    elif normalized > -0.5:
        interpretation = "within_normal_range"
    elif normalized > -1.5:
        interpretation = "slightly_worse_than_usual"
    else:
        interpretation = "significantly_worse_than_usual"

    return {
        "deviation": round(raw_deviation, 1),
        "deviation_pct": round(pct, 1),
        "normalized_deviation": round(normalized, 3),
        "interpretation": interpretation,
    }


def get_trend(scores: List[float], window: int = RECENCY_SESSIONS) -> Dict[str, Any]:
    """
    Compute performance trend over recent sessions.
    Positive slope = improving; negative = declining.
    """
    if len(scores) < 3:
        return {"slope": 0.0, "trend": "insufficient_data", "recent_avg": 0.0}

    recent = scores[-window:]
    x = np.arange(len(recent), dtype=float)
    slope = float(np.polyfit(x, recent, 1)[0])
    recent_avg = float(np.mean(recent))

    if slope > 2.0:
        trend = "strongly_improving"
    elif slope > 0.5:
        trend = "improving"
    elif slope > -0.5:
        trend = "stable"
    elif slope > -2.0:
        trend = "declining"
    else:
        trend = "strongly_declining"

    return {
        "slope": round(slope, 3),
        "trend": trend,
        "recent_avg": round(recent_avg, 1),
        "window_sessions": len(recent),
    }


def personalized_stress_adjustment(
    raw_stress_score: float,
    deviation_info: Dict[str, Any],
    trend_info: Dict[str, Any],
) -> float:
    """
    Adjust raw ML stress score using personalization context.
    Better-than-usual performance reduces stress; worse increases it.
    """
    norm_dev = deviation_info.get("normalized_deviation", 0.0)
    slope = trend_info.get("slope", 0.0)

    # Each unit of norm_dev adjusts stress by ±3 points
    deviation_adjustment = -norm_dev * 3.0

    # Improving trend slightly reduces stress perception
    trend_adjustment = -np.clip(slope / 2.0, -5.0, 5.0)

    adjusted = raw_stress_score + deviation_adjustment + trend_adjustment
    return round(float(np.clip(adjusted, 0, 100)), 1)
