import React from "react";

interface OrbitalSatelliteBaseProps {
  className?: string;
  showGrid?: boolean;
  showCoordinates?: boolean;
  sunGlint?: boolean;
  interactive?: boolean;
}

export default function OrbitalSatelliteBase({
  className = "",
  showGrid = true,
  showCoordinates = true,
  sunGlint = true,
}: OrbitalSatelliteBaseProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden select-none pointer-events-none ${className}`}>
      {/* 1. Deep Ocean Base (Arabian Sea on left, Bay of Bengal on right, South Indian Peninsula) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 45% 85% at 4% 50%, #07263b 0%, #041421 70%, #020b12 100%),
            radial-gradient(ellipse 45% 85% at 96% 50%, #08283d 0%, #041624 70%, #020c14 100%),
            linear-gradient(180deg, #091c29 0%, #030d14 100%)
          `,
        }}
      />

      {/* 2. Seamless Natural-Color Orbital Satellite Terrain Composite */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Natural Color Gradient Palette */}
          {/* Dense Tropical Montane Forest (Western Ghats - Left) */}
          <linearGradient id="tropicalForestGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0a2a16" />
            <stop offset="25%" stopColor="#114526" />
            <stop offset="60%" stopColor="#185c34" />
            <stop offset="100%" stopColor="#226e3f" />
          </linearGradient>

          {/* Transition to Agricultural Fields & Coastal Plain */}
          <linearGradient id="agriculturalPlainGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#256b3e" />
            <stop offset="20%" stopColor="#43773e" />
            <stop offset="50%" stopColor="#7a8d4a" />
            <stop offset="75%" stopColor="#969956" />
            <stop offset="100%" stopColor="#b4a974" />
          </linearGradient>

          {/* Arabian Sea Left Coastal Gradient */}
          <linearGradient id="arabianSeaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#04192b" />
            <stop offset="70%" stopColor="#0b3859" />
            <stop offset="92%" stopColor="#15628a" />
            <stop offset="100%" stopColor="#2289a8" />
          </linearGradient>

          {/* Bay of Bengal Right Coastal Gradient */}
          <linearGradient id="bayOfBengalGrad" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#041a2c" />
            <stop offset="65%" stopColor="#0a395c" />
            <stop offset="88%" stopColor="#16658f" />
            <stop offset="100%" stopColor="#218ba8" />
          </linearGradient>

          {/* Agricultural Field Grid Pattern (Complex farms, crop plots, settlements) */}
          <pattern id="agriFieldsPattern" width="48" height="36" patternUnits="userSpaceOnUse">
            <rect width="22" height="16" fill="#586f3b" fillOpacity="0.45" stroke="#3d4f26" strokeWidth="0.5" />
            <rect x="24" width="22" height="16" fill="#808c4a" fillOpacity="0.35" stroke="#505a2d" strokeWidth="0.5" />
            <rect y="18" width="22" height="16" fill="#697f43" fillOpacity="0.4" stroke="#435329" strokeWidth="0.5" />
            <rect x="24" y="18" width="22" height="16" fill="#9da361" fillOpacity="0.3" stroke="#63693a" strokeWidth="0.5" />
            {/* Rural settlement cluster dots */}
            <circle cx="23" cy="17" r="1.2" fill="#d4cca8" fillOpacity="0.7" />
            <circle cx="47" cy="35" r="1.5" fill="#e8dfba" fillOpacity="0.6" />
          </pattern>

          {/* Micro Field Sub-division */}
          <pattern id="microFarmGrid" width="16" height="12" patternUnits="userSpaceOnUse">
            <rect width="15" height="11" fill="none" stroke="#687840" strokeWidth="0.3" strokeOpacity="0.4" />
          </pattern>

          {/* Mountain Ridge & Terrain Elevation Filter */}
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

          {/* Subtle Sun Glint Specular Shimmer */}
          <linearGradient id="sunGlintArabian" x1="0" y1="0.2" x2="0.6" y2="0.8">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#93c5fd" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.42" />
            <stop offset="55%" stopColor="#67e8f9" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="sunGlintBay" x1="1" y1="0.1" x2="0.4" y2="0.9">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="40%" stopColor="#93c5fd" stopOpacity="0.16" />
            <stop offset="48%" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="56%" stopColor="#67e8f9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* --- 1. ARABIAN SEA (WEST / LEFT) --- */}
        <path d="M 0,0 L 420,0 Q 380,280 320,520 T 260,1000 L 0,1000 Z" fill="url(#arabianSeaGrad)" />
        {sunGlint && (
          <path
            d="M 0,120 Q 220,380 290,600 T 200,950 L 0,800 Z"
            fill="url(#sunGlintArabian)"
            style={{ mixBlendMode: "screen" }}
          />
        )}

        {/* --- 2. BAY OF BENGAL (EAST / RIGHT) --- */}
        <path d="M 1600,0 L 1220,0 Q 1280,320 1340,620 T 1420,1000 L 1600,1000 Z" fill="url(#bayOfBengalGrad)" />
        {sunGlint && (
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
          fill="url(#agriculturalPlainGrad)"
          filter="url(#naturalTerrainShading)"
        />

        {/* --- 4. LUSH MOUNTAINOUS TROPICAL RAINFOREST (WESTERN GHATS - LEFT FLANK) --- */}
        {/* Mountain Base Ridge */}
        <path
          d="
            M 380,0
            C 440,180 410,360 460,540
            C 490,680 430,840 470,1000
            L 260,1000
            Q 320,760 320,520
            T 420,0 Z
          "
          fill="url(#tropicalForestGrad)"
          opacity="0.96"
        />

        {/* High-Elevation Mountain Crests & Deep Valley Ridges */}
        <g stroke="#082111" strokeWidth="3" opacity="0.4" fill="none">
          <path d="M 400,20 Q 450,160 420,320 T 470,620 T 450,960" />
          <path d="M 360,120 Q 410,280 390,440 T 440,780" />
          <path d="M 430,80 Q 480,240 460,480 T 500,840" />
        </g>

        {/* Mountain Ridge Soft Natural Shadows */}
        <path
          d="
            M 390,40 Q 440,200 410,380 T 460,680 T 440,980
            L 480,980 Q 510,700 450,420 T 430,40 Z
          "
          fill="#05170b"
          opacity="0.45"
        />

        {/* --- 5. AGRICULTURAL FIELDS & FARMLAND GRID MATRIX (COASTAL PLAIN) --- */}
        <rect
          x="460"
          y="0"
          width="780"
          height="1000"
          fill="url(#agriFieldsPattern)"
          opacity="0.85"
        />
        <rect
          x="460"
          y="0"
          width="780"
          height="1000"
          fill="url(#microFarmGrid)"
          opacity="0.6"
        />

        {/* Winding River Systems with Natural Alluvial Deltas */}
        <g fill="none" stroke="#228aa6" strokeLinecap="round">
          {/* Major River 1 */}
          <path
            d="M 450,220 C 580,240 700,210 840,280 C 980,340 1120,310 1260,350"
            strokeWidth="3.5"
            strokeOpacity="0.85"
          />
          {/* River 1 Tributaries */}
          <path d="M 520,160 Q 600,210 650,230" strokeWidth="1.8" strokeOpacity="0.6" />
          <path d="M 780,250 Q 860,220 920,290" strokeWidth="2" strokeOpacity="0.65" />

          {/* Major River 2 (Southern Delta) */}
          <path
            d="M 480,680 C 620,690 760,650 920,720 C 1060,780 1200,750 1340,790"
            strokeWidth="4"
            strokeOpacity="0.9"
          />
          <path d="M 920,720 Q 1040,680 1180,720" strokeWidth="2" strokeOpacity="0.6" />
        </g>

        {/* Rural Road & Transit Infrastructure Grid */}
        <g fill="none" stroke="#c2ba95" strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="6 4">
          <path d="M 460,180 L 1260,220" />
          <path d="M 480,420 L 1300,460" />
          <path d="M 470,640 L 1320,670" />
          <path d="M 490,860 L 1360,890" />
          <path d="M 640,0 L 680,1000" />
          <path d="M 880,0 L 920,1000" />
          <path d="M 1100,0 L 1140,1000" />
        </g>
      </svg>

      {/* 3. Minimalist Modern Map Coordinate Grids & Latitude/Longitude Lines */}
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
              {/* Minimal crosshair at grid intersections */}
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

      {/* 4. Precision Flat Perspective Coordinate Labels */}
      {showCoordinates && (
        <div className="absolute inset-x-0 bottom-1.5 flex justify-between px-6 font-mono text-[9px] text-slate-400/70 tracking-widest pointer-events-none select-none">
          <span>76°00'E · ARABIAN SEA</span>
          <span>76°45'E · WESTERN GHATS</span>
          <span>77°30'E · CENTRAL AGRICULTURAL PLAIN</span>
          <span>78°15'E · COROMANDEL COAST</span>
          <span>79°00'E · BAY OF BENGAL</span>
        </div>
      )}

      {/* Subtle top vignette for UI contrast */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/50" />
    </div>
  );
}
