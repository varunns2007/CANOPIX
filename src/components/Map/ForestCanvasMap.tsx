import { useEffect, useMemo, useRef, useState } from "react";
import { HOTSPOTS, VEHICLES, riskColor, type Hotspot } from "../../data/mockData";
import { Sparkles } from "lucide-react";

const TILE = 256;
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 8;
const MAX_ZOOM = 17;
const CENTER = { lat: 10.35, lng: 77.05 };

const FOREST_BOUNDARY = [
  { lat: 10.405, lng: 77.006 }, { lat: 10.425, lng: 77.058 }, { lat: 10.401, lng: 77.106 },
  { lat: 10.355, lng: 77.119 }, { lat: 10.316, lng: 77.091 }, { lat: 10.303, lng: 77.040 }, { lat: 10.330, lng: 76.999 },
];
const ROUTE = [
  { lat: 10.302, lng: 76.986 }, { lat: 10.321, lng: 77.012 }, { lat: 10.341, lng: 77.043 },
  { lat: 10.354, lng: 77.073 }, { lat: 10.382, lng: 77.098 }, { lat: 10.416, lng: 77.121 },
];
const RIVER = [
  { lat: 10.429, lng: 76.990 }, { lat: 10.404, lng: 77.018 }, { lat: 10.390, lng: 77.046 },
  { lat: 10.373, lng: 77.067 }, { lat: 10.350, lng: 77.084 }, { lat: 10.319, lng: 77.109 },
];

