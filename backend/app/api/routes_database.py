from __future__ import annotations

import os
from datetime import datetime
from fastapi import APIRouter, Depends

from app.auth.security import Role, require_roles
from app.database import store
from app.database.persistence import STORAGE_FILE, persistence

router = APIRouter(prefix="/api/database", tags=["database"])


@router.get("/status")
def get_database_status():
    """Return persistent store metadata and record counts."""
    file_exists = STORAGE_FILE.exists()
    size_bytes = STORAGE_FILE.stat().st_size if file_exists else 0
    mtime = (
        datetime.fromtimestamp(STORAGE_FILE.stat().st_mtime).isoformat()
        if file_exists
        else None
    )

    return {
        "storage_mode": "DISK_PERSISTENT_JSON",
        "storage_path": str(STORAGE_FILE),
        "file_exists": file_exists,
        "size_bytes": size_bytes,
        "last_modified": mtime,
        "counts": {
            "forest_zones": len(store.FOREST_ZONES),
            "vehicles": len(store.VEHICLES),
            "permits": len(store.TIMBER_PERMITS),
            "change_polygons": len(store.CHANGE_POLYGONS),
            "alerts": len(store.ALERTS),
            "historical_incidents": len(store.HISTORICAL_INCIDENTS),
            "tracked_vehicle_logs": sum(len(v) for v in store.VEHICLE_POSITION_LOG.values()),
        },
    }


@router.post("/save")
def force_save(user: dict = Depends(require_roles(Role.DFO))):
    """Force flush active state to disk."""
    store.save_current_state()
    return {"status": "saved", "saved_at": datetime.utcnow().isoformat()}


@router.post("/reset")
def reset_database(user: dict = Depends(require_roles(Role.DFO))):
    """Reset the database to clean seed state."""
    persistence.reset_storage()
    store.FOREST_ZONES = [dict(z) for z in store.DEFAULT_FOREST_ZONES]
    store.HISTORICAL_INCIDENTS = [dict(i) for i in store.DEFAULT_HISTORICAL_INCIDENTS]
    store.TIMBER_PERMITS = {k: dict(v) for k, v in store.DEFAULT_TIMBER_PERMITS.items()}
    store.VEHICLES = {k: dict(v) for k, v in store.DEFAULT_VEHICLES.items()}
    store.VEHICLE_POSITION_LOG.clear()
    store.CHANGE_POLYGONS.clear()
    store.ALERTS.clear()
    store.WATCH_HISTORY.clear()
    store.WATCH_LAST_RUN_AT = None

    store.seed_default_change_polygon()
    store.seed_demo_position_log()
    store.save_current_state()

    return {
        "status": "reset_successful",
        "message": "Persistent store re-seeded to default baseline state.",
    }
