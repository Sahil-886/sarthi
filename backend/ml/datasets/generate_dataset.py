"""
Synthetic Dataset Generator for Sathi ML Pipeline
Generates realistic cognitive game + stress data (5,000 rows)
Based on published cognitive psychology distributions:
- Reaction times: log-normal (mean ~400ms, σ=150ms)
- Accuracy: beta distribution (α=5, β=2 for healthy adults)
- Stress labels: derived from performance + self-report with noise
"""

import numpy as np
import pandas as pd
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

np.random.seed(42)
DATASET_DIR = Path(__file__).parent
N_USERS = 200
N_SESSIONS = 5000

GAME_TYPES = [
    "reaction_speed",
    "memory_pattern",
    "focus_tracking",
    "emotional_recognition",
    "decision_making",
    "persistence_challenge",
]


def generate_reaction_metrics(n: int, stress_factor: float) -> dict:
    """Reaction time follows log-normal; higher stress = slower reaction"""
    base_rt = np.exp(np.random.normal(6.0 + stress_factor * 0.4, 0.3, n))  # ~400ms
    accuracy = np.clip(np.random.beta(6 - stress_factor * 1.5, 2, n), 0.2, 1.0)
    attempts = np.random.randint(3, 6, n)
    return {
        "reaction_time": base_rt,
        "accuracy": accuracy,
        "attempts": attempts,
        "mistakes": np.floor((1 - accuracy) * attempts).astype(int),
        "completion_time": base_rt * attempts,
    }


def generate_memory_metrics(n: int, stress_factor: float) -> dict:
    max_seq = np.random.randint(3, 9, n)
    correct = np.clip(
        np.floor(max_seq * np.random.beta(5 - stress_factor * 1.2, 2, n)), 1, max_seq
    ).astype(int)
    return {
        "reaction_time": np.exp(np.random.normal(6.2, 0.4, n)),
        "accuracy": correct / max_seq,
        "mistakes": max_seq - correct,
        "completion_time": np.random.normal(45 + stress_factor * 15, 10, n).clip(10, 120),
        "level_reached": correct,
    }


def generate_focus_metrics(n: int, stress_factor: float) -> dict:
    hits = np.clip(
        np.random.binomial(10, 0.75 - stress_factor * 0.15, n), 1, 10
    )
    return {
        "reaction_time": np.exp(np.random.normal(6.1, 0.3, n)),
        "accuracy": hits / 10,
        "mistakes": 10 - hits,
        "completion_time": np.random.normal(30 + stress_factor * 8, 5, n).clip(10, 80),
        "level_reached": hits,
    }


def generate_emotion_metrics(n: int, stress_factor: float) -> dict:
    correct = np.clip(
        np.random.binomial(10, 0.80 - stress_factor * 0.12, n), 2, 10
    )
    return {
        "reaction_time": np.exp(np.random.normal(6.3, 0.4, n)),
        "accuracy": correct / 10,
        "mistakes": 10 - correct,
        "completion_time": np.random.normal(40 + stress_factor * 10, 8, n).clip(15, 90),
        "level_reached": correct,
    }


def generate_decision_metrics(n: int, stress_factor: float) -> dict:
    correct = np.clip(
        np.random.binomial(10, 0.70 - stress_factor * 0.14, n), 1, 10
    )
    speed_bonus = np.random.beta(3 - stress_factor * 0.5, 3, n)
    return {
        "reaction_time": np.exp(np.random.normal(6.0 + stress_factor * 0.3, 0.3, n)),
        "accuracy": correct / 10,
        "mistakes": 10 - correct,
        "completion_time": np.random.normal(25 + stress_factor * 8, 5, n).clip(5, 60),
        "level_reached": correct,
        "speed_bonus": speed_bonus,
    }


def generate_persistence_metrics(n: int, stress_factor: float) -> dict:
    level = np.clip(
        np.random.binomial(5, 0.65 - stress_factor * 0.13, n), 1, 5
    )
    return {
        "reaction_time": np.exp(np.random.normal(6.2, 0.35, n)),
        "accuracy": level / 5,
        "mistakes": 5 - level,
        "completion_time": np.random.normal(60 + stress_factor * 20, 15, n).clip(10, 150),
        "level_reached": level,
        "quit_flag": (np.random.random(n) < (0.05 + stress_factor * 0.15)).astype(int),
    }


