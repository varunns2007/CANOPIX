// REST client for the PUSHPA FastAPI backend (see /backend).
//
// Supports live JWT Auth tokens, Role-Based Access Control, Persistent DB status,
// Telemetry streaming, Citizen Reporting, Real SMS Alerts, AIS-140 GPS Gateway,
// NTTS Permit Verification, and CCTNS Police Dispatches.

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8000";
const TIMEOUT_MS = 5000;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("pushpa_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers = {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
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

function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// --- Auth & RBAC ----------------------------------------------------------
export async function getProfileApi() {
  return request<{ user: any }>("/api/auth/me");
}

export async function switchRoleApi(roleId: string) {
  return post<{ access_token: string; token_type: string; user: any }>("/api/auth/switch-role", { role_id: roleId });
}

// --- Database & Persistence ------------------------------------------------
export async function getDatabaseStatus() {
  return request<any>("/api/database/status");
}

export async function resetDatabaseApi() {
  return post<any>("/api/database/reset");
}

// --- Public Citizen Reporting ----------------------------------------------
export async function submitCitizenReport(payload: {
  category: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  photo_base64?: string;
  reporter_phone?: string;
  is_anonymous: boolean;
}) {
  return post<any>("/api/reports/citizen", payload);
}

export async function listCitizenReports() {
  return request<{ count: number; reports: any[] }>("/api/reports/citizen");
}

// --- Real SMS Alert Dispatcher ---------------------------------------------
export async function sendSmsAlert(phoneNumber: string, message: string, priority = "CRITICAL") {
  return post<any>("/api/sms/send", { phone_number: phoneNumber, message, priority });
}

export async function getSmsLogs() {
  return request<{ count: number; logs: any[] }>("/api/sms/logs");
}

// --- AIS-140 GPS & FASTag Telemetry Ingestion Gateway ----------------------
export async function ingestAis140(packet: {
  imei: string;
  vehicle_registration: string;
  lat: number;
  lng: number;
  speed_kmh?: number;
  heading_deg?: number;
  ignition?: boolean;
  emergency_panic?: boolean;
  altitude_m?: number;
}) {
  return post<any>("/api/gateway/ais140", packet);
}

export async function ingestFastag(ping: {
  toll_plaza_id: string;
  toll_plaza_name: string;
  lane_id: string;
  vehicle_registration: string;
  tag_epc: string;
  gross_weight_kg?: number;
  declared_cargo?: string;
  lat?: number;
  lng?: number;
}) {
  return post<any>("/api/gateway/fastag", ping);
}

export async function getGatewayPackets() {
  return request<{ count: number; packets: any[] }>("/api/gateway/packets");
}

// --- Government Timber Permit Bridge (NTTS) -------------------------------
export async function verifyDigitalPermit(query: {
  permit_id?: string;
  vehicle_registration?: string;
  qr_payload?: string;
}) {
  return post<any>("/api/permits-bridge/verify", query);
}

export async function getPermitRegistryStats() {
  return request<any>("/api/permits-bridge/registry-stats");
}

// --- Actionable Police Interdiction & CCTNS Dispatch Gateway --------------
export async function dispatchCctnsOrder(req: {
  vehicle_id: string;
  incident_ref?: string;
  commanding_officer?: string;
  chokepoint_id?: string;
  action_type?: string;
}) {
  return post<any>("/api/cctns/dispatch-action-order", req);
}

export async function listCctnsOrders() {
  return request<{ count: number; orders: any[] }>("/api/cctns/orders");
}

// --- Health & Satellite Core -----------------------------------------------
export async function checkHealth() {
  return request<{ status: string; mode: string; storage?: any }>("/api/health");
}

export async function getForests() {
  return request<{ zones: any[] }>("/api/forests");
}

export async function getNdvi(zoneId: string, date?: string, severity?: number) {
  const q = new URLSearchParams({ zone_id: zoneId, ...(date ? { date } : {}), ...(severity !== undefined ? { severity: String(severity) } : {}) });
  return request<any>(`/api/satellite/ndvi?${q}`);
}

export async function compareNdvi(zoneId: string, beforeDate?: string, afterDate?: string, severity?: number) {
  const q = new URLSearchParams({
    zone_id: zoneId,
    ...(beforeDate ? { before_date: beforeDate } : {}),
    ...(afterDate ? { after_date: afterDate } : {}),
    ...(severity !== undefined ? { severity: String(severity) } : {}),
  });
  return request<any>(`/api/satellite/compare?${q}`);
}

export async function detectChanges(zoneId: string, beforeDate?: string, afterDate?: string, severity?: number) {
  return post<any>("/api/changes/detect", { zone_id: zoneId, before_date: beforeDate, after_date: afterDate, severity });
}

export async function listChanges() {
  return request<{ polygons: any[] }>("/api/changes");
}

export async function listVehicles() {
  return request<{ vehicles: any[] }>("/api/vehicles");
}

export async function simulateVehicleTick(vehicleId: string) {
  return post<any>(`/api/vehicles/${vehicleId}/simulate-tick`);
}

export async function listPermits() {
  return request<{ permits: any[] }>("/api/permits");
}

export async function getPermit(vehicleId: string) {
  return request<any>(`/api/permits/${vehicleId}`);
}

export async function listRisk() {
  return request<{ results: any[] }>("/api/risk");
}

export async function getRisk(vehicleId: string, dispatchAlert = false) {
  return request<any>(`/api/risk/${vehicleId}?dispatch_alert=${dispatchAlert}`);
}

export async function listAlerts() {
  return request<{ alerts: any[] }>("/api/alerts");
}

export async function listIncidents(zoneId?: string) {
  return request<{ incidents: any[] }>(`/api/incidents${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export async function runDemoScenario() {
  return post<any>("/api/demo/run-scenario");
}

export async function compareSatellitePlain(zoneId: string, beforeDate: string, afterDate: string) {
  const q = new URLSearchParams({ zone_id: zoneId, before_date: beforeDate, after_date: afterDate });
  return request<any>(`/api/satellite/compare?${q}`);
}

export async function getWatchStatus() {
  return request<any>("/api/watch/status");
}

export async function getWatchHistory(zoneId?: string) {
  return request<{ history: any[] }>(`/api/watch/history${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export function subscribeAlerts(onAlert: (alert: any) => void): () => void {
  try {
    const es = new EventSource(`${BASE_URL}/api/alerts/stream`);
    es.addEventListener("alert", (e: MessageEvent) => {
      try {
        onAlert(JSON.parse(e.data));
      } catch {
        /* ignore */
      }
    });
    return () => es.close();
  } catch {
    return () => {};
  }
}

export function subscribeTelemetryStream(onData: (data: any) => void): () => void {
  try {
    const es = new EventSource(`${BASE_URL}/api/stream/telemetry`);
    es.onmessage = (e: MessageEvent) => {
      try {
        onData(JSON.parse(e.data));
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  } catch {
    return () => {};
  }
}

// --- Multi-Agent AI Interdiction & Police Dispatch ------------------------
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
  return post<any>("/api/telemetry/ingest", payload);
}

export async function getPoliceDispatchLogs() {
  return request<{ count: number; dispatches: any[] }>("/api/police-stations/dispatch-log");
}

export async function getPoliceStations() {
  return request<{ count: number; police_stations: any[]; strategic_chokepoints: any[] }>("/api/police-stations/list");
}

export async function listPoliceStations(zoneId?: string) {
  return request<{ stations: any[] }>(`/api/police-stations${zoneId ? `?zone_id=${zoneId}` : ""}`);
}

export async function nearbyPoliceStations(lat: number, lng: number, limit = 3) {
  const q = new URLSearchParams({ lat: String(lat), lng: String(lng), limit: String(limit) });
  return request<{ stations: any[] }>(`/api/police-stations/nearby?${q}`);
}

export async function policeDispatchLog(limit = 50) {
  return request<{ dispatches: any[] }>(`/api/police-stations/dispatch-log?limit=${limit}`);
}

export async function getConvoySignatures() {
  return request<{ signatures: any[] }>("/api/convoy/signatures");
}

export async function getVehicleHistory(vehicleId: string) {
  return request<{ vehicle_id: string; history: any[] }>(`/api/vehicles/${vehicleId}/history`);
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
  submitCitizenReport,
  listCitizenReports,
  sendSmsAlert,
  getSmsLogs,
  ingestAis140,
  ingestFastag,
  getGatewayPackets,
  verifyDigitalPermit,
  getPermitRegistryStats,
  dispatchCctnsOrder,
  listCctnsOrders,
};
