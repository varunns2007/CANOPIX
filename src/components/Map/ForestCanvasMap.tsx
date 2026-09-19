import { useEffect, useMemo, useRef, useState } from "react";
import { HOTSPOTS, VEHICLES, riskColor, type Hotspot } from "../../data/mockData";

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

export default function ForestCanvasMap({ onOpen, interactive = true, showVehicles = false, onSelectHotspot, selectedId }: ForestCanvasMapProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState(CENTER);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 1200, height: 700 });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const update = () => {
      if (!mapRef.current) return;
      const r = mapRef.current.getBoundingClientRect();
      setSize({ width: Math.max(1, r.width), height: Math.max(1, r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
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
        result.push({ x: ((tx % n) + n) % n, y: ty, left: tx * TILE - centerPx.x + size.width / 2 + offset.x, top: ty * TILE - centerPx.y + size.height / 2 + offset.y });
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

  return (
    <div
      ref={mapRef}
      className="relative h-full w-full select-none overflow-hidden bg-[#173b26]"
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
      <div className="absolute inset-0 overflow-hidden">
        {tiles.map((t, i) => (
          <img
            key={`${zoom}-${t.x}-${t.y}-${i}`}
            src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${t.x}`}
            alt="Esri World Imagery satellite basemap"
            draggable={false}
            className="absolute h-[256px] w-[256px] max-w-none object-cover"
            style={{ left: t.left, top: t.top, filter: "saturate(1.28) contrast(1.08) brightness(1.08)" }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#00150a]/5 via-transparent to-[#00150a]/18" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_45%,rgba(0,12,7,.32)_100%)]" />
      </div>

      <svg viewBox={`0 0 ${size.width} ${size.height}`} className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <filter id="pushpa-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <pattern id="pushpa-grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#d8ffe7" strokeOpacity=".045"/></pattern>
        </defs>
        <rect width={size.width} height={size.height} fill="url(#pushpa-grid)" />
        <polygon points={pathFor(FOREST_BOUNDARY)} fill="#18b66c" fillOpacity=".10" stroke="#69ffb1" strokeWidth="2.5" strokeDasharray="9 7" />
        <polyline points={pathFor(RIVER)} fill="none" stroke="#55cfff" strokeWidth="5" strokeOpacity=".72" />
        <polyline points={pathFor(ROUTE)} fill="none" stroke="#ffd95e" strokeWidth="8" strokeOpacity=".22" />
        <polyline points={pathFor(ROUTE)} fill="none" stroke="#ffe16d" strokeWidth="2.5" strokeDasharray="14 8" />
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
              <circle r={selected ? 19 : 14} fill="none" stroke={c} strokeWidth="2" opacity=".8">
                <animate attributeName="r" values={`${selected ? 18 : 12};${selected ? 31 : 23};${selected ? 18 : 12}`} dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values=".9;0;.9" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle r="7" fill={c} stroke="#fff" strokeWidth="1.5" filter="url(#pushpa-glow)" />
              <text x="12" y="4" fill="#fff" fontSize="12" fontFamily="monospace" fontWeight="700" stroke="#001109" strokeWidth="4" paintOrder="stroke">{h.id}</text>
            </g>
          );
        })}
        {showVehicles && VEHICLES.map((v) => {
          const p = project(v.lat, v.lng);
          return (
            <g key={v.id} transform={`translate(${p.x},${p.y})`}>
              <circle r="13" fill="#07140d" fillOpacity=".78" stroke="#5eead4"/>
              <path d="M-7-4h14v8H-7z M-4-7h8v3h-8z" fill="#f7d35b" stroke="#111"/>
              <text x="12" y="4" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="700" stroke="#001109" strokeWidth="4" paintOrder="stroke">{v.id}</text>
            </g>
          );
        })}
      </svg>

      {criticalVisible && (
        <button
          type="button"
          data-no-pan
          className="absolute z-10 -translate-x-1/2 -translate-y-full border border-red-300/80 bg-[#160907]/92 px-3 py-2 text-left shadow-[0_0_28px_rgba(239,68,68,.32)] backdrop-blur-md transition-transform hover:scale-105"
          style={{ left: critical.x, top: critical.y - 10 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onSelectHotspot?.(critical.h); }}
        >
          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-red-200">▲ DEFORESTATION DETECTED</div>
          <div className="mt-1 font-mono text-[10px] text-ash-200">2.73 ha candidate · multi-index change</div>
        </button>
      )}

      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute left-4 top-4 z-10 rounded border border-forest-300/40 bg-[#06140c]/75 px-3 py-2 backdrop-blur-md"
      >
        <div className="font-mono text-[11px] font-semibold text-white">ANAMALAI RANGE · ZONE A</div>
        <div className="mt-0.5 font-mono text-[9px] text-forest-200">REAL SATELLITE BASEMAP · ESRI WORLD IMAGERY</div>
      </div>

      {/* Interactive Zoom Controls */}
      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="absolute right-4 top-4 z-10 flex flex-col items-center overflow-hidden rounded border border-line/80 bg-[#07140d]/90 shadow-lg backdrop-blur-md"
      >
        <button
          type="button"
          data-cursor-hover
          title="Zoom in (+)"
          className="flex h-9 w-9 items-center justify-center font-mono text-base font-bold text-white transition-colors hover:bg-forest-600/40 active:bg-forest-500/60 disabled:opacity-40"
          disabled={zoom >= MAX_ZOOM}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleZoomIn}
        >
          +
        </button>
        <div className="w-full border-t border-line/60 bg-black/40 py-0.5 text-center font-mono text-[8px] font-semibold text-ash-400">
          Z{zoom}
        </div>
        <button
          type="button"
          data-cursor-hover
          title="Zoom out (−)"
          className="flex h-9 w-9 items-center justify-center border-t border-line/60 font-mono text-base font-bold text-white transition-colors hover:bg-forest-600/40 active:bg-forest-500/60 disabled:opacity-40"
          disabled={zoom <= MIN_ZOOM}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleZoomOut}
        >
          −
        </button>
        <button
          type="button"
          data-cursor-hover
          title="Reset to Center View"
          className="flex h-9 w-9 items-center justify-center border-t border-line/60 font-mono text-xs text-forest-300 transition-colors hover:bg-forest-600/40 active:bg-forest-500/60"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleReset}
        >
          ⌖
        </button>
      </div>

      <div
        data-no-pan
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-4 z-10 w-56 rounded border border-line/80 bg-[#06140c]/88 p-3 backdrop-blur-md"
      >
        <div className="mb-2 font-mono text-[10px] tracking-[.16em] text-white">MAP LAYERS</div>
        <LayerDot color="#69ffb1" label="Forest boundary"/>
        <LayerDot color="#ff5c54" label="Deforestation candidate"/>
        <LayerDot color="#ffe16d" label="Road / monitored route"/>
        <LayerDot color="#55cfff" label="River / water"/>
        {showVehicles && <LayerDot color="#f7d35b" label="Tracked vehicle"/>}
        <div className="mt-2 border-t border-line/60 pt-2 font-mono text-[8px] leading-relaxed text-ash-400">
          BASEMAP: ESRI WORLD IMAGERY · OVERLAYS: PUSHPA ANALYTICS
        </div>
      </div>

      {onOpen && (
        <button
          type="button"
          data-no-pan
          data-cursor-hover
          className="absolute bottom-4 right-4 z-10 rounded border border-forest-300/60 bg-[#07140d]/85 px-3 py-2 font-mono text-[9px] tracking-wider text-forest-200 backdrop-blur-md transition-colors hover:bg-forest-900/80"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
        >
          OPEN FOREST EXPLORER ↗
        </button>
      )}
      <div className="pointer-events-none absolute bottom-2 right-1/2 translate-x-1/2 font-mono text-[8px] text-white/70">
        © Esri · Maxar · Earthstar Geographics · Level {zoom}
      </div>
    </div>
  );
}

function LayerDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2 font-mono text-[9px] text-ash-100">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