GAME_GENERATORS = {
    "reaction_speed": generate_reaction_metrics,
    "memory_pattern": generate_memory_metrics,
    "focus_tracking": generate_focus_metrics,
    "emotional_recognition": generate_emotion_metrics,
    "decision_making": generate_decision_metrics,
    "persistence_challenge": generate_persistence_metrics,
}


def compute_cognitive_score(accuracy: float, reaction_time: float,
                             mistakes: int, completion_time: float) -> float:
    """Composite score: weighted accuracy + speed penalty"""
    acc_score = accuracy * 60
    speed_score = max(0, 20 - (reaction_time - 300) / 100)
    mistake_penalty = mistakes * 2
    time_penalty = max(0, (completion_time - 30) / 10)
    score = acc_score + speed_score - mistake_penalty - time_penalty
    return float(np.clip(score, 0, 100))


def compute_stress_label(cognitive_score: float, stress_answer: int,
                          frustration: bool, historical_score: float) -> int:
    """0=low, 1=moderate, 2=high"""
    perf_stress = (100 - cognitive_score) / 100
    self_stress = (stress_answer - 1) / 4
    hist_delta = (historical_score - cognitive_score) / 100
    composite = (0.4 * perf_stress + 0.3 * self_stress + 0.2 * abs(hist_delta)
                 + (0.1 if frustration else 0))
    composite += np.random.normal(0, 0.05)
    composite = np.clip(composite, 0, 1)
    if composite < 0.35:
        return 0
    elif composite < 0.65:
        return 1
    else:
        return 2


def generate_dataset(n: int = N_SESSIONS) -> pd.DataFrame:
    logger.info(f"Generating {n} synthetic game sessions...")
    rows = []
    user_baselines = {uid: np.random.beta(5, 2) * 80 + 20 for uid in range(N_USERS)}

    per_game = n // len(GAME_TYPES)
    extras = n % len(GAME_TYPES)

    for g_idx, game_type in enumerate(GAME_TYPES):
        count = per_game + (1 if g_idx < extras else 0)
        stress_factors = np.random.beta(2, 5, count)  # most people not stressed
        metrics = GAME_GENERATORS[game_type](count, stress_factors)

        for i in range(count):
            uid = np.random.randint(0, N_USERS)
            baseline = user_baselines[uid]
            hist_score = baseline + np.random.normal(0, 10)
            accuracy = float(metrics["accuracy"][i])
            rt = float(metrics["reaction_time"][i])
            mistakes = int(metrics["mistakes"][i])
            ct = float(metrics["completion_time"][i])
            level = int(metrics.get("level_reached", np.ones(count))[i])

            cog_score = compute_cognitive_score(accuracy, rt, mistakes, ct)
            stress_ans = int(np.clip(
                round(stress_factors[i] * 4 + 1 + np.random.normal(0, 0.5)), 1, 5
            ))
            frustrated = bool(stress_factors[i] > 0.5 and np.random.random() > 0.4)
            label = compute_stress_label(cog_score, stress_ans, frustrated, hist_score)

            rows.append({
                "user_id": uid,
                "game_type": game_type,
                "reaction_time": round(rt, 1),
                "accuracy": round(accuracy, 4),
                "mistakes": mistakes,
                "completion_time": round(ct, 1),
                "level_reached": level,
                "stress_answer": stress_ans,
                "frustration": int(frustrated),
                "historical_score": round(float(hist_score), 1),
                "cognitive_score": round(cog_score, 1),
                "label_stress": label,
            })

    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    out_path = DATASET_DIR / "game_sessions.csv"
    df.to_csv(out_path, index=False)
    logger.info(f"✓ Dataset saved: {out_path} ({len(df)} rows)")
    logger.info(f"  Stress label distribution: {df['label_stress'].value_counts().to_dict()}")
    return df


if __name__ == "__main__":
    generate_dataset()
