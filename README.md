# CANOPIX — Pixel-Level Forest Intelligence & Autonomous Anti-Deforestation Defense System

> **"Pixel-level satellite analytics and autonomous multi-agent AI that detects canopy loss down to the hectare and dispatches tactical roadblock teams in real time."**

CANOPIX is a next-generation Earth-observation command center and multi-agent interdiction platform engineered to safeguard ecologically sensitive biosphere reserves (Seshachalam, Anamalai, Mudumalai, Sathyamangalam). It unifies Copernicus Sentinel-2 multispectral remote sensing, topological Dijkstra road network traversal, and an autonomous 4-tier LangGraph AI pipeline.

---

## Key Capabilities

* **Pixel-Level Change Detection**: Automated Sentinel-2 MSI ingestion (B04 Red + B08 NIR) with cloud masking and NDVI delta extraction.
* **Autonomous 4-Tier Multi-Agent Engine**: Sentinel, Sleuth, Strategist, and Dispatcher agents process real-time vehicle GPS ticks, FASTag toll pings, and timber permit registries in under 50ms.
* **Topological Road Interception**: Computes exact smuggler exit times vs police patrol response times ($T_{\text{police}} + 3\text{m} < T_{\text{exit}}$) to lock down optimal roadblock chokepoints.
* **Anti-Gravity Command Deck**: Floating detached data panes, 3D hover-depth resource optimization tables, and interactive gesture control nodes over natural-color orbital terrain.
* **Procedural 3D Canopy Simulation**: Three.js elevation meshes with real-time raycasting inspection of tree density and high-value species loss (Red Sanders, Rosewood).

**Full architecture, agent roles, and pipeline diagram: [docs/AGENTS.md](./docs/AGENTS.md)**

---

## Real-Time Telemetry Ingestion API

**Full API reference with curl examples: [docs/API.md](./docs/API.md)**

Quick example:
```bash
curl -X POST "http://localhost:8000/api/telemetry/ingest" \
     -H "Content-Type: application/json" \
     -d '{"vehicle_id": "TN43E9912", "lat": 11.4085, "lng": 76.6965, "speed_kmh": 38.0, "cargo_weight_kg": 7500.0, "declared_species": "Red Sanders", "source": "FASTAG_TOLL_PING"}'
```

Returns a risk score, rating, contributing factors, the optimal
interception chokepoint, and the nearest police station — see
[docs/API.md](./docs/API.md) for the full response shape and more
endpoints. Once the backend is running, interactive docs are also live at
`http://localhost:8000/docs`.

---

## Run it


```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Structure

The app is organized into **6 sections** (down from an earlier 15-page layout)
— related views live behind tabs inside one page instead of each getting its
own nav entry:

| Section | What's inside |
|---|---|
| **Overview** | Command-center summary, "Run Demo Incident Scenario" |
| **Forest Explorer** | Map View, 3D Forest, Tree Density — as tabs |
| **Satellite Compare** | Pick two dates, compare imagery, see what changed. Updates Forest Explorer's density view automatically. |
| **Threat Intel** | Hotspots, Risk Score, Vehicles, Permits, Past Incidents — as tabs |
| **Reports & Analytics** | Analytics, Reports — as tabs |
| **Settings** | Sound, region info, API config |

```
src/
  components/
    Intro/        cinematic boot + title-reveal sequence
    Cursor/        custom cursor + click ripple
    Layout/        sidebar, top bar, tab bar, animated page transitions
    HUD/           reusable corner-bracket/scanline frame
    Map/           procedural canvas+SVG "satellite" forest map + heatmap grid
    Widgets/       count-up numbers, small chart primitives
    Backend/       live-backend-vs-demo-data status badge
    Demo/          10-step demo scenario runner
  pages/           Overview, ForestExplorer, SatelliteCompare, ThreatIntel,
                   ReportsAnalytics, Settings (+ the individual screens each
                   of those renders as tabs, e.g. Hotspots.tsx, Forest3D.tsx)
  state/           ComparisonContext — shared before/after date-comparison
                   result, read by both Satellite Compare and Forest Explorer
  data/mockData.ts all demo data, isolated from UI components
  nav.ts           sidebar navigation config (6 items)
