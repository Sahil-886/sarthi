from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User, GameScore, StressLog
from app.schemas.schemas import StressLogResponse
from datetime import datetime, timedelta
from statistics import mean
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scores", tags=["scores"])


def calculate_stress_level(score: float) -> str:
    if score < 33:
        return "low"
    elif score < 66:
        return "moderate"
    else:
        return "high"


# ── /current ─────────────────────────────────────────────────────────────────

@router.get("/current")
async def get_current_stress_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the latest recorded StressLog for a user."""
    latest = (
        db.query(StressLog)
        .filter(StressLog.user_id == current_user.id)
        .order_by(StressLog.created_at.desc())
        .first()
    )
    if not latest:
        return {"stress_score": 0.0, "stress_level": "unknown", "game_contributions": {}}

    return {
        "stress_score": latest.stress_score,
        "stress_level": latest.stress_level,
        "game_contributions": latest.game_contributions or {},
    }


# ── /history ──────────────────────────────────────────────────────────────────

@router.get("/history")
async def get_stress_history(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = datetime.utcnow() - timedelta(days=days)
    logs = (
        db.query(StressLog)
        .filter(StressLog.user_id == current_user.id, StressLog.created_at >= start)
        .order_by(StressLog.created_at.asc())
        .all()
    )
    return {"history": [StressLogResponse.model_validate(log) for log in logs]}


# ── /analytics ────────────────────────────────────────────────────────────────

# Sub-score key → friendly radar dimension name
_RADAR_KEY_MAP = {
    "question_focus": "focus",
    "question_distraction": "focus",
    "question_calmness": "focus",
    "question_frustration": "memory",
    "question_overwhelm": "memory",
    "question_anxiety": "memory",
    "question_pressure": "decision",
    "question_confidence": "decision",
    "question_giving_up": "emotion",
    "question_motivation": "emotion",
    "question_emotion_difficulty": "emotion",
    "question_emotional_impact": "emotion",
    "question_emotional_drain": "emotion",
}

_RADAR_DEFAULTS = {"focus": 0.0, "memory": 0.0, "decision": 0.0, "emotion": 0.0}


def _build_radar(logs: list) -> dict:
    """
    Average the emotional_signals from StressLogs into 4 radar dimensions.
    Values are stored as Likert 1-5 (after reverse scoring), so we normalise to 0-100.
    A *higher* Likert value = more stress → we invert so higher radar = better performance.
    """
    buckets: dict[str, list[float]] = {k: [] for k in _RADAR_DEFAULTS}

    for log in logs:
        signals = log.emotional_signals or {}
        for q_key, value in signals.items():
            dim = _RADAR_KEY_MAP.get(q_key)
            if dim and isinstance(value, (int, float)):
                # Invert: 5 (worst) → 0 score, 1 (best) → 100 score
                normalised = (5 - value) / 4 * 100
                buckets[dim].append(normalised)

    return {
        dim: round(mean(vals), 1) if vals else 0.0
        for dim, vals in buckets.items()
    }


@router.get("/analytics")
async def get_stress_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Comprehensive analytics aligned with strict requirements.
    Best session = max(cognitive_score)
    Radar = average of focus, memory, decision, emotion
    """
    start_date = datetime.utcnow() - timedelta(days=30)

    logs = (
        db.query(StressLog)
        .filter(StressLog.user_id == current_user.id, StressLog.created_at >= start_date)
        .order_by(StressLog.created_at.asc())
        .all()
    )

    games = (
        db.query(GameScore)
        .filter(GameScore.user_id == current_user.id, GameScore.created_at >= start_date)
        .order_by(GameScore.created_at.desc())
        .all()
    )

    # ── Core stress metrics ───────────────────────────────────────────────────
    stress_scores = [log.stress_score for log in logs]
    avg_stress = round(mean(stress_scores), 1) if stress_scores else 0.0
    peak_stress = round(max(stress_scores), 1) if stress_scores else 0.0
    
    # Best session = highest cognitive_score (per user request)
    cognitive_scores = [g.cognitive_score for g in games if g.cognitive_score is not None]
    best_session = round(max(cognitive_scores), 1) if cognitive_scores else 0.0

    # ── Trajectory (last 10 sessions, asc) ───────────────────────────────────
    trajectory_logs = logs[-10:] if len(logs) > 10 else logs
    trajectory = [
        {
            "session": i + 1,
            "stress_score": round(log.stress_score, 1),
            "label": log.stress_level,
            "date": log.created_at.strftime("%d %b"),
        }
        for i, log in enumerate(trajectory_logs)
    ]

    # ── Radar: average of the 4 cognitive dimensions from all sessions ────────
    radar = {"focus": 0.0, "memory": 0.0, "decision": 0.0, "emotion": 0.0}
    if games:
        # Filter out games where cognitive scores haven't been calculated yet (legacy data)
        valid_games = [g for g in games if g.focus_score is not None]
        if valid_games:
            radar["focus"] = round(mean([g.focus_score for g in valid_games]), 1)
            radar["memory"] = round(mean([g.memory_score for g in valid_games]), 1)
            radar["decision"] = round(mean([g.decision_score for g in valid_games]), 1)
            radar["emotion"] = round(mean([g.emotion_score for g in valid_games]), 1)
        else:
            # Fallback for old data: use the _build_radar logic on StressLogs
            radar = _build_radar(logs)

    # ── Game statistics (legacy ViewScore compat) ─────────────────────────────
    game_stats: dict = {}
    for game in games:
        name = game.game_name
        if name not in game_stats:
            game_stats[name] = {"count": 0, "avg_score": 0.0, "max_score": 0.0, "min_score": 100.0}
        game_stats[name]["count"] += 1
        game_stats[name]["avg_score"] += game.score
        game_stats[name]["max_score"] = max(game_stats[name]["max_score"], game.score)
        game_stats[name]["min_score"] = min(game_stats[name]["min_score"], game.score)
    for gn in game_stats:
        c = game_stats[gn]["count"]
        if c > 0:
            game_stats[gn]["avg_score"] = round(game_stats[gn]["avg_score"] / c, 1)

    return {
        "average_stress": avg_stress,
        "peak_stress": peak_stress,
        "best_session": best_session,
        "trajectory": trajectory,
        "radar": radar,
        "stress_metrics": {
            "average": avg_stress,
            "maximum": peak_stress,
            "minimum": round(min(stress_scores), 1) if stress_scores else 0.0,
        },
        "game_statistics": game_stats,
        "total_games_played": len(games),
        "total_logs": len(logs),
    }


# ── /predict ─────────────────────────────────────────────────────────────────

@router.post("/predict")
async def predict_stress_level(
    stress_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    score = stress_data.get("score", 50)
    return {"predicted_stress_level": calculate_stress_level(score), "confidence": 0.85}


# ── /clear ────────────────────────────────────────────────────────────────────

@router.delete("/clear")
async def clear_stress_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all stress logs, game scores, and question responses for the current user."""
    try:
        from app.models.user import GameQuestionResponse
        db.query(GameQuestionResponse).filter(GameQuestionResponse.user_id == current_user.id).delete()
        db.query(GameScore).filter(GameScore.user_id == current_user.id).delete()
        db.query(StressLog).filter(StressLog.user_id == current_user.id).delete()
        db.commit()
        return {"success": True, "message": "History cleared successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to clear history for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear history")
