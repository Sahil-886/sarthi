from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/user", tags=["user"])


class UserProfileRequest(BaseModel):
    close_friend_name: Optional[str] = None
    close_friend_phone: Optional[str] = None
    phone_number: Optional[str] = None


@router.post("/profile")
def update_user_profile_post(
    profile_data: UserProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile fields (POST — legacy compat)."""
    return _apply_profile(profile_data, current_user, db)


@router.patch("/profile")
def update_user_profile_patch(
    profile_data: UserProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile fields (PATCH — preferred)."""
    return _apply_profile(profile_data, current_user, db)


def _apply_profile(data: UserProfileRequest, current_user: User, db: Session):
    if data.close_friend_name is not None:
        current_user.close_friend_name = data.close_friend_name
    if data.close_friend_phone is not None:
        current_user.close_friend_phone = data.close_friend_phone
    if data.phone_number is not None:
        current_user.phone_number = data.phone_number

    db.commit()
    db.refresh(current_user)

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "close_friend_name": current_user.close_friend_name,
        "close_friend_phone": current_user.close_friend_phone,
        "phone_number": current_user.phone_number,
    }
