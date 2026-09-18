import { motion } from "framer-motion";
import { HOTSPOTS, riskColor } from "../data/mockData";
import { Crosshair, Sparkles } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  REQUIRES_VERIFICATION: "Requires Field Verification",
  UNDER_REVIEW: "Under Review",
  VERIFIED_FIELD_TEAM: "Verified by Field Team",
};

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

export default function Hotspots() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg tracking-wide text-ash-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Potential Forest-Loss Hotspots
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-ash-500">
            Real satellite imagery analysis (Sentinel-2 10m GSD) · AI-assisted canopy loss
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {HOTSPOTS.length} ACTIVE SATELLITE SECTORS
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {HOTSPOTS.map((h, i) => {
          const tile = latLngToTile(h.lat, h.lng, 13);
          const color = riskColor(h.risk);

          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
              className="relative overflow-hidden rounded-xl border border-line/70 bg-panel/50 p-4 shadow-xl backdrop-blur-sm"
            >
              {(h.risk === "HIGH" || h.risk === "CRITICAL") && (
                <div
                  className="pointer-events-none absolute inset-0 animate-pulse"
                  style={{ boxShadow: `inset 0 0 0 1px ${color}55` }}
                />
              )}

              {/* Satellite Imagery Thumbnail Header */}
              <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg border border-white/10 bg-[#041009]">
                <img
                  src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/${tile.y}/${tile.x}`}
                  alt={`Satellite view of ${h.label}`}
                  className="h-full w-full object-cover contrast-125 saturate-125"
                />

                {/* Atmospheric Vignette */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                {/* Scanlines */}
                <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_3px)]" />

                {/* Center Reticle & Pulse */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <span
                      className="absolute h-8 w-8 rounded-full border animate-ping opacity-75"
                      style={{ borderColor: color }}
                    />
                    <span
                      className="h-3 w-3 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                    <Crosshair className="absolute h-6 w-6 text-white/70" />
                  </div>
                </div>

                {/* Top Badge: Coordinate & Zoom */}
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400 border border-white/10 backdrop-blur-sm">
                  <span>{h.lat.toFixed(4)}°N, {h.lng.toFixed(4)}°E</span>
                </div>

                <div className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-slate-300 border border-white/10 backdrop-blur-sm">
                  Z13 · 10M GSD
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-gold-400">{h.id}</div>
                  <div className="text-sm font-semibold text-ash-100">{h.label}</div>
                </div>
                <span
                  className="rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider"
                  style={{ color: color, border: `1px solid ${color}66`, backgroundColor: `${color}15` }}
                >
                  {h.risk} RISK
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-ash-300">
                <div>
                  <div className="text-ash-500">Canopy Density</div>
                  <div>{h.densityBefore}% → {h.densityAfter}%</div>
                </div>
                <div>
                  <div className="text-ash-500">Canopy Loss</div>
                  <div className="text-rose-400 font-bold">{h.changePct}%</div>
                </div>
                <div>
                  <div className="text-ash-500">Impact Area</div>
                  <div>{h.areaKm2} km²</div>
                </div>
                <div>
                  <div className="text-ash-500">Confidence</div>
                  <div className="text-emerald-400 font-bold">{h.confidence}%</div>
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full rounded bg-line/60 overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${h.confidence}%`, backgroundColor: color }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 font-mono text-[10px]">
                <span className="text-ash-400">{STATUS_LABEL[h.status]}</span>
                <span className="text-ash-500">{h.detectedOn}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
