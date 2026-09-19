from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.security import (
    DEMO_PASSWORD,
    ELEVATABLE_ROLES,
    ROLE_PROFILES,
    Role,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RoleSwitchRequest(BaseModel):
    role_id: str
    # Shared demo password (see PUSHPA_DEMO_PASSWORD in backend/.env.example).
    # Not real per-officer auth -- just a minimum bar above "no check at all".
    password: str = ""


@router.get("/roles")
def list_roles():
    """Return all available command roles and clearance levels."""
    return {"roles": list(ROLE_PROFILES.values())}


@router.get("/me")
def get_current_profile(user: dict = Depends(get_current_user)):
    """Return current authenticated officer profile and permissions."""
    return {"user": user}


@router.post("/switch-role")
def switch_role(req: RoleSwitchRequest):
    """Switch active command role and issue a new JWT session token.

    Elevated roles (anything above GUEST) require the shared demo
    password. This is deliberately lightweight -- it's a hackathon
    demo, not a real identity system -- but it means a stray or
    malicious request can no longer silently mint a top-clearance
    badge with zero friction.
    """
    role_id = req.role_id if req.role_id in ROLE_PROFILES else Role.GUEST

    if role_id in ELEVATABLE_ROLES and req.password != DEMO_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect demo password for an elevated role. See PUSHPA_DEMO_PASSWORD in backend/.env.example.",
        )

    profile = ROLE_PROFILES[role_id]
    token = create_access_token(role_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": profile,
    }
