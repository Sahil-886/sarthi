from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/therapy", tags=["therapy"])



THERAPY_BOOKS = [
    {
        "id": 1,
        "title": "The Anxiety and Phobia Workbook",
        "author": "Edmund J. Bourne",
        "description": "Practical exercises for overcoming anxiety and panic attacks",
        "category": "anxiety",
        "link": "https://example.com/book1"
    },
    {
        "id": 2,
        "title": "Feeling Good: The New Mood Therapy",
        "author": "David D. Burns",
        "description": "Understanding and treating depression",
        "category": "depression",
        "link": "https://example.com/book2"
    },
    {
        "id": 3,
        "title": "Emotional Intelligence",
        "author": "Daniel Goleman",
        "description": "Understanding and managing emotions",
        "category": "emotional-awareness",
        "link": "https://example.com/book3"
    },
    {
        "id": 4,
        "title": "The Body Keeps the Score",
        "author": "Bessel van der Kolk",
        "description": "Healing trauma and stress",
        "category": "trauma",
        "link": "https://example.com/book4"
    }
]

THERAPY_VIDEOS = [
    {
        "id": 1,
        "title": "Introduction to Mindfulness",
        "description": "Learn basic mindfulness techniques",
        "duration": 600,  # seconds
        "category": "mindfulness",
        "video_url": "https://example.com/video1"
    },
    {
        "id": 2,
        "title": "Cognitive Behavioral Therapy Basics",
        "description": "Understanding CBT principles",
        "duration": 900,
        "category": "cbt",
        "video_url": "https://example.com/video2"
    },
    {
        "id": 3,
        "title": "Managing Stress Effectively",
        "description": "Practical stress management techniques",
        "duration": 750,
        "category": "stress-management",
        "video_url": "https://example.com/video3"
    },
    {
        "id": 4,
        "title": "Building Healthy Relationships",
        "description": "Improving communication and connections",
        "duration": 1200,
        "category": "relationships",
        "video_url": "https://example.com/video4"
    }
]

BREATHING_TECHNIQUES = [
    {
        "id": 1,
        "name": "Box Breathing",
        "description": "4-4-4-4 breathing pattern",
        "duration": 240,
        "steps": [
            "Inhale for 4 counts",
            "Hold for 4 counts",
            "Exhale for 4 counts",
            "Hold for 4 counts",
            "Repeat 5 times"
        ],
        "benefits": ["Reduces anxiety", "Improves focus", "Calms nervous system"]
    },
    {
        "id": 2,
        "name": "4-7-8 Breathing",
        "description": "Relaxation technique",
        "duration": 180,
        "steps": [
            "Inhale for 4 counts",
            "Hold for 7 counts",
            "Exhale for 8 counts",
            "Repeat 4 times"
        ],
        "benefits": ["Promotes sleep", "Reduces stress", "Calms mind"]
    },
    {
        "id": 3,
        "name": "Alternate Nostril Breathing",
        "description": "Balancing technique",
        "duration": 300,
        "steps": [
            "Close right nostril, inhale through left",
            "Close left nostril, exhale through right",
            "Inhale through right, exhale through left",
            "Repeat 10 times"
        ],
        "benefits": ["Balances energy", "Clears mind", "Reduces anxiety"]
    },
    {
        "id": 4,
        "name": "Belly Breathing",
        "description": "Deep diaphragmatic breathing",
        "duration": 360,
        "steps": [
            "Breathe deeply into your belly",
            "Feel your abdomen expand",
            "Exhale slowly",
            "Repeat 10 times"
        ],
        "benefits": ["Activates relaxation response", "Improves oxygen", "Reduces stress"]
    }
]

@router.get("/books")
async def get_therapy_books(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get recommended therapy books"""
    return {"books": THERAPY_BOOKS}

@router.get("/books/{book_id}")
async def get_book_details(
    book_id: int,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get specific book details"""
    
    book = next((b for b in THERAPY_BOOKS if b["id"] == book_id), None)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book

@router.get("/videos")
async def get_therapy_videos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get recommended therapy videos"""
    return {"videos": THERAPY_VIDEOS}

@router.get("/videos/{video_id}")
async def get_video_details(
    video_id: int,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get specific video details"""
    
    video = next((v for v in THERAPY_VIDEOS if v["id"] == video_id), None)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    return video

@router.get("/breathing-techniques")
async def get_breathing_techniques(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get breathing techniques"""
    return {"techniques": BREATHING_TECHNIQUES}

@router.get("/breathing-techniques/{technique_id}")
async def get_breathing_technique(
    technique_id: int,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get specific breathing technique"""
    
    technique = next((t for t in BREATHING_TECHNIQUES if t["id"] == technique_id), None)
    if not technique:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technique not found"
        )
    return technique
