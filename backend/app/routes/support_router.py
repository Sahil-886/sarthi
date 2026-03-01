from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/support", tags=["support"])


# ── Pydantic ──────────────────────────────────────────────────────────────────

class AlertRequest(BaseModel):
    type: str  # "stress" | "risk"


# ── Helplines ─────────────────────────────────────────────────────────────────

@router.get("/helpline")
async def get_helplines() -> Dict[str, List[Dict[str, str]]]:
    """24/7 mental health crisis helplines."""
    return {
        "helplines": [
            {
                "name": "Kiran Mental Health Helpline",
                "phone": "1800-599-0019",
                "description": "24/7 toll-free support by the Ministry of Social Justice & Empowerment",
            },
            {
                "name": "AASRA (Crisis Intervention)",
                "phone": "+91-9820466627",
                "description": "Round-the-clock helpline for emotional support and suicide prevention",
            },
            {
                "name": "Vandrevala Foundation",
                "phone": "1860-2662-345",
                "description": "24/7 mental health helpline and counselling",
            },
            {
                "name": "National Emergency Number",
                "phone": "112",
                "description": "Police, Fire & Ambulance — for immediate danger",
            },
        ]
    }


# ── Contact ───────────────────────────────────────────────────────────────────

@router.get("/contact")
async def get_support_contact():
    """Returns Sarthi support contact details."""
    return {
        "name": "Sarthi Support",
        "phone": "7262854580",
        "whatsapp": "7262854580",
        "email": "sahilmakhamale88@gmail.com",
        "hours": "Mon–Sat, 9 AM – 8 PM IST",
        "message": "If you need help or want to talk, feel free to reach out.",
    }


# ── Professional Consultants ──────────────────────────────────────────────────

CONSULTANTS = [
    {
        "id": 1,
        "name": "Dr. Ananya Sharma",
        "specialization": "Clinical Psychologist",
        "phone": "+91-9876543210",
        "email": "ananya.sharma@sarthi.care",
        "availability": "Mon–Sat, 9 AM – 6 PM IST",
        "location": "Mumbai (Online available)",
    },
    {
        "id": 2,
        "name": "Dr. Rahul Mehta",
        "specialization": "Psychiatrist & Therapist",
        "phone": "+91-9123456789",
        "email": "rahul.mehta@sarthi.care",
        "availability": "Tue–Sun, 10 AM – 7 PM IST",
        "location": "Delhi (Online available)",
    },
    {
        "id": 3,
        "name": "Priya Verma",
        "specialization": "Licensed Counsellor (Grief & Trauma)",
        "phone": "+91-9988776655",
        "email": "priya.verma@sarthi.care",
        "availability": "Mon–Fri, 8 AM – 5 PM IST",
        "location": "Bangalore (Online available)",
    },
    {
        "id": 4,
        "name": "Kiran Helpline (Free)",
        "specialization": "Mental Health Crisis Support",
        "phone": "1800-599-0019",
        "email": None,
        "availability": "24/7 — Always available",
        "location": "India-wide (Toll-free)",
    },
]


@router.get("/consultants")
async def get_consultants() -> Dict[str, list]:
    return {"consultants": CONSULTANTS}


@router.get("/emergency")
async def get_emergency_contacts() -> Dict[str, object]:
    return {
        "helplines": (await get_helplines())["helplines"],
        "consultants": CONSULTANTS,
    }


# ── Send Alert ────────────────────────────────────────────────────────────────

def _fire_alert(alert_type: str, user_phone: Optional[str], friend_phone: Optional[str]):
    """Called in a background task — won't block the API response."""
    try:
        from app.services.sms_service import send_high_stress_alert, send_risk_alert
        if alert_type == "stress":
            result = send_high_stress_alert(user_phone, friend_phone)
        else:
            result = send_risk_alert(user_phone, friend_phone)
        logger.info(f"Alert ({alert_type}) results: {result}")
    except Exception as e:
        logger.error(f"Alert background task failed: {e}")


@router.post("/send-alert")
async def send_manual_alert(
    alert_data: Dict[str, str],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger a stress or risk alert."""
    from app.services.sms_service import send_high_stress_alert, send_risk_alert
    
    alert_type = alert_data.get("type", "stress")
    if alert_type == "stress":
        background_tasks.add_task(send_high_stress_alert, current_user.id, db)
    else:
        background_tasks.add_task(send_risk_alert, current_user.id, db)
    
    return {
        "queued": True,
        "type": alert_type,
        "note": "SMS queued. Will deliver if Twilio is configured and phone numbers are saved.",
    }


@router.post("/engagement-check")
async def run_engagement_check(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Check for inactive users and send engagement reminders."""
    from app.services.engagement_service import check_and_send_engagement_reminders
    background_tasks.add_task(check_and_send_engagement_reminders, db)
    return {"status": "Engagement check initiated"}
