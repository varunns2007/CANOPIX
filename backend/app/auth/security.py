"""
Security, Authentication & Role-Based Access Control (RBAC) for PUSHPA.

Defines roles, credentials, JWT generation/validation, and permission dependencies
for DFO, Police Tactical Commander, Range Guard, and GIS Analyst.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any, Optional

from fastapi import Depends, HTTPException, Header, status
from pydantic import BaseModel

SECRET_KEY = "pushpa_tactical_secret_key_change_in_production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 86400  # 24 hours


class Role:
    DFO = "DFO"  # Divisional Forest Officer
    POLICE_CMD = "POLICE_CMD"  # Police Tactical Interdiction Commander
    RANGE_GUARD = "RANGE_GUARD"  # Forest Range Guard / Checkpost Officer
    GIS_ANALYST = "GIS_ANALYST"  # Geospatial & Satellite Analyst


ROLE_PROFILES: dict[str, dict[str, Any]] = {
    Role.DFO: {
        "role_id": Role.DFO,
        "name": "Divisional Forest Officer (DFO)",
        "badge": "DFO-ATR-01",
        "jurisdiction": "Anamalai Tiger Reserve & Nilgiri Biosphere",
        "clearance_level": "LEVEL-4 (TOP SECRET)",
        "permissions": ["all", "interdiction_dispatch", "change_detection", "risk_override", "permit_audit"],
    },
    Role.POLICE_CMD: {
        "role_id": Role.POLICE_CMD,
        "name": "Police Tactical Interdiction Commander",
        "badge": "TN-POL-TACTICAL-88",
        "jurisdiction": "State Highway Patrol & Checkpost Network",
        "clearance_level": "LEVEL-3 (TACTICAL DISPATCH)",
        "permissions": ["interdiction_dispatch", "roadblock_authorise", "vehicle_tracking", "alerts_view"],
    },
    Role.RANGE_GUARD: {
        "role_id": Role.RANGE_GUARD,
        "name": "Forest Range Field Officer",
        "badge": "RNG-NAVAMALAI-14",
        "jurisdiction": "Navamalai Core Sector Checkpost",
        "clearance_level": "LEVEL-2 (FIELD OPERATIONS)",
        "permissions": ["vehicle_inspection", "permit_verify", "incident_log", "alerts_view"],
    },
    Role.GIS_ANALYST: {
        "role_id": Role.GIS_ANALYST,
        "name": "GIS & Satellite Intelligence Specialist",
        "badge": "GIS-ISRO-SENTINEL-07",
        "jurisdiction": "Copernicus Sentinel-2 Processing Center",
        "clearance_level": "LEVEL-3 (REMOTE SENSING)",
        "permissions": ["change_detection", "ndvi_analysis", "density_mapping", "alerts_view"],
    },
}


class TokenPayload(BaseModel):
    sub: str
    role: str
    name: str
    badge: str
    exp: int


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding < 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))


def create_access_token(role_id: str, subject: str = "officer") -> str:
    profile = ROLE_PROFILES.get(role_id, ROLE_PROFILES[Role.DFO])
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": subject,
        "role": profile["role_id"],
        "name": profile["name"],
        "badge": profile["badge"],
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS,
    }
    header_b64 = _b64encode(json.dumps(header).encode("utf-8"))
    payload_b64 = _b64encode(json.dumps(payload).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def verify_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        provided_sig = _b64decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            return None
        payload_json = json.loads(_b64decode(payload_b64).decode("utf-8"))
        if payload_json.get("exp", 0) < time.time():
            return None
        return payload_json
    except Exception:
        return None


def get_current_user(authorization: Optional[str] = Header(None)) -> dict[str, Any]:
    """Dependency that extracts user from Authorization header, defaulting to DFO if header absent for frictionless local dev."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        verified = verify_access_token(token)
        if verified:
            role = verified.get("role", Role.DFO)
            profile = ROLE_PROFILES.get(role, ROLE_PROFILES[Role.DFO])
            return {**profile, **verified}

    # Default fallback profile for immediate local / hackathon use
    return ROLE_PROFILES[Role.DFO]


def require_roles(*allowed_roles: str):
    def role_checker(user: dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role", user.get("role_id"))
        if user_role == Role.DFO or "all" in user.get("permissions", []):
            return user
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{user_role}'. Required roles: {list(allowed_roles)}",
            )
        return user

    return role_checker
