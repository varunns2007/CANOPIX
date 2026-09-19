import React, { type ReactNode } from "react";
import { motion } from "framer-motion";

interface ElevatedControlButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "white" | "warning";
  icon?: ReactNode;
  active?: boolean;
  className?: string;
  pillColor?: string;
}

export default function ElevatedControlButton({
  children,
  onClick,
  variant = "primary",
  icon,
  active = false,
  className = "",
}: ElevatedControlButtonProps) {
  const getButtonStyles = () => {
    switch (variant) {
      case "white":
        return "bg-gradient-to-br from-white to-slate-100 text-slate-900 border-white/95 shadow-[0_4px_10px_rgba(0,0,0,0.12),0_14px_28px_-4px_rgba(0,0,0,0.28),0_0_20px_rgba(255,255,255,0.6)] hover:shadow-[0_8px_18px_rgba(0,0,0,0.2),0_22px_40px_-6px_rgba(0,0,0,0.4),0_0_28px_rgba(255,255,255,0.85)]";
      case "warning":
        return "bg-gradient-to-br from-amber-600 to-amber-900 text-amber-100 border-amber-400/50 shadow-[0_4px_10px_rgba(0,0,0,0.4),0_14px_28px_-4px_rgba(0,0,0,0.6),0_0_18px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_18px_rgba(0,0,0,0.5),0_22px_40px_-6px_rgba(0,0,0,0.7),0_0_28px_rgba(245,158,11,0.6)]";
      case "secondary":
        return "bg-slate-900/90 text-slate-200 border-slate-700/80 shadow-[0_4px_10px_rgba(0,0,0,0.35),0_12px_24px_-4px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.45),0_18px_36px_-6px_rgba(0,0,0,0.65)] hover:border-emerald-400/50 hover:text-white";
      case "primary":
      default:
        return "bg-gradient-to-br from-emerald-600 to-emerald-950 text-emerald-100 border-emerald-400/40 shadow-[0_4px_10px_rgba(0,0,0,0.4),0_14px_28px_-4px_rgba(0,0,0,0.6),0_0_18px_rgba(125,250,209,0.3)] hover:shadow-[0_8px_18px_rgba(0,0,0,0.5),0_22px_40px_-6px_rgba(0,0,0,0.7),0_0_28px_rgba(125,250,209,0.55)] hover:border-emerald-300";
    }
  };

  return (
    <div className="relative inline-flex group">
      {/* Soft contact shadow matrix cast onto satellite ground below */}
      <div className="pointer-events-none absolute -bottom-3 left-2 right-2 h-3.5 rounded-full bg-black/60 blur-md transition-all duration-300 group-hover:-bottom-4.5 group-hover:scale-95 group-hover:opacity-80 group-hover:blur-lg" />

      {/* Invisible Force Pillar Indicator glow */}
      <div className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-2 w-12 bg-emerald-400/20 blur-sm transition-all duration-300 group-hover:w-16 group-hover:bg-emerald-400/40" />

      <motion.button
        type="button"
        data-cursor-hover
        whileHover={{ y: -3.5, scale: 1.02 }}
        whileTap={{ y: 0, scale: 0.98 }}
        onClick={onClick}
        className={`relative z-10 flex items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition-colors duration-200 ${getButtonStyles()} ${
          active ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950" : ""
        } ${className}`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </motion.button>
    </div>
  );
}
