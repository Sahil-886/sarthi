from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User, AIConversation, GameScore, SafetyEvent, UserPermission
from app.schemas.schemas import AIMessageRequest, AIMessageResponse
from app.services.did_service import get_did_client
from app.services.ai_service import ai_service
from app.services.emotion_service import emotion_service
from app.services.voice_emotion_service import voice_emotion_service
from app.services.safety_service import detect_risk, get_safety_ai_prompt_note
from app.services.streak_service import update_streak
from app.services.xp_service import add_xp, XP_AI_CHAT
from app.routes.support_router import CONSULTANTS
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai-companion", tags=["ai-companion"])


async def get_ai_response(
    message: str,
    current_user: User,
    db: Session,
    language: str = "en"
) -> tuple:
    """Generate AI response with emotion detection and safety check."""
    emotion_result = emotion_service.detect_emotion(message)
    emotion_detected = emotion_result.get("emotion", "neutral")

    recent_stress_level = "Unknown"
    latest_score = db.query(GameScore).filter(GameScore.user_id == current_user.id).order_by(GameScore.created_at.desc()).first()
    if latest_score and latest_score.stress_level_answer is not None:
        stress_map = {1: "Low", 2: "Low", 3: "Moderate", 4: "High", 5: "Severe"}
        recent_stress_level = stress_map.get(latest_score.stress_level_answer, "Moderate")

    ai_response = await ai_service.generate_response(
        user=current_user,
        message=message,
        emotion=emotion_detected,
        language=language,
        recent_stress_level=recent_stress_level
    )

    return ai_response, emotion_detected


