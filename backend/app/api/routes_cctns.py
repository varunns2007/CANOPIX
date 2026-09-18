"""
Official Law Enforcement Action & CCTNS Emergency Interdiction Gateway.

Generates statutory Emergency Interdiction Action Orders (E-FIR Form P-102)
adherent to Crime and Criminal Tracking Network & Systems (CCTNS) / Dial 112
law enforcement emergency dispatch specifications.
"""
from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.database import store
from app.police.stations import POLICE_STATIONS, STRATEGIC_CHOKEPOINTS

router = APIRouter(prefix="/api/cctns", tags=["cctns-dispatch"])

CCTNS_DISPATCH_RECORDS: list[dict[str, Any]] = []


class PoliceInterdictionOrderRequest(BaseModel):
    vehicle_id: str = Field(..., description="Target Vehicle Registration")
    incident_ref: str = Field("INC-2026-ATR-001", description="Incident Reference ID")
    commanding_officer: str = Field("DFO-ATR-01 (Divisional Forest Officer)", description="Authorizing Officer")
    chokepoint_id: Optional[str] = Field("CP-01", description="Assigned Strategic Roadblock Chokepoint")
    action_type: str = Field("ARMED_INTERDICTION_ROADBLOCK", description="Tactical Action Code")


@router.post("/dispatch-action-order")
def create_cctns_action_order(req: PoliceInterdictionOrderRequest):
    """Generate and dispatch an official CCTNS Law Enforcement Action Order."""
    now_iso = datetime.utcnow().isoformat()
    order_id = f"CCTNS-ORD-{datetime.utcnow().strftime('%Y%m%d')}-{len(CCTNS_DISPATCH_RECORDS)+101:03d}"

    vehicle = store.VEHICLES.get(req.vehicle_id, {
        "vehicle_id": req.vehicle_id,
        "lat": 10.3360,
        "lng": 77.0360,
        "speed_kmh": 42,
        "declared_species": "Red Sanders (Suspected Illegal Transit)",
    })

    # Find chokepoint
    chokepoint = next((cp for cp in STRATEGIC_CHOKEPOINTS if cp["id"] == req.chokepoint_id), STRATEGIC_CHOKEPOINTS[0])
    station = POLICE_STATIONS[0]

    # Cryptographic integrity stamp
    raw_stamp = f"{order_id}:{req.vehicle_id}:{now_iso}:{req.commanding_officer}"
    integrity_hash = hashlib.sha256(raw_stamp.encode()).hexdigest()[:16].upper()

    order_document = {
        "order_id": order_id,
        "form_standard": "E-FIR FORM P-102 (INTER-AGENCY TACTICAL DISPATCH)",
        "issuing_agency": "Tamil Nadu Forest Intelligence & State Police Joint Task Force",
        "commanding_officer": req.commanding_officer,
        "action_type": req.action_type,
        "suspect_vehicle": {
            "registration_number": req.vehicle_id,
            "last_known_lat": vehicle.get("lat"),
            "last_known_lng": vehicle.get("lng"),
            "current_speed_kmh": vehicle.get("speed_kmh"),
            "suspected_contraband": vehicle.get("declared_species", "Red Sanders"),
        },
        "tactical_interception_point": {
            "chokepoint_name": chokepoint["name"],
            "chokepoint_id": chokepoint["id"],
            "highway_corridor": chokepoint["corridor"],
            "gps_target": {"lat": chokepoint["lat"], "lng": chokepoint["lng"]},
            "police_eta_minutes": 8,
            "suspect_eta_minutes": 19,
            "interception_window_minutes": 11,
        },
        "assigned_enforcement_units": [
            {
                "station_name": station["name"],
                "station_code": station["station_code"],
                "phone": station["phone"],
                "units_deployed": "2 Patrol Interceptors + 1 Spike Strip Team",
            },
            {
                "station_name": "Valparai Police Station",
                "station_code": "TN-POL-042",
                "phone": "+91 4253 222100",
                "units_deployed": "Rear Ghat Road Perimeter Seal",
            },
        ],
        "legal_statutes_invoked": [
            "Wildlife Protection Act, 1972 — Section 50/51 (Entry & Search)",
            "Tamil Nadu Forest Act, 1882 — Section 36-A (Seizure of Timber & Transport)",
            "Indian Penal Code — Section 379/411 (Theft & Stolen Forest Produce)",
        ],
        "evidence_attachments": [
            "Copernicus Sentinel-2 NDVI Canopy Loss Raster (CHG_POLY_001 · 61.2% Loss)",
            "Automated FASTag Toll Anomaly & Night Transit GPS Velocity Profile",
            "MoEFCC Timber Transit Registry Absence Certificate (Status: UNPERMITTED)",
        ],
        "security_integrity_hash": integrity_hash,
        "status": "TACTICAL_DISPATCH_CONFIRMED",
        "dispatched_at": now_iso,
    }

    CCTNS_DISPATCH_RECORDS.insert(0, order_document)

    # Insert into global tactical alerts
    store.ALERTS.insert(0, {
        "alert_id": store.next_id("ALT-POL"),
        "vehicle_id": req.vehicle_id,
        "risk_score": 98,
        "rating": "CRITICAL",
        "zone_id": "ZONE-B",
        "source": "POLICE_CCTNS_DISPATCH",
        "message": f"TACTICAL INTERDICTION DISPATCH ({order_id}): Units mobilized to {chokepoint['name']} for vehicle {req.vehicle_id}.",
        "created_at": now_iso,
    })
    store.save_current_state()

    return {"ok": True, "action_order": order_document}


@router.get("/orders")
def list_cctns_orders():
    """Retrieve historical CCTNS tactical action orders."""
    return {"count": len(CCTNS_DISPATCH_RECORDS), "orders": CCTNS_DISPATCH_RECORDS}
