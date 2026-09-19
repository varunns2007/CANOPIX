import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import HUDFrame from "../components/HUD/HUDFrame";
import BackendBadge from "../components/Backend/BackendBadge";
import ForestCanvasMap from "../components/Map/ForestCanvasMap";
import { listIncidents } from "../api/client";
import { INCIDENTS_DEMO, type HistoricalIncident } from "../data/mockData";

export default function HistoricalIncidentsPage() {
  const [incidents, setIncidents] = useState<HistoricalIncident[]>(INCIDENTS_DEMO);

  useEffect(() => {
    listIncidents().then((res) => {
      if (res.ok) {
        // The live backend reports incidents without a pre-formatted
        // human-readable location name and uses seizure_kg (snake_case);
        // derive/rename rather than assuming the demo shape.
        const mapped: HistoricalIncident[] = res.data.incidents.map((i) => ({
          id: i.id,
          zone_id: i.zone_id,
          locationName: `${i.zone_id} incident site`,
          lat: i.lat,
          lng: i.lng,
          date: i.date,
          species: i.species,
          seizureKg: i.seizure_kg,
        }));
        setIncidents(mapped);
      }
    });
  }, []);

  const bySpecies = incidents.reduce<Record<string, number>>((acc, i) => {
    acc[i.species] = (acc[i.species] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_300px]">
      <HUDFrame label="HISTORICAL INCIDENT HEATMAP" className="relative overflow-hidden">
        <ForestCanvasMap interactive />
        <div className="pointer-events-none absolute right-4 top-4">
          <BackendBadge />
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] text-ash-500">
          {incidents.length} RECORDED INCIDENTS · PREDICTS HIGH-VULNERABILITY CORRIDORS
        </div>
      </HUDFrame>

      <div className="flex flex-col gap-4 overflow-y-auto">
        <HUDFrame label="BY SPECIES" className="p-4">
          <div className="space-y-2">
            {Object.entries(bySpecies).map(([species, count], i) => (
              <motion.div
                key={species}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between font-mono text-[11px]"
              >
                <span className="text-ash-300">{species}</span>
                <span className="text-gold-400">{count}</span>
              </motion.div>
            ))}
          </div>
        </HUDFrame>

        <HUDFrame label="INCIDENT LOG" className="max-h-[420px] flex-1 overflow-y-auto p-2">
          <div className="space-y-1.5 p-1.5">
            {incidents.map((inc, i) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border border-line/60 bg-panel/40 px-3 py-2 font-mono text-[10px]"
              >
                <div className="flex justify-between text-ash-100">
                  <span>{inc.id}</span>
                  <span className="text-ash-500">{inc.date}</span>
                </div>
                <div className="mt-0.5 text-ash-500">{inc.species} · {inc.zone_id}</div>
              </motion.div>
            ))}
          </div>
        </HUDFrame>
      </div>
    </div>
  );
}
