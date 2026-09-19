import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import { ANALYTICS_SUMMARY, HOTSPOTS, TIMELINE_SERIES, riskColor } from "../data/mockData";
import CountUp from "../components/Widgets/CountUp";
import GaugeChart from "../components/Widgets/GaugeChart";
import DonutChart from "../components/Widgets/DonutChart";
import ForestCanvasMap from "../components/Map/ForestCanvasMap";
import DemoScenarioButton from "../components/Demo/DemoScenarioButton";
import type { PageId } from "../nav";

export default function Overview({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] tracking-wider text-ash-300 font-semibold">COMMAND CENTER</span>
            <button
              type="button"
              data-cursor-hover
              onClick={() => onNavigate("reports")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-3 py-1.5 font-mono text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/35 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_12px_rgba(125,250,209,0.35)]"
            >
              <span>📊</span> FOREST INTELLIGENCE REPORTS ➔
            </button>
            <button
              type="button"
              data-cursor-hover
              onClick={() => onNavigate("range-detector")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-mint-500/50 bg-mint-500/10 px-2.5 py-1.5 font-mono text-[10px] font-bold text-mint-300 hover:bg-mint-500/25 transition-colors shadow-[0_0_8px_rgba(125,250,209,0.25)]"
            >
              <span>⌖</span> SCAN FOREST RANGE ➔
            </button>
          </div>
          <DemoScenarioButton />
        </div>
        <HUDFrame label="FOREST REGION · ORBITAL REAL-TIME MONITORING" scanline className="min-h-[320px] flex-1 overflow-hidden shadow-2xl rounded-xl">
          <ForestCanvasMap onOpen={() => onNavigate("forest-explorer")} />
        </HUDFrame>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "TREE COVER", value: ANALYTICS_SUMMARY.canopyDensityPct, suffix: "%" },
            { label: "FOREST SIZE", value: ANALYTICS_SUMMARY.forestAreaKm2, suffix: " km²" },
            { label: "TROUBLE SPOTS", value: ANALYTICS_SUMMARY.hotspotCount, suffix: "" },
            { label: "LOST THIS YEAR", value: ANALYTICS_SUMMARY.forestLossKm2Ytd, suffix: " km²" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              className="ag-detached-pane p-4"
            >
              <div className="font-mono text-[10px] tracking-[0.15em] text-emerald-300/80 font-bold">{s.label}</div>
              <div className="mt-1 font-display text-2xl text-white font-bold">
                <CountUp value={s.value} decimals={s.value % 1 !== 0 ? 1 : 0} />
                <span className="text-base text-slate-300">{s.suffix}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4">
        <HUDFrame label="SYSTEM STATUS" className="ag-detached-pane p-4 rounded-xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
            <GaugeChart value={ANALYTICS_SUMMARY.canopyDensityPct} label="CANOPY HEALTH" size={124} strokeWidth={10} />
            <DonutChart
              size={92}
              strokeWidth={14}
              data={ANALYTICS_SUMMARY.riskDistribution.map((r) => ({
                label: r.label,
                value: r.value,
                color: riskColor(r.label as any),
              }))}
            />
          </div>
        </HUDFrame>

        <HUDFrame label="RECENT HOTSPOTS" className="ag-detached-pane flex-1 overflow-y-auto p-2 rounded-xl">
          <div className="space-y-1.5 p-1.5">
            {HOTSPOTS.slice(0, 4).map((h, i) => (
              <motion.button
                data-cursor-hover
                key={h.id}
                onClick={() => onNavigate("threat-intel")}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex w-full items-center justify-between border border-white/10 bg-slate-900/60 rounded-lg px-3 py-2 text-left transition-all hover:border-emerald-400/50 hover:bg-slate-800/80 shadow-xs"
              >
                <div>
                  <div className="font-mono text-[11px] text-white font-bold">{h.id}</div>
                  <div className="text-[11px] text-slate-400">{h.label}</div>
                </div>
                <span
                  className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider"
                  style={{ color: riskColor(h.risk), border: `1px solid ${riskColor(h.risk)}55`, backgroundColor: `${riskColor(h.risk)}15` }}
                >
                  {h.risk}
                </span>
              </motion.button>
            ))}
          </div>
        </HUDFrame>

        <HUDFrame label="6-MONTH TREE COVER TREND" className="ag-detached-pane p-4 rounded-xl">
          <MiniTrend />
        </HUDFrame>
      </div>
    </div>
  );
}

function MiniTrend() {
  const points = TIMELINE_SERIES.map((d) => d.density);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 260;
  const h = 70;
  const linePath = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min || 1)) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-mint-400)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--color-mint-400)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#trendFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--color-mint-400)"
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter: "drop-shadow(0 0 5px rgba(125,250,209,0.6))" }}
      />
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - ((p - min) / (max - min || 1)) * h;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={2.4}
            fill="var(--color-forest-500)"
            stroke="var(--color-mint-300)"
            strokeWidth={1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 + i * 0.05 }}
          />
        );
      })}
    </svg>
  );
}
