"""
Public Citizen Reporting API for PUSHPA.

Allows regular citizens, hikers, tribal communities, and local villagers to report
suspicious forest activity (chainsaw noises, illegal log loading, unpermitted trucks,
smoke/fire, snare traps) with photo uploads and precise GPS coordinates.
Auto-correlates reports with forest zones and triggers tactical alerts.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import store
from app.database.persistence import calculate_haversine_distance_km

router = APIRouter(prefix="/api/reports", tags=["citizen-reports"])

# In-memory & persistent citizen reports collection
CITIZEN_REPORTS: list[dict[str, Any]] = []


class CitizenReportPayload(BaseModel):
    category: str = Field(..., description="e.g. 'CHAINSAW_NOISE', 'ILLEGAL_LOGGING', 'SUSPICIOUS_TRUCK', 'SMOKE_FIRE', 'POACHING_SNARE'")
    title: str = Field(..., description="Brief headline of incident")
    description: str = Field(..., description="Detailed description or landmark cues")
    lat: float = Field(..., description="GPS Latitude")
    lng: float = Field(..., description="GPS Longitude")
    photo_base64: Optional[str] = Field(None, description="Optional photo capture (base64 data URI)")
    reporter_phone: Optional[str] = Field(None, description="Optional phone number for reward/verification")
    is_anonymous: bool = Field(True, description="Whether reporter chose anonymity")


@router.post("/citizen")
def submit_citizen_report(payload: CitizenReportPayload):
    """Public endpoint to ingest citizen intelligence report."""
    report_id = f"CIT-REP-{len(CITIZEN_REPORTS) + 101:04d}"
    now_iso = datetime.utcnow().isoformat()

    # Find nearest forest zone
    nearest_zone = None
    min_dist = float("inf")
    for zone in store.FOREST_ZONES:
        dist = calculate_haversine_distance_km(payload.lat, payload.lng, zone["center"]["lat"], zone["center"]["lng"])
        if dist < min_dist:
            min_dist = dist
            nearest_zone = zone["id"]

    report_record = {
        "report_id": report_id,
        "category": payload.category,
        "title": payload.title,
        "description": payload.description,
        "lat": payload.lat,
        "lng": payload.lng,
        "photo_base64": payload.photo_base64,
        "reporter_phone": "ANONYMOUS" if payload.is_anonymous else (payload.reporter_phone or "ANONYMOUS"),
        "is_anonymous": payload.is_anonymous,
        "zone_id": nearest_zone or "ZONE-B",
        "distance_to_core_km": round(min_dist, 2) if min_dist != float("inf") else 0.0,
        "status": "VERIFIED_ALERT",
        "created_at": now_iso,
    }

    CITIZEN_REPORTS.insert(0, report_record)

    # Automatically generate tactical alert for officers
    alert_id = store.next_id("ALT-CIT")
    alert_entry = {
        "alert_id": alert_id,
        "vehicle_id": "UNKNOWN_FIELD_INTEL",
        "risk_score": 85 if payload.category in ["CHAINSAW_NOISE", "ILLEGAL_LOGGING"] else 70,
        "rating": "HIGH",
        "zone_id": nearest_zone or "ZONE-B",
        "source": "CITIZEN_INTELLIGENCE",
        "message": f"CITIZEN INTEL ({report_id}): {payload.title} reported at [{payload.lat:.4f}, {payload.lng:.4f}]. Distance: {min_dist:.1f}km from core.",
        "created_at": now_iso,
        "lat": payload.lat,
        "lng": payload.lng,
        "photo_url": payload.photo_base64,
    }
    store.ALERTS.insert(0, alert_entry)
    store.save_current_state()

    return {
        "ok": True,
        "report_id": report_id,
        "alert_id": alert_id,
        "message": "Thank you. Your report has been dispatched to Forest Intelligence & Range Patrol.",
        "zone_id": nearest_zone,
    }


@router.get("/citizen")
def list_citizen_reports():
    """Retrieve verified citizen intelligence reports."""
    return {"count": len(CITIZEN_REPORTS), "reports": CITIZEN_REPORTS}
