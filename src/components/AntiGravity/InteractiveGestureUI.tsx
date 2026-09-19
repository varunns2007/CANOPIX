import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Sparkles, Move3d, Radio, Eye, Crosshair } from "lucide-react";

interface LevitatingNode {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
  risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  ndvi: number;
  treesProtected: string;
}

const SAMPLE_NODES: LevitatingNode[] = [
  { id: "NODE-ALPHA", name: "Seshachalam Red Sanders Core", x: 42, y: 35, risk: "CRITICAL", ndvi: 0.62, treesProtected: "Pterocarpus santalinus (3,420 ha)" },
  { id: "NODE-BETA", name: "Anamalai Western Ridge Corridor", x: 68, y: 55, risk: "HIGH", ndvi: 0.74, treesProtected: "Evergreen Shola Complex (1,850 ha)" },
  { id: "NODE-GAMMA", name: "Mudumalai Buffer Perimeter", x: 28, y: 65, risk: "MEDIUM", ndvi: 0.81, treesProtected: "Teak & Rosewood Reserve (920 ha)" },
  { id: "NODE-DELTA", name: "Palani Hills Ridge Intercept", x: 55, y: 78, risk: "LOW", ndvi: 0.88, treesProtected: "Montane Cloud Forest (2,100 ha)" },
];

export default function InteractiveGestureUI({
  onSelectNode,
  activeNodeId,
}: {
  onSelectNode?: (node: LevitatingNode) => void;
  activeNodeId?: string | null;
}) {
  const [gestureMode, setGestureMode] = useState<"orbit" | "pinch" | "forceField" | "raycast">("orbit");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isGesturing, setIsGesturing] = useState(false);

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x, y });
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden select-none"
      onMouseMove={handleContainerMouseMove}
      onMouseDown={() => setIsGesturing(true)}
      onMouseUp={() => setIsGesturing(false)}
    >
      {/* Gesture Control HUD Bar */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 font-sans text-xs font-bold text-slate-900">
          <Hand className="h-4 w-4 text-emerald-600 animate-pulse" />
          <span>GESTURE UI</span>
        </div>
        <div className="flex items-center gap-1">
          {[
            { id: "orbit", label: "Levitation", icon: Move3d },
            { id: "pinch", label: "Pinch Depth", icon: Sparkles },
            { id: "forceField", label: "Force Ray", icon: Radio },
            { id: "raycast", label: "Target Lock", icon: Crosshair },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              data-cursor-hover
              onClick={() => setGestureMode(mode.id as any)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold transition-all ${
                gestureMode === mode.id
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <mode.icon className="h-3 w-3" />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Raycast Force-Field lines connecting cursor to nearest floating node */}
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
        {SAMPLE_NODES.map((node) => {
          const isNodeActive = hoveredNode === node.id || activeNodeId === node.id;
          return (
            <g key={`beam-${node.id}`}>
              {/* Force field beam when in forceField/pinch mode */}
              {(gestureMode === "forceField" || isNodeActive) && (
                <line
                  x1={`${cursorPos.x}%`}
                  y1={`${cursorPos.y}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={isNodeActive ? "rgba(125,250,209,0.85)" : "rgba(255,255,255,0.25)"}
                  strokeWidth={isNodeActive ? "1.8" : "0.8"}
                  strokeDasharray={isNodeActive ? "4 2" : "2 4"}
                  className={isNodeActive ? "animate-pulse" : ""}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Levitating Nodes with Tiny Precise Contact Shadows on Ground */}
      {SAMPLE_NODES.map((node) => {
        const isHovered = hoveredNode === node.id;
        const isSelected = activeNodeId === node.id;

        const getRiskColor = () => {
          switch (node.risk) {
            case "CRITICAL": return "#f43f5e";
            case "HIGH": return "#ea580c";
            case "MEDIUM": return "#f59e0b";
            case "LOW": default: return "#10b981";
          }
        };

        return (
          <div
            key={node.id}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
          >
            {/* Tiny precise contact shadow on satellite map ground */}
            <motion.div
              animate={{
                scale: isHovered ? 1.4 : 1,
                opacity: isHovered ? 0.8 : 0.5,
                y: isHovered ? 14 : 9,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 h-3.5 w-7 rounded-full bg-black/80 blur-[3px]"
            />

            {/* Levitating Node Element */}
            <motion.div
              animate={{
                y: isHovered ? -12 : [-4, 4, -4],
                scale: isHovered || isSelected ? 1.15 : 1,
              }}
              transition={
                isHovered
                  ? { type: "spring", stiffness: 400, damping: 20 }
                  : { y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" } }
              }
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectNode?.(node)}
              className="relative cursor-pointer"
            >
              {/* Force field pulse ring */}
              <div
                className="absolute -inset-2 rounded-full opacity-60 blur-xs animate-ping"
                style={{ backgroundColor: `${getRiskColor()}40`, animationDuration: "3s" }}
              />

              {/* Node core pill */}
              <div className="relative flex items-center gap-2 rounded-full border border-white/90 bg-white/95 px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.3),0_10px_24px_rgba(0,0,0,0.4)] backdrop-blur-md">
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: getRiskColor(), color: getRiskColor() }}
                />
                <span className="font-mono text-[11px] font-bold text-slate-900">
                  {node.id}
                </span>
                <span className="font-mono text-[9px] font-bold text-slate-500">
                  {node.risk}
                </span>
              </div>
            </motion.div>

            {/* Hover Floating Tooltip Card */}
            <AnimatePresence>
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: -20, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-30 mb-2 w-64 rounded-xl border border-white/90 bg-white/98 p-3 text-slate-900 shadow-[0_16px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-sans text-xs font-bold text-slate-900">{node.name}</span>
                    <span
                      className="rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase"
                      style={{ color: getRiskColor(), backgroundColor: `${getRiskColor()}15` }}
                    >
                      {node.risk}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-600">
                    <div className="flex justify-between">
                      <span>NDVI Index:</span>
                      <span className="font-bold text-slate-900">{node.ndvi}</span>
                    </div>
                    <div className="text-[9px] text-slate-500">{node.treesProtected}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Floating Gesture Status in Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 rounded-lg border border-white/80 bg-white/90 px-3 py-1.5 font-mono text-[10px] text-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isGesturing ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
          <span>{isGesturing ? "GESTURE ENGAGED · AIR GAP ACTIVE" : "HOVER / DRAG TO LEVITATE"}</span>
        </div>
      </div>
    </div>
  );
}
