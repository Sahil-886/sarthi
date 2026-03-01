from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# Auth Schemas
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    close_friend_name: str
    close_friend_phone: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Permission Schemas
class PermissionConsent(BaseModel):
    data_processing: bool
    ai_companion: bool
    emergency_alert: bool
    privacy_policy: bool

class PermissionResponse(BaseModel):
    id: int
    user_id: int
    data_processing: bool
    ai_companion: bool
    emergency_alert: bool
    privacy_policy: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Stress Category Schemas
class StressCategoryRequest(BaseModel):
    categories: List[str]  # ["academic", "relationship", "family"]

class StressCategoryResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

# Game Schemas
class GameScoreRequest(BaseModel):
    game_name: str
    score: float
    accuracy: Optional[float] = None
    response_time: Optional[float] = None
    answers: Optional[dict] = None

class GameScoreResponse(BaseModel):
    id: int
    user_id: int
    game_name: str
    score: float
    accuracy: Optional[float]
    reaction_time: Optional[float]
    mistakes: Optional[int]
    completion_time: Optional[float]
    level_reached: Optional[int]
    cognitive_score: Optional[float]
    stress_score: Optional[float]
    focus_score: Optional[float]
    memory_score: Optional[float]
    decision_score: Optional[float]
    emotion_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PostGameAnswers(BaseModel):
    stress_level: int  # 1-5
    frustration: bool

class GameSubmitRequest(BaseModel):
    game_type: str
    score: float
    accuracy: Optional[float] = None
    reaction_time: Optional[float] = None
    mistakes: Optional[int] = 0
    completion_time: Optional[float] = 0
    level_reached: Optional[int] = 1
    answers: PostGameAnswers

class GameSubmitResponse(BaseModel):
    game_score_id: int
    stress_score: float
    stress_level: str  # low, moderate, high
    cognitive_score: float
    focus: float
    memory: float
    decision: float
    emotion: float
    message: str

# Stress Log Schemas
class StressLogResponse(BaseModel):
    id: int
    user_id: int
    stress_level: str  # low, moderate, high
    stress_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Companion Schemas
class AIMessageRequest(BaseModel):
    message: str
    language: Optional[str] = "en"
    generate_avatar: Optional[bool] = False

class AIMessageResponse(BaseModel):
    user_message: str
    ai_response: str
    emotion_detected: Optional[str]
    language: str
    risk_level: Optional[str] = None
    helpline_required: bool = False
    avatar_video_url: Optional[str] = None
    consultants: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True

# Score/Analytics Schemas
class ScoreSummary(BaseModel):
    stress_level: str
    stress_score: float
    recent_games: List[GameScoreResponse]
    stress_history: List[StressLogResponse]

# ─── ML Schemas ──────────────────────────────────────────────────────────────

class GameMetrics(BaseModel):
    """Raw game performance metrics sent from the frontend."""
    reaction_time: Optional[float] = 500
    accuracy: Optional[float] = 0.5
    mistakes: Optional[int] = 2
    completion_time: Optional[float] = 60
    level_reached: Optional[int] = 3
    speed_bonus: Optional[float] = None
    quit_flag: Optional[int] = 0

class MLPredictRequest(BaseModel):
    game_type: str
    metrics: GameMetrics
    answers: PostGameAnswers
    history: Optional[List[float]] = []   # recent stress scores, newest first

class StressProbabilities(BaseModel):
    low: float
    moderate: float
    high: float

class AnomalyInfo(BaseModel):
    is_anomaly: bool
    severity: str
    z_score: float
    message: str

class BaselineInfo(BaseModel):
    deviation: float
    deviation_pct: float
    normalized_deviation: float
    interpretation: str
    trend: str

class MLPredictResponse(BaseModel):
    stress_level: int            # 0=low, 1=moderate, 2=high
    stress_label: str            # "low" / "moderate" / "high"
    stress_score: float          # 0–100
    confidence: float            # model confidence 0–1
    cognitive_score: float       # 0–100
    probabilities: StressProbabilities
    anomaly: AnomalyInfo
    baseline: Optional[BaselineInfo] = None
    model: str                   # "gradient_boosting" or "rule_based_fallback"

class GameSubmitResponseV2(BaseModel):
    """Extended game submit response with ML data."""
    game_score_id: int
    stress_score: float
    stress_level: str
    message: str
    cognitive_score: float
    confidence: float
    anomaly: Optional[AnomalyInfo] = None

class UserBaselineResponse(BaseModel):
    user_id: int
    baseline_mean: Optional[float]
    baseline_std: Optional[float]
    sessions_used: int
    trend: str
    recent_avg: float
    deviation: Optional[float] = None

