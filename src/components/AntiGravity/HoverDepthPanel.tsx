import React, { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

interface HoverDepthPanelProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  theme?: "white" | "dark";
}

export default function HoverDepthPanel({
  title,
  subtitle,
  children,
  className = "",
  theme = "white",
}: HoverDepthPanelProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shadowOffset, setShadowOffset] = useState({ x: 0, y: 25 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -8; // Max 8 deg tilt
    const rotY = ((x - centerX) / centerX) * 8;

    setRotateX(rotX);
    setRotateY(rotY);

    // Multi-directional dynamic contact shadow offset
    setShadowOffset({
      x: (x - centerX) * -0.06,
      y: 24 + (y - centerY) * 0.08,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setShadowOffset({ x: 0, y: 25 });
    setIsHovered(false);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className={`relative inline-block w-full ${className}`}
      onMouseMove={(e) => {
        setIsHovered(true);
        handleMouseMove(e);
      }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic Multi-Directional Contact Shadow on Terrain Layer Below */}
      <motion.div
        className="pointer-events-none absolute inset-x-4 h-10 rounded-2xl bg-black/60 blur-xl"
        animate={{
          bottom: isHovered ? -16 : -8,
          x: shadowOffset.x,
          y: shadowOffset.y,
          opacity: isHovered ? 0.75 : 0.45,
          scale: isHovered ? 0.96 : 0.98,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />

      {/* Floating 3D Air-Gap Card */}
      <motion.div
        ref={cardRef}
        animate={{
          rotateX,
          rotateY,
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.01 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          transformStyle: "preserve-3d",
        }}
        className={`relative z-10 rounded-xl border p-5 transition-shadow duration-300 ${
          theme === "white"
            ? "border-white/90 bg-white/95 text-slate-900 shadow-[0_4px_8px_rgba(0,0,0,0.08),0_16px_32px_-4px_rgba(0,0,0,0.25),0_36px_72px_-10px_rgba(0,0,0,0.4)]"
            : "border-emerald-500/25 bg-slate-950/85 text-emerald-100 shadow-[0_6px_12px_rgba(0,0,0,0.4),0_20px_40px_-6px_rgba(0,0,0,0.7),0_42px_80px_-12px_rgba(0,0,0,0.85)]"
        }`}
      >
        {/* Anti-Gravity Specular Edge Reflection */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60" />

        {(title || subtitle) && (
          <div className={`mb-4 border-b pb-3 ${theme === "white" ? "border-slate-200" : "border-white/10"}`} style={{ transform: "translateZ(18px)" }}>
            {title && (
              <h3 className={`font-sans text-sm font-bold uppercase tracking-wider ${theme === "white" ? "!text-slate-900" : "text-white"}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`mt-0.5 font-mono text-[11px] ${theme === "white" ? "!text-slate-600" : "text-slate-400"}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div style={{ transform: "translateZ(24px)" }}>{children}</div>
      </motion.div>
    </div>
  );
}
