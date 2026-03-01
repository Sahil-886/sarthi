import logging
import asyncio
from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.models.user import User, AIConversation
from app.services.ai_service import ai_service
from app.services.memory_service import memory_service

logger = logging.getLogger(__name__)

async def extract_and_store_traits_async():
    """Weekly background job to extract user traits from recent conversations"""
    logger.info("Starting weekly Memory Evolution job for Sarthi...")
    db = SessionLocal()
    try:
        # Get all users who had conversations in the last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        users_with_conversations = db.query(User).join(AIConversation).filter(
            AIConversation.created_at >= seven_days_ago
        ).distinct().all()
        
        for user in users_with_conversations:
            logger.info(f"Extracting traits for user {user.id}")
            # Get recent convos
            convos = db.query(AIConversation).filter(
                AIConversation.user_id == user.id,
                AIConversation.created_at >= seven_days_ago
            ).order_by(AIConversation.created_at.asc()).all()
            
            if not convos:
                continue
                
            # Compress into a summary
            convo_text = "\n".join([f"User: {c.user_message}\nSarthi: {c.ai_response}" for c in convos])
            
            prompt = f"""Analyze the following recent conversations between the user ({user.name}) and Sarthi.
Extract 3-5 key enduring behavioral traits, emotional triggers, goals, or preferences about the user.
Format as a brief, bulleted profile summary specifically designed to be stored in long-term memory to help Sarthi personalize future support.

Conversations:
{convo_text}

Extracted Traits Profile:"""

            try:
                if ai_service.client:
                    response = await ai_service.client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.5,
                        max_tokens=250
                    )
                    profile = response.choices[0].message.content.strip()
                    
                    # Store this deep memory profile
                    memory_service.store_memory(
                        user.id,
                        f"Weekly Personality Profile Evolution for {user.name}: {profile}",
                        metadata={"type": "evolution_profile"}
                    )
                    logger.info(f"Successfully stored evolved profile for user {user.id}")
            except Exception as e:
                logger.error(f"Failed to generate profile for user {user.id}: {e}")
                
    except Exception as e:
        logger.error(f"Error in memory evolution job: {e}")
    finally:
        db.close()
        logger.info("Memory Evolution job finished.")

def extract_and_store_traits_sync():
    """Wrapper to run the async job in the sync APScheduler context."""
    asyncio.run(extract_and_store_traits_async())
