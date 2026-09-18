"""
Sentinel-2 Satellite Client with Live Planetary Computer & Synthetic Fallback.

Supports real European Space Agency (ESA) Copernicus Sentinel-2 L2A STAC queries
via Microsoft Planetary Computer, extracting true B04/B08 reflectance bands and true-color
optical preview photographs.
"""
from __future__ import annotations

import hashlib
import os

import numpy as np

from app.satellite.live_client import LiveFetchUnavailable, fetch_bands_live

GRID_SIZE = 64

# Default to Live Satellite (with graceful fallback if offline or cloudy)
USE_LIVE_SATELLITE = os.getenv("USE_LIVE_SATELLITE", "1") == "1"


def _seeded_rng(seed_key: str) -> np.random.Generator:
    digest = hashlib.sha256(seed_key.encode()).digest()
    seed = int.from_bytes(digest[:8], "big")
    return np.random.default_rng(seed)


def fetch_bands(zone_id: str, observation_date: str, clearing_severity: float = 0.0) -> dict[str, np.ndarray]:
    rng = _seeded_rng(f"{zone_id}:{observation_date}")

    base_nir = rng.normal(0.55, 0.05, size=(GRID_SIZE, GRID_SIZE)).clip(0.05, 0.95)
    base_red = rng.normal(0.09, 0.02, size=(GRID_SIZE, GRID_SIZE)).clip(0.01, 0.6)

    if clearing_severity > 0:
        cy, cx = GRID_SIZE // 2 + rng.integers(-6, 6), GRID_SIZE // 2 + rng.integers(-6, 6)
        yy, xx = np.ogrid[:GRID_SIZE, :GRID_SIZE]
        radius = 6 + clearing_severity * 8
        mask = (yy - cy) ** 2 + (xx - cx) ** 2 <= radius**2
        base_nir[mask] -= clearing_severity * 0.42
        base_red[mask] += clearing_severity * 0.28
        base_nir = base_nir.clip(0.02, 0.95)
        base_red = base_red.clip(0.01, 0.9)

    return {"B04": base_red.astype(np.float32), "B08": base_nir.astype(np.float32)}


def fetch_bands_for_zone(
    zone: dict,
    observation_date: str,
    clearing_severity: float = 0.0,
    force_live: bool | None = None,
) -> tuple[dict[str, np.ndarray], dict]:
    """
    Fetch satellite reflectance bands for a forest zone.
    When live mode is enabled (default), queries real Sentinel-2 passes via Microsoft Planetary Computer.
    """
    zone_id = zone["id"]
    lat, lng = zone["center"]["lat"], zone["center"]["lng"]
    use_live = force_live if force_live is not None else USE_LIVE_SATELLITE

    if not use_live:
        bands = fetch_bands(zone_id, observation_date, clearing_severity=clearing_severity)
        return bands, {
            "source": "synthetic",
            "observation_date_requested": observation_date,
            "observation_date_actual": observation_date,
            "platform": "Copernicus Sentinel-2 (High-Res Simulation)",
        }

    try:
        bands, scene = fetch_bands_live(lat, lng, observation_date, GRID_SIZE)
        return bands, {
            "source": "live",
            "observation_date_requested": observation_date,
            "observation_date_actual": scene.observed_date,
            "cloud_cover_pct": scene.cloud_cover,
            "scene_id": scene.item_id,
            "preview_url": scene.preview_href,
            "platform": "Copernicus Sentinel-2 L2A (Live Planetary Computer)",
        }
    except Exception as exc:
        bands = fetch_bands(zone_id, observation_date, clearing_severity=clearing_severity)
        return bands, {
            "source": "live_unavailable_fallback",
            "observation_date_requested": observation_date,
            "observation_date_actual": observation_date,
            "fallback_reason": str(exc),
            "platform": "Copernicus Sentinel-2 (Calibrated Fallback)",
        }
