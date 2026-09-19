import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Satellite,
  Compass,
  Layers,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Trees,
  Maximize2,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Activity,
  Filter,
} from "lucide-react";
import StandardFloatingCard from "./StandardFloatingCard";
import ElevatedControlButton from "./ElevatedControlButton";
import HoverDepthPanel from "./HoverDepthPanel";
import InteractiveGestureUI from "./InteractiveGestureUI";
import OrbitalSatelliteBase from "../Map/OrbitalSatelliteBase";
import CountUp from "../Widgets/CountUp";
import DonutChart from "../Widgets/DonutChart";
import { ANALYTICS_SUMMARY, HOTSPOTS, riskColor } from "../../data/mockData";

export default function AntiGravityDashboard({ onNavigate }: { onNavigate?: (pageId: string) => void }) {
  const [activeLayer, setActiveLayer] = useState<"optical" | "ndvi" | "elevation" | "infrared">("optical");
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [showGestureOverlay, setShowGestureOverlay] = useState(true);
  const [viewMode, setViewMode] = useState<"standard" | "detached" | "deep-gap">("detached");

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 font-sans">
      {/* =========================================================================
          1. REALISTIC SATELLITE IMAGE BASE LAYER (Top-down Orbital Perspective)
          High-resolution satellite imagery composite dynamically rendering
          OPTICAL, NDVI, ELEVATION, and INFRARED spectral modes
          ========================================================================= */}
      <OrbitalSatelliteBase spectrum={activeLayer} showGrid={true} showCoordinates={true} sunGlint={true} />

      {/* Top Orbital Telemetry Marker */}
      <div className="pointer-events-none absolute top-3 right-4 z-10 flex items-center gap-3 font-mono text-[10px] text-emerald-300/90 bg-slate-950/80 px-3 py-1 rounded-md border border-emerald-500/30 backdrop-blur-md shadow-lg">
        <Satellite className="h-3.5 w-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "14s" }} />
        <span>SENTINEL-2B · ORBIT R119 · 10.35° N, 77.05° E</span>
      </div>

      {/* =========================================================================
          5. INTERACTIVE GESTURE UI / LEVITATING NODES OVER SATELLITE MAP
          ========================================================================= */}
      {showGestureOverlay && (
        <div className="absolute inset-0 z-10">
          <InteractiveGestureUI
            activeNodeId={selectedHotspot?.id}
            onSelectNode={(node) => {
              const match = HOTSPOTS.find((h) => h.id === node.id) || {
                id: node.id,
                label: node.name,
                risk: node.risk,
                densityBefore: 85,
                densityAfter: Math.round(node.ndvi * 100),
                changePct: -14.2,
                areaKm2: 42.8,
                confidence: 96.4,
              };
              setSelectedHotspot(match);
            }}
          />
        </div>
      )}

      {/* =========================================================================
          3. DASHBOARD WITH DETACHED DATA LAYERS (Anti-Gravity Stack with Air Gap)
          Sleek independent panes elevated over the satellite map background
          ========================================================================= */}
      <div className="relative z-20 flex h-full flex-col pointer-events-none p-4 lg:p-6 overflow-y-auto">
        {/* Top Control Deck: Elevated Interactive Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto pb-4">
          <div className="flex items-center gap-2">
            <ElevatedControlButton
              variant="white"
              onClick={() => onNavigate?.("reports-analytics")}
              icon={<BarChart3 className="h-3.5 w-3.5 text-slate-800" />}
            >
              VIEW DETAILED REPORTS
            </ElevatedControlButton>

            <ElevatedControlButton
              variant="primary"
              onClick={() => onNavigate?.("range-detector")}
              icon={<Compass className="h-3.5 w-3.5 text-emerald-300" />}
            >
              INITIALIZE ORBITAL SCAN
            </ElevatedControlButton>
          </div>

          {/* Spectrum Mode Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 p-1 text-slate-900 shadow-[0_6px_16px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <span className="px-2 font-mono text-[10px] font-bold text-slate-500 uppercase">SPECTRUM:</span>
            {(["optical", "ndvi", "elevation", "infrared"] as const).map((layer) => {
              const isCurrent = activeLayer === layer;
              return (
                <button
                  key={layer}
                  type="button"
                  data-cursor-hover
                  onClick={() => setActiveLayer(layer)}
                  className={`relative rounded-lg px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all duration-200 ${
                    isCurrent
                      ? "bg-slate-900 text-white shadow-md scale-105"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {layer}
                  {isCurrent && (
                    <motion.span
                      layoutId="active-spectrum-dot"
                      className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Floating Dashboard Layout Grid */}
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12 pointer-events-auto items-start">
          {/* Left Column: Featured Analysis & Impact Overview (Standard Floating Elements) */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            {/* Standard UI Floating Element (Anti-Gravity Style): Featured Analysis */}
            <StandardFloatingCard
              title="Featured Analysis"
              subtitle={`Orbital Deep-Scan · Mode: ${activeLayer.toUpperCase()}`}
              badge="LIVE TELEMETRY"
              badgeColor="#059669"
              icon={<Sparkles className="h-4 w-4" />}
              styleVariant="white"
              elevation="high"
            >
              <div className="space-y-3">
                <p className="font-sans text-xs leading-relaxed text-slate-700">
                  {activeLayer === "optical" && "True-color photographic RGB view composite. Visual canopy monitoring active across Anamalai and Seshachalam reserves."}
                  {activeLayer === "ndvi" && "Normalized Difference Vegetation Index active. Chlorophyll delta highlights active canopy depletion (-12.4% over 45 days)."}
                  {activeLayer === "elevation" && "Digital Elevation Model active. Topographic slope gradient evaluates chokepoint barriers and valley escape routes."}
                  {activeLayer === "infrared" && "Color Infrared False-Color active. Penetrates morning haze to expose bare soil disturbance, dry timber, and logging tracks."}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 shadow-inner">
                    <div className="text-[9px] text-slate-500 uppercase">
                      {activeLayer === "ndvi" ? "Mean NDVI Index" : activeLayer === "elevation" ? "Mean Altitude" : "Tree Canopy Health"}
                    </div>
                    <div className="mt-0.5 text-lg font-bold text-emerald-700">
                      {activeLayer === "ndvi" ? "0.824" : activeLayer === "elevation" ? "1,240 m" : `${ANALYTICS_SUMMARY.canopyDensityPct}%`}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 shadow-inner">
                    <div className="text-[9px] text-slate-500 uppercase">Active Hotspots</div>
                    <div className="mt-0.5 text-lg font-bold text-rose-600">
                      <CountUp value={ANALYTICS_SUMMARY.hotspotCount} />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <ElevatedControlButton
                    variant="primary"
                    className="w-full justify-center text-center"
                    onClick={() => onNavigate?.("satellite-compare")}
                  >
                    COMPARE HISTORICAL PASSES ➔
                  </ElevatedControlButton>
                </div>
              </div>
            </StandardFloatingCard>

            {/* Standard UI Floating Element: Legend Box & Air Gap Status */}
            <StandardFloatingCard
              title={`Spectral Legend · ${activeLayer.toUpperCase()}`}
              subtitle="Calibrated Copernicus Sentinel-2 MSI"
              styleVariant="white"
              elevation="medium"
              delay={0.15}
            >
              <div className="space-y-2 font-mono text-[11px]">
                {activeLayer === "optical" && (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-600 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Dense Tropical Rainforest</span>
                      </div>
                      <span className="text-slate-500">68.4%</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-600 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Agricultural / Plain</span>
                      </div>
                      <span className="text-slate-500">22.1%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-500 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Cleared Land / Timber Loss</span>
                      </div>
                      <span className="text-rose-600 font-bold">9.5%</span>
                    </div>
                  </>
                )}

                {activeLayer === "ndvi" && (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
                        <span className="text-slate-800 font-semibold">High Chlorophyll (&gt;0.78)</span>
                      </div>
                      <span className="text-emerald-600 font-bold">PRISTINE</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Thinning (0.45 - 0.78)</span>
                      </div>
                      <span className="text-amber-600 font-bold">WARNING</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-600 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Deforested / Cleared (&lt;0.45)</span>
                      </div>
                      <span className="text-rose-600 font-bold">CRITICAL</span>
                    </div>
                  </>
                )}

                {activeLayer === "elevation" && (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-stone-300 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Mountain Peaks (&gt;1,800m)</span>
                      </div>
                      <span className="text-slate-600">CREST</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-stone-500 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Mid-Altitude (800 - 1,800m)</span>
                      </div>
                      <span className="text-slate-600">SLOPE</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-stone-700 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Valley Chokepoint (&lt;800m)</span>
                      </div>
                      <span className="text-emerald-700 font-bold">ROADBLOCK</span>
                    </div>
                  </>
                )}

                {activeLayer === "infrared" && (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-600 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Living Foliage (Ruby NIR)</span>
                      </div>
                      <span className="text-rose-600 font-bold">HIGH NIR</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-cyan-500 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Bare Soil / Logging Tracks</span>
                      </div>
                      <span className="text-cyan-600 font-bold">SOIL ANOMALY</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-900 shadow-sm" />
                        <span className="text-slate-800 font-semibold">Water Reservoirs / Deep Sea</span>
                      </div>
                      <span className="text-slate-700">ABSORPTION</span>
                    </div>
                  </>
                )}
              </div>
            </StandardFloatingCard>
          </div>

          {/* Center Column: Detached Data Layer Graph & Middle Air Gap */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            {/* Dashboard Detached Pane: Impact Dashboard Overview */}
            <div className="ag-detached-pane p-5 text-white">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div>
                  <h3 className="font-display text-sm tracking-wider uppercase text-emerald-300 font-bold">
                    IMPACT DASHBOARD OVERVIEW
                  </h3>
                  <p className="font-mono text-[10px] text-slate-400">
                    Temporal vegetation analysis across 6 calendar cycles
                  </p>
                </div>
                <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-slate-300">Net Forest Area Protected:</span>
                  <span className="font-display text-xl text-white font-bold">
                    {ANALYTICS_SUMMARY.forestAreaKm2.toLocaleString()} km²
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>+2.4% re-growth recovery in conserved sector B</span>
                </div>
              </div>

              {/* Detached Area Graph visualization */}
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-slate-950/60 p-3">
                <div className="h-28 w-full">
                  <svg viewBox="0 0 300 90" className="h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="agGlowFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,60 Q 50,45 100,52 T 200,30 T 300,18 L 300,90 L 0,90 Z"
                      fill="url(#agGlowFill)"
                    />
                    <path
                      d="M 0,60 Q 50,45 100,52 T 200,30 T 300,18"
                      fill="none"
                      stroke="#7dfad1"
                      strokeWidth="2.5"
                      style={{ filter: "drop-shadow(0 0 6px rgba(125,250,209,0.7))" }}
                    />
                    {[
                      { cx: 0, cy: 60 },
                      { cx: 100, cy: 52 },
                      { cx: 200, cy: 30 },
                      { cx: 300, cy: 18 },
                    ].map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.cx}
                        cy={pt.cy}
                        r="3.5"
                        fill="#064e3b"
                        stroke="#7dfad1"
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between font-mono text-[9px] text-slate-400 mt-1">
                  <span>JAN (82%)</span>
                  <span>MAR (79%)</span>
                  <span>MAY (72%)</span>
                  <span>CURRENT (84.2%)</span>
                </div>
              </div>
            </div>

            {/* Risk Distribution Donut Detached Pane */}
            <div className="ag-detached-pane p-5 text-white">
              <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-white/10 pb-2">
                Risk Categorization Spectrum
              </h4>
              <div className="mt-3 flex items-center justify-between">
                <DonutChart
                  size={100}
                  strokeWidth={14}
                  data={ANALYTICS_SUMMARY.riskDistribution.map((r) => ({
                    label: r.label,
                    value: r.value,
                    color: riskColor(r.label as any),
                  }))}
                />
                <div className="space-y-1.5 font-mono text-[10px]">
                  {ANALYTICS_SUMMARY.riskDistribution.map((r) => (
                    <div key={r.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: riskColor(r.label as any) }} />
                      <span className="text-slate-300">{r.label}:</span>
                      <span className="font-bold text-white">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 4. Detailed Data Panel with Hover Depth (Resource Optimization) */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            <HoverDepthPanel
              title="Resource Optimization Matrix"
              subtitle="Tilt cursor over card for 3D Anti-Gravity Hover Depth"
              theme="white"
            >
              <div className="space-y-3">
                <p className="font-sans text-xs leading-relaxed text-slate-700">
                  High-precision allocation of drone patrol sweeps, ranger intercept squads, and satellite cadence triggers based on real-time threat density.
                </p>

                {/* Resource Allocation Table */}
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-2.5 py-2">Sector</th>
                        <th className="px-2.5 py-2">Asset</th>
                        <th className="px-2.5 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr>
                        <td className="px-2.5 py-2 font-bold text-slate-800">Zone B-1</td>
                        <td className="px-2.5 py-2 text-slate-600">Sentinel-2B Pass</td>
                        <td className="px-2.5 py-2 text-right text-emerald-600 font-bold">LOCKED</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-2 font-bold text-slate-800">Sector Red-7</td>
                        <td className="px-2.5 py-2 text-slate-600">Drone Intercept #04</td>
                        <td className="px-2.5 py-2 text-right text-rose-600 font-bold">DISPATCHED</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-2 font-bold text-slate-800">Perimeter South</td>
                        <td className="px-2.5 py-2 text-slate-600">Acoustic Audio Grid</td>
                        <td className="px-2.5 py-2 text-right text-emerald-600 font-bold">99.8% LIVE</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-2 font-bold text-slate-800">Corridor Beta</td>
                        <td className="px-2.5 py-2 text-slate-600">Thermal Infrared Cam</td>
                        <td className="px-2.5 py-2 text-right text-amber-600 font-bold">STANDBY</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2">
                  <ElevatedControlButton
                    variant="white"
                    className="w-full justify-center text-center"
                    onClick={() => onNavigate?.("multi-agent")}
                  >
                    DEPLOY INTERDICTION SQUADS ➔
                  </ElevatedControlButton>
                </div>
              </div>
            </HoverDepthPanel>

            {/* Selected Hotspot Deep Analysis Card */}
            {selectedHotspot && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ag-floating-card-white p-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono text-xs font-bold text-rose-600">{selectedHotspot.id}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedHotspot(null)}
                    className="text-slate-400 hover:text-slate-800 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-700">
                  <div className="text-xs font-bold text-slate-900">{selectedHotspot.label}</div>
                  <div className="flex justify-between pt-1">
                    <span>Change:</span>
                    <span className="font-bold text-rose-600">{selectedHotspot.changePct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Area Impact:</span>
                    <span className="font-bold text-slate-900">{selectedHotspot.areaKm2} km²</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
