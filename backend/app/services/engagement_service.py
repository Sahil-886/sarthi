"""
Engagement Service — Logic for detecting inactive users and sending reminders.
"""
import logging
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.streak import UserStreak
from app.services.sms_service import send_engagement_reminder

logger = logging.getLogger(__name__)

def check_and_send_engagement_reminders(db: Session):
    """
    Check all users who have not had activity today and 
    send an engagement SMS if they haven't received one yet today.
    """
    today = date.today()
    
    overdue_streaks = (
        db.query(UserStreak)
        .filter(
            (UserStreak.last_activity_date < today) | (UserStreak.last_activity_date == None),
            (UserStreak.last_engagement_msg_sent_at == None) | 
            (UserStreak.last_engagement_msg_sent_at < today)
        )
        .all()
    )
    
    records_sent = 0
    for streak in overdue_streaks:
        try:
            # Try to send
            send_engagement_reminder(streak.user_id, db)
            
            # We mark it as sent for rate-limiting regardless of actual SMS success
            # (the attempt was made, and we don't want to spam if it's a configuration issue)
            streak.last_engagement_msg_sent_at = today
            records_sent += 1
        except Exception as e:
            logger.error(f"Failed to send engagement reminder to user {streak.user_id}: {e}")
            
    if records_sent > 0:
        db.commit()
        logger.info(f"Sent {records_sent} engagement reminders.")
    
    return {"reminders_sent": records_sent}
