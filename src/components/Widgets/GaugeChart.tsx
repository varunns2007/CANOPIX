import { motion } from "framer-motion";

/**
 * Animated radial gauge, mirroring the "Operational Efficiency" style arc
 * from the reference dashboard: a dark track with a glowing mint/forest
 * arc that sweeps in on mount, plus a large centered percentage readout.
 */
export default function GaugeChart({
  value,
  label,
  size = 148,
  strokeWidth = 12,
}: {
  value: number; // 0-100
  label: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half-circle arc
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + strokeWidth / 2} viewBox={`0 0 ${size} ${size / 2 + strokeWidth / 2}`}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-forest-500)" />
            <stop offset="100%" stopColor="var(--color-mint-400)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${strokeWidth / 2},${cy} A ${radius},${radius} 0 0 1 ${size - strokeWidth / 2},${cy}`}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated value arc */}
        <motion.path
          d={`M ${strokeWidth / 2},${cy} A ${radius},${radius} 0 0 1 ${size - strokeWidth / 2},${cy}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 6px rgba(125,250,209,0.55))" }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="-mt-7 text-center"
      >
        <div className="font-display text-2xl text-ash-100 text-glow-mint">{Math.round(clamped)}%</div>
        <div className="mt-0.5 font-mono text-[10px] tracking-[0.15em] text-ash-500">{label}</div>
      </motion.div>
    </div>
  );
}
