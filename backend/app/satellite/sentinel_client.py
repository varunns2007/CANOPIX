"""
Synthetic Sentinel-2 client.

This project does not ship real Copernicus Data Space Ecosystem credentials,
so this module generates plausible, deterministic-per-seed B04 (Red) and B08
(Near-Infrared) reflectance rasters instead of querying orbit. The output
shape and value ranges mimic Sentinel-2 Level-2A surface reflectance
(0.0-1.0 float, after the /10000 scale factor Sentinel-2 normally ships in),
so `ndvi.py` and everything downstream works unmodified against a real
client later — only this file needs to be replaced.

To wire in the real thing: implement `fetch_bands()` against the Copernicus
Data Space Ecosystem OData/STAC API using an `openeo` or `sentinelhub`
client authenticated via OAuth2, apply the Scene Classification Layer (SCL)
cloud/water mask, and return the same (band04, band08) tuple shape.
"""
from __future__ import annotations

import hashlib
import os

import numpy as np

from app.satellite.live_client import LiveFetchUnavailable, fetch_bands_live

GRID_SIZE = 64  # 64x64 synthetic tile, kept small for fast in-browser demo use

# Set USE_LIVE_SATELLITE=1 (see .env.example) to fetch real Sentinel-2
# imagery via Microsoft Planetary Computer instead of the synthetic
# generator below. Off by default so the app still runs with zero setup.
USE_LIVE_SATELLITE = os.getenv("USE_LIVE_SATELLITE", "0") == "1"


def _seeded_rng(seed_key: str) -> np.random.Generator:
    digest = hashlib.sha256(seed_key.encode()).digest()
    seed = int.from_bytes(digest[:8], "big")
    return np.random.default_rng(seed)


def fetch_bands(zone_id: str, observation_date: str, clearing_severity: float = 0.0) -> dict[str, np.ndarray]:
    """
    Return synthetic B04 (red) / B08 (NIR) reflectance rasters for a zone
    on a given observation date.

    `clearing_severity` (0.0-1.0) optionally depresses NIR / raises Red
    reflectance over a patch of the tile, simulating a canopy-loss event so
    that "before" vs "after" calls can demonstrate real NDVI change.
    """
    rng = _seeded_rng(f"{zone_id}:{observation_date}")

    # Healthy dense-canopy baseline: high NIR, moderate-low Red.
    base_nir = rng.normal(0.55, 0.05, size=(GRID_SIZE, GRID_SIZE)).clip(0.05, 0.95)
    base_red = rng.normal(0.09, 0.02, size=(GRID_SIZE, GRID_SIZE)).clip(0.01, 0.6)

    if clearing_severity > 0:
        # carve a contiguous "clearing" patch near the centre of the tile
        cy, cx = GRID_SIZE // 2 + rng.integers(-6, 6), GRID_SIZE // 2 + rng.integers(-6, 6)
        yy, xx = np.ogrid[:GRID_SIZE, :GRID_SIZE]
        radius = 6 + clearing_severity * 8
        mask = (yy - cy) ** 2 + (xx - cx) ** 2 <= radius**2
        base_nir[mask] -= clearing_severity * 0.42
        base_red[mask] += clearing_severity * 0.28
        base_nir = base_nir.clip(0.02, 0.95)
        base_red = base_red.clip(0.01, 0.9)

    return {"B04": base_red.astype(np.float32), "B08": base_nir.astype(np.float32)}


def fetch_bands_for_zone(zone: dict, observation_date: str, clearing_severity: float = 0.0) -> tuple[dict[str, np.ndarray], dict]:
    """
    The single entry point the API routes should call. Returns
    (bands, meta) where `meta` describes where the data actually came
    from — this is what lets the frontend / plain-language layer say
    "real satellite photo" vs "demo data" truthfully instead of assuming.

    Behaviour:
      - USE_LIVE_SATELLITE=0 (default): always synthetic, meta.source="synthetic".
      - USE_LIVE_SATELLITE=1: tries a real Sentinel-2 pass near
        observation_date via Planetary Computer. If no cloud-free pass
        exists nearby, or the network/library isn't available, it falls
        back to synthetic data rather than erroring out, and says so in
        meta.source="live_unavailable_fallback".
    """
    zone_id = zone["id"]
    lat, lng = zone["center"]["lat"], zone["center"]["lng"]

    if not USE_LIVE_SATELLITE:
        bands = fetch_bands(zone_id, observation_date, clearing_severity=clearing_severity)
        return bands, {
            "source": "synthetic",
            "observation_date_requested": observation_date,
            "observation_date_actual": observation_date,
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
        }
    except LiveFetchUnavailable as exc:
        bands = fetch_bands(zone_id, observation_date, clearing_severity=clearing_severity)
        return bands, {
            "source": "live_unavailable_fallback",
            "observation_date_requested": observation_date,
            "observation_date_actual": observation_date,
            "fallback_reason": str(exc),
        }
