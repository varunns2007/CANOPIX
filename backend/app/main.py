from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    interdiction,
    routes_alerts,
    routes_auth,
    routes_cctns,
    routes_changes,
    routes_citizen_reports,
    routes_convoy,
    routes_database,
    routes_demo,
    routes_forests,
    routes_permits,
    routes_permits_bridge,
    routes_police,
    routes_risk,
    routes_satellite,
    routes_sms,
    routes_stream,
    routes_telemetry_gateway,
    routes_vehicles,
    routes_watch,
)
from app.database import store
from app.database.persistence import STORAGE_FILE
from app.scheduler.watch import start_scheduler, stop_scheduler

app = FastAPI(
    title="PUSHPA Backend",
    description=(
        "Forest Intelligence & Anti-Smuggling API with Real Satellite Photos, "
        "Citizen Reporting, Real SMS Alerts, AIS-140/FASTag Telemetry, and CCTNS Police Dispatch."
    ),
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router)
app.include_router(routes_database.router)
app.include_router(routes_stream.router)
app.include_router(routes_citizen_reports.router)
app.include_router(routes_sms.router)
app.include_router(routes_telemetry_gateway.router)
app.include_router(routes_permits_bridge.router)
app.include_router(routes_cctns.router)
app.include_router(interdiction.router)
app.include_router(routes_forests.router)
app.include_router(routes_satellite.router)
app.include_router(routes_changes.router)
app.include_router(routes_vehicles.router)
app.include_router(routes_permits.router)
app.include_router(routes_risk.router)
app.include_router(routes_alerts.router)
app.include_router(routes_demo.router)
app.include_router(routes_watch.router)
app.include_router(routes_police.router)
app.include_router(routes_convoy.router)

_watch_enabled = os.getenv("WATCH_ENABLED", "1") == "1"


@app.on_event("startup")
def _on_startup():
    store.restore_state_from_disk()
    if _watch_enabled:
        start_scheduler()


@app.on_event("shutdown")
def _on_shutdown():
    store.save_current_state()
    if _watch_enabled:
        stop_scheduler()


@app.get("/api/health")
def health():
    live = os.getenv("USE_LIVE_SATELLITE", "1") == "1"
    return {
        "status": "ok",
        "mode": "LIVE" if live else "DEMO",
        "watch_enabled": _watch_enabled,
        "storage": {
            "type": "DISK_PERSISTENT_JSON",
            "persisted": STORAGE_FILE.exists(),
            "vehicles_count": len(store.VEHICLES),
            "alerts_count": len(store.ALERTS),
        },
    }
