from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.user import User
from app.core.config import settings
from jose import jwt, JWTError
import requests
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

_CLERK_JWKS = None

def get_clerk_jwks():
    global _CLERK_JWKS
    if _CLERK_JWKS is None and settings.CLERK_SECRET_KEY:
        url = "https://api.clerk.com/v1/jwks"
        headers = {"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"}
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                _CLERK_JWKS = response.json()
                logger.info("Successfully fetched Clerk JWKS.")
            else:
                logger.error(f"Failed to fetch Clerk JWKS: {response.text}")
        except Exception as e:
            logger.error(f"Error fetching Clerk JWKS: {e}")
    return _CLERK_JWKS

def verify_clerk_token(token: str) -> dict:
    jwks = get_clerk_jwks()
    if not jwks:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Auth configuration error: Cannot fetch Clerk keys."
        )
    
    try:
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = next((k for k in jwks.get("keys", []) if k["kid"] == unverified_header.get("kid")), None)
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token key ID"
            )
            
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False}
        )
        return payload
    except JWTError as e:
        logger.error(f"JWT Decode Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    payload = verify_clerk_token(token)
    
    clerk_id = payload.get("sub")
    
    # Try via Clerk ID
    user = db.query(User).filter(User.clerk_user_id == clerk_id).first()
    
    if not user:
        # Clerk doesn't always put plain 'email' in the root payload depending on the template,
        # but often it's configured. Let's gracefully support finding by email if it exists from migration.
        # Otherwise, dynamically insert new user.
        email = payload.get("email", getattr(payload, "primary_email", None))
        
        # If there's an existing email without clerk_id, migrate it
        if email:
            user = db.query(User).filter(User.email == email).first()
            if user and not user.clerk_user_id:
                user.clerk_user_id = clerk_id
                db.commit()
                db.refresh(user)
                return user
                
        # If absolutely no user exists, create one
        if not email:
            email = f"{clerk_id}@placeholder.clerk.com" # Safe fallback
            
        user = User(
            clerk_user_id=clerk_id,
            email=email,
            name="Friend",
            password_hash="clerk_managed" # Dummy string to satisfy legacy NOT NULL constraint
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user
