"""
Anomaly Detection for Sathi ML System
Uses Isolation Forest + Z-Score to detect sudden stress spikes.
"""

import logging
import numpy as np
import joblib
from pathlib import Path
from typing import Optional, List, Dict, Any

from ml.model_registry import MODELS_DIR

logger = logging.getLogger(__name__)

_iso_forest = None
_iso_forest_path = MODELS_DIR / "anomaly_detector.pkl"


def _load_iso_forest():
    global _iso_forest
    if _iso_forest is None and _iso_forest_path.exists():
        _iso_forest = joblib.load(_iso_forest_path)
        logger.info("Isolation Forest loaded.")
    return _iso_forest


def train_anomaly_detector(stress_scores: List[float]):
    """
    Train Isolation Forest on a user's stress score history.
    Called when user has >= 10 sessions.
    """
    global _iso_forest
    from sklearn.ensemble import IsolationForest

    if len(stress_scores) < 10:
        logger.warning("Not enough data to train anomaly detector (need ≥10 sessions).")
        return None

    X = np.array(stress_scores).reshape(-1, 1)
    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,   # expect ~10% anomalies
        random_state=42,
    )
    model.fit(X)
    _iso_forest = model
    joblib.dump(model, _iso_forest_path)
    logger.info(f"Isolation Forest trained on {len(stress_scores)} samples.")
    return model


def detect_anomaly(
    new_score: float,
    history: List[float],
    user_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Detect if new_score is an anomaly compared to user's history.
    Returns: {is_anomaly, method, z_score, message, severity}
    """
    if len(history) < 5:
        return {
            "is_anomaly": False,
            "method": "insufficient_data",
            "z_score": 0.0,
            "message": "Not enough history to detect anomalies.",
            "severity": "none",
        }

    history_arr = np.array(history)
    mean_h = float(np.mean(history_arr))
    std_h = float(np.std(history_arr)) + 1e-6   # avoid div/0

    # Z-score method
    z_score = float((new_score - mean_h) / std_h)
    z_anomaly = abs(z_score) > 2.0

    # Isolation Forest method (if model trained)
    iso_anomaly = False
    iso_model = _load_iso_forest()
    if iso_model is not None:
        pred = iso_model.predict([[new_score]])
        iso_anomaly = bool(pred[0] == -1)   # -1 = anomaly

    is_anomaly = z_anomaly or iso_anomaly

    # Determine spike direction and severity
    if not is_anomaly:
        severity = "none"
        message = "Your stress level is within your normal range."
    elif new_score > mean_h + 1.5 * std_h:
        severity = "spike_high"
        message = (
            f"⚠️ Sudden stress spike detected! Your score ({new_score:.0f}) is "
            f"{abs(z_score):.1f} standard deviations above your average ({mean_h:.0f}). "
            "Consider taking a break."
        )
    elif new_score < mean_h - 1.5 * std_h:
        severity = "spike_low"
        message = (
            f"🎉 Big improvement! Your score ({new_score:.0f}) is significantly "
            f"better than your average ({mean_h:.0f})."
        )
    else:
        severity = "moderate"
        message = "Slight deviation from your normal stress pattern detected."

    return {
        "is_anomaly": is_anomaly,
        "method": "z_score" + ("+isolation_forest" if iso_model else ""),
        "z_score": round(z_score, 3),
        "user_mean": round(mean_h, 1),
        "user_std": round(std_h, 1),
        "new_score": new_score,
        "message": message,
        "severity": severity,
    }
