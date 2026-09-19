// REST client for the PUSHPA FastAPI backend (see /backend).
//
// Supports live JWT Auth tokens, Role-Based Access Control, Persistent DB status,
// Telemetry streaming, and soft fallbacks to bundled data in src/data/mockData.ts.
//
// Response shapes are typed (see ./types.ts) instead of `any`, mirrored by hand
// from the backend's Pydantic models -- catches shape drift at compile time
// instead of a silent runtime `undefined` deep in a component.

import type {
  Alert,
  AuthUser,
  ChangePolygon,
  ConvoySignature,
  DatabaseStatus,
  DemoScenarioResult,
  ForestZone,
  HealthStatus,
  Incident,
  NdviCompareResult,
  PermitRecord,
  PoliceDispatchLogEntry,
  PoliceStation,
  RegionalPoliceStation,
  RiskResult,
  SwitchRoleResponse,
  TelemetryIngestResponse,
  Vehicle,
  WatchHistoryEntry,
  WatchStatus,
} from "./types";

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8000";

// Most endpoints are simple in-memory lookups and return in well under a
// second, but a couple (satellite NDVI compare, change detection) do real
// numeric work over a grid and can legitimately take longer, especially on
// a cold start. Give those a longer budget than everything else instead of
// a single one-size-fits-all timeout.
const DEFAULT_TIMEOUT_MS = 8000;
const LONG_TIMEOUT_MS = 20000;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("pushpa_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      ...getAuthHeaders(),
      ...init?.headers,
    };
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}

function post<T>(path: string, body?: unknown, timeoutMs?: number) {
  return request<T>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
    timeoutMs,
  );
}

// --- Auth & RBAC ------------------------------------------------------------
export async function getProfileApi() {
  return request<{ user: AuthUser }>("/api/auth/me");
}

/** Elevated roles (anything above GUEST) require the shared demo password --
 * see PUSHPA_DEMO_PASSWORD in backend/.env.example. */
export async function switchRoleApi(roleId: string, password: string = "") {
  return post<SwitchRoleResponse>("/api/auth/switch-role", { role_id: roleId, password });
}

// --- Database & Persistence -------------------------------------------------
export async function getDatabaseStatus() {
  return request<DatabaseStatus>("/api/database/status");
}

export async function resetDatabaseApi() {
  return post<{ status: string }>("/api/database/reset");
}

// --- Health & Zones ----------------------------------------------------------
export async function checkHealth() {
  return request<HealthStatus>("/api/health");
}

export async function getForests() {
  return request<{ zones: ForestZone[] }>("/api/forests");
}

export async function getNdvi(zoneId: string, date?: string, severity?: number) {
  const q = new URLSearchParams({ zone_id: zoneId, ...(date ? { date } : {}), ...(severity !== undefined ? { severity: String(severity) } : {}) });
  return request<NdviCompareResult>(`/api/satellite/ndvi?${q}`, undefined, LONG_TIMEOUT_MS);
}

export async function compareNdvi(zoneId: string, beforeDate?: string, afterDate?: string, severity?: number) {
  const q = new URLSearchParams({
    zone_id: zoneId,
    ...(beforeDate ? { before_date: beforeDate } : {}),
    ...(afterDate ? { after_date: afterDate } : {}),
    ...(severity !== undefined ? { severity: String(severity) } : {}),
  });
  return request<NdviCompareResult>(`/api/satellite/compare?${q}`, undefined, LONG_TIMEOUT_MS);
}

export async function detectChanges(zoneId: string, beforeDate?: string, afterDate?: string, severity?: number) {
  return post<{ polygons: ChangePolygon[] }>(
    "/api/changes/detect",
    { zone_id: zoneId, before_date: beforeDate, after_date: afterDate, severity },
    LONG_TIMEOUT_MS,
  );
}

export async function listChanges() {
  return request<{ polygons: ChangePolygon[] }>("/api/changes");
}

export async function listVehicles() {
  return request<{ vehicles: Vehicle[] }>("/api/vehicles");
}

export async function simulateVehicleTick(vehicleId: string) {
  return post<Vehicle>(`/api/vehicles/${vehicleId}/simulate-tick`);
}

export async function listPermits() {
  return request<{ permits: PermitRecord[] }>("/api/permits");
}

export async function getPermit(vehicleId: string) {
  return request<PermitRecord>(`/api/permits/${vehicleId}`);
}

export async function listRisk() {
  return request<{ results: RiskResult[] }>("/api/risk");
}