function worldPixel(lat: number, lng: number, zoom: number) {
  const scale = TILE * Math.pow(2, zoom);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

interface ForestCanvasMapProps {
  onOpen?: () => void;
  interactive?: boolean;
  showVehicles?: boolean;
  onSelectHotspot?: (h: Hotspot) => void;
  selectedId?: string | null;
}

export type SatelliteLayerMode = "true-color" | "nir-false-color" | "ndvi-density" | "terrain-topo";

export default function ForestCanvasMap({
  onOpen: _onOpen,
  interactive = true,
  showVehicles = false,
  onSelectHotspot,
  selectedId,
}: ForestCanvasMapProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState(CENTER);
  const [layerMode, setLayerMode] = useState<SatelliteLayerMode>("true-color");
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 1200, height: 700 });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const update = () => {
      if (mapRef.current) {
        const r = mapRef.current.getBoundingClientRect();
        setSize({ width: Math.max(1, r.width), height: Math.max(1, r.height) });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, []);

  const centerPx = useMemo(() => worldPixel(center.lat, center.lng, zoom), [center, zoom]);
  const project = (lat: number, lng: number) => {
    const p = worldPixel(lat, lng, zoom);
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

  const finishPan = () => {
    if (!drag) return;
    if (offset.x === 0 && offset.y === 0) {
      setDrag(null);
      return;
    }
    const current = worldPixel(center.lat, center.lng, zoom);
    const moved = { x: current.x - offset.x, y: current.y - offset.y };
    const scale = TILE * Math.pow(2, zoom);
    const lng = (moved.x / scale) * 360 - 180;
    const y2 = 0.5 - moved.y / scale;
    const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(y2 * 2 * Math.PI)) - Math.PI / 2);
    setCenter({ lat: Math.max(-85, Math.min(85, lat)), lng: Math.max(-180, Math.min(180, lng)) });
    setOffset({ x: 0, y: 0 });
    setDrag(null);
  };

  const handleZoomIn = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setZoom((z) => Math.min(MAX_ZOOM, z + 1));
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomOut = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setZoom((z) => Math.max(MIN_ZOOM, z - 1));
    setOffset({ x: 0, y: 0 });
  };

  const handleReset = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setCenter(CENTER);
    setZoom(DEFAULT_ZOOM);
    setOffset({ x: 0, y: 0 });
  };

  const pathFor = (points: { lat: number; lng: number }[]) => points.map((p) => { const q = project(p.lat, p.lng); return `${q.x},${q.y}`; }).join(" ");
  const hotspotScreen = HOTSPOTS.map((h) => ({ h, ...project(h.lat, h.lng) }));
  const critical = hotspotScreen.find((x) => x.h.risk === "CRITICAL") ?? hotspotScreen[0];
  const criticalVisible = !!critical && critical.x > -180 && critical.x < size.width + 180 && critical.y > -100 && critical.y < size.height + 100;

  // Filter styles per spectral layer
  const tileFilter = useMemo(() => {
    switch (layerMode) {
      case "true-color":
        return "contrast(1.18) saturate(1.28) brightness(1.05)";
      case "nir-false-color":
        return "contrast(1.35) saturate(1.8) hue-rotate(-60deg) brightness(1.1)";
      case "ndvi-density":
        return "contrast(1.4) saturate(2.2) hue-rotate(40deg) brightness(0.95)";
      case "terrain-topo":
        return "contrast(1.4) grayscale(0.5) sepia(0.3) brightness(0.95)";
      default:
        return "contrast(1.15) saturate(1.2)";
    }
  }, [layerMode]);

  return (
    <div
      ref={mapRef}
      className="relative h-full w-full select-none overflow-hidden bg-[#06140c]"
      onWheel={(e) => {
        if (!interactive) return;
        const delta = e.deltaY < 0 ? 1 : -1;
        setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
        setOffset({ x: 0, y: 0 });
      }}
      onPointerDown={(e) => {
        if (!interactive) return;
        if ((e.target as HTMLElement).closest("button, [data-no-pan]")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({ x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => {
        if (drag && interactive) setOffset({ x: e.clientX - drag.x, y: e.clientY - drag.y });
      }}
      onPointerUp={finishPan}
      onPointerCancel={finishPan}
      style={{ cursor: interactive ? (drag ? "grabbing" : "grab") : "default" }}
    >
      {/* Real Satellite Raster Tiles */}
      <div className="absolute inset-0 overflow-hidden">
        {tiles.map((t, i) => (
          <img
            key={`${zoom}-${t.x}-${t.y}-${i}`}
            src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${t.x}`}
            alt="Real Optical Satellite Basemap"
            draggable={false}
            className="absolute h-[256px] w-[256px] max-w-none object-cover transition-filter duration-300"
            style={{ left: t.left, top: t.top, filter: tileFilter }}
          />
        ))}

        {/* Photorealistic Atmospheric Shading & Vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020b06]/25 via-transparent to-[#020b06]/35" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(2,11,6,0.5)_100%)]" />

        {/* Scanlines Effect */}
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.12)_3px)] opacity-60" />
      </div>

      {/* SVG Vector Tactical Layers */}
      <svg viewBox={`0 0 ${size.width} ${size.height}`} className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <filter id="pushpa-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="pushpa-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke="#6ee7b7" strokeOpacity=".05" />
          </pattern>
        </defs>

        <rect width={size.width} height={size.height} fill="url(#pushpa-grid)" />

        {/* Forest Protected Reserve Polygon Boundary */}
        <polygon
          points={pathFor(FOREST_BOUNDARY)}
          fill="#10b981"
          fillOpacity=".12"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeDasharray="9 6"
        />

        {/* Waterway / River Track */}
        <polyline points={pathFor(RIVER)} fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeOpacity=".75" />

        {/* Road Corridor */}
        <polyline points={pathFor(ROUTE)} fill="none" stroke="#fbbf24" strokeWidth="7" strokeOpacity=".25" />
        <polyline points={pathFor(ROUTE)} fill="none" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="12 6" />

        {/* Coordinate Center Reticle */}
        <g transform={`translate(${size.width / 2},${size.height / 2})`} opacity=".5">
          <circle r="22" fill="none" stroke="#5eead4" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="-30" y1="0" x2="30" y2="0" stroke="#5eead4" strokeWidth="1" />
          <line x1="0" y1="-30" x2="0" y2="30" stroke="#5eead4" strokeWidth="1" />
        </g>

        {/* Hotspots */}
        {hotspotScreen.map(({ h, x, y }) => {
          if (x < -40 || x > size.width + 40 || y < -40 || y > size.height + 40) return null;
          const c = riskColor(h.risk), selected = selectedId === h.id;
          return (
            <g
              key={h.id}
              transform={`translate(${x},${y})`}
              pointerEvents="auto"
              onClick={(e) => { e.stopPropagation(); onSelectHotspot?.(h); }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ cursor: "pointer" }}
            >
              <circle r={selected ? 20 : 14} fill="none" stroke={c} strokeWidth="2" opacity=".85">
                <animate attributeName="r" values={`${selected ? 18 : 12};${selected ? 32 : 24};${selected ? 18 : 12}`} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values=".9;0;.9" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="7" fill={c} stroke="#fff" strokeWidth="1.5" filter="url(#pushpa-glow)" />
              <text x="12" y="4" fill="#fff" fontSize="11" fontFamily="monospace" fontWeight="700" stroke="#020b06" strokeWidth="4" paintOrder="stroke">{h.id}</text>
            </g>
          );
        })}

        {/* Live Vehicles */}
        {showVehicles && VEHICLES.map((v) => {
          const p = project(v.lat, v.lng);
          return (
            <g key={v.id} transform={`translate(${p.x},${p.y})`}>
              <circle r="14" fill="#020b06" fillOpacity=".85" stroke="#38bdf8" strokeWidth="1.5" />
              <path d="M-7-4h14v8H-7z M-4-7h8v3h-8z" fill="#facc15" stroke="#000" />
              <text x="14" y="4" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="700" stroke="#020b06" strokeWidth="4" paintOrder="stroke">{v.id}</text>
            </g>
          );
        })}
      </svg>

      {/* Critical Hotspot Popup Alert */}
      {criticalVisible && (
        <button
          type="button"
          data-no-pan
          className="absolute z-10 -translate-x-1/2 -translate-y-full border border-rose-500/80 bg-rose-950/90 px-3.5 py-2 text-left shadow-[0_0_30px_rgba(244,63,94,0.35)] backdrop-blur-md transition-transform hover:scale-105 rounded"
          style={{ left: critical.x, top: critical.y - 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot?.(critical.h); }}
        >
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-rose-200">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> SATELLITE DEFORESTATION DETECTED
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-rose-300">2.73 ha canopy loss · Red Sanders Core</div>
        </button>
      )}

      {/* Top Left Satellite Status Header */}
      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute left-4 top-4 z-20 flex flex-col gap-1 rounded-lg border border-emerald-500/40 bg-[#041009]/85 p-2.5 backdrop-blur-md shadow-xl"
      >
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-ash-100">
          <Sparkles className="h-3.5 w-3.5 text-gold-400" />
          ANAMALAI TIGER RESERVE · ZONE B
        </div>
        <div className="font-mono text-[9px] text-emerald-400 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          COPERNICUS SENTINEL-2 L2A · 10M/PX GSD
        </div>
        <div className="font-mono text-[9px] text-ash-400">
          [{center.lat.toFixed(4)}°N, {center.lng.toFixed(4)}°E] · SUN ELEV: 58.4°
        </div>
      </div>

      {/* Satellite Layer Switcher */}
      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute left-4 bottom-4 z-20 flex items-center gap-1 rounded-lg border border-line/80 bg-[#041009]/90 p-1 backdrop-blur-md shadow-xl text-[10px] font-mono"
      >
        <button
          onClick={() => setLayerMode("true-color")}
          className={`px-2.5 py-1 rounded transition-colors ${
            layerMode === "true-color"
              ? "bg-gold-500 text-void font-bold"
              : "text-ash-300 hover:text-ash-100 hover:bg-void/40"
          }`}
        >
          True Optical RGB
        </button>
        <button
          onClick={() => setLayerMode("nir-false-color")}
          className={`px-2.5 py-1 rounded transition-colors ${
            layerMode === "nir-false-color"
              ? "bg-gold-500 text-void font-bold"
              : "text-ash-300 hover:text-ash-100 hover:bg-void/40"
          }`}
        >
          NIR False Color
        </button>
        <button
          onClick={() => setLayerMode("ndvi-density")}
          className={`px-2.5 py-1 rounded transition-colors ${
            layerMode === "ndvi-density"
              ? "bg-gold-500 text-void font-bold"
              : "text-ash-300 hover:text-ash-100 hover:bg-void/40"
          }`}
        >
          NDVI Density
        </button>
      </div>

      {/* Top Right Zoom & Reset Controls */}
      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-4 top-4 z-20 flex flex-col items-center overflow-hidden rounded-lg border border-line/80 bg-[#041009]/90 shadow-xl backdrop-blur-md font-mono"
      >
        <button
          type="button"
          title="Zoom in (+)"
          className="flex h-8 w-8 items-center justify-center text-sm font-bold text-ash-100 transition-colors hover:bg-emerald-950/60 disabled:opacity-40"
          disabled={zoom >= MAX_ZOOM}
          onClick={handleZoomIn}
        >
          +
        </button>
        <div className="w-full border-t border-line/60 bg-black/50 py-0.5 text-center text-[9px] font-semibold text-gold-400">
          Z{zoom}
        </div>
        <button
          type="button"
          title="Zoom out (-)"
          className="flex h-8 w-8 items-center justify-center text-sm font-bold text-ash-100 transition-colors hover:bg-emerald-950/60 disabled:opacity-40 border-t border-line/60"
          disabled={zoom <= MIN_ZOOM}
          onClick={handleZoomOut}
        >
          −
        </button>
        <button
          type="button"
          title="Reset to center"
          className="flex h-7 w-8 items-center justify-center text-[9px] font-bold text-ash-400 transition-colors hover:bg-emerald-950/60 border-t border-line/60"
          onClick={handleReset}
        >
          ⌖
        </button>
      </div>
    </div>
  );
}
