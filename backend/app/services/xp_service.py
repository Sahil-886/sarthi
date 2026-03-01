"""
XP Service
==========
Manages XP accumulation and level calculation.

Level formula: level = floor(sqrt(total_xp / 100)) + 1
  Level 1 →    0 XP
  Level 2 →  100 XP
  Level 3 →  400 XP
  Level 4 →  900 XP
  Level 5 → 1600 XP  (progressive difficulty)
"""
import math
from typing import Optional
from sqlalchemy.orm import Session
from app.models.xp import UserXP, UserBadge
import logging

logger = logging.getLogger(__name__)

# XP reward constants
XP_GAME_COMPLETED = 20
XP_AI_CHAT = 15
XP_BREATHING = 10
XP_THERAPY_VIEW = 10
XP_HABIT_COMPLETE = 10
XP_DAILY_LOGIN = 5
XP_STREAK_MILESTONE = 25

LEVEL_TITLES = {
    1:  "Newcomer",    2: "Explorer",    3: "Seeker",
    4:  "Aware",       5: "Mindful",     6: "Grounded",
    7:  "Balanced",    8: "Focused",     9: "Resilient",
    10: "Warrior",    12: "Guardian",   15: "Champion",
    20: "Sage",       25: "Master",     30: "Legend",
}

def get_level_title(level: int) -> str:
    """Return the closest title for a given level."""
    for threshold in sorted(LEVEL_TITLES.keys(), reverse=True):
        if level >= threshold:
            return LEVEL_TITLES[threshold]
    return "Newcomer"


def calculate_level(total_xp: int) -> int:
    return int(math.floor(math.sqrt(total_xp / 100))) + 1


def xp_for_level(level: int) -> int:
    """Total XP needed to reach this level."""
    return (level - 1) ** 2 * 100


def xp_to_next(total_xp: int) -> int:
    current = calculate_level(total_xp)
    return xp_for_level(current + 1) - total_xp


def add_xp(user_id: int, points: int, db: Session, reason: str = "") -> UserXP:
    """Add XP to a user and update level. Returns updated UserXP."""
    record = db.query(UserXP).filter(UserXP.user_id == user_id).first()

    if not record:
        record = UserXP(user_id=user_id, total_xp=0, current_level=1, xp_to_next_level=100)
        db.add(record)

    old_level = record.current_level
    record.total_xp += points
    record.current_level = calculate_level(record.total_xp)
    record.xp_to_next_level = xp_to_next(record.total_xp)

    db.commit()
    db.refresh(record)

    if record.current_level > old_level:
        logger.info(f"🎉 Level UP! user={user_id} → Level {record.current_level}")

    logger.info(f"XP +{points} ({reason}) user={user_id} total={record.total_xp}")
    return record


def get_xp_record(user_id: int, db: Session) -> Optional[UserXP]:
    return db.query(UserXP).filter(UserXP.user_id == user_id).first()


def award_badge(user_xp_id: int, badge_key: str, badge_name: str,
                description: str, icon: str, db: Session) -> Optional[UserBadge]:
    """Award a badge if not already earned."""
    existing = db.query(UserBadge).filter(
        UserBadge.user_xp_id == user_xp_id,
        UserBadge.badge_key == badge_key
    ).first()
    if existing:
        return None  # already earned

    badge = UserBadge(
        user_xp_id=user_xp_id, badge_key=badge_key,
        badge_name=badge_name, description=description, icon=icon
    )
    db.add(badge)
    db.commit()
    db.refresh(badge)
    logger.info(f"Badge awarded: {badge_key} → xp_record={user_xp_id}")
    return badge
