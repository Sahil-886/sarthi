"""
Habits Router
=============
GET  /api/habits/today    — today's habits + completion status
POST /api/habits/complete — mark a habit complete (awards XP)
GET  /api/habits/history  — last 7 days habit history
"""
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User
from app.services.habit_service import get_daily_habits, complete_habit, get_habit_history

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("/today")
async def get_today_habits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habits = get_daily_habits(current_user.id, db)
    completed = sum(1 for h in habits if h["is_completed"])
    return {
        "habits": habits,
        "completed_count": completed,
        "total_count": len(habits),
    }


@router.post("/complete")
async def complete_habit_endpoint(
    habit_id: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = complete_habit(current_user.id, habit_id, db)
    return result


@router.get("/history")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = get_habit_history(current_user.id, db)
    return {"history": history}
