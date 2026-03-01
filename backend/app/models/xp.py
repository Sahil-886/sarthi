"""
XP & Level Models
================
user_xp  — stores total XP and current level per user.
user_badges — stores earned achievement badges.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class UserXP(Base):
    __tablename__ = "user_xp"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_xp = Column(Integer, default=0)
    current_level = Column(Integer, default=1)
    xp_to_next_level = Column(Integer, default=100)  # pre-calculated for quick reads
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="xp")
    badges = relationship("UserBadge", back_populates="user_xp_record", cascade="all, delete-orphan")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_xp_id = Column(Integer, ForeignKey("user_xp.id"), nullable=False)
    badge_key = Column(String, nullable=False)   # e.g. "first_game", "streak_7"
    badge_name = Column(String, nullable=False)
    description = Column(String)
    icon = Column(String, default="🏅")
    earned_at = Column(DateTime, default=datetime.utcnow)

    user_xp_record = relationship("UserXP", back_populates="badges")
