"""
Streak Service
==============
update_streak(user_id, db) — call from any activity endpoint.
Rules:
  - Same day → no change (idempotent)
  - Next consecutive day → streak +1
  - Gap > 1 day → reset to 1
  - First ever activity → streak = 1
Also updates longest_streak and total_days_active.
"""
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from app.models.streak import UserStreak
import logging

logger = logging.getLogger(__name__)


def update_streak(user_id: int, db: Session) -> UserStreak:
    """
    Update the streak for a user and return the updated UserStreak record.
    Idempotent within the same day.
    """
    today = date.today()

    streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()

    if not streak:
        streak = UserStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_activity_date=today,
            total_days_active=1,
        )
        db.add(streak)
        db.commit()
        db.refresh(streak)
        logger.info(f"New streak created for user {user_id} — streak=1")
        return streak

    last = streak.last_activity_date

    # Already active today — no change
    if last == today:
        return streak

    delta = (today - last).days if last else 999

    if delta == 1:
        # Consecutive day
        streak.current_streak += 1
    else:
        # Gap — reset
        streak.current_streak = 1

    streak.last_activity_date = today
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.total_days_active += 1

    db.commit()
    db.refresh(streak)
    logger.info(f"Streak updated for user {user_id} — streak={streak.current_streak}")
    return streak


def get_streak(user_id: int, db: Session) -> Optional[UserStreak]:
    return db.query(UserStreak).filter(UserStreak.user_id == user_id).first()
