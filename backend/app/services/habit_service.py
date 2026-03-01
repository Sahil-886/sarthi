"""
Habit Service
=============
Manages daily habits for users.
Seeds the default habits table on first call.
"""
from datetime import date, datetime
from typing import List
from sqlalchemy.orm import Session
from app.models.habit import Habit, UserHabit
from app.services.xp_service import add_xp, XP_HABIT_COMPLETE
from app.services.streak_service import update_streak
import logging

logger = logging.getLogger(__name__)

# Default habits seeded on first run
DEFAULT_HABITS = [
    {"name": "Drink Water",         "description": "Stay hydrated throughout the day",       "icon": "💧", "xp_reward": 10},
    {"name": "Sleep 7-8 Hours",     "description": "Get quality rest tonight",                "icon": "😴", "xp_reward": 10},
    {"name": "Meditate / Breathe",  "description": "Take a mindful breathing break",          "icon": "🧘", "xp_reward": 10},
    {"name": "Move Your Body",      "description": "Any movement — walk, stretch, exercise",  "icon": "🏃", "xp_reward": 10},
    {"name": "Positive Thought",    "description": "Write or say one thing you appreciate",   "icon": "💛", "xp_reward": 10},
    {"name": "Journal Writing",     "description": "Spend 5 minutes reflecting in a journal", "icon": "✍️", "xp_reward": 10},
    {"name": "Connect with Someone","description": "Reach out to a friend or family member",  "icon": "🤝", "xp_reward": 10},
]


def _seed_habits(db: Session):
    """Ensure default habits exist in the DB."""
    if db.query(Habit).count() == 0:
        for h in DEFAULT_HABITS:
            db.add(Habit(**h))
        db.commit()
        logger.info("Default habits seeded.")


def get_daily_habits(user_id: int, db: Session, for_date: date = None) -> List[dict]:
    """Return all habits with today's completion status for user."""
    _seed_habits(db)
    today = for_date or date.today()

    habits = db.query(Habit).all()
    result = []
    for habit in habits:
        record = db.query(UserHabit).filter(
            UserHabit.user_id == user_id,
            UserHabit.habit_id == habit.id,
            UserHabit.date == today,
        ).first()

        result.append({
            "habit_id": habit.id,
            "name": habit.name,
            "description": habit.description,
            "icon": habit.icon,
            "xp_reward": habit.xp_reward,
            "is_completed": record.is_completed if record else False,
            "completed_at": record.completed_at.isoformat() if record and record.completed_at else None,
        })
    return result


def complete_habit(user_id: int, habit_id: int, db: Session) -> dict:
    """Mark a habit as completed for today and award XP."""
    today = date.today()

    # Check if already completed
    record = db.query(UserHabit).filter(
        UserHabit.user_id == user_id,
        UserHabit.habit_id == habit_id,
        UserHabit.date == today,
    ).first()

    if record and record.is_completed:
        return {"message": "Already completed today", "xp_earned": 0, "already_done": True}

    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        return {"message": "Habit not found", "xp_earned": 0}

    if not record:
        record = UserHabit(user_id=user_id, habit_id=habit_id, date=today)
        db.add(record)

    record.is_completed = True
    record.completed_at = datetime.utcnow()
    db.commit()

    # Award XP
    xp_record = add_xp(user_id, habit.xp_reward, db, reason=f"habit:{habit.name}")

    # Update streak
    try:
        update_streak(user_id, db)
    except Exception as e:
        logger.warning(f"Streak update on habit failed: {e}")

    return {
        "message": f"{habit.name} completed!",
        "xp_earned": habit.xp_reward,
        "total_xp": xp_record.total_xp,
        "current_level": xp_record.current_level,
        "already_done": False,
    }


def get_habit_history(user_id: int, db: Session, days: int = 7) -> List[dict]:
    """Return habit completion history for last N days."""
    from datetime import timedelta
    today = date.today()
    results = []
    for i in range(days):
        d = today - timedelta(days=i)
        records = db.query(UserHabit).filter(
            UserHabit.user_id == user_id,
            UserHabit.date == d,
            UserHabit.is_completed == True,
        ).all()
        results.append({
            "date": d.isoformat(),
            "completed_count": len(records),
        })
    return results
