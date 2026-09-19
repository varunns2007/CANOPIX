import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import BackendBadge from "../components/Backend/BackendBadge";
import { listRisk } from "../api/client";
import { RISK_RESULTS_DEMO, type RiskResult } from "../data/mockData";

const RATING_COLOR: Record<string, string> = {
  CRITICAL: "var(--color-earth-500)",
  HIGH: "var(--color-earth-400)",
  MODERATE: "var(--color-gold-500)",
  LOW: "var(--color-forest-400)",
};

export default function RiskAnalyticsPage() {
  const [results, setResults] = useState<RiskResult[]>(RISK_RESULTS_DEMO);
  const [selected, setSelected] = useState<RiskResult | null>(RISK_RESULTS_DEMO[0]);

  useEffect(() => {
    listRisk().then((res) => {
      if (res.ok && res.data.results?.length) {
        // The live backend's RiskResult doesn't carry the decorative
        // registration_number/make_model fields the demo dataset shows --
        // those are demo-only flavour text, so we fall back to the
        // vehicle_id it does send rather than pretending the field exists.
        const mapped: RiskResult[] = res.data.results.map((r) => ({
          vehicle_id: r.vehicle_id,
          registration_number: r.vehicle_id,
          make_model: "Live telemetry vehicle",
          risk_score: r.risk_score,
          rating: r.rating,
          breakdown: r.breakdown,
        }));
        setResults(mapped);
        setSelected(mapped[0]);
      }
    });
  }, []);

  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[11px] tracking-wider text-ash-500">RISK QUEUE</div>
          <BackendBadge />
        </div>
        {results.map((r, i) => (
          <motion.button
            data-cursor-hover
            key={r.vehicle_id}
            onClick={() => setSelected(r)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`border px-3 py-3 text-left transition-colors ${
              selected?.vehicle_id === r.vehicle_id ? "border-gold-500/60 bg-panel/60" : "border-line/60 bg-panel/30 hover:border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ash-100">#{r.vehicle_id}</span>
              <span
                className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] tracking-wider"
                style={{ color: RATING_COLOR[r.rating], border: `1px solid ${RATING_COLOR[r.rating]}66` }}
              >
                {r.rating}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-line/60">
              <div className="h-full" style={{ width: `${r.risk_score}%`, backgroundColor: RATING_COLOR[r.rating] }} />
            </div>
            <div className="mt-1 text-right font-mono text-[10px] text-ash-500">{r.risk_score}/100</div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.vehicle_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-4 overflow-y-auto"
          >
            <HUDFrame label="EXPLAINABLE RISK SCORE" className="p-5">
              <div className="flex items-center gap-6">
                <RiskDial score={selected.risk_score} color={RATING_COLOR[selected.rating]} />
                <div>
                  <div className="font-mono text-xs text-ash-500">VEHICLE #{selected.vehicle_id}</div>
                  <div className="font-display text-3xl" style={{ color: RATING_COLOR[selected.rating] }}>
                    {selected.rating}
                  </div>
                  <div className="font-mono text-[11px] text-ash-500">Investigation Risk Score: {selected.risk_score}/100</div>
                </div>
              </div>
            </HUDFrame>

            <HUDFrame label="FACTOR BREAKDOWN" className="flex-1 p-4">
              <div className="space-y-3">
                {selected.breakdown.map((f, i) => (
                  <motion.div
                    key={f.factor}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`border px-3 py-2.5 ${f.triggered ? "border-gold-500/40 bg-gold-500/5" : "border-line/50 bg-panel/20"}`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className={f.triggered ? "text-ash-100" : "text-ash-500"}>{f.factor}</span>
                      <span className={f.triggered ? "text-gold-400" : "text-ash-700"}>
                        +{f.points} / {f.max_points}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full bg-line/50">
                      <motion.div
                        className="h-full bg-gold-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.points / f.max_points) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08 }}
                      />
                    </div>
                    <div className="mt-1.5 font-mono text-[10px] text-ash-500">{f.detail}</div>
                  </motion.div>
                ))}
              </div>
            </HUDFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RiskDial({ score, color }: { score: number; color: string }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90">
      <circle cx={50} cy={50} r={r} fill="none" stroke="var(--color-line)" strokeWidth={8} />
      <motion.circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - score / 100) }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}
