from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User, StressCategory, UserStressCategory
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stress", tags=["stress"])



@router.post("/categories/select")
async def select_stress_categories(
    categories: dict,  # {"categories": ["academic", "relationship", "family"]}
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """User selects stress categories"""
    
    category_names = categories.get("categories", [])
    
    # Clear existing categories
    db.query(UserStressCategory).filter(
        UserStressCategory.user_id == current_user.id
    ).delete()
    
    # Initialize categories if they don't exist
    for cat_name in ["academic", "relationship", "family"]:
        existing = db.query(StressCategory).filter(
            StressCategory.name == cat_name
        ).first()
        if not existing:
            db.add(StressCategory(name=cat_name))
    
    db.commit()
    
    # Add selected categories
    for cat_name in category_names:
        category = db.query(StressCategory).filter(
            StressCategory.name == cat_name
        ).first()
        
        if category:
            user_cat = UserStressCategory(
                user_id=current_user.id,
                stress_category_id=category.id
            )
            db.add(user_cat)
    
    db.commit()
    
    logger.info(f"Stress categories selected for current_user: {current_user.email}")
    
    return {
        "status": "success",
        "message": "Stress categories selected",
        "categories": category_names
    }

@router.get("/categories/my-categories")
async def get_user_stress_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current_user's selected stress categories"""
    
    categories = db.query(StressCategory).join(
        UserStressCategory,
        UserStressCategory.stress_category_id == StressCategory.id
    ).filter(
        UserStressCategory.user_id == current_user.id
    ).all()
    
    return {
        "categories": [
            {"id": c.id, "name": c.name}
            for c in categories
        ]
    }

@router.get("/categories/available")
async def get_available_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all available stress categories"""
    categories = db.query(StressCategory).all()
    
    if not categories:
        # Initialize default categories
        defaults = [
            StressCategory(name="academic", description="Academic and educational stress"),
            StressCategory(name="relationship", description="Relationship-related stress"),
            StressCategory(name="family", description="Family-related stress")
        ]
        db.add_all(defaults)
        db.commit()
        categories = defaults
    
    return {
        "categories": [
            {"id": c.id, "name": c.name, "description": c.description}
            for c in categories
        ]
    }
