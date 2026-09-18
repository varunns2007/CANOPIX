"""
Real Truck GPS & FASTag Telemetry Ingestion Gateway for PUSHPA.

Supports:
  1. AIS-140 GPS Device Standard (IMEI, Latitude, Longitude, Speed, Heading, Ignition, Panic, Timestamp)
  2. NPCI / IHMCL FASTag Toll Plaza Transit Records (Plaza ID, EPC Tag, VRN, Weight, Timestamp)
  3. Live partner webhook receiver for fleet tracking companies and toll plaza servers.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import store
from app.vehicles.tracker import analyze_vehicle

router = APIRouter(prefix="/api/gateway", tags=["telemetry-gateway"])

INGESTED_RAW_PACKETS: list[dict[str, Any]] = []


class Ais140Packet(BaseModel):
    imei: str = Field(..., description="Device IMEI / Unique Hardware ID")
    vehicle_registration: str = Field(..., description="Vehicle Registration Number (e.g. TN 38 BX 9104)")
    lat: float = Field(..., description="GPS Latitude")
    lng: float = Field(..., description="GPS Longitude")
    speed_kmh: float = Field(0.0, description="Speed in km/h")
    heading_deg: float = Field(0.0, description="Heading in degrees (0-360)")
    ignition: bool = Field(True, description="Engine Ignition Status")
    emergency_panic: bool = Field(False, description="SOS Panic Button state")
    altitude_m: Optional[float] = Field(None, description="Altitude in meters")
    timestamp: Optional[str] = Field(None, description="ISO timestamp of packet")


class FastagTollPing(BaseModel):
    toll_plaza_id: str = Field(..., description="FASTag Toll Plaza Code (e.g. TP-TN-NAVAMALAI)")
    toll_plaza_name: str = Field(..., description="Toll Plaza Name")
    lane_id: str = Field(..., description="Toll Lane Number (e.g. Lane-03)")
    vehicle_registration: str = Field(..., description="Vehicle License Plate")
    tag_epc: str = Field(..., description="RFID Tag EPC ID")
    gross_weight_kg: Optional[float] = Field(None, description="Weigh-in-Motion axle weight in kg")
    declared_cargo: Optional[str] = Field(None, description="Toll declaration")
    lat: float = Field(10.3500, description="Toll Plaza Latitude")
    lng: float = Field(77.0500, description="Toll Plaza Longitude")
    timestamp: Optional[str] = Field(None, description="Timestamp of toll crossing")


@router.post("/ais140")
def ingest_ais140_telemetry(packet: Ais140Packet):
    """Ingest real-time AIS-140 GPS hardware packet."""
    now_iso = packet.timestamp or datetime.utcnow().isoformat()
    vrn = packet.vehicle_registration.strip().upper()

    # Update or insert vehicle in database
    existing = store.VEHICLES.get(vrn, {
        "vehicle_id": vrn,
        "registration_number": vrn,
        "make_model": f"Commercial Transport (IMEI: {packet.imei})",
        "type": "Heavy Commercial Carrier",
        "cargo_weight_kg": 7500,
        "declared_species": "Commercial Timber",
        "zone_id": "ZONE-B",
    })

    existing.update({
        "lat": packet.lat,
        "lng": packet.lng,
        "speed_kmh": packet.speed_kmh,
        "heading_deg": packet.heading_deg,
        "last_update": now_iso,
        "imei": packet.imei,
        "ignition": packet.ignition,
    })
    store.VEHICLES[vrn] = existing
    store.log_vehicle_position(vrn, packet.lat, packet.lng, now_iso)

    # Record raw packet in audit stream
    packet_record = {
        "type": "AIS_140_GPS",
        "vrn": vrn,
        "imei": packet.imei,
        "lat": packet.lat,
        "lng": packet.lng,
        "speed_kmh": packet.speed_kmh,
        "timestamp": now_iso,
    }
    INGESTED_RAW_PACKETS.insert(0, packet_record)
    del INGESTED_RAW_PACKETS[100:]

    return {
        "ok": True,
        "status": "TELEMETRY_INGESTED",
        "vehicle_id": vrn,
        "processed_at": now_iso,
    }


@router.post("/fastag")
def ingest_fastag_toll(ping: FastagTollPing):
    """Ingest real-time FASTag RFID Toll Crossing."""
    now_iso = ping.timestamp or datetime.utcnow().isoformat()
    vrn = ping.vehicle_registration.strip().upper()

    existing = store.VEHICLES.get(vrn, {
        "vehicle_id": vrn,
        "registration_number": vrn,
        "make_model": "Highway Carrier",
        "type": "Commercial Truck",
        "cargo_weight_kg": ping.gross_weight_kg or 8000,
        "declared_species": ping.declared_cargo or "Timber Goods",
        "zone_id": "ZONE-B",
    })

    existing.update({
        "lat": ping.lat,
        "lng": ping.lng,
        "speed_kmh": 20,
        "last_update": now_iso,
        "last_toll_plaza": ping.toll_plaza_name,
        "fastag_epc": ping.tag_epc,
    })
    if ping.gross_weight_kg:
        existing["cargo_weight_kg"] = ping.gross_weight_kg

    store.VEHICLES[vrn] = existing
    store.log_vehicle_position(vrn, ping.lat, ping.lng, now_iso)

    packet_record = {
        "type": "FASTAG_RFID_TOLL",
        "vrn": vrn,
        "plaza": ping.toll_plaza_name,
        "lane": ping.lane_id,
        "tag_epc": ping.tag_epc,
        "weight_kg": ping.gross_weight_kg,
        "timestamp": now_iso,
    }
    INGESTED_RAW_PACKETS.insert(0, packet_record)
    del INGESTED_RAW_PACKETS[100:]

    return {
        "ok": True,
        "status": "FASTAG_PING_RECORDED",
        "vehicle_id": vrn,
        "toll_plaza": ping.toll_plaza_name,
    }


@router.get("/packets")
def get_recent_gateway_packets():
    """Return recent raw gateway telemetry packets for integration testing."""
    return {"count": len(INGESTED_RAW_PACKETS), "packets": INGESTED_RAW_PACKETS}
