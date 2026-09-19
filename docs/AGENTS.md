# Multi-Agent AI Interdiction Engine

This document covers the LangGraph agent pipeline in detail. See the main
[README](../README.md) for setup and the project overview.

## Feature summary

* **Real-Time Multi-Agent Interdiction Engine (LangGraph + Pydantic v2)**: Sub-second, event-driven multi-agent AI pipeline processing real-time vehicle GPS ticks, FASTag toll pings, and timber permit registries. Computes topological road interception bottlenecks (T_police < T_exit) and auto-dispatches tactical emergency dossiers to surrounding police stations.
* **Copernicus Sentinel-2 Data Pipeline**: Searches and ingests Sentinel-2 Level-2A imagery, processes B04 (Red) & B08 (Near Infrared) bands, applies SCL cloud/shadow masking, and calculates NDVI rasters (B08 - B04) / (B08 + B04).
* **Forest Density Analyzer**: Classifies pixels into Non-vegetation, Sparse, Moderate, and Dense vegetation tiers with configurable thresholds.
* **Before vs After NDVI Change Detection**: Computes vegetation decline deltas and extracts contiguous geographic polygons (CHG_POLY_001) with area (ha), centroids, and vegetation loss percentage.
* **Vehicle Intelligence & Telemetry**: Monitors timber vehicle GPS coordinates, speed, heading, origin, destination, and evaluates route proximity to forest clearing polygons.
* **Timber Permit Verification**: Checks legal transport authorization against the timber_permits registry.
* **Explainable AI Risk Engine**: Generates an Investigation Risk Score (0-100) with transparent contributing factor breakdowns (+30 Change severity, +25 Permit violation, +20 Spatial proximity, +15 Route anomaly, +10 Historical hotspot). See backend/app/risk/engine.py and its tests in backend/tests/test_risk_engine.py for the exact weight table.
* **3D Forest Density & Terrain View**: Three.js 3D terrain elevation surface rendering vegetation density textures and highlighting forest clearing depression zones.
* **GIS Command Dashboard**: Dark-mode interface with 12 toggleable map layers, live alert ticker, before/after comparison slider, and an Officer Investigation Panel.
* **PUSHPA DEMO INCIDENT**: Preconfigured 10-step hackathon demonstration executing the entire intelligence story end-to-end.

## Pipeline diagram

```text
[ Real-Time GPS / FASTag Ping ]
              |
              v
   +----------------------+
   |    Sentinel Agent    |  --> Verify Timber Permit & Highway Corridor Conformance
   +----------+-----------+
              |
              v
   +----------------------+
   |     Sleuth Agent     |  --> Night Curfew (22:00-05:00) & Convoy / Tandem Correlation
   +----------+-----------+
              |
       [ Risk Score >= 80 ? ]
         +-- NO  --> [ Routine Log / Skip Dispatch ]
         +-- YES -->
              |
              v
   +----------------------+
   |   Strategist Agent   |  --> Topological Road Dijkstra Routing (T_police < T_exit)
   +----------+-----------+
              |
              v
   +----------------------+
   |   Dispatcher Agent   |  --> Jinja2 Tactical Police Dossier & Automated Alert Dispatch
   +----------------------+
```

## 4 specialized agent roles

1. **Sentinel Agent (Ingestion & Registry)**: Cross-checks vehicle registration against the state timber permit registry and evaluates spatial conformance against gazetted highway buffers (500m tolerance).
2. **Sleuth Agent (Nocturnal & Convoy Engine)**: Checks timestamps against nocturnal curfew hours (22:00-05:00) and correlates nearby commercial vehicles to detect multi-vehicle timber cartels.
3. **Strategist Agent (Topological Road Interceptor)**: Activated on CRITICAL (>=80) risk. Replaces straight-line approximations with topological Dijkstra road network traversal, computing Smuggler Exit Time (T_exit) vs Police Response Time (T_police) across candidate chokepoints with a 3+ minute tactical safety headroom.
4. **Dispatcher Agent (Emergency Tactical Disseminator)**: Generates high-priority police dossiers containing exact roadblock coordinates, suspect descriptions, and XAI factor attribution, logging dispatches and broadcasting to the live SSE stream.

## Where the code lives

| Concern | File |
|---|---|
| Risk scoring weights & rating thresholds | backend/app/risk/engine.py |
| LangGraph pipeline wiring | backend/app/agents/graph.py |
| Agent node implementations | backend/app/agents/nodes.py |
| Road/chokepoint routing data | backend/app/agents/routing.py |
| Convoy correlation engine | backend/app/vehicles/convoy_correlation.py |
| Police dispatch (nearest-station lookup + notify) | backend/app/police/dispatch.py, backend/app/police/stations.py |
| Unit tests for the risk engine | backend/tests/test_risk_engine.py |
| Agent pipeline integration tests | backend/tests/test_interdiction_agents.py |

## Running the agent tests

```bash
cd backend
python -m pytest tests/test_risk_engine.py -v          # risk scoring unit tests
python -m pytest tests/test_interdiction_agents.py -v  # full pipeline integration tests
```

> **Known issue:** three tests in test_interdiction_agents.py currently fail
> because their fixture vehicle IDs (e.g. TN09CJ5521) don't match any
> record in the seeded TIMBER_PERMITS registry in
> backend/app/database/store.py -- they're always scored UNPERMITTED
> regardless of intent. This is a data/fixture mismatch, not a pipeline bug;
> fixing it means either adding matching permit records or updating the
> fixtures to use vehicle IDs that already exist in the registry.
