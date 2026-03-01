"""
Weekly Auto-Retrain Scheduler for Sathi ML System
Uses APScheduler to retrain stress + game scoring models every Sunday at 02:00.
Loads all GameScore records from the DB, retrains, re-saves models,
and invalidates the in-memory cache.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


def retrain_from_db():
    """
    Pull latest GameScore records from DB and retrain models.
    Called by the scheduler job.
    """
    try:
        logger.info(f"[Scheduler] Starting scheduled retrain at {datetime.now()}")

        # Import here to avoid circular imports at module load time
        import pandas as pd
        import numpy as np
        from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
        from ml.model_registry import save_model, invalidate_cache, MODELS_DIR
        from ml.preprocess import build_training_features
        from ml.datasets.generate_dataset import DATASET_PATH

        # Load from database if available (via SQLAlchemy SessionLocal)
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent))
            from app.core.database import SessionLocal
            from app.models.user import GameScore

            db = SessionLocal()
            rows = db.query(GameScore).all()
            db.close()

            if len(rows) < 50:
                logger.warning(f"[Scheduler] Only {len(rows)} DB rows — skipping retrain (need ≥50).")
                return

            records = [{
                "user_id": r.user_id,
                "game_type": r.game_name,
                "reaction_time": r.response_time or 500,
                "accuracy": (r.score / 100.0) if r.score else 0.5,
                "mistakes": 2,
                "completion_time": 60,
                "level_reached": 3,
                "stress_answer": r.stress_level_answer or 3,
                "frustration": int(r.frustration_answer or False),
                "historical_score": r.score or 50,
                "cognitive_score": r.score or 50,
                "label_stress": (
                    0 if (r.score or 50) >= 65 else
                    1 if (r.score or 50) >= 35 else 2
                ),
            } for r in rows]

            df = pd.DataFrame(records)
            logger.info(f"[Scheduler] Loaded {len(df)} records from DB.")

        except Exception as e:
            logger.warning(f"[Scheduler] DB load failed, falling back to CSV dataset: {e}")
            if not DATASET_PATH.exists():
                from ml.datasets.generate_dataset import generate_dataset
                df = generate_dataset(5000)
            else:
                df = pd.read_csv(DATASET_PATH)

        X_game, y_game, X_stress, y_stress = build_training_features(df)
        version = datetime.now().strftime("%Y%m%d_%H%M")

        # Retrain game scoring model
        game_model = RandomForestRegressor(
            n_estimators=200, max_depth=12, min_samples_leaf=5,
            n_jobs=-1, random_state=42
        )
        game_model.fit(X_game, y_game)
        save_model(game_model, "model_game", version)

        # Retrain stress prediction model
        stress_model = GradientBoostingClassifier(
            n_estimators=300, learning_rate=0.07, max_depth=5,
            subsample=0.8, random_state=42
        )
        stress_model.fit(X_stress, y_stress)
        save_model(stress_model, "model_stress", version)

        invalidate_cache()
        logger.info(f"[Scheduler] ✓ Retrain complete. Version: {version}")

    except Exception as e:
        logger.error(f"[Scheduler] Retrain failed: {e}", exc_info=True)


def start_scheduler():
    """Initialize APScheduler for weekly retraining."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger

        scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
        scheduler.add_job(
            retrain_from_db,
            trigger=CronTrigger(day_of_week="sun", hour=2, minute=0),
            id="weekly_retrain",
            name="Weekly ML Retrain",
            replace_existing=True,
            misfire_grace_time=3600,
        )
        
        # Import dynamically to avoid circular dependencies
        def run_memory_evolution():
            from app.jobs.memory_evolution import extract_and_store_traits_sync
            extract_and_store_traits_sync()

        scheduler.add_job(
            run_memory_evolution,
            trigger=CronTrigger(day_of_week="sun", hour=3, minute=0),
            id="weekly_memory_evolution",
            name="Weekly Memory Personality Evolution",
            replace_existing=True,
            misfire_grace_time=3600,
        )
        
        scheduler.start()
        logger.info("✓ ML Retrain Scheduler started (every Sunday 02:00 IST)")
        return scheduler

    except ImportError:
        logger.warning("APScheduler not installed — auto-retrain disabled. Run: pip install apscheduler")
        return None
    except Exception as e:
        logger.error(f"Scheduler startup failed: {e}")
        return None
