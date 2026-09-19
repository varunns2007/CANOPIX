import { motion } from "framer-motion";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * Animated donut chart -- each slice sweeps in from 0 on mount, mirroring
 * the reference dashboard's "Carbon Offset Sources" donut. A legend with
 * live value labels sits beside it.
 */
export default function DonutChart({
  data,
  size = 140,
  strokeWidth = 20,
}: {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={strokeWidth} />
        {data.map((slice, i) => {
          const fraction = slice.value / total;
          const dash = circumference * fraction;
          const gap = circumference - dash;
          const rotationOffset = cumulative;
          cumulative += fraction;
          return (
            <motion.circle
              key={slice.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${gap}`}
              initial={{ strokeDashoffset: circumference, opacity: 0 }}
              animate={{ strokeDashoffset: -rotationOffset * circumference, opacity: 1 }}
              transition={{ duration: 1, delay: 0.15 + i * 0.12, ease: "easeOut" }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-1">
        {data.map((slice, i) => (
          <motion.div
            key={slice.label}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="font-mono text-[9px] tracking-wide text-ash-500">{slice.label}</span>
            <span className="font-mono text-[9px] text-ash-100">{slice.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
