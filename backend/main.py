from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn
import logging

# Configure logging early
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Import models BEFORE create_all so all tables are registered ──────────────
from app.core.database import Base, engine
from app.models import user    # noqa: F401
from app.models import streak  # noqa: F401
from app.models import xp      # noqa: F401
from app.models import habit   # noqa: F401

# ── Import routers ─────────────────────────────────────────────────────────────
from app.routes import (
    user_router,
    permissions_router,
    stress_router,
    games_router,
    ai_companion_router,
    therapy_router,
    scores_router,
    support_router,
)
from app.routes import ml_router
from app.routes import streak_router
from app.routes import gamification_router
from app.routes import habits_router

# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Sarthi Mental Wellbeing Platform")
    try:
        from ml.retrain_scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        logger.warning(f"ML scheduler not started: {e}")
    yield
    logger.info("Shutting down Sarthi Mental Wellbeing Platform")

# ── Create app ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Sarthi - Smart Mental Wellbeing Platform",
    description="An intelligent mental wellness companion",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Auto-create all DB tables ──────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── CORS ────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "https://sarthi-mental-wellbeing.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include routers ────────────────────────────────────────────────────────────
app.include_router(user_router.router)
app.include_router(permissions_router.router)
app.include_router(stress_router.router)
app.include_router(games_router.router)
app.include_router(ai_companion_router.router)
app.include_router(therapy_router.router)
app.include_router(scores_router.router)
app.include_router(ml_router.router)
app.include_router(support_router.router)
app.include_router(streak_router.router)
app.include_router(gamification_router.router)
app.include_router(habits_router.router)

# ── Static Files ──────────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# ── Root endpoints ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Welcome to Sarthi - Smart Mental Wellbeing Platform", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
