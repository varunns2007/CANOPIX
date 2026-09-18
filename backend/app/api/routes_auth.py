from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.security import ROLE_PROFILES, Role, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RoleSwitchRequest(BaseModel):
    role_id: str


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
    """Switch active command role and issue a new JWT session token."""
    role_id = req.role_id if req.role_id in ROLE_PROFILES else Role.DFO
    profile = ROLE_PROFILES[role_id]
    token = create_access_token(role_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": profile,
    }
