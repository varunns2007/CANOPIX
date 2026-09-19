import React, { type ReactNode } from "react";
import { motion } from "framer-motion";

interface StandardFloatingCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  styleVariant?: "white" | "slate" | "glass";
  elevation?: "low" | "medium" | "high";
  delay?: number;
}

export default function StandardFloatingCard({
  title,
  subtitle,
  badge,
  badgeColor = "#10b981",
  icon,
  children,
  className = "",
  styleVariant = "white",
  elevation = "high",
  delay = 0,
}: StandardFloatingCardProps) {
  const getElevationShadow = () => {
    switch (elevation) {
      case "high":
        return "shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_24px_-4px_rgba(0,0,0,0.28),0_28px_56px_-10px_rgba(0,0,0,0.45)]";
      case "medium":
        return "shadow-[0_2px_4px_rgba(0,0,0,0.05),0_8px_16px_-2px_rgba(0,0,0,0.22),0_18px_36px_-6px_rgba(0,0,0,0.35)]";
      case "low":
      default:
        return "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_6px_12px_-2px_rgba(0,0,0,0.18),0_12px_24px_-4px_rgba(0,0,0,0.25)]";
    }
  };

  const getVariantStyles = () => {
    switch (styleVariant) {
      case "white":
        return "bg-white/95 text-slate-900 border-white/90";
      case "slate":
        return "bg-slate-900/90 text-slate-100 border-slate-700/60";
      case "glass":
      default:
        return "bg-slate-950/80 text-emerald-100 border-emerald-500/20 backdrop-blur-xl";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative rounded-xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 ${getVariantStyles()} ${getElevationShadow()} ${className}`}
    >
      {/* Dynamic contact shadow matrix on base satellite layer */}
      <div className="pointer-events-none absolute -bottom-5 left-4 right-4 h-5 rounded-full bg-black/40 blur-md transition-all duration-300 group-hover:-bottom-6 group-hover:scale-95 group-hover:opacity-60" />

      {/* Header section */}
      {(title || badge || icon) && (
        <div className={`flex items-center justify-between border-b px-4 py-3 ${styleVariant === "white" ? "border-slate-200" : "border-white/10"}`}>
          <div className="flex items-center gap-2.5">
            {icon && <div className={styleVariant === "white" ? "text-emerald-700" : "text-emerald-400"}>{icon}</div>}
            <div>
              {title && (
                <h4 className={`font-sans text-xs font-bold tracking-wide uppercase ${styleVariant === "white" ? "!text-slate-900" : "text-white"}`}>
                  {title}
                </h4>
              )}
              {subtitle && (
                <p className={`text-[10px] font-mono ${styleVariant === "white" ? "!text-slate-600" : "text-slate-400"}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {badge && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase shadow-xs"
              style={{
                backgroundColor: styleVariant === "white" ? `${badgeColor}20` : `${badgeColor}25`,
                color: styleVariant === "white" ? "#065f46" : badgeColor,
                border: `1px solid ${badgeColor}60`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className={`p-4 ${styleVariant === "white" ? "text-slate-900" : "text-slate-100"}`}>{children}</div>
    </motion.div>
  );
}
