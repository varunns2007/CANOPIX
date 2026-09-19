import { motion } from "framer-motion";
import { NAV_ITEMS, type PageId } from "../../nav";

interface SidebarProps {
  active: PageId;
  onNavigate: (id: PageId) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="relative z-20 flex h-full w-[76px] flex-col items-center border-r border-line/70 bg-bark/80 py-5 backdrop-blur-sm lg:w-[220px] lg:items-stretch lg:px-3">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-mint-500/50 font-display text-lg text-mint-400">
          C
        </div>
        <div className="hidden flex-col lg:flex">
          <span className="font-display text-sm tracking-[0.25em] text-ash-100">CANOPIX</span>
          <span className="font-mono text-[9px] tracking-[0.15em] text-ash-500">FOREST INTEL</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          // The Multi-Agent AI page gets its own violet accent instead of
          // the default gold/green -- it's a genuinely distinct subsystem
          // (LangGraph agent pipeline) from the satellite/vehicle pages,
          // so the nav reflects that with a contrasting color rather than
          // reusing the same accent everywhere.
          const isIntel = item.id === "multi-agent";
          return (
            <button
              key={item.id}
              data-cursor-hover
              onClick={() => onNavigate(item.id)}
              className="group relative flex items-center gap-3 px-2.5 py-2.5 text-left transition-colors lg:px-3"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className={`absolute inset-0 border ${isIntel ? "border-intel-500/50 bg-intel-700/30" : "border-forest-500/50 bg-forest-900/50"}`}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="nav-active-bar"
                  className={`absolute left-0 top-0 h-full w-[2px] ${isIntel ? "bg-intel-400" : "bg-mint-500"}`}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                size={17}
                strokeWidth={1.5}
                className={`relative z-10 shrink-0 transition-colors ${
                  isActive ? (isIntel ? "text-intel-400" : "text-mint-400") : "text-ash-500 group-hover:text-ash-100"
                }`}
              />
              <span
                className={`relative z-10 hidden font-mono text-[11px] tracking-[0.08em] transition-colors lg:inline ${
                  isActive ? "text-ash-100" : "text-ash-500 group-hover:text-ash-100"
                }`}
              >
                {item.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="hidden px-2 lg:block">
        <div className="border-t border-line/70 pt-3 font-mono text-[9px] leading-relaxed text-ash-700">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-signal-400" />
            SYSTEM ONLINE
          </div>
          <div className="mt-1">DEMO DATA MODE</div>
        </div>
      </div>
    </aside>
  );
}
