import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

const TILE = 256;
const DEFAULT_ZOOM = 12;
const MIN_ZOOM = 9;
const MAX_ZOOM = 16;

function worldPixel(lat: number, lng: number, zoom: number) {
  const scale = TILE * Math.pow(2, zoom);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

interface TacticalSatelliteMapProps {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  chokepoint?: {
    name: string;
    road_name: string;
    lat: number;
    lng: number;
    smuggler_eta_mins: number;
    police_eta_mins: number;
    safety_margin_mins: number;
    feasibility: string;
  } | null;
  policeStation?: {
    station_name: string;
    phone: string;
    jurisdiction_code: string;
    lat?: number;
    lng?: number;
  } | null;
  riskScore?: number;
}

export type SpectralMode = "true-color" | "nir-false-color" | "tactical-hud";

export default function TacticalSatelliteMap({
  vehicleId,
  lat,
  lng,
  speed,
  heading,
  chokepoint,
  policeStation,
  riskScore = 85,
}: TacticalSatelliteMapProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [spectralMode, setSpectralMode] = useState<SpectralMode>("true-color");
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 380, height: 260 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute map center (midpoint between vehicle and chokepoint or vehicle itself)
  const center = useMemo(() => {
    if (chokepoint && chokepoint.lat && chokepoint.lng) {
      return {
        lat: (lat + chokepoint.lat) / 2,
        lng: (lng + chokepoint.lng) / 2,
      };
    }
    return { lat, lng };
  }, [lat, lng, chokepoint]);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setSize({ width: Math.max(1, r.width), height: Math.max(1, r.height) });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const centerPx = useMemo(() => worldPixel(center.lat, center.lng, zoom), [center, zoom]);
  const project = (pLat: number, pLng: number) => {
    const p = worldPixel(pLat, pLng, zoom);
    return { x: size.width / 2 + p.x - centerPx.x + offset.x, y: size.height / 2 + p.y - centerPx.y + offset.y };
  };

  const tiles = useMemo(() => {
    const cx = Math.floor(centerPx.x / TILE);
    const cy = Math.floor(centerPx.y / TILE);
    const cols = Math.ceil(size.width / TILE) + 2;
    const rows = Math.ceil(size.height / TILE) + 2;
    const n = Math.pow(2, zoom);
    const result: { x: number; y: number; left: number; top: number }[] = [];
    for (let dx = -cols; dx <= cols; dx++) {
      for (let dy = -rows; dy <= rows; dy++) {
        const tx = cx + dx, ty = cy + dy;
        if (ty < 0 || ty >= n) continue;
        result.push({
          x: ((tx % n) + n) % n,
          y: ty,
          left: tx * TILE - centerPx.x + size.width / 2 + offset.x,
          top: ty * TILE - centerPx.y + size.height / 2 + offset.y,
        });
      }
    }
    return result;
  }, [centerPx, zoom, offset, size.width, size.height]);

  const tileFilter = useMemo(() => {
    switch (spectralMode) {
      case "true-color":
        return "contrast(1.22) saturate(1.30) brightness(1.04)";
      case "nir-false-color":
        return "contrast(1.4) saturate(1.85) hue-rotate(-60deg) brightness(1.08)";
      case "tactical-hud":
        return "contrast(1.5) saturate(0.6) hue-rotate(140deg) brightness(0.9)";
      default:
        return "contrast(1.2) saturate(1.25)";
    }
  }, [spectralMode]);

  // Projected Points
  const vehiclePt = project(lat, lng);
  const chokepointPt = chokepoint ? project(chokepoint.lat, chokepoint.lng) : null;
  const policePt = policeStation && policeStation.lat && policeStation.lng ? project(policeStation.lat, policeStation.lng) : null;

  // Midpoint control points for realistic highway curve simulation
  const routeBezier = useMemo(() => {
    if (!chokepointPt) return null;
    const midX = (vehiclePt.x + chokepointPt.x) / 2 + (chokepointPt.y - vehiclePt.y) * 0.18;
    const midY = (vehiclePt.y + chokepointPt.y) / 2 - (chokepointPt.x - vehiclePt.x) * 0.18;
    return `M ${vehiclePt.x} ${vehiclePt.y} Q ${midX} ${midY} ${chokepointPt.x} ${chokepointPt.y}`;
  }, [vehiclePt, chokepointPt]);

  const isHighRisk = riskScore >= 75;

  return (
    <div
      ref={containerRef}
      className="relative h-[240px] w-full select-none overflow-hidden rounded-xl border border-white/10 bg-[#05130b] shadow-2xl"
      onWheel={(e) => {
        const delta = e.deltaY < 0 ? 1 : -1;
        setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
        setOffset({ x: 0, y: 0 });
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button, [data-no-pan]")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({ x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => {
        if (drag) setOffset({ x: e.clientX - drag.x, y: e.clientY - drag.y });
      }}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
      style={{ cursor: drag ? "grabbing" : "grab" }}
    >
      {/* Real Optical Satellite Raster Tiles */}
      <div className="absolute inset-0 overflow-hidden">
        {tiles.map((t, i) => (
          <img
            key={`${zoom}-${t.x}-${t.y}-${i}`}
            src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${t.x}`}
            alt="Real Satellite Intercept Imagery"
            draggable={false}
            className="absolute h-[256px] w-[256px] max-w-none object-cover transition-filter duration-300"
            style={{ left: t.left, top: t.top, filter: tileFilter }}
          />
        ))}

        {/* Photorealistic Atmospheric Shading & Vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020b06]/35 via-transparent to-[#020b06]/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(2,11,6,0.6)_100%)]" />

        {/* Tactical Scanlines */}
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.14)_3px)] opacity-70" />
      </div>

      {/* SVG Tactical Roadblock & Vector Intercept Overlay */}
      <svg viewBox={`0 0 ${size.width} ${size.height}`} className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <filter id="tactical-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="tac-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#6ee7b7" strokeOpacity=".06" />
          </pattern>
        </defs>

        <rect width={size.width} height={size.height} fill="url(#tac-grid)" />

        {/* Suspect Dijkstra Highway Escape Corridor */}
        {routeBezier && (
          <>
            <path
              d={routeBezier}
              fill="none"
              stroke={isHighRisk ? "rgba(244, 63, 94, 0.35)" : "rgba(16, 185, 129, 0.35)"}
              strokeWidth="7"
            />
            <path
              d={routeBezier}
              fill="none"
              stroke={isHighRisk ? "#f43f5e" : "#10b981"}
              strokeWidth="2.5"
              strokeDasharray="6 4"
            >
              <animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite" />
            </path>
          </>
        )}

        {/* Police Intercept Vector */}
        {policePt && chokepointPt && (
          <line
            x1={policePt.x}
            y1={policePt.y}
            x2={chokepointPt.x}
            y2={chokepointPt.y}
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />
        )}

        {/* Police Station Marker & Radius */}
        {policePt && (
          <g transform={`translate(${policePt.x},${policePt.y})`}>
            <circle r="18" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
            <circle r="6" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" filter="url(#tactical-glow)" />
            <text x="10" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" stroke="#020b06" strokeWidth="3" paintOrder="stroke">
              {policeStation?.jurisdiction_code || "POLICE UNIT"}
            </text>
          </g>
        )}

        {/* Chokepoint Roadblock Bottleneck */}
        {chokepointPt && (
          <g transform={`translate(${chokepointPt.x},${chokepointPt.y})`}>
            <circle r="20" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="1.5">
              <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="8" fill="#f43f5e" stroke="#fff" strokeWidth="2" filter="url(#tactical-glow)" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#fff" strokeWidth="1.5" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#fff" strokeWidth="1.5" />
            <text x="14" y="-4" fill="#fb7185" fontSize="10" fontFamily="monospace" fontWeight="bold" stroke="#020b06" strokeWidth="3" paintOrder="stroke">
              ROADBLOCK CHOKEPOINT
            </text>
            <text x="14" y="8" fill="#fecdd3" fontSize="9" fontFamily="monospace" stroke="#020b06" strokeWidth="3" paintOrder="stroke">
              {chokepoint?.name || "State Border Barrier"}
            </text>
          </g>
        )}

        {/* Suspect Vehicle Live GPS Target Marker */}
        <g transform={`translate(${vehiclePt.x},${vehiclePt.y})`}>
          <circle r="22" fill="none" stroke={isHighRisk ? "#fb7185" : "#34d399"} strokeWidth="1.5" opacity="0.8">
            <animate attributeName="r" values="14;30;14" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle r="7" fill={isHighRisk ? "#ef4444" : "#10b981"} stroke="#ffffff" strokeWidth="2" filter="url(#tactical-glow)" />
          {/* Heading pointer */}
          <line
            x1="0"
            y1="0"
            x2={16 * Math.sin((heading * Math.PI) / 180)}
            y2={-16 * Math.cos((heading * Math.PI) / 180)}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text x="12" y="4" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold" stroke="#020b06" strokeWidth="3" paintOrder="stroke">
            {vehicleId} [{speed} km/h]
          </text>
        </g>
      </svg>

      {/* Top Left Satellite Telemetry HUD */}
      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-0.5 rounded-lg border border-emerald-500/40 bg-[#030e08]/90 px-2 py-1.5 backdrop-blur-md shadow-xl"
      >
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-200">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          ORBITAL SATELLITE HUD · 10M GSD
        </div>
        <div className="font-mono text-[8px] text-emerald-400">
          TARGET: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E · HDG {heading}°
        </div>
        {chokepoint && (
          <div className="font-mono text-[8px] text-rose-300">
            INTERCEPT DELTA: +{chokepoint.safety_margin_mins}m SAFETY MARGIN
          </div>
        )}
      </div>

      {/* Top Right Spectral Layer Switcher & Zoom */}
      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1"
      >
        <div className="flex overflow-hidden rounded-md border border-white/10 bg-[#030e08]/90 backdrop-blur-md">
          <button
            onClick={() => setSpectralMode("true-color")}
            title="True Optical RGB Satellite"
            className={`px-1.5 py-1 font-mono text-[9px] font-bold transition-colors ${
              spectralMode === "true-color" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            RGB
          </button>
          <button
            onClick={() => setSpectralMode("nir-false-color")}
            title="Sentinel-2 NIR False Color"
            className={`border-l border-white/10 px-1.5 py-1 font-mono text-[9px] font-bold transition-colors ${
              spectralMode === "nir-false-color" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            NIR
          </button>
          <button
            onClick={() => setSpectralMode("tactical-hud")}
            title="Tactical Thermal Vision"
            className={`border-l border-white/10 px-1.5 py-1 font-mono text-[9px] font-bold transition-colors ${
              spectralMode === "tactical-hud" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            HUD
          </button>
        </div>

        <div className="flex overflow-hidden rounded-md border border-white/10 bg-[#030e08]/90 backdrop-blur-md">
          <button
            onClick={() => { setZoom((z) => Math.min(MAX_ZOOM, z + 1)); setOffset({ x: 0, y: 0 }); }}
            className="flex h-6 w-6 items-center justify-center font-mono text-xs font-bold text-slate-200 hover:bg-emerald-950/60"
          >
            +
          </button>
          <button
            onClick={() => { setZoom((z) => Math.max(MIN_ZOOM, z - 1)); setOffset({ x: 0, y: 0 }); }}
            className="flex h-6 w-6 items-center justify-center border-l border-white/10 font-mono text-xs font-bold text-slate-200 hover:bg-emerald-950/60"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}
