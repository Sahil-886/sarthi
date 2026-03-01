"""
Model Registry — versioned model save/load for Sathi ML system.
"""

import joblib
import logging
from pathlib import Path
from typing import Optional, Any

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

_cache: dict = {}


def save_model(model: Any, name: str, version: str = "") -> Path:
    """Save a model with optional version suffix."""
    filename = f"{name}_{version}.pkl" if version else f"{name}.pkl"
    path = MODELS_DIR / filename
    joblib.dump(model, path)
    _cache[name] = model
    logger.info(f"Model saved: {path}")
    return path


def load_model(name: str, use_cache: bool = True) -> Optional[Any]:
    """Load latest model by name, with in-memory caching."""
    if use_cache and name in _cache:
        return _cache[name]

    path = MODELS_DIR / f"{name}.pkl"
    if not path.exists():
        logger.warning(f"Model not found: {path}")
        return None

    model = joblib.load(path)
    _cache[name] = model
    logger.info(f"Model loaded: {path}")
    return model


def list_versions(name: str) -> list:
    """List all saved versions of a model."""
    return sorted(MODELS_DIR.glob(f"{name}_*.pkl"), reverse=True)


def invalidate_cache():
    """Clear in-memory model cache (use after retraining)."""
    _cache.clear()
    logger.info("Model cache cleared.")
