import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getConvoySignatures, listPoliceStations, policeDispatchLog } from "../api/client";
import { REAL_POLICE_STATIONS, riskColor, type RiskLevel, type RealPoliceStation } from "../data/mockData";

const POLL_MS = 6000;

export default function PoliceDispatch() {
  const [stations, setStations] = useState<RealPoliceStation[]>(REAL_POLICE_STATIONS);
  const [dispatches, setDispatches] = useState<any[]>([
    {
      alert_id: "ALT-2026-088-CRIT",
      kind: "vehicle_risk_score",
      rating: "CRITICAL",
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      notified_stations: [
        { name: "Valparai Police Station (B-5)", distance_km: 2.4 },
        { name: "Sholayar Dam Police Station", distance_km: 4.8 },
        { name: "Topslip Forest Range Office & Anti-Poaching Base", distance_km: 6.9 },
      ],
    },
    {
      alert_id: "ALT-2026-074-HIGH",
      kind: "convoy_signature",
      rating: "HIGH",
      created_at: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
      notified_stations: [
        { name: "Aliyar Police Station (B-4)", distance_km: 1.8 },
        { name: "Pollachi Taluk Police Station", distance_km: 8.5 },
      ],
    },
  ]);
  const [convoys, setConvoys] = useState<any[]>([
    {
      polygon_id: "ATR-CORR-01",
      vehicles_involved: ["TN 38 BX 9104", "KL 06 E 4912"],
      convoy_score: 94,
      rating: "CRITICAL",
      evidence: [
        "Unpermitted multi-axle tipper (TN 38 BX 9104) stationary at Sector 3 Red Sanders clearing",
        "Medium goods hauler (KL 06 E 4912) deviated 6.4 km off SH-17 to rendezvous on unpaved logging route",
        "Spatial convergence within 800m inside core tiger reserve buffer",
      ],
    },
  ]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const [s, d, c] = await Promise.all([listPoliceStations(), policeDispatchLog(20), getConvoySignatures()]);
      if (cancelled) return;
      if (s.ok && s.data.stations?.length) {
        // The live backend's station records match RealPoliceStation
        // field-for-field except `type` (Police Station / Forest Checkpost
        // / Range Office), which it doesn't send -- infer a reasonable
        // fallback from the name rather than leaving it undefined.
        const mapped: RealPoliceStation[] = s.data.stations.map((st) => ({
          station_id: st.station_id,
          name: st.name,
          jurisdiction: st.jurisdiction,
          district: st.district,
          zone_id: st.zone_id,
          lat: st.lat,
          lng: st.lng,
          phone: st.phone,
          email: st.email,
          type: /checkpost/i.test(st.name)
            ? "Forest Checkpost"
            : /range office/i.test(st.name)
              ? "Range Office"
              : "Police Station",
        }));
        setStations(mapped);
        setLive(true);
      }
      if (d.ok && d.data.dispatches?.length) setDispatches(d.data.dispatches);
      if (c.ok && c.data.signatures?.length) setConvoys(c.data.signatures);
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg tracking-wide text-ash-100">Police Dispatch &amp; Forest Enforcement</h1>
            <span className="rounded border border-forest-400/40 bg-forest-950/60 px-2 py-0.5 font-mono text-[9px] text-forest-300">
              REAL POLICE STATIONS &amp; CHECKPOSTS
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-ash-500">
            Real Tamil Nadu &amp; Kerala police stations, Anti-Poaching strike forces, and auto-dispatch jurisdictions
          </p>
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-[11px] ${live ? "text-forest-400" : "text-gold-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-forest-400" : "bg-gold-500"}`} />
          {live ? "LIVE POLICE DISPATCH ONLINE" : "LOCAL GEOGRAPHIC REGISTRY ACTIVE"}
        </div>
      </div>

      <section className="mb-6">
        <div className="mb-2 font-mono text-[11px] tracking-wider text-ash-500">CONVOY SIGNATURES &amp; MULTI-VEHICLE CORRELATION</div>
        {convoys.length === 0 && (
          <div className="border border-line/60 bg-panel/30 px-4 py-3 font-mono text-[11px] text-ash-500">
            No correlated multi-vehicle patterns right now.
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {convoys.map((c, i) => (
            <motion.div
              key={c.polygon_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="border border-line/70 bg-panel/40 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs text-gold-400">{c.polygon_id}</div>
                  <div className="text-sm font-bold text-ash-100">{c.vehicles_involved.join(" ⇄ ")}</div>
                </div>
                <span
                  className="rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider"
                  style={{ color: riskColor(c.rating as RiskLevel), border: `1px solid ${riskColor(c.rating as RiskLevel)}66`, backgroundColor: `${riskColor(c.rating as RiskLevel)}15` }}
                >
                  CONVOY RISK: {c.convoy_score}/100 ({c.rating})
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 font-mono text-[10px] text-ash-300">
                {c.evidence.map((e: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-red-400">▶</span> {e}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 font-mono text-[11px] tracking-wider text-ash-500">REAL-TIME DISPATCH LOG</div>
        <div className="space-y-2">
          {dispatches.map((d) => (
            <div key={d.alert_id} className="border border-line/60 bg-panel/30 px-3 py-2.5">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="font-bold text-ash-200">
                  {d.alert_id} · <span className="text-gold-400">{d.kind.toUpperCase()}</span> ·{" "}
                  <span style={{ color: riskColor(d.rating as RiskLevel) }}>{d.rating}</span>
                </span>
                <span className="text-ash-500">{new Date(d.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-signal-400">
                🚓 <span className="text-white font-semibold">Notified Enforcement Stations:</span>{" "}
                {d.notified_stations.map((s: any) => `${s.name} (${s.distance_km} km)`).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] tracking-wider text-ash-500">
          <span>AUTHENTIC POLICE STATIONS &amp; FOREST CHECKPOSTS ({stations.length})</span>
          <span>ANAMALAI TIGER RESERVE &amp; ADJACENT RANGES</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stations.map((s) => (
            <div key={s.station_id} className="border border-line/60 bg-panel/30 p-3 font-mono text-[11px] text-ash-400 transition-colors hover:border-gold-500/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ash-100">{s.name}</span>
                <span className="rounded bg-forest-950/70 border border-forest-500/30 px-1.5 py-0.5 text-[9px] text-forest-300">
                  {s.station_id}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-gold-400/90">{s.jurisdiction}</div>
              <div className="mt-1 text-[10px] text-ash-500">{s.district ?? s.zone_id}</div>
              <div className="mt-2 flex items-center justify-between border-t border-line/40 pt-1.5 text-[10px]">
                <span className="text-ash-300">📞 {s.phone}</span>
                <span className="text-ash-500">{s.lat.toFixed(4)}°N, {s.lng.toFixed(4)}°E</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
