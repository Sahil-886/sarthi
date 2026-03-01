from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User, UserPermission
from app.schemas.schemas import PermissionConsent, PermissionResponse
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/permissions", tags=["permissions"])



@router.post("/consent")
async def set_permissions(
    permissions: PermissionConsent,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Set current_user permissions and consent"""
    
    # Check if permission already exists
    user_permission = db.query(UserPermission).filter(
        UserPermission.user_id == current_user.id
    ).first()
    
    if user_permission:
        # Update
        user_permission.data_processing = permissions.data_processing
        user_permission.ai_companion = permissions.ai_companion
        user_permission.emergency_alert = permissions.emergency_alert
        user_permission.privacy_policy = permissions.privacy_policy
    else:
        # Create new
        user_permission = UserPermission(
            user_id=current_user.id,
            data_processing=permissions.data_processing,
            ai_companion=permissions.ai_companion,
            emergency_alert=permissions.emergency_alert,
            privacy_policy=permissions.privacy_policy
        )
        db.add(user_permission)
    
    db.commit()
    db.refresh(user_permission)
    
    logger.info(f"Permissions set for current_user: {current_user.email}")
    
    return {
        "status": "success",
        "message": "Permissions updated successfully",
        "permissions": PermissionResponse.model_validate(user_permission)
    }

@router.get("/consent", response_model=Optional[PermissionResponse])
async def get_permissions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current_user permissions"""
    
    user_permission = db.query(UserPermission).filter(
        UserPermission.user_id == current_user.id
    ).first()
    
    if not user_permission:
        return None
    
    return PermissionResponse.model_validate(user_permission)
