// Type definitions mirroring the FastAPI backend's response shapes
// (see backend/app/risk/engine.py, vehicles/tracker.py, permits/registry.py,
// database/store.py, police/*, and the Pydantic models under backend/app/api/).
//
// These replace the `any` types that used to flow straight through
// src/api/client.ts. They're hand-mirrored rather than codegen'd from the
// OpenAPI schema, so if a backend field changes shape, update it here too --
// but that's still far better than no compile-time check at all.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoleProfile {
  role_id: string;
  name: string;
  badge: string;
  jurisdiction: string;
  clearance_level: string;
  permissions: string[];
}

export interface AuthUser extends RoleProfile {
  sub?: string;
  role?: string;
  exp?: number;
}

export interface SwitchRoleResponse {
  access_token: string;
  token_type: string;
  user: RoleProfile;
}

export interface HealthStatus {
  status: string;
  mode: "LIVE" | "DEMO";
  watch_enabled: boolean;
  storage?: {
    type: string;
    persisted: boolean;
    vehicles_count: number;
    alerts_count: number;
  };
}

export interface ForestZone {
  id: string;
  name: string;
  center: LatLng;
  area_ha: number;
}

export interface ChangePolygon {
  polygon_id: string;
  zone_id?: string;
  centroid: LatLng;
  area_ha?: number;
  vegetation_drop_pct: number;
  detected_at?: string;
}

export interface Vehicle {
  vehicle_id: string;
  lat: number;
  lng: number;
  heading_deg?: number;
  speed_kmh?: number;
  cargo_weight_kg?: number;
  declared_species?: string | null;
  origin?: string;
  destination?: string;
  last_update?: string;
}

export interface PermitRecord {
  vehicle_id: string;
  permit_id?: string | null;
  holder?: string | null;
  authorized_species?: string | null;
  approved_route?: string | null;
  expiry?: string | null;
  status: "VALID" | "UNPERMITTED" | "EXPIRED" | "SPECIES_MISMATCH" | "OVERWEIGHT" | "ROUTE_MISMATCH";
  valid: boolean;
  reason: string;
}

export interface RiskFactorBreakdown {
  factor: string;
  points: number;
  max_points: number;
  triggered: boolean;
  detail: string;
}

export interface VehicleAnalysis {
  vehicle_id: string;
  nearest_change_polygon: string | null;
  distance_to_change_km: number | null;
  distance_to_legal_corridor_km: number;
  flags: string[];
}

export interface RiskResult {
  vehicle_id: string;
  risk_score: number;
  rating: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence_pct: number;
  margin_of_error_pct: number;
  false_positive_risk: "LOW" | "MEDIUM" | "HIGH";
  breakdown: RiskFactorBreakdown[];
  vehicle_analysis: VehicleAnalysis;
  permit: PermitRecord;
  nearest_polygon: ChangePolygon | null;
  lat: number;
  lng: number;
  notified_stations?: PoliceStation[];
}

export interface Alert {
  alert_id: string;
  vehicle_id?: string | null;
  vehicles_involved?: string[];
  zone_id?: string;
  zone_name?: string;
  risk_score?: number | null;
  rating: string;
  headline?: string;
  polygon_id?: string | null;
  created_at: string;
  kind?: string;
  notified_stations?: DispatchedStation[];
}

export interface Incident {
  id: string;
  zone_id: string;
  lat: number;
  lng: number;
  date: string;
  species: string;
  seizure_kg: number;
}

export interface PoliceStation {
  station_name: string;
  phone: string;
  jurisdiction_code: string;
  lat: number;
  lng: number;
  distance_to_chokepoint_km?: number;
  distance_km?: number;
}

// The subset of RegionalPoliceStation fields present specifically inside
// an Alert's notified_stations (always carries the computed distance and
// dispatch record, unlike a bare /api/police-stations listing).
export interface DispatchedStation extends RegionalPoliceStation {
  distance_km: number;
  dispatch: { alert_id: string; sent_at: string; [key: string]: unknown };
}
// /api/police-stations/nearby, and an alert's notified_stations) --
// a *different* dataset from PoliceStation above (agents/routing.py,
// used by /api/police-stations/list and telemetry ingest), with its own
// field names (`name` not `station_name`, `jurisdiction` not
// `jurisdiction_code`). The two subsystems were built independently and
// were never reconciled onto one shared shape -- this type documents
// that split rather than papering over it.
export interface RegionalPoliceStation {
  station_id: string;
  name: string;
  jurisdiction: string;
  district: string;
  zone_id: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  distance_km?: number;
  dispatch?: { alert_id: string; sent_at: string; [key: string]: unknown };
}

export interface Chokepoint {
  name: string;
  road_name: string;
  lat: number;
  lng: number;
  smuggler_eta_mins: number;
  police_eta_mins: number;
  safety_margin_mins: number;
  feasibility: string;
}

export interface TelemetryIngestResponse {
  status: string;
  vehicle_id: string;
  risk_score: number;
  rating: string;
  permit_status: string | null;
  convoy_detected: boolean;
  risk_factors: { factor: string; points: number; explanation: string }[];
  target_chokepoint: Chokepoint | null;
  assigned_police_station: PoliceStation | null;
  dispatch_status: string;
  dispatch_payload: string | null;
  execution_time_ms: number;
  processed_at: string;
}

export interface PoliceDispatchLogEntry {
  dispatch_id?: string;
  vehicle_id?: string;
  station_name?: string;
  dispatched_at?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ConvoySignature {
  signature_id?: string;
  convoy_score: number;
  pattern: "REPEAT_VISITOR" | "CONVOY_SIGNATURE" | string;
  vehicle_ids: string[];
  evidence: string[];
  detected_at?: string;
}

export interface WatchStatus {
  enabled: boolean;
  interval_hours: number;
  last_run_at?: string | null;
  next_run_at?: string | null;
}

export interface WatchHistoryEntry {
  zone_id: string;
  checked_at: string;
  canopy_drop_pct: number;
  alert_fired: boolean;
}

export interface DatabaseStatus {
  storage_type: string;
  persisted: boolean;
  vehicles_count: number;
  alerts_count: number;
  [key: string]: unknown;
}

export interface DemoScenarioStep {
  step: number;
  title: string;
  detail: string;
  data?: unknown;
}

export interface DemoScenarioResult {
  scenario: string;
  zone_id: string;
  vehicle_id: string;
  steps: DemoScenarioStep[];
  final_risk_score: number;
  final_rating: string;
}

export interface PlainLanguageExplanation {
  headline: string;
  severity_word: string;
  recommended_action: string;
  area_lost_ha: number;
  area_lost_plain: string;
  what_the_colors_mean: string;
  species_note: string | null;
  confidence_caveat: string;
  data_source_note: string;
}

export interface SatelliteSourceMeta {
  source: "synthetic" | "live" | "live_unavailable_fallback";
  preview_url?: string;
  [key: string]: unknown;
}

export interface SatellitePassResult {
  date: string;
  canopy_density_pct?: number;
  source: SatelliteSourceMeta;
  [key: string]: unknown;
}

export interface NdviCompareResult {
  zone_id: string;
  before: SatellitePassResult;
  after: SatellitePassResult;
  plain_language: PlainLanguageExplanation;
  [key: string]: unknown;
}
