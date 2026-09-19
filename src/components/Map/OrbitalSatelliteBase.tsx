import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SpectrumMode = "optical" | "ndvi" | "elevation" | "infrared";

interface OrbitalSatelliteBaseProps {
  className?: string;
  showGrid?: boolean;
  showCoordinates?: boolean;
  sunGlint?: boolean;
  spectrum?: SpectrumMode;
}

export default function OrbitalSatelliteBase({
  className = "",
  showGrid = true,
  showCoordinates = true,
  sunGlint = true,
  spectrum = "optical",
}: OrbitalSatelliteBaseProps) {
  // Dynamic Spectral Shaders and Styling Configuration
  const getSpectrumShaders = () => {
    switch (spectrum) {
      case "ndvi":
        return {
          oceanBg: "radial-gradient(ellipse 45% 85% at 4% 50%, #03141f 0%, #020b12 100%), radial-gradient(ellipse 45% 85% at 96% 50%, #031521 0%, #020c14 100%), linear-gradient(180deg, #051420 0%, #01060a 100%)",
          forestGrad: ["#022c16", "#059669", "#10b981", "#34d399"],
          plainGrad: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
          agriFill: "#f59e0b",
          agriOpacity: 0.65,
          seaGrad: ["#020b12", "#04192b", "#093352"],
          hazeFilter: "hue-rotate(20deg) saturate(2.2) contrast(1.3)",
          badgeLabel: "NDVI VEGETATION INDEX · B08/B04 (NIR/RED)",
          badgeColor: "#10b981",
        };
      case "elevation":
        return {
          oceanBg: "radial-gradient(ellipse 45% 85% at 4% 50%, #081a24 0%, #02080d 100%), radial-gradient(ellipse 45% 85% at 96% 50%, #081b26 0%, #02090e 100%), linear-gradient(180deg, #0a1b24 0%, #02070c 100%)",
          forestGrad: ["#1c1917", "#44403c", "#78716c", "#d6d3d1"],
          plainGrad: ["#44403c", "#78716c", "#a8a29e", "#e7e5e4"],
          agriFill: "#78716c",
          agriOpacity: 0.45,
          seaGrad: ["#030712", "#0b1220", "#111827"],
          hazeFilter: "grayscale(0.85) contrast(1.5) brightness(1.1)",
          badgeLabel: "DIGITAL ELEVATION MODEL (DEM) · SRTM TOPO",
          badgeColor: "#cbd5e1",
        };
      case "infrared":
        return {
          oceanBg: "radial-gradient(ellipse 45% 85% at 4% 50%, #020814 0%, #01040a 100%), radial-gradient(ellipse 45% 85% at 96% 50%, #020814 0%, #01040a 100%), linear-gradient(180deg, #020610 0%, #000205 100%)",
          forestGrad: ["#881337", "#be123c", "#e11d48", "#f43f5e"],
          plainGrad: ["#e11d48", "#fb7185", "#06b6d4", "#0891b2"],
          agriFill: "#06b6d4",
          agriOpacity: 0.55,
          seaGrad: ["#010409", "#020a17", "#031226"],
          hazeFilter: "hue-rotate(300deg) saturate(2.4) contrast(1.25)",
          badgeLabel: "COLOR INFRARED (CIR) · B08/B04/B03 FALSE COLOR",
          badgeColor: "#f43f5e",
        };
      case "optical":
      default:
        return {
          oceanBg: "radial-gradient(ellipse 45% 85% at 4% 50%, #07263b 0%, #041421 70%, #020b12 100%), radial-gradient(ellipse 45% 85% at 96% 50%, #08283d 0%, #041624 70%, #020c14 100%), linear-gradient(180deg, #091c29 0%, #030d14 100%)",
          forestGrad: ["#0a2a16", "#114526", "#185c34", "#226e3f"],
          plainGrad: ["#256b3e", "#43773e", "#7a8d4a", "#b4a974"],
          agriFill: "#586f3b",
          agriOpacity: 0.85,
          seaGrad: ["#04192b", "#0b3859", "#15628a", "#2289a8"],
          hazeFilter: "none",
          badgeLabel: "TRUE COLOR OPTICAL · B04/B03/B02 (NATURAL RGB)",
          badgeColor: "#38bdf8",
        };
    }
  };

  const currentCfg = getSpectrumShaders();

  return (
    <div className={`absolute inset-0 overflow-hidden select-none pointer-events-none transition-all duration-700 ${className}`}>
      {/* 1. Deep Ocean Base */}
      <motion.div
        className="absolute inset-0 transition-all duration-700"
        style={{ background: currentCfg.oceanBg }}
      />

      {/* 2. Seamless Natural-Color Orbital Satellite Terrain Composite */}
      <svg
        className="absolute inset-0 h-full w-full transition-all duration-700"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: currentCfg.hazeFilter }}
      >
        <defs>
          {/* Tropical Forest Gradient */}
          <linearGradient id="activeForestGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={currentCfg.forestGrad[0]} />
            <stop offset="30%" stopColor={currentCfg.forestGrad[1]} />
            <stop offset="70%" stopColor={currentCfg.forestGrad[2]} />
            <stop offset="100%" stopColor={currentCfg.forestGrad[3]} />
          </linearGradient>

          {/* Agricultural Plain Gradient */}
          <linearGradient id="activePlainGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={currentCfg.plainGrad[0]} />
            <stop offset="35%" stopColor={currentCfg.plainGrad[1]} />
            <stop offset="70%" stopColor={currentCfg.plainGrad[2]} />
            <stop offset="100%" stopColor={currentCfg.plainGrad[3]} />
          </linearGradient>

          {/* Arabian Sea Left Coastal Gradient */}
          <linearGradient id="activeArabianSeaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={currentCfg.seaGrad[0]} />
            <stop offset="70%" stopColor={currentCfg.seaGrad[1] || currentCfg.seaGrad[0]} />
            <stop offset="100%" stopColor={currentCfg.seaGrad[2] || currentCfg.seaGrad[1]} />
          </linearGradient>

          {/* Bay of Bengal Right Coastal Gradient */}
          <linearGradient id="activeBayOfBengalGrad" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor={currentCfg.seaGrad[0]} />
            <stop offset="70%" stopColor={currentCfg.seaGrad[1] || currentCfg.seaGrad[0]} />
            <stop offset="100%" stopColor={currentCfg.seaGrad[2] || currentCfg.seaGrad[1]} />
          </linearGradient>

          {/* Agricultural Field Grid Pattern */}
          <pattern id="activeAgriPattern" width="48" height="36" patternUnits="userSpaceOnUse">
            <rect width="22" height="16" fill={currentCfg.agriFill} fillOpacity="0.45" stroke="#3d4f26" strokeWidth="0.5" />
            <rect x="24" width="22" height="16" fill={currentCfg.agriFill} fillOpacity="0.3" stroke="#505a2d" strokeWidth="0.5" />
            <rect y="18" width="22" height="16" fill={currentCfg.agriFill} fillOpacity="0.4" stroke="#435329" strokeWidth="0.5" />
            <rect x="24" y="18" width="22" height="16" fill={currentCfg.agriFill} fillOpacity="0.25" stroke="#63693a" strokeWidth="0.5" />
            <circle cx="23" cy="17" r="1.2" fill="#d4cca8" fillOpacity="0.7" />
            <circle cx="47" cy="35" r="1.5" fill="#e8dfba" fillOpacity="0.6" />
          </pattern>

          {/* Micro Farm Subdivision */}
          <pattern id="activeMicroFarm" width="16" height="12" patternUnits="userSpaceOnUse">
            <rect width="15" height="11" fill="none" stroke="#687840" strokeWidth="0.3" strokeOpacity="0.4" />
          </pattern>

          {/* Topographic Contour Ridge Line Pattern for ELEVATION mode */}
          <pattern id="topoElevationContours" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 0,20 Q 20,5 40,20 M 0,35 Q 20,20 40,35" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
          </pattern>

          {/* Mountain Ridge Shading Filter */}
          <filter id="naturalTerrainShading" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.008" numOctaves="4" result="terrainNoise" />
            <feColorMatrix
              type="matrix"
              values="
                0.35 0.55 0.10 0 0
                0.20 0.65 0.15 0 0
                0.05 0.25 0.40 0 0
                0    0    0    1 0"
              result="coloredNoise"
            />
            <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
          </filter>

          {/* Sun Glints */}
          <linearGradient id="sunGlintArabian" x1="0" y1="0.2" x2="0.6" y2="0.8">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="sunGlintBay" x1="1" y1="0.1" x2="0.4" y2="0.9">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* --- 1. ARABIAN SEA (WEST / LEFT) --- */}
        <path d="M 0,0 L 420,0 Q 380,280 320,520 T 260,1000 L 0,1000 Z" fill="url(#activeArabianSeaGrad)" />
        {sunGlint && spectrum !== "infrared" && (
          <path
            d="M 0,120 Q 220,380 290,600 T 200,950 L 0,800 Z"
            fill="url(#sunGlintArabian)"
            style={{ mixBlendMode: "screen" }}
          />
        )}

        {/* --- 2. BAY OF BENGAL (EAST / RIGHT) --- */}
        <path d="M 1600,0 L 1220,0 Q 1280,320 1340,620 T 1420,1000 L 1600,1000 Z" fill="url(#activeBayOfBengalGrad)" />
        {sunGlint && spectrum !== "infrared" && (
          <path
            d="M 1600,80 Q 1380,340 1310,580 T 1400,920 L 1600,850 Z"
            fill="url(#sunGlintBay)"
            style={{ mixBlendMode: "screen" }}
          />
        )}

        {/* --- 3. MAIN CONTINENTAL LANDMASS / PENINSULA --- */}
        <path
          d="
            M 420,0
            L 1220,0
            Q 1280,320 1340,620
            T 1420,1000
            L 260,1000
            Q 320,760 320,520
            T 420,0 Z
          "
          fill="url(#activePlainGrad)"
          filter="url(#naturalTerrainShading)"
        />

        {/* --- 4. LUSH MOUNTAINOUS TROPICAL RAINFOREST (WESTERN GHATS - LEFT FLANK) --- */}
        <path
          d="
            M 380,0
            C 440,180 410,360 460,540
            C 490,680 430,840 470,1000
            L 260,1000
            Q 320,760 320,520
            T 420,0 Z
          "
          fill="url(#activeForestGrad)"
          opacity="0.96"
        />

        {/* Mountain Ridge & Valley Shadows */}
        <g stroke={spectrum === "infrared" ? "#4c0519" : "#082111"} strokeWidth="3" opacity="0.4" fill="none">
          <path d="M 400,20 Q 450,160 420,320 T 470,620 T 450,960" />
          <path d="M 360,120 Q 410,280 390,440 T 440,780" />
          <path d="M 430,80 Q 480,240 460,480 T 500,840" />
        </g>

        {/* Elevation Contour Overlay (Active when in ELEVATION mode) */}
        {spectrum === "elevation" && (
          <rect x="260" y="0" width="1160" height="1000" fill="url(#topoElevationContours)" opacity="0.75" />
        )}

        {/* --- 5. AGRICULTURAL FIELDS & FARMLAND GRID MATRIX --- */}
        <rect
          x="460"
          y="0"
          width="780"
          height="1000"
          fill="url(#activeAgriPattern)"
          opacity={currentCfg.agriOpacity}
        />
        <rect
          x="460"
          y="0"
          width="780"
          height="1000"
          fill="url(#activeMicroFarm)"
          opacity="0.5"
        />

        {/* Rivers & Watercourses */}
        <g fill="none" stroke={spectrum === "infrared" ? "#0284c7" : "#228aa6"} strokeLinecap="round">
          <path d="M 450,220 C 580,240 700,210 840,280 C 980,340 1120,310 1260,350" strokeWidth="3.5" strokeOpacity="0.85" />
          <path d="M 480,680 C 620,690 760,650 920,720 C 1060,780 1200,750 1340,790" strokeWidth="4" strokeOpacity="0.9" />
        </g>

        {/* Transit Highways */}
        <g fill="none" stroke={spectrum === "elevation" ? "#e2e8f0" : "#c2ba95"} strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="6 4">
          <path d="M 460,180 L 1260,220" />
          <path d="M 480,420 L 1300,460" />
          <path d="M 470,640 L 1320,670" />
          <path d="M 490,860 L 1360,890" />
          <path d="M 640,0 L 680,1000" />
          <path d="M 880,0 L 920,1000" />
        </g>
      </svg>

      {/* 3. Modern Coordinate Grids */}
      {showGrid && (
        <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="latLongGrid" width="160" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M 160 0 L 0 0 0 120"
                fill="none"
                stroke="rgba(226, 232, 240, 0.45)"
                strokeWidth="0.75"
                strokeDasharray="4 4"
              />
              <path
                d="M -4,0 L 4,0 M 0,-4 L 0,4"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#latLongGrid)" />
        </svg>
      )}

      {/* 4. Active Spectrum Indicator Pill at bottom-left */}
      <div className="absolute top-3 left-4 flex items-center gap-2 rounded-lg border border-white/40 bg-slate-950/85 px-3 py-1 font-mono text-[10px] font-bold text-white shadow-xl backdrop-blur-md">
        <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: currentCfg.badgeColor }} />
        <span>{currentCfg.badgeLabel}</span>
      </div>

      {/* 5. Precision Flat Perspective Coordinate Labels */}
      {showCoordinates && (
        <div className="absolute inset-x-0 bottom-1.5 flex justify-between px-6 font-mono text-[9px] text-slate-400/70 tracking-widest pointer-events-none select-none">
          <span>76°00'E · ARABIAN SEA</span>
          <span>76°45'E · WESTERN GHATS</span>
          <span>77°30'E · CENTRAL AGRICULTURAL PLAIN</span>
          <span>78°15'E · COROMANDEL COAST</span>
          <span>79°00'E · BAY OF BENGAL</span>
        </div>
      )}

      {/* Subtle top vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/50" />
    </div>
  );
}