export async function getRisk(vehicleId: string, dispatchAlert = false) {
  return request<RiskResult>(`/api/risk/${vehicleId}?dispatch_alert=${dispatchAlert}`);
}

export async function listAlerts() {
  return request<{ alerts: Alert[] }>("/api/alerts");
}

export async function listIncidents(zoneId?: string) {
  return request<{ incidents: Incident[] }>(`/api/incidents${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export async function runDemoScenario() {
  return post<DemoScenarioResult>("/api/demo/run-scenario", undefined, LONG_TIMEOUT_MS);
}

export async function compareSatellitePlain(zoneId: string, beforeDate: string, afterDate: string) {
  const q = new URLSearchParams({ zone_id: zoneId, before_date: beforeDate, after_date: afterDate });
  return request<NdviCompareResult>(`/api/satellite/compare?${q}`, undefined, LONG_TIMEOUT_MS);
}

export async function getWatchStatus() {
  return request<WatchStatus>("/api/watch/status");
}

export async function getWatchHistory(zoneId?: string) {
  return request<{ history: WatchHistoryEntry[] }>(`/api/watch/history${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export function subscribeAlerts(onAlert: (alert: Alert) => void): () => void {
  try {
    const es = new EventSource(`${BASE_URL}/api/alerts/stream`);
    es.addEventListener("alert", (e: MessageEvent) => {
      try {
        onAlert(JSON.parse(e.data));
      } catch {
        /* ignore malformed event */
      }
    });
    return () => es.close();
  } catch {
    return () => {};
  }
}

export function subscribeTelemetryStream(onData: (data: Vehicle) => void): () => void {
  try {
    const es = new EventSource(`${BASE_URL}/api/stream/telemetry`);
    es.onmessage = (e: MessageEvent) => {
      try {
        onData(JSON.parse(e.data));
      } catch {
        /* ignore parse error */
      }
    };
    return () => es.close();
  } catch {
    return () => {};
  }
}

// --- Multi-Agent AI Interdiction & Police Dispatch --------------------------
export async function ingestTelemetry(payload: {
  vehicle_id: string;
  timestamp?: string;
  lat: number;
  lng: number;
  heading_deg?: number;
  speed_kmh?: number;
  cargo_weight_kg?: number;
  declared_species?: string;
  source?: string;
}) {
  return post<TelemetryIngestResponse>("/api/telemetry/ingest", payload);
}

export async function getPoliceDispatchLogs() {
  return request<{ count: number; dispatches: PoliceDispatchLogEntry[] }>("/api/police-stations/dispatch-log");
}

export async function getPoliceStations() {
  return request<{ count: number; police_stations: PoliceStation[]; strategic_chokepoints: unknown[] }>("/api/police-stations/list");
}

export async function listPoliceStations(zoneId?: string) {
  return request<{ stations: RegionalPoliceStation[] }>(`/api/police-stations${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export async function nearbyPoliceStations(lat: number, lng: number, limit = 3) {
  const q = new URLSearchParams({ lat: String(lat), lng: String(lng), limit: String(limit) });
  return request<{ stations: RegionalPoliceStation[] }>(`/api/police-stations/nearby?${q}`);
}

export async function policeDispatchLog(limit = 50) {
  return request<{ dispatches: PoliceDispatchLogEntry[] }>(`/api/police-stations/dispatch-log?limit=${limit}`);
}

export async function getConvoySignatures() {
  return request<{ signatures: ConvoySignature[] }>("/api/convoy/signatures");
}

export async function getVehicleHistory(vehicleId: string) {
  return request<{ vehicle_id: string; history: Vehicle[] }>(`/api/vehicles/${vehicleId}/history`);
}

export const api = {
  checkHealth,
  getForests,
  getNdvi,
  compareNdvi,
  detectChanges,
  listChanges,
  listVehicles,
  simulateVehicleTick,
  listPermits,
  getPermit,
  listRisk,
  getRisk,
  listAlerts,
  listIncidents,
  runDemoScenario,
  subscribeAlerts,
  subscribeTelemetryStream,
  compareSatellitePlain,
  getWatchStatus,
  getWatchHistory,
  ingestTelemetry,
  getPoliceDispatchLogs,
  getPoliceStations,
  listPoliceStations,
  nearbyPoliceStations,
  policeDispatchLog,
  getConvoySignatures,
  getVehicleHistory,
  getProfileApi,
  switchRoleApi,
  getDatabaseStatus,
  resetDatabaseApi,
};
