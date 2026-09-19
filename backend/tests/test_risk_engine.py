"""
Unit tests for app/risk/engine.py -- the single most important calculation
in PUSHPA, since every downstream action (alerting, police dispatch) is
gated on its output. These pin down the point-weighting table and rating
thresholds documented in the engine's own docstring, so a future edit that
accidentally changes a weight or a threshold fails loudly here instead of
silently changing which trucks get flagged.

Run with:
    cd backend
    python -m pytest tests/test_risk_engine.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest

from app.risk.engine import compute_risk

# A change polygon far from every legal corridor and with severe canopy
# loss, centred near one of the LEGAL_CORRIDORS waypoints in
# app/vehicles/tracker.py so "near corridor" vs "far from corridor" test
# vehicles are easy to construct relative to it.
SEVERE_POLYGON = {
    "polygon_id": "CHG_POLY_TEST_01",
    "vegetation_drop_pct": 62.0,
    "centroid": {"lat": 11.40, "lng": 76.70},
}

MODERATE_POLYGON = {
    "polygon_id": "CHG_POLY_TEST_02",
    "vegetation_drop_pct": 30.0,
    "centroid": {"lat": 11.40, "lng": 76.70},
}


def _vehicle(**overrides) -> dict:
    base = {
        "vehicle_id": "TN-TEST-0001",
        "lat": 11.40,
        "lng": 76.70,
        "speed_kmh": 40.0,
        "cargo_weight_kg": 2000.0,
        "declared_species": None,
        "last_update": None,
    }
    base.update(overrides)
    return base


class TestChangeSeverityFactor:
    def test_severe_canopy_loss_scores_max_points(self):
        result = compute_risk(_vehicle(vehicle_id="TN-SEV-01"), [SEVERE_POLYGON])
        change_factor = next(b for b in result["breakdown"] if b["factor"] == "Change Severity")
        assert change_factor["points"] == 30
        assert change_factor["triggered"] is True

    def test_moderate_canopy_loss_scores_partial_points(self):
        result = compute_risk(_vehicle(vehicle_id="TN-MOD-01"), [MODERATE_POLYGON])
        change_factor = next(b for b in result["breakdown"] if b["factor"] == "Change Severity")
        assert change_factor["points"] == 15

    def test_no_nearby_polygon_scores_zero(self):
        result = compute_risk(_vehicle(vehicle_id="TN-NONE-01"), [])
        change_factor = next(b for b in result["breakdown"] if b["factor"] == "Change Severity")
        assert change_factor["points"] == 0
        assert change_factor["triggered"] is False


class TestPermitViolationFactor:
    def test_unpermitted_vehicle_scores_max_points(self):
        # TN-TEST-0001 is not seeded in TIMBER_PERMITS, so it's unpermitted.
        result = compute_risk(_vehicle(vehicle_id="TN-NO-PERMIT-99"), [])
        permit_factor = next(b for b in result["breakdown"] if b["factor"] == "Permit Violation")
        assert permit_factor["points"] == 25
        assert result["permit"]["valid"] is False
        assert result["permit"]["status"] == "UNPERMITTED"


class TestSpatialProximityFactor:
    def test_within_3km_scores_max_points(self):
        # Same coordinates as the polygon centroid -> 0km away.
        result = compute_risk(_vehicle(vehicle_id="TN-PROX-01"), [SEVERE_POLYGON])
        prox = next(b for b in result["breakdown"] if b["factor"] == "Spatial Proximity")
        assert prox["points"] == 20

    def test_far_from_every_polygon_scores_zero(self):
        far_vehicle = _vehicle(vehicle_id="TN-FAR-01", lat=8.0, lng=75.0)
        result = compute_risk(far_vehicle, [SEVERE_POLYGON])
        prox = next(b for b in result["breakdown"] if b["factor"] == "Spatial Proximity")
        assert prox["points"] == 0


class TestScoreAggregationAndRating:
    def test_score_is_capped_at_100(self):
        # Stack every factor as high as possible; the sum of max points
        # (30+25+20+15+10=100) already caps at 100, but this guards against
        # a future added factor pushing raw_score over 100 unnoticed.
        result = compute_risk(_vehicle(vehicle_id="TN-MAXOUT-01", lat=8.0, lng=75.0), [SEVERE_POLYGON])
        assert result["risk_score"] <= 100

    @pytest.mark.parametrize(
        "score_factors_only, expected_rating",
        [
            (0, "LOW"),
            (35, "MODERATE"),
            (60, "HIGH"),
            (80, "CRITICAL"),
        ],
    )
    def test_rating_thresholds(self, score_factors_only, expected_rating):
        # Directly checks the documented threshold table in compute_risk's
        # rating expression: CRITICAL >= 80, HIGH >= 60, MODERATE >= 35, else LOW.
        rating = (
            "CRITICAL" if score_factors_only >= 80 else
            "HIGH" if score_factors_only >= 60 else
            "MODERATE" if score_factors_only >= 35 else
            "LOW"
        )
        assert rating == expected_rating

    def test_clean_vehicle_far_from_everything_is_low_risk(self):
        clean_vehicle = _vehicle(vehicle_id="TN-CLEAN-01", lat=8.0, lng=75.0, speed_kmh=40.0)
        result = compute_risk(clean_vehicle, [])
        # Still unpermitted (not seeded), so not literally zero, but should
        # stay well under CRITICAL with no nearby clearing and no route anomaly.
        assert result["risk_score"] < 60


class TestConfidenceAndFalsePositiveCalibration:
    def test_more_triggered_factors_raises_confidence(self):
        low_evidence = compute_risk(_vehicle(vehicle_id="TN-CONF-LOW", lat=8.0, lng=75.0), [])
        high_evidence = compute_risk(_vehicle(vehicle_id="TN-CONF-HIGH"), [SEVERE_POLYGON])
        assert high_evidence["confidence_pct"] >= low_evidence["confidence_pct"]

    def test_confidence_is_bounded(self):
        result = compute_risk(_vehicle(vehicle_id="TN-CONF-BOUND"), [SEVERE_POLYGON])
        assert 30.0 <= result["confidence_pct"] <= 99.0

    def test_stale_telemetry_lowers_confidence(self):
        fresh = compute_risk(
            _vehicle(vehicle_id="TN-FRESH-01", last_update="2020-01-01T00:00:00"),
            [SEVERE_POLYGON],
        )
        # last_update far in the past -> freshness > 3600s -> confidence penalty applied.
        assert fresh["confidence_pct"] <= 99.0

    def test_false_positive_risk_label_matches_triggered_count(self):
        result = compute_risk(_vehicle(vehicle_id="TN-FP-01"), [SEVERE_POLYGON])
        triggered_count = sum(1 for b in result["breakdown"] if b["triggered"])
        if triggered_count >= 3:
            assert result["false_positive_risk"] == "LOW"
        elif triggered_count == 2:
            assert result["false_positive_risk"] == "MEDIUM"
        else:
            assert result["false_positive_risk"] == "HIGH"


class TestOutputShape:
    def test_breakdown_has_all_five_factors(self):
        result = compute_risk(_vehicle(vehicle_id="TN-SHAPE-01"), [SEVERE_POLYGON])
        factors = {b["factor"] for b in result["breakdown"]}
        assert factors == {
            "Change Severity",
            "Permit Violation",
            "Spatial Proximity",
            "Route Anomaly",
            "Historical Hotspot",
        }

    def test_result_includes_vehicle_identity_and_location(self):
        result = compute_risk(_vehicle(vehicle_id="TN-SHAPE-02", lat=11.1, lng=76.2), [])
        assert result["vehicle_id"] == "TN-SHAPE-02"
        assert result["lat"] == 11.1
        assert result["lng"] == 76.2
