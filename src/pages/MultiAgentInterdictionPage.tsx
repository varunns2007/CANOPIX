import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Bot,
  Cpu,
  Radio,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Navigation,
  PhoneCall,
  Activity,
  Layers,
  Gauge,
  Compass,
  Scale,
  Zap,
  Crosshair,
} from "lucide-react";
import { api } from "../api/client";


interface RiskFactor {
  factor: string;
  points: number;
  explanation: string;
}

interface Chokepoint {
  name: string;
  road_name: string;
  lat: number;
  lng: number;
  smuggler_eta_mins: number;
  police_eta_mins: number;
  safety_margin_mins: number;
  feasibility: string;
}

interface PoliceStation {
  station_name: string;
  phone: string;
  jurisdiction_code: string;
  lat?: number;
  lng?: number;
  distance_to_chokepoint_km?: number;
}

interface IngestResponse {
  status: string;
  vehicle_id: string;
  risk_score: number;
  rating: string;
  permit_status: string | null;
  convoy_detected: boolean;
  risk_factors: RiskFactor[];
  target_chokepoint: Chokepoint | null;
  assigned_police_station: PoliceStation | null;
  dispatch_status: string;
  dispatch_payload: string | null;
  execution_time_ms: number;
  processed_at: string;
}

export default function MultiAgentInterdictionPage() {
  const [vehicleId, setVehicleId] = useState("TN43E9912");
  const [lat, setLat] = useState("11.4085");
  const [lng, setLng] = useState("76.6965");
  const [speed, setSpeed] = useState("38");
  const [heading, setHeading] = useState("212");
  const [cargoWeight, setCargoWeight] = useState("7500");
  const [declaredSpecies, setDeclaredSpecies] = useState("Red Sanders");
  const [timestamp, setTimestamp] = useState("2026-09-12T02:30:00Z");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load initial dispatch logs
  const loadLogs = async () => {
    const res = await api.getPoliceDispatchLogs();
    if (res.ok && res.data) {
      setDispatchLogs(res.data.dispatches || []);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Draw tactical interception route preview on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Suspect coordinate (Start)
    const sx = 60;
    const sy = 130;

    // Chokepoint bottleneck coordinate (Target)
    const cx = 220;
    const cy = 60;

    // Police Station coordinate
    const px = 270;
    const py = 120;

    // Road curve from Suspect to Chokepoint
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(100, 160, 160, 90, cx, cy);
    ctx.strokeStyle = result && result.risk_score >= 80 ? "rgba(244, 63, 94, 0.75)" : "rgba(16, 185, 129, 0.6)";
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Police Response Vector
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(cx, cy);
    ctx.strokeStyle = "rgba(14, 165, 233, 0.75)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Chokepoint Circle & Pulse
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText("CHOKEPOINT", cx - 30, cy - 20);

    // Draw Suspect Vehicle marker
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#fb7185";
    ctx.fill();
    ctx.fillText("TARGET (" + vehicleId + ")", sx - 35, sy + 20);

    // Draw Police Station marker
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
    ctx.fillText("POLICE UNIT", px - 25, py + 20);
  }, [result, vehicleId]);

  const runPipeline = async (overrideParams?: any) => {
    setLoading(true);
    setActiveStep(1);

    const payload = {
      vehicle_id: overrideParams?.vehicle_id ?? vehicleId,
      lat: parseFloat(overrideParams?.lat ?? lat),
      lng: parseFloat(overrideParams?.lng ?? lng),
      speed_kmh: parseFloat(overrideParams?.speed ?? speed),
      heading_deg: parseFloat(overrideParams?.heading ?? heading),
      cargo_weight_kg: parseFloat(overrideParams?.cargoWeight ?? cargoWeight),
      declared_species: overrideParams?.declaredSpecies ?? declaredSpecies,
      timestamp: overrideParams?.timestamp ?? timestamp,
      source: "GPS_TELEMETRY",
    };

    setTimeout(() => setActiveStep(2), 150);
    setTimeout(() => setActiveStep(3), 300);

    const res = await api.ingestTelemetry(payload);
    setTimeout(() => {
      setActiveStep(4);
      setLoading(false);
      if (res.ok && res.data) {
        setResult(res.data);
        loadLogs();
      }
    }, 450);
  };

  const setScenario = (type: "smuggler" | "benign" | "convoy") => {
    if (type === "smuggler") {
      setVehicleId("TN43E9912");
      setLat("11.4085");
      setLng("76.6965");
      setSpeed("38");
      setHeading("212");
      setCargoWeight("7500");
      setDeclaredSpecies("Red Sanders");
      setTimestamp("2026-09-12T02:30:00Z");
      runPipeline({
        vehicle_id: "TN43E9912",
        lat: 11.4085,
        lng: 76.6965,
        speed: 38,
        heading: 212,
        cargoWeight: 7500,
        declaredSpecies: "Red Sanders",
        timestamp: "2026-09-12T02:30:00Z",
      });
    } else if (type === "benign") {
      setVehicleId("TN09CJ5521");
      setLat("10.9650");
      setLng("76.9800");
      setSpeed("58");
      setHeading("95");
      setCargoWeight("6000");
      setDeclaredSpecies("Teak");
      setTimestamp("2026-09-12T14:00:00Z");
      runPipeline({
        vehicle_id: "TN09CJ5521",
        lat: 10.9650,
        lng: 76.9800,
        speed: 58,
        heading: 95,
        cargoWeight: 6000,
        declaredSpecies: "Teak",
        timestamp: "2026-09-12T14:00:00Z",
      });
    } else {
      setVehicleId("KL07BQ9012");
      setLat("11.4090");
      setLng("76.6970");
      setSpeed("45");
      setHeading("220");
      setCargoWeight("8500");
      setDeclaredSpecies("Rosewood");
      setTimestamp("2026-09-12T01:15:00Z");
      runPipeline({
        vehicle_id: "KL07BQ9012",
        lat: 11.4090,
        lng: 76.6970,
        speed: 45,
        heading: 220,
        cargoWeight: 8500,
        declaredSpecies: "Rosewood",
        timestamp: "2026-09-12T01:15:00Z",
      });
    }
  };

  const handleCopyDossier = () => {
    if (result?.dispatch_payload) {
      navigator.clipboard.writeText(result.dispatch_payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "CRITICAL":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30 glow-rose";
      case "HIGH":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30 glow-amber";
      case "MODERATE":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 glow-emerald";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-6 text-slate-100 bg-tech-grid">
      {/* TOP COMMAND HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-xl shadow-emerald-500/25">
              <Bot className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
                Multi-Agent AI Interdiction Engine
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-400 glow-emerald">
                  LangGraph Orchestrator v2.4
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Deterministic sub-second tool-calling agent swarm for real-time telemetry ingestion, topological chokepoint routing, and emergency police dispatch.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 glass-panel px-3.5 py-2 text-xs text-slate-200">
            <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
            <span>4 Specialized Agents (<span className="text-emerald-400 font-mono font-semibold">Sentinel, Sleuth, Strategist, Dispatcher</span>)</span>
          </div>
        </div>
      </div>

      {/* QUICK PRESET SCENARIO BUTTONS */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" /> 1-Click Live Scenarios:
        </span>
        <button
          onClick={() => setScenario("smuggler")}
          className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/25 hover:border-rose-400 glow-rose"
        >
          <Flame className="h-4 w-4 text-rose-400 animate-bounce" />
          🚨 Clandestine Night Smuggler (Red Sanders)
        </button>
        <button
          onClick={() => setScenario("convoy")}
          className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/25 hover:border-amber-400"
        >
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          🚛 Correlated Convoy / Overweight (Rosewood)
        </button>
        <button
          onClick={() => setScenario("benign")}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 hover:border-emerald-400"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          🚚 Legal Permitted Timber Transit (Highway)
        </button>
      </div>

      {/* AGENT SWARM STATE GRAPH PIPELINE VISUALIZER */}
      <div className="mb-6 rounded-2xl glass-panel p-5 border border-white/10 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            Live LangGraph StateGraph Execution Pipeline
          </h2>
          {result && (
            <span className="text-xs text-slate-400">
              Pipeline latency: <strong className="text-emerald-400 font-mono">{result.execution_time_ms} ms</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* NODE 1: SENTINEL */}
          <div
            className={`relative rounded-xl border p-4 transition-all duration-300 ${
              activeStep >= 1
                ? "border-emerald-500/80 bg-emerald-950/30 glow-emerald"
                : "border-white/5 bg-slate-900/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> 1. Sentinel Agent
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-semibold">
                Registry Tool
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Verifies digital permit validity, species authorization, and 500m highway corridor conformance.
            </p>
            {result && (
              <div className="mt-3 border-t border-white/10 pt-2 text-[11px] font-mono text-slate-300">
                Status: <span className={result.permit_status === "VALID" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{result.permit_status || "UNPERMITTED"}</span>
              </div>
            )}
          </div>

          {/* NODE 2: SLEUTH */}
          <div
            className={`relative rounded-xl border p-4 transition-all duration-300 ${
              activeStep >= 2
                ? "border-amber-500/80 bg-amber-950/30 glow-amber"
                : "border-white/5 bg-slate-900/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> 2. Sleuth Agent
              </span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-semibold">
                Pattern Engine
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Detects restricted night curfew transit (22:00–05:00) and correlates multi-vehicle tandem convoys.
            </p>
            {result && (
              <div className="mt-3 border-t border-white/10 pt-2 text-[11px] font-mono text-slate-300">
                Convoy: <span className={result.convoy_detected ? "text-rose-400 font-bold" : "text-slate-400"}>{result.convoy_detected ? "DETECTED" : "None"}</span>
              </div>
            )}
          </div>

          {/* NODE 3: STRATEGIST */}
          <div
            className={`relative rounded-xl border p-4 transition-all duration-300 ${
              activeStep >= 3
                ? "border-sky-500/80 bg-sky-950/30 glow-cyan"
                : "border-white/5 bg-slate-900/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <Navigation className="h-4 w-4" /> 3. Strategist Agent
              </span>
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-mono text-sky-300 font-semibold">
                Dijkstra Solver
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Evaluates road network escape routes and selects optimal roadblock where <span className="font-mono text-sky-300">T_police &lt; T_exit</span>.
            </p>
            {result && (
              <div className="mt-3 border-t border-white/10 pt-2 text-[11px] font-mono text-slate-300 truncate">
                Chokepoint: <span className="text-sky-300 font-bold">{result.target_chokepoint?.name || "Bypassed (Low Risk)"}</span>
              </div>
            )}
          </div>

          {/* NODE 4: DISPATCHER */}
          <div
            className={`relative rounded-xl border p-4 transition-all duration-300 ${
              activeStep >= 4
                ? "border-rose-500/80 bg-rose-950/30 glow-rose"
                : "border-white/5 bg-slate-900/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <Send className="h-4 w-4" /> 4. Dispatcher Agent
              </span>
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono text-rose-300 font-semibold">
                Police Disseminator
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Renders Jinja2 tactical dossier, broadcasts to live SSE stream, and logs emergency alert.
            </p>
            {result && (
              <div className="mt-3 border-t border-white/10 pt-2 text-[11px] font-mono text-slate-300">
                Dispatch: <span className={result.dispatch_status === "SENT" ? "text-rose-400 font-bold" : "text-slate-400"}>{result.dispatch_status}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: TELEMETRY INGESTION FORM & GAUGES (5 COLS) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl glass-panel p-5 shadow-2xl border border-white/10">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              Real-Time Telemetry & FASTag Ingestion Form
            </h2>

            <div className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Vehicle Registration / ID</label>
                <input
                  type="text"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none shadow-inner"
                  placeholder="e.g. TN43E9912"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* REAL-TIME TELEMETRY GAUGES PREVIEW */}
              <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-white/5 bg-slate-950/50 p-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
                    <Gauge className="h-3 w-3 text-emerald-400" /> Speed
                  </div>
                  <input
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    className="w-full text-center font-mono text-xs font-bold text-emerald-400 bg-transparent focus:outline-none"
                  />
                  <div className="text-[9px] text-slate-500">km/h</div>
                </div>

                <div className="text-center border-x border-white/10">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
                    <Compass className="h-3 w-3 text-sky-400" /> Heading
                  </div>
                  <input
                    type="number"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    className="w-full text-center font-mono text-xs font-bold text-sky-400 bg-transparent focus:outline-none"
                  />
                  <div className="text-[9px] text-slate-500">&deg; DEG</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
                    <Scale className="h-3 w-3 text-amber-400" /> Weight
                  </div>
                  <input
                    type="number"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="w-full text-center font-mono text-xs font-bold text-amber-400 bg-transparent focus:outline-none"
                  />
                  <div className="text-[9px] text-slate-500">kg</div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Declared Species</label>
                <input
                  type="text"
                  value={declaredSpecies}
                  onChange={(e) => setDeclaredSpecies(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Timestamp (ISO UTC)</label>
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => runPipeline()}
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-xs font-bold text-white transition hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Executing Multi-Agent StateGraph...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Ingest Telemetry & Run Multi-Agent Interdiction
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TACTICAL ROUTE ROADBLOCK MINI-MAP CANVAS */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-rose-400" />
                Tactical Road Intercept Vector Simulation
              </div>
              <span className="text-[10px] font-mono text-slate-400">Dijkstra Topological Graph</span>
            </div>
            <canvas ref={canvasRef} width={340} height={180} className="w-full rounded-xl border border-white/10 bg-slate-950/90 shadow-inner" />
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE EXECUTION RESULTS & POLICE DOSSIER (7 COLS) */}
        <div className="space-y-6 lg:col-span-7">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* SUMMARY STATS & RISK SCORE */}
              <div className="rounded-2xl glass-panel p-5 shadow-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-medium text-slate-400">Vehicle Target</div>
                    <div className="text-xl font-black text-white font-mono">{result.vehicle_id}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-400">Risk Score</div>
                      <div className="text-2xl font-black text-white font-mono">{result.risk_score}<span className="text-xs text-slate-400">/100</span></div>
                    </div>
                    <div className={`rounded-xl border px-3.5 py-2 text-xs font-black uppercase tracking-wider ${getRatingColor(result.rating)}`}>
                      {result.rating}
                    </div>
                  </div>
                </div>

                {/* XAI RISK FACTORS */}
                <div className="mt-4">
                  <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                    Explainable AI (XAI) Contributing Factors:
                  </div>
                  {result.risk_factors.length === 0 ? (
                    <div className="text-xs text-emerald-400 italic">No suspicious anomalies detected. Clean transit.</div>
                  ) : (
                    <div className="space-y-2">
                      {result.risk_factors.map((factor, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/70 p-3 text-xs glass-card">
                          <div>
                            <span className="font-bold text-rose-400 font-mono">+{factor.points} pts</span> &mdash;{" "}
                            <span className="font-bold text-slate-100">{factor.factor}</span>
                            <p className="mt-0.5 text-[11px] text-slate-400">{factor.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TARGET CHOKEPOINT & POLICE INTERCEPT CARD */}
              {result.target_chokepoint && (
                <div className="rounded-2xl glass-panel p-5 shadow-2xl border border-rose-500/40 glow-rose">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Strategist Interception Route & Roadblock Chokepoint
                    </h3>
                    <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                      {result.target_chokepoint.feasibility}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-slate-950/80 p-3.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Chokepoint Bottleneck</div>
                      <div className="text-xs font-bold text-white mt-0.5">{result.target_chokepoint.name}</div>
                      <div className="text-[11px] text-slate-400">{result.target_chokepoint.road_name}</div>
                      <div className="mt-2 text-[10px] font-mono text-emerald-400">
                        GPS: {result.target_chokepoint.lat}, {result.target_chokepoint.lng}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/80 p-3.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Time-to-Intercept Headroom</div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Smuggler ETA:</span>
                        <span className="text-xs font-bold font-mono text-rose-400">{result.target_chokepoint.smuggler_eta_mins} mins</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Police ETA:</span>
                        <span className="text-xs font-bold font-mono text-sky-400">{result.target_chokepoint.police_eta_mins} mins</span>
                      </div>
                      <div className="mt-1.5 border-t border-white/10 pt-1 flex items-baseline justify-between text-emerald-400 font-bold text-xs">
                        <span>Tactical Safety Margin:</span>
                        <span>+{result.target_chokepoint.safety_margin_mins} mins</span>
                      </div>
                    </div>
                  </div>

                  {result.assigned_police_station && (
                    <div className="mt-3.5 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs">
                      <div>
                        <span className="text-slate-400">Assigned Unit: </span>
                        <strong className="text-white">{result.assigned_police_station.station_name}</strong>
                        <span className="ml-2 font-mono text-[10px] text-slate-500">[{result.assigned_police_station.jurisdiction_code}]</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                        <PhoneCall className="h-3.5 w-3.5" />
                        {result.assigned_police_station.phone}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TACTICAL EMERGENCY DOSSIER */}
              {result.dispatch_payload && (
                <div className="rounded-2xl glass-panel p-5 shadow-2xl border border-white/10">
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-rose-400" />
                      Tactical Police Emergency Dossier
                    </h3>
                    <button
                      onClick={handleCopyDossier}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy Dossier"}
                    </button>
                  </div>
                  <pre className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/90 p-3.5 font-mono text-[11px] leading-relaxed text-slate-300 shadow-inner">
                    {result.dispatch_payload}
                  </pre>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 glass-panel p-8 text-center">
              <Bot className="h-12 w-12 text-slate-500 mb-3 animate-float-smooth" />
              <h3 className="text-sm font-bold text-slate-200">Ready to Ingest Telemetry</h3>
              <p className="max-w-md text-xs text-slate-400 mt-1">
                Select a 1-click scenario above or enter custom coordinates and click <strong>"Ingest Telemetry"</strong> to watch the 4 LangGraph agents execute in real-time.
              </p>
            </div>
          )}

          {/* HISTORICAL POLICE DISPATCH LOGS */}
          <div className="rounded-2xl glass-panel p-5 shadow-2xl border border-white/10">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Live Police Station Emergency Dispatch Log ({dispatchLogs.length})
              </h3>
              <button
                onClick={loadLogs}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            {dispatchLogs.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No emergency dispatches recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-white/10 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="pb-2.5">Dispatch ID</th>
                      <th className="pb-2.5">Vehicle ID</th>
                      <th className="pb-2.5">Risk</th>
                      <th className="pb-2.5">Chokepoint Intercept</th>
                      <th className="pb-2.5">Police Station</th>
                      <th className="pb-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {dispatchLogs.slice(0, 5).map((log, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 text-emerald-400">{log.dispatch_id}</td>
                        <td className="py-2.5 font-bold text-white">{log.vehicle_id}</td>
                        <td className="py-2.5 text-rose-400 font-bold">{log.risk_score}/100</td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[140px]">{log.target_chokepoint?.name || "—"}</td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[140px]">{log.assigned_police_station?.station_name || "—"}</td>
                        <td className="py-2.5">
                          <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-300">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
