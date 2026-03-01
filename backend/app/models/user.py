from sqlalchemy import Column, String, Integer, DateTime, Boolean, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String(100), unique=True, index=True, nullable=True) # Will be populated on first Clerk login
    name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True) # Legacy, now nullable
    close_friend_name = Column(String(100))
    close_friend_phone = Column(String(20))
    phone_number = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")
    stress_categories = relationship("StressCategory", secondary="user_stress_categories", back_populates="users")
    game_scores = relationship("GameScore", back_populates="user", cascade="all, delete-orphan")
    ai_conversations = relationship("AIConversation", back_populates="user", cascade="all, delete-orphan")
    stress_logs = relationship("StressLog", back_populates="user", cascade="all, delete-orphan")
    safety_events = relationship("SafetyEvent", back_populates="user", cascade="all, delete-orphan")
    streak = relationship("UserStreak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    xp = relationship("UserXP", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserPermission(Base):
    __tablename__ = "user_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_processing = Column(Boolean, default=False)
    ai_companion = Column(Boolean, default=False)
    emergency_alert = Column(Boolean, default=False)
    privacy_policy = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="permissions")

class StressCategory(Base):
    __tablename__ = "stress_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # academic, relationship, family
    description = Column(Text)
    
    users = relationship("User", secondary="user_stress_categories", back_populates="stress_categories")

class UserStressCategory(Base):
    __tablename__ = "user_stress_categories"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    stress_category_id = Column(Integer, ForeignKey("stress_categories.id"), primary_key=True)

class GameScore(Base):
    __tablename__ = "game_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_name = Column(String(100), nullable=False)  # Map to game_type
    
    # Raw metrics
    score = Column(Float, nullable=False)
    accuracy = Column(Float)
    reaction_time = Column(Float)  # ms
    mistakes = Column(Integer, default=0)
    completion_time = Column(Float) # seconds
    level_reached = Column(Integer, default=1)
    
    # Calculated scores (0-100)
    cognitive_score = Column(Float)
    stress_score = Column(Float)
    
    # Sub-scores
    focus_score = Column(Float)
    memory_score = Column(Float)
    decision_score = Column(Float)
    emotion_score = Column(Float)
    
    stress_level_answer = Column(Integer)  # 1-5 from post-game Q
    frustration_answer = Column(Boolean)
    answers = Column(JSON)  # Store specific question responses
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="game_scores")

class StressLog(Base):
    __tablename__ = "stress_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stress_level = Column(String(20), nullable=False)  # low, moderate, high
    stress_score = Column(Float, nullable=False)
    game_contributions = Column(JSON)  # Game scores that contributed
    emotional_signals = Column(JSON)  # NLP emotion analysis
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="stress_logs")

class AIConversation(Base):
    __tablename__ = "ai_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    emotion_detected = Column(String(50))
    language = Column(String(20), default="en")  # en, hi, hinglish
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="ai_conversations")

class SafetyEvent(Base):
    __tablename__ = "safety_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_snippet = Column(String(500), nullable=False)  # First 500 chars only
    risk_level = Column(String(20), nullable=False)       # low | concern | high
    matched_terms = Column(JSON)                          # list of matched keywords
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="safety_events")


class GameQuestionResponse(Base):
    """Stores individual post-game psychological question answers (Likert 1-5)."""
    __tablename__ = "game_question_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_score_id = Column(Integer, ForeignKey("game_scores.id"), nullable=True)
    game_id = Column(String(60), nullable=False)   # e.g. "reaction_speed"
    question_id = Column(String(60), nullable=False) # e.g. "question_overwhelm"
    answer_value = Column(Integer, nullable=False)   # 1-5 Likert
    reverse_scored = Column(Boolean, default=False)
    adjusted_value = Column(Integer, nullable=True)  # after reverse scoring
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