```

## Color theme

- **Green** — healthy forest / tree cover
- **Copper/amber** (`--color-value-*`) — a *dedicated* marker for missing
  high-value trees (Red Sanders, Rosewood, Teak). This is intentionally a
  different color from the general amber UI accent, so a field officer can
  tell "valuable species lost" apart from ordinary risk at a glance.
- **Ember red** (`--color-earth-*`) — general danger / critical alerts
- **Signal cyan** (`--color-signal-*`) — live telemetry / system status,
  used for "online" indicators so live data reads differently from nature
  colors

All of this lives in CSS custom properties in `src/index.css` — retheming
the whole app is a matter of editing values there, not hunting through
components.

## Realistic canopy rendering

Satellite Compare and Forest Explorer's Tree Density tab no longer render
tree cover as flat colored grid squares. `src/components/Map/ForestTextureCanvas.tsx`
scatters organic, gradient-blurred canopy blobs (density-weighted per
region) onto a canvas, closer to what a low-altitude aerial photo of
canopy actually looks like, with a winding river line for orientation and
pulsing copper diamond markers over the sparsest patches when a
high-value species loss is flagged.

## How the 3D forest connects to Satellite Compare

`src/state/ComparisonContext.tsx` holds the result of your last date
comparison (before/after tree cover, a loss-intensity grid, and whether a
high-value species was affected). Both **Forest Explorer's Tree Density
tab** and its **3D Forest tab** read from this same context, so running a
comparison on Satellite Compare immediately re-tints the heatmap and the
3D canopy colors to match — no page reload, no separate sync step.

In the 3D tab, click anywhere on the terrain to fly the camera in close and
see a readout of tree cover and canopy height for that exact spot; a
pulsing copper marker calls out patches with high-value species nearby.

## Real data later

Swap the contents of `src/data/mockData.ts` for calls into `src/services/`
(create this folder as needed) hitting the endpoints in `.env.example`:

```
VITE_SATELLITE_API_URL=
VITE_GOOGLE_MAPS_API_KEY=
VITE_BACKEND_URL=
```

None of these are required for the demo — the app runs entirely from
`mockData.ts` out of the box.

## Live tracking, instant alerts & police dispatch

Three additions on top of the base build, all backed by real (if
in-memory/demo-seeded) backend logic — not just UI:

### 1. Live Google Maps vehicle tracking

The **Vehicles** tab (Threat Intel → Vehicles) has a **Live Map (Google)**
toggle next to the existing zero-key tactical map. Set
`VITE_GOOGLE_MAPS_API_KEY` in `.env.local` (see the comment in
`.env.example` for how to get a free-tier key from Google Cloud Console —
takes about 5 minutes, no cost for normal hackathon-demo traffic) and
restart `npm run dev`. It renders every tracked vehicle by plate number on
a real basemap, polls the backend every few seconds so trucks visibly
move, overlays police-station markers and active clearing radii, and
shows a live alert feed fed by the same SSE stream as the rest of the app.
Without a key, it shows a clear placeholder instead of breaking — the
tactical map keeps working either way.

### 2. Instant alerting

This was already mostly built: `backend/app/scheduler/watch.py` re-checks
every forest zone on a timer (default 24h, configurable down to minutes
via `WATCH_INTERVAL_HOURS` for a live demo) and the moment a canopy drop
crosses `WATCH_ALERT_THRESHOLD_PCT`, it pushes an alert over Server-Sent
Events (`GET /api/alerts/stream`) — the frontend receives it with no
polling delay. `POST /api/watch/run-now` triggers an out-of-schedule check
on demand (wired to the "Run Demo Incident Scenario" button on Overview).

### 3. Nearest-police-station auto-dispatch (`backend/app/police/`)

Every alert — vehicle risk, satellite-watch clearing, or convoy signature
below — now looks up the nearest police stations to the incident
(`app/police/stations.py`, haversine distance against a seeded demo
station registry for the Western Ghats region) and "dispatches" to them
(`app/police/dispatch.py`) the instant the alert fires. Dispatch is
**simulated by default** — logged and returned as `notified_stations` on
the alert so the UI can show "🚓 Notified: Coonoor Rural PS (12.4 km)"
in real time — with a clearly marked extension point (`_send_live()`) for
wiring in real SMS/email once you have a transport and real station
contact details. See `GET /api/police-stations`,
`GET /api/police-stations/nearby`, `GET /api/police-stations/dispatch-log`.

### 4. Convoy Correlation Engine (`backend/app/vehicles/convoy_correlation.py`)

The genuinely novel piece: instead of scoring one vehicle or one clearing
in isolation, this correlates **across vehicles and time** against every
recent severe clearing to surface two patterns a snapshot view can't:

- **Repeat visitor** — the same vehicle passing the same fresh clearing
  more than once in the lookback window (one pass could be a patrol;
  three at night is a haul pattern).
- **Convoy signature** — two or more *different* vehicles near the same
  fresh clearing within a short time window of each other — the
  coordinated "swarm" pattern real timber-smuggling operations actually
  use, and exactly what per-vehicle risk scoring misses.

Both roll into an explainable 0–100 `convoy_score` with the evidence
attached. It runs automatically after every satellite watch cycle and
every vehicle telemetry tick, and pushes a `CONVOY_SIGNATURE`-kind alert
(through the same police-dispatch path above) the moment a HIGH/CRITICAL
pattern emerges. See it live under Threat Intel → **Police Dispatch**, or
on demand at `GET /api/convoy/signatures`.

## Backend (optional — the frontend works without it)

`/backend` is a FastAPI service implementing the full PUSHPA pipeline described
in the technical spec: synthetic Sentinel-2 NDVI, change-detection polygon
extraction, vehicle telemetry + route-anomaly flags, timber permit
verification, the weighted Explainable Risk Engine (0–100), an SSE alert
stream, and the built-in 10-step demo incident scenario.

It ships with **no real Copernicus/GPS/permit credentials** — everything is
synthetic or seeded demo data, clearly documented in `backend/app/database/store.py`
and `backend/app/satellite/sentinel_client.py`, so it runs immediately.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then, with the frontend's dev server also running, the new Satellite
Analysis / Timber Permits / Historical Incidents / Risk Analytics pages
(and the "Run Demo Incident Scenario" button on Overview) will show a
**LIVE BACKEND CONNECTED** badge and pull real computed data instead of
their bundled fallback numbers. If the backend isn't running, those same
pages fall back to demo data automatically — nothing breaks.

Interactive API docs: http://localhost:8000/docs once the backend is running.

To point the frontend at a different backend URL, set `VITE_BACKEND_URL` in
a `.env.local` file (see `.env.example`).

### Security notes for the backend

The backend ships in a demo-friendly configuration, but a couple of things
are worth knowing before running it anywhere beyond your own machine:

* **Copy `backend/.env.example` to `backend/.env`** and set `JWT_SECRET_KEY`
  to a real random value (a command to generate one is in the file). Without
  it, a random key is generated each process start — fine for a single demo
  session, but every restart invalidates existing sessions.
* Elevated roles (DFO, Police Commander, Range Guard, GIS Analyst) require
  the shared `PUSHPA_DEMO_PASSWORD` (default `pushpa-demo`) via
  `/api/auth/switch-role` — this is a minimum bar above no check at all, not
  real per-officer login. If you change it on the backend, also set
  `VITE_DEMO_PASSWORD` to match on the frontend (see `.env.example`).
* `ALLOWED_ORIGINS` in `backend/.env` controls which frontend origins the
  API accepts requests from (defaults to the local Vite dev server ports).

See `backend/.env.example` for the full list of configurable env vars,
including the satellite watch scheduler and police dispatch settings.

## Optional cinematic video intro

Drop a licensed video at `public/assets/intro.mp4` and wire it into
`CinematicIntro.tsx` if you'd rather use footage than the built-in
CSS/WebGL sequence. Without that file, the built-in animated intro
(particles, tree silhouettes, letter-by-letter title reveal) always runs —
this is the current default.

## PUSHPA launch targets

### Web / development
```powershell
npm.cmd install
npm.cmd run dev
```
Open http://localhost:5173.

### Windows desktop (Electron)
```powershell
npm.cmd install
npm.cmd run electron:dev
```
Production installer:
```powershell
npm.cmd run electron:build
```
The installer is written to `release/`.

### Android / mobile
Install Android Studio + Android SDK first, then:
```powershell
npm.cmd install
npx cap add android
npm.cmd run mobile:android
```
The existing responsive UI is reused; no separate mobile UI code is required.

## Satellite map

The Forest Map now uses real Esri World Imagery XYZ satellite tiles as its map surface, centered on the Anamalai Range / Western Ghats demo region. PUSHPA overlays forest boundaries, detected-change polygons, routes, vehicles and hotspot markers above the imagery. No Google Maps key is required for this primary map. The Google vehicle map remains available when `VITE_GOOGLE_MAPS_API_KEY` is configured and uses Google's satellite map type.

The map is an online imagery layer, so an internet connection is required for live satellite tiles. If imagery tiles fail, the intelligence overlays remain visible rather than showing a misleading synthetic forest texture.
