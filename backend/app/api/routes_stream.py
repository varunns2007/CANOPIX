from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.database import store

router = APIRouter(prefix="/api/stream", tags=["stream"])


async def telemetry_event_generator() -> AsyncGenerator[str, None]:
    """Generates periodic real-time telemetry ticks for connected command dashboards."""
    try:
        while True:
            # Gather current active snapshot
            snapshot = {
                "timestamp": datetime.utcnow().isoformat(),
                "vehicles_count": len(store.VEHICLES),
                "alerts_count": len(store.ALERTS),
                "polygons_count": len(store.CHANGE_POLYGONS),
                "recent_alerts": store.ALERTS[:3],
                "active_vehicles": [
                    {
                        "vehicle_id": v["vehicle_id"],
                        "lat": v.get("lat"),
                        "lng": v.get("lng"),
                        "speed_kmh": v.get("speed_kmh"),
                        "species": v.get("declared_species"),
                    }
                    for v in list(store.VEHICLES.values())[:5]
                ],
            }
            yield f"data: {json.dumps(snapshot)}\n\n"
            await asyncio.sleep(2.5)
    except asyncio.CancelledError:
        pass


@router.get("/telemetry")
async def stream_telemetry():
    """SSE endpoint streaming live vehicle telemetry & intelligence pings."""
    return StreamingResponse(
        telemetry_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
