"""
Streak Router
=============
GET  /api/streak/current  — returns current streak data
POST /api/streak/update   — manually trigger streak update (e.g. breathing exercise)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User
from app.services.streak_service import update_streak, get_streak

router = APIRouter(prefix="/api/streak", tags=["streak"])


def _format(streak):
    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
            "total_days_active": 0,
        }
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date.isoformat() if streak.last_activity_date else None,
        "total_days_active": streak.total_days_active,
    }


@router.get("/current")
async def get_current_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's current streak data."""
    streak = get_streak(current_user.id, db)
    return _format(streak)


@router.post("/update")
async def trigger_streak_update(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually update the streak (e.g. breathing exercise completion)."""
    streak = update_streak(current_user.id, db)
    return _format(streak)
