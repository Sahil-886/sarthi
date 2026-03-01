from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User, GameScore, StressLog, GameQuestionResponse
from app.schemas.schemas import GameScoreRequest, GameScoreResponse, GameSubmitRequest, GameSubmitResponse
from app.services.streak_service import update_streak
from app.services.xp_service import add_xp, XP_GAME_COMPLETED
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime
import logging
import random

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/games", tags=["games"])


# ── Question Definitions ──────────────────────────────────────────────────────

QUESTIONS: Dict[str, List[dict]] = {
    "reaction_speed": [
        {
            "id": "question_overwhelm",
            "text": "How often did you feel mentally overwhelmed during the activity?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
        {
            "id": "question_anxiety",
            "text": "Did you notice yourself getting tense or anxious while trying to respond quickly?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
    ],
    "memory_pattern": [
        {
            "id": "question_focus",
            "text": "How difficult was it to maintain your focus throughout the task?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
        {
            "id": "question_frustration",
            "text": "Did you feel frustrated when you made mistakes?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
    ],
    "focus_tracking": [
        {
            "id": "question_distraction",
            "text": "Did your mind wander or get distracted during the activity?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
        {
            "id": "question_calmness",
            "text": "How hard was it to stay calm and steady while performing the task?",
            "scale_low": "Not at all",
            "scale_high": "Very hard",
            "reverse": False,
        },
    ],
    "emotional_recognition": [
        {
            "id": "question_emotion_difficulty",
            "text": "Did you find it difficult to interpret or understand emotions correctly?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
        {
            "id": "question_emotional_impact",
            "text": "Did you feel emotionally affected while doing this task?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
    ],
    "decision_making": [
        {
            "id": "question_pressure",
            "text": "Did you feel pressured or rushed while making decisions?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
        {
            "id": "question_confidence",
            "text": "How confident did you feel about your choices?",
            "scale_low": "Not at all",
            "scale_high": "Very confident",
            "reverse": True,  # High confidence = low stress
        },
    ],
    "persistence_challenge": [
        {
            "id": "question_giving_up",
            "text": "Did you feel like giving up during the activity?",
            "scale_low": "Not at all",
            "scale_high": "Very Often",
            "reverse": False,
        },
        {
            "id": "question_motivation",
            "text": "How motivated did you feel to continue even when it became difficult?",
            "scale_low": "Not at all",
            "scale_high": "Very motivated",
            "reverse": True,  # High motivation = low stress
        },
    ],
}

# Optional random bonus question (10% chance)
BONUS_QUESTION = {
    "id": "question_emotional_drain",
    "text": "How emotionally drained do you feel right now?",
    "scale_low": "Not at all",
    "scale_high": "Completely drained",
    "reverse": False,
}

# Game definitions
GAMES = [
    {
        "id": "reaction_speed",
        "name": "Reaction Speed",
        "description": "Test your reaction time under pressure",
        "duration": 30,
        "questions": [q["text"] for q in QUESTIONS["reaction_speed"]],
        "psychological_focus": "Anxiety & Pressure",
    },
    {
        "id": "memory_pattern",
        "name": "Memory Pattern",
        "description": "Match pairs and improve memory",
        "duration": 60,
        "questions": [q["text"] for q in QUESTIONS["memory_pattern"]],
        "psychological_focus": "Focus & Frustration",
    },
    {
        "id": "focus_tracking",
        "name": "Focus Tracking",
        "description": "Maintain focus on moving objects",
        "duration": 45,
        "questions": [q["text"] for q in QUESTIONS["focus_tracking"]],
        "psychological_focus": "Attention Stability",
    },
    {
        "id": "emotional_recognition",
        "name": "Emotional Recognition",
        "description": "Identify emotions in images",
        "duration": 50,
        "questions": [q["text"] for q in QUESTIONS["emotional_recognition"]],
        "psychological_focus": "Emotional Sensitivity",
    },
    {
        "id": "decision_making",
        "name": "Decision Making",
        "description": "Make quick strategic decisions",
        "duration": 40,
        "questions": [q["text"] for q in QUESTIONS["decision_making"]],
        "psychological_focus": "Confidence & Pressure",
    },
    {
        "id": "persistence_challenge",
        "name": "Persistence Challenge",
        "description": "Complete increasingly difficult tasks",
        "duration": 55,
        "questions": [q["text"] for q in QUESTIONS["persistence_challenge"]],
        "psychological_focus": "Motivation & Hopelessness",
    },
]


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class QuestionAnswerItem(BaseModel):
    question_id: str
    answer: int  # 1-5 Likert

class QuestionSubmitRequest(BaseModel):
    game_id: str
    game_score_id: Optional[int] = None
    answers: List[QuestionAnswerItem]

class QuestionSubmitResponse(BaseModel):
    stress_score: float
    stress_level: str   # low / moderate / high / severe
    stress_percentage: float
    risk_flag: bool
    risk_message: Optional[str] = None
    ml_features: dict


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/list")
async def list_games():
    """Get all available games"""
    return {"games": GAMES}


@router.get("/info/{game_id}")
async def get_game(game_id: str):
    """Get specific game details"""
    game = next((g for g in GAMES if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    return game


@router.get("/questions/{game_id}")
async def get_questions_for_game(game_id: str):
    """Return the 2 psychological questions for a given game."""
    questions = QUESTIONS.get(game_id)
    if not questions:
        raise HTTPException(status_code=404, detail=f"No questions defined for game '{game_id}'")

    result = list(questions)  # copy

    # 10% chance to add the bonus question
    if random.random() < 0.10:
        result.append(BONUS_QUESTION)

    return {
        "game_id": game_id,
        "questions": result,
        "scale_labels": {
            "1": "Not at all",
            "2": "Rarely",
            "3": "Sometimes",
            "4": "Often",
            "5": "Very Often",
        },
    }


@router.post("/questions/submit", response_model=QuestionSubmitResponse)
async def submit_question_answers(
    data: QuestionSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Receive post-game Likert answers, compute PSS-based stress score,
    persist question responses, update StressLog, and detect risk.
    """
    game_questions = QUESTIONS.get(data.game_id, [])
    q_map = {q["id"]: q for q in game_questions}
    if BONUS_QUESTION["id"] in [a.question_id for a in data.answers]:
        q_map[BONUS_QUESTION["id"]] = BONUS_QUESTION

    # ── 1. Reverse-score and persist each answer ──────────────────────────────
    ml_features: dict = {}
    raw_sum = 0
    answer_count = 0

    for item in data.answers:
        q_def = q_map.get(item.question_id)
        reverse = q_def["reverse"] if q_def else False
        adjusted = (6 - item.answer) if reverse else item.answer

        db.add(GameQuestionResponse(
            user_id=current_user.id,
            game_score_id=data.game_score_id,
            game_id=data.game_id,
            question_id=item.question_id,
            answer_value=item.answer,
            reverse_scored=reverse,
            adjusted_value=adjusted,
        ))
        ml_features[item.question_id] = adjusted
        raw_sum += adjusted
        answer_count += 1

    db.commit()

    # ── 2. PSS-based stress score (12 questions = 12-60 range) ───────────────
    # For a single game (2 questions), we scale it proportionally.
    # Full session (12 q's): stress_percentage = (sum - 12) / 48 * 100
    # Single game (2 q's): stress_percentage = (sum - 2) / 8 * 100
    min_possible = answer_count         # all 1s
    max_possible = answer_count * 5     # all 5s
    range_possible = max_possible - min_possible

    if range_possible > 0:
        stress_percentage = round((raw_sum - min_possible) / range_possible * 100, 1)
    else:
        stress_percentage = 0.0

    # ── 3. Classify ───────────────────────────────────────────────────────────
    if stress_percentage <= 30:
        stress_level = "low"
    elif stress_percentage <= 60:
        stress_level = "moderate"
    elif stress_percentage <= 80:
        stress_level = "high"
    else:
        stress_level = "severe"

    stress_score = stress_percentage  # alias for ML pipeline

    # ── 4. Risk detection rule ────────────────────────────────────────────────
    giving_up_answer = ml_features.get("question_giving_up", 0)
    risk_flag = giving_up_answer >= 4 and stress_percentage > 70
    risk_message = None
    if risk_flag:
        risk_message = (
            "Hey… it sounds like things felt really tough during that activity. "
            "That's completely okay. Would you like to talk to Sarthi about how you're feeling? 💛"
        )

    # ── 5. Append to existing StressLog (for the associated game if available) ─
    try:
        stress_log = StressLog(
            user_id=current_user.id,
            stress_level=stress_level,
            stress_score=stress_score,
            game_contributions={
                "game_id": data.game_id,
                "game_score_id": data.game_score_id,
                "source": "question_responses",
            },
            emotional_signals=ml_features,
        )
        db.add(stress_log)
        db.commit()
    except Exception as e:
        logger.warning(f"StressLog update failed: {e}")

    logger.info(
        f"Questions submitted: user={current_user.email} game={data.game_id} "
        f"stress={stress_percentage}% level={stress_level} risk={risk_flag}"
    )

    return QuestionSubmitResponse(
        stress_score=stress_score,
        stress_level=stress_level,
        stress_percentage=stress_percentage,
        risk_flag=risk_flag,
        risk_message=risk_message,
        ml_features=ml_features,
    )


# ── Legacy routes (kept for backward compatibility) ────────────────────────────

@router.post("/score", response_model=GameScoreResponse)
async def submit_game_score(
    score_data: GameScoreRequest,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Submit game score"""
    game_score = GameScore(
        user_id=current_user.id,
        game_name=score_data.game_name,
        score=score_data.score,
        accuracy=score_data.accuracy,
        response_time=score_data.response_time,
        answers=score_data.answers
    )
    db.add(game_score)
    db.commit()
    db.refresh(game_score)

    try:
        update_streak(current_user.id, db)
    except Exception as e:
        logger.warning(f"Streak update failed: {e}")

    try:
        add_xp(current_user.id, XP_GAME_COMPLETED, db, reason="game_completed")
    except Exception as e:
        logger.warning(f"XP award failed: {e}")

    return GameScoreResponse.model_validate(game_score)


@router.get("/history")
async def get_game_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scores = db.query(GameScore).filter(
        GameScore.user_id == current_user.id
    ).order_by(GameScore.created_at.desc()).all()
    return {"history": [GameScoreResponse.model_validate(s) for s in scores]}


@router.get("/stats")
async def get_game_statistics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scores = db.query(GameScore).filter(GameScore.user_id == current_user.id).all()
    stats = {}
    for score in scores:
        if score.game_name not in stats:
            stats[score.game_name] = {"count": 0, "total_score": 0, "avg_accuracy": 0, "avg_response_time": 0}
        stats[score.game_name]["count"] += 1
        stats[score.game_name]["total_score"] += score.score
        if score.accuracy:
            stats[score.game_name]["avg_accuracy"] += score.accuracy
        if score.response_time:
            stats[score.game_name]["avg_response_time"] += score.response_time

    for game_name in stats:
        count = stats[game_name]["count"]
        if count > 0:
            stats[game_name]["avg_score"] = stats[game_name]["total_score"] / count
            stats[game_name]["avg_accuracy"] = stats[game_name]["avg_accuracy"] / count
            stats[game_name]["avg_response_time"] = stats[game_name]["avg_response_time"] / count

    return {"statistics": stats}


@router.post("/submit", response_model=GameSubmitResponse)
async def submit_game(
    data: GameSubmitRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Submit game session and compute stress/cognitive scores exactly as requested.
    Stress formula: (100 - cognitive_score)*0.5 + (mistakes*5) + (frustration*15) + reaction_time_factor
    """
    # ... logic continues below ...
    # 1. Map questions to 4 cognitive buckets (0-100 scale)
    # We map common post-game question IDs to these dimensions
    # Default to 70 (neutral/good) if no specific answers found
    focus = 70.0
    memory = 70.0
    decision = 70.0
    emotion = 70.0

    # Invert Likert 1-5 to 0-100 (1 is best, 5 is worst)
    # 1->100, 2->75, 3->50, 4->25, 5->0
    def invert_likert(val):
        if val is None or not (1 <= val <= 5): return 70.0
        return (5 - val) / 4 * 100

    # These would typically come from a more complex questionnaire, 
    # but we'll use the stress_level_answer (1-5) as a proxy if detail missing
    base_val = invert_likert(data.answers.stress_level)
    focus = base_val
    memory = base_val
    decision = base_val
    emotion = base_val
    
    # If frustration is true, it heavily impacts emotion and focus
    if data.answers.frustration:
        emotion = max(0, emotion - 30)
        focus = max(0, focus - 20)

    # 2. Calculate cognitive_score (average of the 4)
    cognitive_score = round((focus + memory + decision + emotion) / 4, 1)

    # 3. Calculate stress_score using requested formula
    # reaction_time_factor: say 1 point per 100ms over 300ms, capped at 20
    rt = data.reaction_time or 500
    rt_factor = min(20.0, max(0.0, (rt - 300) / 100))
    
    frustration_val = 1 if data.answers.frustration else 0
    
    stress_score = (
        (100 - cognitive_score) * 0.5 + 
        (data.mistakes * 5) + 
        (frustration_val * 15) + 
        rt_factor
    )
    stress_score = round(max(0, min(100, stress_score)), 1)
    
    # 4. Map stress level label
    if stress_score <= 33:
        stress_level = "low"
    elif stress_score <= 66:
        stress_level = "moderate"
    else:
        stress_level = "high"

    # 5. Save session
    game_score = GameScore(
        user_id=current_user.id,
        game_name=data.game_type,
        score=data.score,
        accuracy=data.accuracy,
        reaction_time=data.reaction_time,
        mistakes=data.mistakes,
        completion_time=data.completion_time,
        level_reached=data.level_reached,
        cognitive_score=cognitive_score,
        stress_score=stress_score,
        focus_score=focus,
        memory_score=memory,
        decision_score=decision,
        emotion_score=emotion,
        stress_level_answer=data.answers.stress_level,
        frustration_answer=data.answers.frustration,
        created_at=datetime.utcnow()
    )
    db.add(game_score)
    
    # Also record in StressLog for the history/trend components
    db.add(StressLog(
        user_id=current_user.id,
        stress_level=stress_level,
        stress_score=stress_score,
        game_contributions={"game_type": data.game_type, "score": data.score},
        emotional_signals={
            "focus": focus, "memory": memory, "decision": decision, "emotion": emotion,
            "frustration": data.answers.frustration, "stress_self_report": data.answers.stress_level
        },
        created_at=datetime.utcnow()
    ))
    
    db.commit()
    db.refresh(game_score)

    # Gamification
    try:
        update_streak(current_user.id, db)
        add_xp(current_user.id, XP_GAME_COMPLETED, db, reason="game_completed")
    except Exception as e:
        logger.warning(f"Gamification update failed: {e}")

    # 6. Automatic SMS Alert if stress > 75
    if stress_score > 75:
        from app.services.sms_service import send_high_stress_alert
        background_tasks.add_task(send_high_stress_alert, current_user.id, db)

    return GameSubmitResponse(
        game_score_id=game_score.id,
        stress_score=stress_score,
        stress_level=stress_level,
        cognitive_score=cognitive_score,
        focus=focus,
        memory=memory,
        decision=decision,
        emotion=emotion,
        message=f"Session saved. Cognitive: {cognitive_score}, Stress: {stress_level} ({stress_score})"
    )
