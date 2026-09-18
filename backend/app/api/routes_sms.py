from __future__ import annotations

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.alerts.sms_gateway import SMS_DISPATCH_LOGS, dispatch_sms

router = APIRouter(prefix="/api/sms", tags=["sms"])


class SendSmsRequest(BaseModel):
    phone_number: str = Field(..., description="Recipient phone number (e.g. +91 98765 43210)")
    message: str = Field(..., description="Alert text payload")
    priority: str = Field("CRITICAL", description="Priority level")


@router.post("/send")
def send_sms_alert(req: SendSmsRequest):
    """Dispatch an SMS emergency alert to an officer's phone."""
    result = dispatch_sms(req.phone_number, req.message, req.priority)
    return {"ok": True, "dispatch": result}


@router.get("/logs")
def get_sms_logs():
    """Retrieve all SMS transmission dispatch logs."""
    return {"count": len(SMS_DISPATCH_LOGS), "logs": SMS_DISPATCH_LOGS}
