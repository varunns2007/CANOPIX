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
    def __init__(self, filepath: Path = STORAGE_FILE):
        self.filepath = filepath
        ensure_data_dir()

    def save_state(self, state: dict[str, Any]) -> bool:
        """Atomic write of store state to disk."""
        try:
            ensure_data_dir()
            tmp_file = self.filepath.with_suffix(".tmp")
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
        """Load state from disk if exists."""
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
        try:
            if self.filepath.exists():
                self.filepath.unlink()
            return True
        except Exception as exc:
            print(f"[PERSISTENCE ERROR] Failed to reset store: {exc}")
            return False


persistence = PersistenceEngine()
