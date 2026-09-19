"""
Disk-backed persistence manager for PUSHPA.

Saves and loads all intelligence store state (vehicles, permits, change polygons,
alerts, watch history, position logs) to JSON so state survives backend restarts.
Also provides spatial indexing and geometry calculation helpers.
"""
from __future__ import annotations

import json
import math
import os
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
STORAGE_FILE = DATA_DIR / "pushpa_store.json"


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def calculate_haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in km."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def is_point_in_polygon(lat: float, lng: float, polygon_coords: list[tuple[float, float]]) -> bool:
    """Ray casting point-in-polygon algorithm."""
    n = len(polygon_coords)
    if n < 3:
        return False
    inside = False
    p1x, p1y = polygon_coords[0]
    for i in range(n + 1):
        p2x, p2y = polygon_coords[i % n]
        if min(p1y, p2y) < lng <= max(p1y, p2y):
            if lat <= max(p1x, p2x):
                if p1y != p2y:
                    xinters = (lng - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lat <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


class PersistenceEngine:
    """Disk-backed JSON persistence.

    A process-wide lock serializes save/load/reset so a background
    watch-cycle alert and an incoming vehicle telemetry tick firing at
    the same moment can't race each other's writes. Writes are also
    atomic (write-to-temp + os.replace), so a reader never sees a
    half-written file even without the lock -- the lock's job is to
    stop two writers from clobbering each other.
    """

    def __init__(self, filepath: Path = STORAGE_FILE):
        self.filepath = filepath
        self._lock = threading.Lock()
        ensure_data_dir()

    def save_state(self, state: dict[str, Any]) -> bool:
        """Atomic, lock-serialized write of store state to disk."""
        with self._lock:
            try:
                ensure_data_dir()
                tmp_file = self.filepath.with_suffix(f".tmp-{os.getpid()}-{threading.get_ident()}")
                payload = {
                    "_metadata": {
                        "version": "1.0",
                        "saved_at": datetime.utcnow().isoformat(),
                    },
                    "data": state,
                }
                with open(tmp_file, "w", encoding="utf-8") as f:
                    json.dump(payload, f, indent=2)
                os.replace(tmp_file, self.filepath)
                return True
            except Exception as exc:
                print(f"[PERSISTENCE ERROR] Failed to save store: {exc}")
                return False

    def load_state(self) -> dict[str, Any] | None:
        """Lock-serialized load of state from disk, if it exists."""
        with self._lock:
            if not self.filepath.exists():
                return None
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("data")
            except Exception as exc:
                print(f"[PERSISTENCE ERROR] Failed to load store from {self.filepath}: {exc}")
                return None

    def reset_storage(self) -> bool:
        """Delete storage file to trigger clean re-seeding."""
        with self._lock:
            try:
                if self.filepath.exists():
                    self.filepath.unlink()
                return True
            except Exception as exc:
                print(f"[PERSISTENCE ERROR] Failed to reset store: {exc}")
                return False


persistence = PersistenceEngine()
