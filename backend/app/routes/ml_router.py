"""
ML Prediction Router for Sathi
Endpoints:
  POST /api/ml/predict-stress   — full pipeline: game metrics → cognitive score → stress
  GET  /api/ml/current_user-baseline    — personalized performance baseline
  GET  /api/ml/anomaly-check    — check for stress spikes
  POST /api/ml/retrain          — manual trigger for model retraining
"""

import sys
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

# Add parent dirs to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User, GameScore, StressLog
from app.schemas.schemas import (
    MLPredictRequest, MLPredictResponse,
    StressProbabilities, AnomalyInfo, BaselineInfo,
    UserBaselineResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ml", tags=["ml"])





def _get_user_score_history(user_id: int, db: Session, limit: int = 20) -> List[float]:
    """Fetch recent stress scores for a current_user (newest first)."""
    logs = (
        db.query(StressLog)
        .filter(StressLog.user_id == user_id)
        .order_by(StressLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [float(log.stress_score) for log in logs if log.stress_score is not None]


def _get_user_cognitive_history(user_id: int, db: Session, limit: int = 20) -> List[float]:
    """Fetch recent cognitive/game scores for a current_user (newest first)."""
    games = (
        db.query(GameScore)
        .filter(GameScore.user_id == user_id)
        .order_by(GameScore.created_at.desc())
        .limit(limit)
        .all()
    )
    return [float(g.score) for g in games if g.score is not None]


@router.post("/predict-stress", response_model=MLPredictResponse)
async def predict_stress_endpoint(
    data: MLPredictRequest,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """
    Full ML pipeline: game metrics → cognitive_score → stress_level + confidence.
    Also runs anomaly detection and personalization baseline adjustment.
    """

    # Get history from DB if not provided
    history = data.history or _get_user_score_history(current_user.id, db)

    # Import ML modules (lazy to avoid startup failure if models not trained)
    try:
        from ml.predict import predict_full_pipeline
        from ml.anomaly import detect_anomaly
        from ml.baseline import compute_baseline, compute_deviation, get_trend, personalized_stress_adjustment

        metrics_dict = {
            "reaction_time": data.metrics.reaction_time,
            "accuracy": data.metrics.accuracy,
            "mistakes": data.metrics.mistakes,
            "completion_time": data.metrics.completion_time,
            "level_reached": data.metrics.level_reached,
        }

        # 1) Run full ML pipeline
        result = predict_full_pipeline(
            game_type=data.game_type,
            raw_metrics=metrics_dict,
            answers={"stress_level": data.answers.stress_level, "frustration": data.answers.frustration},
            history=history,
        )

        cognitive_score = result["cognitive_score"]
        stress_score = result["stress_score"]

        # 2) Personalization baseline
        cog_history = _get_user_cognitive_history(current_user.id, db)
        baseline_data = compute_baseline(cog_history) if len(cog_history) >= 5 else None
        deviation_info = compute_deviation(cognitive_score, baseline_data)
        trend_info = get_trend(cog_history)

        # 3) Apply personalized adjustment
        adjusted_stress = personalized_stress_adjustment(stress_score, deviation_info, trend_info)
        result["stress_score"] = adjusted_stress

        # 4) Anomaly detection
        anomaly_info = detect_anomaly(adjusted_stress, history)

        # 5) Re-determine label from adjusted score
        if adjusted_stress <= 40:
            stress_label = "low"
            stress_level_int = 0
        elif adjusted_stress <= 70:
            stress_label = "moderate"
            stress_level_int = 1
        else:
            stress_label = "high"
            stress_level_int = 2

        baseline_response = None
        if baseline_data:
            baseline_response = BaselineInfo(
                deviation=deviation_info["deviation"],
                deviation_pct=deviation_info["deviation_pct"],
                normalized_deviation=deviation_info["normalized_deviation"],
                interpretation=deviation_info["interpretation"],
                trend=trend_info["trend"],
            )

        probs = result.get("probabilities", {"low": 0.33, "moderate": 0.34, "high": 0.33})

        return MLPredictResponse(
            stress_level=stress_level_int,
            stress_label=stress_label,
            stress_score=adjusted_stress,
            confidence=result.get("confidence", 0.70),
            cognitive_score=cognitive_score,
            probabilities=StressProbabilities(
                low=probs.get("low", 0.33),
                moderate=probs.get("moderate", 0.34),
                high=probs.get("high", 0.33),
            ),
            anomaly=AnomalyInfo(
                is_anomaly=anomaly_info["is_anomaly"],
                severity=anomaly_info["severity"],
                z_score=anomaly_info["z_score"],
                message=anomaly_info["message"],
            ),
            baseline=baseline_response,
            model=result.get("model", "rule_based_fallback"),
        )

    except Exception as e:
        logger.error(f"ML prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ML prediction error: {str(e)}")


@router.get("/current_user-baseline")
async def get_user_baseline(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Return current_user's personalized performance baseline and trend."""

    try:
        from ml.baseline import compute_baseline, get_trend, compute_deviation

        cog_history = _get_user_cognitive_history(current_user.id, db, limit=30)
        baseline_data = compute_baseline(cog_history) if len(cog_history) >= 5 else None
        trend_info = get_trend(cog_history)

        current = cog_history[0] if cog_history else None
        deviation_info = compute_deviation(current or 50, baseline_data)

        return UserBaselineResponse(
            user_id=current_user.id,
            baseline_mean=baseline_data["baseline_mean"] if baseline_data else None,
            baseline_std=baseline_data["baseline_std"] if baseline_data else None,
            sessions_used=len(cog_history),
            trend=trend_info["trend"],
            recent_avg=trend_info["recent_avg"],
            deviation=deviation_info.get("deviation"),
        )

    except Exception as e:
        logger.error(f"Baseline fetch failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomaly-check")
async def check_anomaly(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Check if current_user's latest stress score is an anomaly vs their history."""

    try:
        from ml.anomaly import detect_anomaly

        history = _get_user_score_history(current_user.id, db, limit=20)
        if len(history) < 2:
            return {"is_anomaly": False, "message": "Not enough history yet.", "severity": "none"}

        latest = history[0]
        past = history[1:]
        return detect_anomaly(latest, past, user_id=current_user.id)

    except Exception as e:
        logger.error(f"Anomaly check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrain")
async def trigger_retrain(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Manually trigger model retraining (admin use)."""

    def _retrain():
        try:
            from ml.retrain_scheduler import retrain_from_db
            retrain_from_db()
        except Exception as e:
            logger.error(f"Retrain failed: {e}", exc_info=True)

    background_tasks.add_task(_retrain)
    return {"message": "Retraining started in background.", "user_id": current_user.id}
