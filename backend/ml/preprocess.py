"""
Feature Engineering & Preprocessing for Sathi ML Pipeline
Converts raw game metrics into model-ready feature vectors.
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

GAME_TYPES = [
    "reaction_speed", "memory_pattern", "focus_tracking",
    "emotional_recognition", "decision_making", "persistence_challenge",
]

GAME_TYPE_ENCODING = {g: i for i, g in enumerate(GAME_TYPES)}

# Feature names used by the game scoring model
GAME_FEATURE_COLS = [
    "game_type_enc",
    "reaction_time_normalized",
    "accuracy",
    "mistakes_normalized",
    "completion_time_normalized",
    "level_reached_normalized",
]

# Feature names used by the stress prediction model
STRESS_FEATURE_COLS = [
    "cognitive_score",
    "cognitive_score_squared",
    "stress_answer",
    "stress_answer_normalized",
    "frustration",
    "historical_score",
    "score_delta",           # current - historical
    "reaction_time_trend",   # normalized reaction time
    "accuracy_trend",        # accuracy
    "game_type_enc",
]


def normalize_reaction_time(rt_ms: float) -> float:
    """Normalize reaction time: 200ms=1.0 (excellent), 1500ms=0.0 (very slow)"""
    return float(np.clip(1.0 - (rt_ms - 200) / 1300, 0.0, 1.0))


def extract_game_features(
    game_type: str,
    metrics: Dict[str, Any],
) -> np.ndarray:
    """
    Extract feature vector for the game scoring model.
    Metrics can include: reaction_time, accuracy, mistakes,
    completion_time, level_reached + any game-specific extras.
    """
    rt = float(metrics.get("reaction_time", 500))
    accuracy = float(metrics.get("accuracy", 0.5))
    mistakes = float(metrics.get("mistakes", 2))
    completion_time = float(metrics.get("completion_time", 60))
    level_reached = float(metrics.get("level_reached", 3))

    game_enc = GAME_TYPE_ENCODING.get(game_type, 0) / len(GAME_TYPES)
    rt_norm = normalize_reaction_time(rt)
    mistakes_norm = np.clip(1.0 - mistakes / 10.0, 0.0, 1.0)
    ct_norm = np.clip(1.0 - (completion_time - 10) / 140.0, 0.0, 1.0)
    level_norm = np.clip(level_reached / 10.0, 0.0, 1.0)
    acc = np.clip(accuracy, 0.0, 1.0)

    features = np.array([
        game_enc,
        rt_norm,
        acc,
        mistakes_norm,
        ct_norm,
        level_norm,
    ], dtype=np.float32)
    return features


def extract_stress_features(
    cognitive_score: float,
    answers: Dict[str, Any],
    history: list,
    game_type: str = "reaction_speed",
    reaction_time: float = 500,
    accuracy: float = 0.5,
) -> np.ndarray:
    """
    Extract feature vector for the stress prediction model.
    History: list of recent stress scores (most recent first).
    """
    stress_answer = float(answers.get("stress_level", 3))
    frustration = float(answers.get("frustration", False))
    historical_score = float(np.mean(history)) if history else cognitive_score
    score_delta = cognitive_score - historical_score
    rt_norm = normalize_reaction_time(reaction_time)
    game_enc = GAME_TYPE_ENCODING.get(game_type, 0) / len(GAME_TYPES)

    features = np.array([
        cognitive_score / 100.0,
        (cognitive_score / 100.0) ** 2,
        stress_answer,
        (stress_answer - 1) / 4.0,
        frustration,
        historical_score / 100.0,
        score_delta / 100.0,
        rt_norm,
        np.clip(accuracy, 0.0, 1.0),
        game_enc,
    ], dtype=np.float32)
    return features


def build_training_features(df: pd.DataFrame):
    """Convert DataFrame columns → numpy arrays for training."""
    # Game scoring features
    X_game = np.column_stack([
        df["game_type"].map(GAME_TYPE_ENCODING).fillna(0) / len(GAME_TYPES),
        df["reaction_time"].apply(normalize_reaction_time),
        df["accuracy"].clip(0, 1),
        (1 - df["mistakes"].clip(0, 10) / 10).clip(0, 1),
        (1 - (df["completion_time"] - 10).clip(0, 140) / 140).clip(0, 1),
        (df["level_reached"].clip(0, 10) / 10).clip(0, 1),
    ])
    y_game = df["cognitive_score"].values

    # Stress prediction features
    X_stress = np.column_stack([
        df["cognitive_score"] / 100.0,
        (df["cognitive_score"] / 100.0) ** 2,
        df["stress_answer"],
        (df["stress_answer"] - 1) / 4.0,
        df["frustration"],
        df["historical_score"] / 100.0,
        (df["cognitive_score"] - df["historical_score"]) / 100.0,
        df["reaction_time"].apply(normalize_reaction_time),
        df["accuracy"].clip(0, 1),
        df["game_type"].map(GAME_TYPE_ENCODING).fillna(0) / len(GAME_TYPES),
    ])
    y_stress = df["label_stress"].values

    return X_game, y_game, X_stress, y_stress


def save_scaler(scaler: StandardScaler, name: str = "scaler.pkl"):
    path = MODELS_DIR / name
    joblib.dump(scaler, path)
    logger.info(f"✓ Scaler saved → {path}")


def load_scaler(name: str = "scaler.pkl") -> Optional[StandardScaler]:
    path = MODELS_DIR / name
    if path.exists():
        return joblib.load(path)
    return None
