import { motion } from "framer-motion";
import { HOTSPOTS, riskColor } from "../data/mockData";

const STATUS_LABEL: Record<string, string> = {
  REQUIRES_VERIFICATION: "Requires Field Verification",
  UNDER_REVIEW: "Under Review",
  VERIFIED_FIELD_TEAM: "Verified by Field Team",
};

export default function Hotspots() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg tracking-wide text-ash-100">Potential Forest-Loss Hotspots</h1>
          <p className="mt-0.5 font-mono text-[11px] text-ash-500">AI-assisted risk assessment · requires field verification</p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-earth-400">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-earth-500" />
          {HOTSPOTS.length} ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {HOTSPOTS.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09, duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden border border-line/70 bg-panel/40 p-4"
          >
            {(h.risk === "HIGH" || h.risk === "CRITICAL") && (
              <div
                className="pointer-events-none absolute inset-0 animate-pulse-soft"
                style={{ boxShadow: `inset 0 0 0 1px ${riskColor(h.risk)}55` }}
              />
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-xs text-gold-400">{h.id}</div>
                <div className="text-sm text-ash-100">{h.label}</div>
              </div>
              <span
                className="rounded-sm px-2 py-0.5 font-mono text-[10px] tracking-wider"
                style={{ color: riskColor(h.risk), border: `1px solid ${riskColor(h.risk)}66` }}
              >
                {h.risk} RISK
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-ash-300">
              <div>
                <div className="text-ash-500">Density</div>
                <div>{h.densityBefore}% → {h.densityAfter}%</div>
              </div>
              <div>
                <div className="text-ash-500">Change</div>
                <div className="text-earth-400">{h.changePct}%</div>
              </div>
              <div>
                <div className="text-ash-500">Area</div>
                <div>{h.areaKm2} km²</div>
              </div>
              <div>
                <div className="text-ash-500">Confidence</div>
                <div>{h.confidence}%</div>
              </div>
            </div>

            <div className="mt-3 h-1 w-full bg-line/60">
              <div className="h-full bg-gold-500" style={{ width: `${h.confidence}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 font-mono text-[10px]">
              <span className="text-ash-500">{STATUS_LABEL[h.status]}</span>
              <span className="text-ash-700">{h.detectedOn}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