@router.post("/chat")
async def chat_with_companion(
    message_data: AIMessageRequest,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Chat with AI companion — includes safety detection, logging, and consultant contacts."""

    # 1 — Safety detection
    safety = detect_risk(message_data.message)
    risk_level = safety["risk_level"]
    helpline_required = safety["helpline_required"]

    # 2 — Log safety event if elevated
    if risk_level in ("concern", "high"):
        try:
            event = SafetyEvent(
                user_id=current_user.id,
                message_snippet=message_data.message[:500],
                risk_level=risk_level,
                matched_terms=safety["matched_terms"],
            )
            db.add(event)
            db.commit()
            logger.warning(
                f"Safety event logged — user={current_user.id} "
                f"risk={risk_level} terms={safety['matched_terms']}"
            )
        except Exception as e:
            logger.error(f"Failed to log safety event: {e}")
            db.rollback()

    # 3 — SMS alert to trusted friend (only if permission granted)
    if risk_level == "high":
        try:
            perm = db.query(UserPermission).filter(
                UserPermission.user_id == current_user.id
            ).first()
            if perm and perm.emergency_alert:
                from app.services.sms_service import send_risk_alert
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_in_executor(
                    None,
                    lambda: send_risk_alert(
                        current_user.phone_number,
                        current_user.close_friend_phone,
                    ),
                )
                logger.info(
                    f"Risk SMS alert triggered for user {current_user.id}"
                )
        except Exception as e:
            logger.error(f"Trusted friend SMS alert error: {e}")

    # 4 — HIGH RISK: skip LLM entirely, return warm response + all contacts immediately
    if risk_level == "high":
        warm_response = (
            "I'm really glad you reached out to me, and I want you to know — "
            "you matter so much. What you're feeling right now sounds incredibly heavy, "
            "and you don't have to carry it alone. 💛\n\n"
            "Please talk to someone who can really help right now. "
            "These people are just a call away and they care:"
        )
        conversation = AIConversation(
            user_id=current_user.id,
            user_message=message_data.message,
            ai_response=warm_response,
            emotion_detected="distressed",
            language=message_data.language
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return {
            "user_message": conversation.user_message,
            "ai_response": warm_response,
            "emotion_detected": "distressed",
            "language": message_data.language,
            "risk_level": "high",
            "helpline_required": True,
            "consultants": CONSULTANTS,
        }

    # 4b — Get AI response from LLM (only for safe/concern messages)
    ai_result, emotion = await get_ai_response(
        message_data.message,
        current_user,
        db,
        message_data.language
    )

    # 5 — Store conversation
    conversation = AIConversation(
        user_id=current_user.id,
        user_message=message_data.message,
        ai_response=ai_result["reply"],
        emotion_detected=emotion,
        language=message_data.language
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    logger.info(f"AI conversation recorded — user={current_user.email} risk={risk_level}")

    # Update daily streak (AI chat counts as engagement)
    try:
        update_streak(current_user.id, db)
    except Exception as e:
        logger.warning(f"Streak update failed: {e}")

    # Award XP for AI chat engagement
    try:
        add_xp(current_user.id, XP_AI_CHAT, db, reason="ai_chat")
    except Exception as e:
        logger.warning(f"XP award failed: {e}")

    # 6 — Include consultants if risk elevated
    consultants_in_response = CONSULTANTS if helpline_required else []

    # 7 — Handle Avatar Video Generation (if requested)
    avatar_video_url = None
    if message_data.generate_avatar and risk_level != "high":
        try:
            did_client = get_did_client()
            avatar_video_url = did_client.create_avatar_video(conversation.ai_response)
        except Exception as e:
            logger.error(f"Avatar generation failed unexpectedly: {e}")

    return {
        "user_message": conversation.user_message,
        "ai_response": conversation.ai_response,
        "emotion_detected": conversation.emotion_detected,
        "language": conversation.language,
        "risk_level": risk_level,
        "helpline_required": helpline_required,
        "consultants": consultants_in_response,
        "avatar_video_url": avatar_video_url
    }

@router.post("/emotion")
async def detect_emotion_endpoint(
    request_data: AIMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Detect emotion from message"""
    return emotion_service.detect_emotion(request_data.message)

@router.post("/voice-emotion")
async def detect_voice_emotion(
    audio_blob: bytes
):
    """Detect emotion from voice audio data"""
    return voice_emotion_service.detect_emotion_from_audio(audio_blob)

@router.post("/safety-check")
async def check_safety(
    request_data: AIMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Check for self-harm keywords"""
    result = ai_service.safety_check(request_data.message)
    return {
        "is_safe": result["safe"],
        "risk_level": result["risk_level"],
        "helpline_required": result["helpline_required"],
        "response": result["response"]
    }

@router.get("/history")
async def get_conversation_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get conversation history"""
    
    conversations = db.query(AIConversation).filter(
        AIConversation.user_id == current_user.id
    ).order_by(AIConversation.created_at.desc()).limit(limit).all()

    return {
        "conversations": [
            {
                "user_message": c.user_message,
                "ai_response": c.ai_response,
                "emotion_detected": c.emotion_detected,
                "language": c.language,
                "created_at": c.created_at
            }
            for c in conversations
        ]
    }

@router.delete("/history")
async def clear_conversation_history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete all conversation history for the current user."""
    deleted = db.query(AIConversation).filter(
        AIConversation.user_id == current_user.id
    ).delete()
    db.commit()
    logger.info(f"Cleared {deleted} conversations for user={current_user.email}")
    return {"message": f"Cleared {deleted} conversations.", "deleted_count": deleted}

@router.post("/voice")
async def generate_voice(
    text: str,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Generate voice synthesis and return audio stream directly"""
    audio_bytes = await ai_service.generate_voice(text)
    
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Voice generation failed")
        
    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.post("/avatar")
async def generate_avatar_video(
    request: AIMessageRequest,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Standalone endpoint to generate avatar video using D-ID API"""
    try:
        did_client = get_did_client()
        if not did_client.api_key:
            return {
                "status": "error",
                "message": "D-ID API key not configured",
                "video_url": None
            }
        
        # Note: We use the upgraded create_avatar_video which polls for completion
        video_url = did_client.create_avatar_video(request.message)
        
        if video_url:
            return {
                "status": "success",
                "message": "Avatar video generated",
                "video_url": video_url,
                "avatar_name": "Sarthi"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to generate or poll avatar video",
                "video_url": None
            }
            
    except Exception as e:
        logger.error(f"Error in generate_avatar_video: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "video_url": None
        }
