"""
Habit Models
============
habits      — master list of default habits.
user_habits — one row per user per habit per day.
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    icon = Column(String, default="✅")
    xp_reward = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_habits = relationship("UserHabit", back_populates="habit")


class UserHabit(Base):
    __tablename__ = "user_habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    is_completed = Column(Boolean, default=False)
    date = Column(Date, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    habit = relationship("Habit", back_populates="user_habits")
