"""
Gamification Router
===================
GET  /api/gamification/xp      — return XP + level data
GET  /api/gamification/badges  — return earned badges
POST /api/gamification/add-xp  — add XP (internal / testing)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User
from app.services.xp_service import (
    add_xp, get_xp_record, get_level_title, xp_for_level
)

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


def _format_xp(record):
    if not record:
        return {
            "total_xp": 0, "current_level": 1, "xp_to_next_level": 100,
            "level_title": "Newcomer", "xp_this_level": 0, "xp_needed_this_level": 100,
        }
    xp_start = xp_for_level(record.current_level)
    xp_end   = xp_for_level(record.current_level + 1)
    return {
        "total_xp": record.total_xp,
        "current_level": record.current_level,
        "xp_to_next_level": record.xp_to_next_level,
        "level_title": get_level_title(record.current_level),
        "xp_this_level": record.total_xp - xp_start,
        "xp_needed_this_level": xp_end - xp_start,
        "badges": [
            {"key": b.badge_key, "name": b.badge_name, "icon": b.icon,
             "description": b.description, "earned_at": b.earned_at.isoformat()}
            for b in (record.badges or [])
        ],
    }


@router.get("/xp")
async def get_xp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = get_xp_record(current_user.id, db)
    return _format_xp(record)


@router.post("/add-xp")
async def add_xp_endpoint(
    points: int = Query(default=10, ge=1, le=1000),
    reason: str = Query(default="manual"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = add_xp(current_user.id, points, db, reason=reason)
    return _format_xp(record)


@router.get("/badges")
async def get_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = get_xp_record(current_user.id, db)
    if not record:
        return {"badges": []}
    return {
        "badges": [
            {"key": b.badge_key, "name": b.badge_name, "icon": b.icon,
             "description": b.description, "earned_at": b.earned_at.isoformat()}
            for b in record.badges
        ]
    }
