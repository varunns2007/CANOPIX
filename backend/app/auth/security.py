"""
Security, Authentication & Role-Based Access Control (RBAC) for PUSHPA.

Defines roles, credentials, JWT generation/validation, and permission dependencies
for DFO, Police Tactical Commander, Range Guard, and GIS Analyst.

Hardening notes (read this before deploying anywhere but localhost):
  - The signing key comes from the JWT_SECRET_KEY env var. If it's not set,
    we generate a random one at process startup and print a loud warning --
    tokens simply stop validating on the next restart, but at least nothing
    is hardcoded in source control anymore.
  - Getting an elevated role (anything other than the default GUEST) now
    requires a shared demo password (PUSHPA_DEMO_PASSWORD, default
    "pushpa-demo" -- change it via env for anything beyond a local demo).
    This is still not real per-officer login (no usernames, no per-person
    audit trail) -- it's a minimum bar above "anyone can mint any badge
    with zero friction". A production deployment should replace this with
    real accounts.
  - A request with no/invalid token no longer silently becomes a DFO
    (top-clearance) user. It becomes a read-mostly GUEST instead.
"""
from __future__ import annotations

import os
import secrets
import time
import warnings
from typing import Any, Optional

import jwt
from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel

_env_secret = os.environ.get("JWT_SECRET_KEY")
if _env_secret:
    SECRET_KEY = _env_secret
else:
    SECRET_KEY = secrets.token_urlsafe(48)
    warnings.warn(
        "JWT_SECRET_KEY is not set -- generated a random signing key for this "
        "process only. All sessions will be invalidated on restart, and if you "
        "ever run more than one backend instance they won't trust each other's "
        "tokens. Set JWT_SECRET_KEY in your environment (see backend/.env.example) "
        "before deploying anywhere beyond a single local demo.",
        stacklevel=2,
    )

ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 86400  # 24 hours
DEMO_PASSWORD = os.environ.get("PUSHPA_DEMO_PASSWORD", "pushpa-demo")


class Role:
    GUEST = "GUEST"  # Unauthenticated / read-mostly default
    DFO = "DFO"  # Divisional Forest Officer
    POLICE_CMD = "POLICE_CMD"  # Police Tactical Interdiction Commander
    RANGE_GUARD = "RANGE_GUARD"  # Forest Range Guard / Checkpost Officer
    GIS_ANALYST = "GIS_ANALYST"  # Geospatial & Satellite Analyst


ROLE_PROFILES: dict[str, dict[str, Any]] = {
    Role.GUEST: {
        "role_id": Role.GUEST,
        "name": "Guest (Unauthenticated)",
        "badge": "GUEST-00",
        "jurisdiction": "None",
        "clearance_level": "LEVEL-0 (READ-ONLY)",
        "permissions": ["alerts_view"],
    },
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

# Roles a caller may request via /api/auth/switch-role, given the demo password.
ELEVATABLE_ROLES = {Role.DFO, Role.POLICE_CMD, Role.RANGE_GUARD, Role.GIS_ANALYST}


class TokenPayload(BaseModel):
    sub: str
    role: str
    name: str
    badge: str
    exp: int


def create_access_token(role_id: str, subject: str = "officer") -> str:
    """Sign a standard JWT (via PyJWT) carrying the officer's role profile."""
    profile = ROLE_PROFILES.get(role_id, ROLE_PROFILES[Role.GUEST])
    payload = {
        "sub": subject,
        "role": profile["role_id"],
        "name": profile["name"],
        "badge": profile["badge"],
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_current_user(authorization: Optional[str] = Header(None)) -> dict[str, Any]:
    """Dependency that extracts the user from the Authorization header.

    No token, or an invalid/expired one, resolves to GUEST (read-mostly)
    rather than silently granting the top-clearance DFO profile.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        verified = verify_access_token(token)
        if verified:
            role = verified.get("role", Role.GUEST)
            profile = ROLE_PROFILES.get(role, ROLE_PROFILES[Role.GUEST])
            return {**profile, **verified}

    return ROLE_PROFILES[Role.GUEST]


def require_roles(*allowed_roles: str):
    def role_checker(user: dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role", user.get("role_id"))
        if "all" in user.get("permissions", []):
            return user
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{user_role}'. Required roles: {list(allowed_roles)}",
            )
        return user

    return role_checker
