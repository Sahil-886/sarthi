"""
Training Pipeline for Sathi ML System
Trains two models:
  1. Game Scoring Model  — RandomForestRegressor → cognitive_score (0-100)
  2. Stress Prediction   — GradientBoostingClassifier → stress_level (0/1/2) + confidence
Evaluation metrics printed; models versioned and saved to ml/models/.
"""

import sys
import logging
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime

from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    mean_absolute_error, r2_score,
    accuracy_score, f1_score, roc_auc_score,
    classification_report,
)
from sklearn.preprocessing import LabelBinarizer

# Add backend root to path so imports work
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.datasets.generate_dataset import generate_dataset
from ml.preprocess import build_training_features, MODELS_DIR

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

DATASET_PATH = Path(__file__).parent / "datasets" / "game_sessions.csv"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M")


def load_or_generate_dataset() -> pd.DataFrame:
    if DATASET_PATH.exists():
        df = pd.read_csv(DATASET_PATH)
        logger.info(f"✓ Loaded dataset: {len(df)} rows from {DATASET_PATH}")
    else:
        logger.info("Dataset not found — generating synthetic data...")
        df = generate_dataset(5000)
    return df


def train_game_scoring_model(X: np.ndarray, y: np.ndarray):
    """RandomForestRegressor to predict cognitive_score (0-100)"""
    logger.info("\n── Training Game Scoring Model ──────────────────")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=5,
        n_jobs=-1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2", n_jobs=-1)

    logger.info(f"  MAE:            {mae:.2f} points")
    logger.info(f"  R² (test):      {r2:.4f}")
    logger.info(f"  R² (5-fold CV): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Feature importances
    feat_names = ["game_type", "reaction_time", "accuracy", "mistakes", "completion_time", "level_reached"]
    importances = sorted(zip(feat_names, model.feature_importances_), key=lambda x: -x[1])
    logger.info("  Feature Importances:")
    for name, imp in importances:
        bar = "█" * int(imp * 40)
        logger.info(f"    {name:<20} {imp:.4f} {bar}")

    return model, {"mae": mae, "r2": r2, "cv_r2_mean": cv_scores.mean()}


def train_stress_prediction_model(X: np.ndarray, y: np.ndarray):
    """GradientBoostingClassifier to predict stress_level (0=low,1=moderate,2=high)"""
    logger.info("\n── Training Stress Prediction Model ─────────────")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.07,
        max_depth=5,
        subsample=0.8,
        min_samples_leaf=10,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")

    # One-vs-Rest ROC-AUC for multiclass
    lb = LabelBinarizer()
    y_bin = lb.fit_transform(y_test)
    if y_bin.shape[1] == 1:
        y_bin = np.hstack([1 - y_bin, y_bin])
    roc_auc = roc_auc_score(y_bin, y_proba, multi_class="ovr", average="weighted")

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_acc = cross_val_score(model, X, y, cv=skf, scoring="accuracy", n_jobs=-1)

    logger.info(f"  Accuracy (test):      {acc:.4f}")
    logger.info(f"  F1 Weighted (test):   {f1:.4f}")
    logger.info(f"  ROC-AUC:              {roc_auc:.4f}")
    logger.info(f"  Accuracy (5-fold CV): {cv_acc.mean():.4f} ± {cv_acc.std():.4f}")
    logger.info(f"\n{classification_report(y_test, y_pred, target_names=['Low','Moderate','High'])}")

    feat_names = [
        "cognitive_score", "cog_score²", "stress_answer", "stress_norm",
        "frustration", "historical_score", "score_delta",
        "reaction_trend", "accuracy_trend", "game_type"
    ]
    importances = sorted(zip(feat_names, model.feature_importances_), key=lambda x: -x[1])
    logger.info("  Feature Importances:")
    for name, imp in importances:
        bar = "█" * int(imp * 50)
        logger.info(f"    {name:<22} {imp:.4f} {bar}")

    return model, {"accuracy": acc, "f1": f1, "roc_auc": roc_auc, "cv_acc_mean": cv_acc.mean()}


def save_model(model, name: str, metrics: dict):
    versioned_name = f"{name}_{TIMESTAMP}.pkl"
    versioned_path = MODELS_DIR / versioned_name
    latest_path = MODELS_DIR / f"{name}.pkl"

    joblib.dump(model, versioned_path)
    joblib.dump(model, latest_path)
    logger.info(f"  ✓ Saved → {latest_path}")
    logger.info(f"  ✓ Versioned → {versioned_path}")

    # Save metrics alongside
    metrics_path = MODELS_DIR / f"{name}_metrics_{TIMESTAMP}.txt"
    with open(metrics_path, "w") as f:
        for k, v in metrics.items():
            f.write(f"{k}: {v:.4f}\n")

    # Clean old versions (keep 3 most recent)
    pattern = f"{name}_*.pkl"
    old_versions = sorted(MODELS_DIR.glob(pattern))[:-3]
    for old in old_versions:
        old.unlink()
        logger.info(f"  Removed old version: {old.name}")


def main():
    logger.info("=" * 55)
    logger.info("  SATHI ML TRAINING PIPELINE")
    logger.info("=" * 55)

    df = load_or_generate_dataset()
    X_game, y_game, X_stress, y_stress = build_training_features(df)

    logger.info(f"\n  Dataset shape: {df.shape}")
    logger.info(f"  Game features: {X_game.shape[1]}")
    logger.info(f"  Stress features: {X_stress.shape[1]}")
    logger.info(f"  Stress class dist: {dict(zip(*np.unique(y_stress, return_counts=True)))}")

    # Train models
    game_model, game_metrics = train_game_scoring_model(X_game, y_game)
    stress_model, stress_metrics = train_stress_prediction_model(X_stress, y_stress)

    # Save models
    logger.info("\n── Saving Models ────────────────────────────────")
    save_model(game_model, "model_game", game_metrics)
    save_model(stress_model, "model_stress", stress_metrics)

    logger.info("\n" + "=" * 55)
    logger.info("  TRAINING COMPLETE")
    logger.info(f"  Game Scoring  — R²: {game_metrics['r2']:.4f}, MAE: {game_metrics['mae']:.2f}")
    logger.info(f"  Stress Model  — Acc: {stress_metrics['accuracy']:.4f}, F1: {stress_metrics['f1']:.4f}, AUC: {stress_metrics['roc_auc']:.4f}")
    logger.info("=" * 55)
    return game_model, stress_model


if __name__ == "__main__":
    main()
