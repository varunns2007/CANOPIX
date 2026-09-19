# API Reference & curl Examples

See the main [README](../README.md) for setup, and [AGENTS.md](./AGENTS.md)
for how the multi-agent pipeline these endpoints trigger actually works.

Base URL for a local run: `http://localhost:8000`

## Auth

Most read endpoints work unauthenticated (as the read-mostly `GUEST` role).
Elevated actions require a JWT from `/api/auth/switch-role`, which itself
requires the shared demo password (see `backend/.env.example`,
`PUSHPA_DEMO_PASSWORD`).

```bash
curl -X POST "http://localhost:8000/api/auth/switch-role" \
     -H "Content-Type: application/json" \
     -d '{"role_id": "DFO", "password": "pushpa-demo"}'
```

Use the returned `access_token` as a Bearer token on subsequent requests:

```bash
curl "http://localhost:8000/api/auth/me" \
     -H "Authorization: Bearer <token>"
```

## 1. Ingest vehicle telemetry (Multi-Agent Interdiction Pipeline)

```bash
curl -X POST "http://localhost:8000/api/telemetry/ingest" \
     -H "Content-Type: application/json" \
     -d '{
       "vehicle_id": "TN43E9912",
       "timestamp": "2026-09-12T02:30:00Z",
       "lat": 11.4085,
       "lng": 76.6965,
       "heading_deg": 212.0,
       "speed_kmh": 38.0,
       "cargo_weight_kg": 7500.0,
       "declared_species": "Red Sanders",
       "source": "FASTAG_TOLL_PING"
     }'
```

**Response (processed in well under 50ms):**
```json
{
  "status": "PROCESSED",
  "vehicle_id": "TN43E9912",
  "risk_score": 85,
  "rating": "CRITICAL",
  "permit_status": "UNPERMITTED",
  "convoy_detected": false,
  "risk_factors": [
    {
      "factor": "Unpermitted Vehicle",
      "points": 25,
      "explanation": "No valid digital transit permit on file in the state registry."
    },
    {
      "factor": "Off-Route Dirt Track",
      "points": 15,
      "explanation": "Vehicle is 4.00km off gazetted highway transit corridors on an unmonitored interior track."
    },
    {
      "factor": "Nocturnal Transit",
      "points": 30,
      "explanation": "Vehicle operating during restricted dead-of-night curfew hours (02:00 UTC)."
    }
  ],
  "target_chokepoint": {
    "name": "Naduvattam Toll-Barrier Bottleneck",
    "road_name": "NH-67 Ooty-Gudalur Highway",
    "lat": 11.4789,
    "lng": 76.5478,
    "smuggler_eta_mins": 31.6,
    "police_eta_mins": 1.5,
    "safety_margin_mins": 30.1,
    "feasibility": "OPTIMAL_INTERCEPT"
  },
  "assigned_police_station": {
    "station_name": "Naduvattam Police Outpost",
    "phone": "+91-423-274100",
    "jurisdiction_code": "TN-NIL-NDV-05",
    "lat": 11.4789,
    "lng": 76.5478,
    "distance_to_chokepoint_km": 0.0
  },
  "dispatch_status": "SENT",
  "dispatch_payload": null,
  "execution_time_ms": 12.4,
  "processed_at": "2026-09-12T02:30:00.104Z"
}
```

Note: `assigned_police_station` here comes from a different dataset
(`app/agents/routing.py`, `station_name` / `jurisdiction_code`) than the
`/api/police-stations` endpoints below (`app/police/stations.py`, `name` /
`jurisdiction`) -- the two subsystems were built independently. See the
comment on `RegionalPoliceStation` in `src/api/types.ts` for the frontend
side of this.

## 2. Inspect emergency police dispatches

```bash
curl "http://localhost:8000/api/police-stations/dispatch-log"
```

## 3. Nearby police stations for an arbitrary point

```bash
curl "http://localhost:8000/api/police-stations/nearby?lat=11.40&lng=76.70&limit=3"
```

## 4. Satellite change detection & NDVI compare

```bash
curl "http://localhost:8000/api/satellite/compare?zone_id=ZONE-B&before_date=2026-01-01&after_date=2026-06-01&severity=0.55"
```

Add `USE_LIVE_SATELLITE=1` in `backend/.env` to pull real Sentinel-2 imagery
via Microsoft Planetary Computer instead of synthetic demo data -- see the
main README's "Real data later" section.

## 5. Risk score for a vehicle

```bash
curl "http://localhost:8000/api/risk/TN43E9912?dispatch_alert=false"
```

## 6. Run the full 10-step demo scenario end-to-end

```bash
curl -X POST "http://localhost:8000/api/demo/run-scenario"
```

## 7. Run automated tests

```bash
cd backend
python -m pytest tests/test_risk_engine.py -v          # risk scoring unit tests
python -m pytest tests/test_interdiction_agents.py -v  # agent pipeline integration tests
```

## Full endpoint list

Once the backend is running, the interactive OpenAPI docs are available at
`http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc`
-- both generated live from the FastAPI route definitions, so they're
always in sync with the actual code, unlike a hand-maintained list here.
