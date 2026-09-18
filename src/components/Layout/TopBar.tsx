import { useEffect, useState, useRef } from "react";
import { REGION } from "../../data/mockData";
import type { PageId } from "../../nav";
import { NAV_ITEMS } from "../../nav";
import { useAuth, PRESET_ROLES } from "../../state/AuthContext";
import { Shield, RefreshCw, ChevronDown, Check, Server } from "lucide-react";

export default function TopBar({ active }: { active: PageId }) {
  const [time, setTime] = useState(new Date());
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser, switchRole, backendOnline, backendChecking, checkConnection } = useAuth();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = NAV_ITEMS.find((n) => n.id === active)?.label ?? "Overview";

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-line/70 bg-bark/90 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="font-display text-sm tracking-[0.2em] text-ash-100 font-bold">PUSHPA</span>
        <span className="text-line">/</span>
        <span className="font-mono text-xs tracking-[0.1em] text-gold-400 font-semibold">{label.toUpperCase()}</span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[11px]">
        {/* Backend Connectivity Status Pill */}
        <button
          onClick={checkConnection}
          title="Click to re-verify backend API health"
          className={`flex items-center gap-1.5 rounded border px-2.5 py-1 transition-all ${
            backendOnline
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
              : "border-amber-500/40 bg-amber-950/30 text-amber-300"
          }`}
        >
          <Server className="h-3 w-3" />
          <span className="flex items-center gap-1 font-semibold">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                backendOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {backendChecking ? "CHECKING..." : backendOnline ? "API PERSISTENT" : "STANDALONE DEMO"}
          </span>
          <RefreshCw className={`h-2.5 w-2.5 opacity-60 ml-0.5 ${backendChecking ? "animate-spin" : ""}`} />
        </button>

        {/* Role Selector & RBAC Clearance Badge */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 rounded border border-line bg-void/60 px-2.5 py-1 text-ash-300 hover:border-gold-500/50 hover:text-ash-100 transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-gold-400" />
            <span className="max-w-[130px] truncate text-xs font-semibold">{currentUser.role_id}</span>
            <span className="rounded bg-gold-500/20 px-1 py-0.5 text-[9px] text-gold-300">
              {currentUser.clearance_level.split(" ")[0]}
            </span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-lg border border-line/80 bg-bark shadow-2xl backdrop-blur-xl p-1 z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-line/50 text-[10px] text-ash-400 font-sans">
                <div className="font-semibold text-ash-200">TACTICAL COMMAND ROLES (RBAC)</div>
                <div>Current: {currentUser.name}</div>
              </div>
              <div className="py-1">
                {Object.values(PRESET_ROLES).map((role) => {
                  const isSelected = currentUser.role_id === role.role_id;
                  return (
                    <button
                      key={role.role_id}
                      onClick={() => {
                        switchRole(role.role_id);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-start gap-2 px-3 py-2 text-left rounded text-xs transition-colors ${
                        isSelected
                          ? "bg-gold-500/15 text-gold-300 font-semibold"
                          : "text-ash-300 hover:bg-void/60 hover:text-ash-100"
                      }`}
                    >
                      <Shield className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isSelected ? "text-gold-400" : "text-ash-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{role.name}</span>
                          {isSelected && <Check className="h-3 w-3 text-gold-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-ash-400 font-mono mt-0.5">{role.clearance_level}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Live Analysis ticker and Clock */}
        <div className="hidden lg:flex items-center gap-3 text-ash-500">
          <span>{REGION.code}</span>
          <span className="flex items-center gap-1.5 text-signal-400">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-signal-400" /> LIVE
          </span>
          <span className="text-ash-300 font-medium">{time.toLocaleTimeString("en-GB", { hour12: false })} IST</span>
        </div>
      </div>
    </header>
  );
}
