"""
SMS Service — Twilio-powered alert system
==========================================
Gracefully no-ops when TWILIO_* env vars are not set.
"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Messages ─────────────────────────────────────────────────────────────────

MSG_HIGH_STRESS = (
    "Hi, we noticed you may be experiencing high stress today. "
    "Remember to take a break and breathe. We’re here for you ❤️"
)

MSG_RISK = (
    "Hi, this is a gentle check-in from Sarthi. You are not alone. "
    "If you need help, please contact someone you trust or a helpline."
)

MSG_FRIEND_STRESS = (
    "Your friend may need support right now. Please consider checking in with them."
)

MSG_FRIEND_RISK = (
    "Your friend may be going through a difficult time and could use your support. "
    "Please reach out to them."
)

MSG_DAILY_ENGAGEMENT = (
    "Hi, Sarthi misses you! 🌸 You haven't checked in today. "
    "How is your day going? Remember, we're always here to listen."
)


def _get_client():
    """Return a Twilio client or None if not configured."""
    sid = settings.TWILIO_ACCOUNT_SID
    token = settings.TWILIO_AUTH_TOKEN
    if not sid or not token:
        return None
    try:
        from twilio.rest import Client
        return Client(sid, token)
    except ImportError:
        logger.warning("twilio package not installed. SMS disabled.")
        return None
    except Exception as e:
        logger.warning(f"Twilio client init failed: {e}")
        return None


def send_sms(phone: str, message: str) -> bool:
    """
    Send an SMS via Twilio.
    Returns True on success, False on failure or when not configured.
    """
    if not phone:
        return False

    client = _get_client()
    if not client:
        logger.warning(f"SMS not sent (Twilio unconfigured). To={phone} Msg={message}")
        return False

    from_number = settings.TWILIO_PHONE_NUMBER
    if not from_number:
        logger.warning("SMS not sent: TWILIO_PHONE_NUMBER not set.")
        return False

    # Normalize phone
    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) == 10:
        phone = "+91" + clean_phone
    elif not phone.startswith("+"):
        phone = "+" + clean_phone

    try:
        msg = client.messages.create(body=message, from_=from_number, to=phone)
        logger.info(f"SMS sent. SID={msg.sid} to={phone}")
        return True
    except Exception as e:
        logger.error(f"SMS send failed to {phone}: {e}")
        return False


def _get_phones(user_id: int, db) -> tuple[Optional[str], Optional[str]]:
    """Helper to get user and friend phones."""
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None, None
    return user.phone_number, user.close_friend_phone


def send_high_stress_alert(user_id: int, db) -> dict:
    """Send high-stress SMS to user and friend."""
    user_phone, friend_phone = _get_phones(user_id, db)
    results = {"user_sent": False, "friend_sent": False}
    if user_phone:
        results["user_sent"] = send_sms(user_phone, MSG_HIGH_STRESS)
    if friend_phone:
        results["friend_sent"] = send_sms(friend_phone, MSG_FRIEND_STRESS)
    return results


def send_risk_alert(user_id: int, db) -> dict:
    """Send risk SMS to user and friend."""
    user_phone, friend_phone = _get_phones(user_id, db)
    results = {"user_sent": False, "friend_sent": False}
    if user_phone:
        results["user_sent"] = send_sms(user_phone, MSG_RISK)
    if friend_phone:
        results["friend_sent"] = send_sms(friend_phone, MSG_FRIEND_RISK)
    return results


def send_engagement_reminder(user_id: int, db) -> bool:
    """Send a 'missing you' engagement SMS to the user."""
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.phone_number:
        return False
    return send_sms(user.phone_number, MSG_DAILY_ENGAGEMENT)
