import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BackendBadge from "../components/Backend/BackendBadge";
import { listPermits } from "../api/client";
import { PERMITS_DEMO, type PermitRecord } from "../data/mockData";

const STATUS_COLOR: Record<string, string> = {
  VALID: "var(--color-forest-400)",
  UNPERMITTED: "var(--color-earth-500)",
  EXPIRED: "var(--color-earth-400)",
  ROUTE_MISMATCH: "var(--color-gold-500)",
  SPECIES_MISMATCH: "var(--color-gold-500)",
  OVERWEIGHT: "var(--color-gold-500)",
};

export default function TimberPermitsPage() {
  const [permits, setPermits] = useState<PermitRecord[]>(PERMITS_DEMO);

  useEffect(() => {
    listPermits().then((res) => {
      if (res.ok && res.data.permits?.length) {
        // The live backend doesn't send the demo dataset's decorative
        // `rto` (Regional Transport Office) label -- derive a readable
        // fallback from what it does send instead of pretending the
        // field exists.
        const mapped: PermitRecord[] = res.data.permits.map((p) => ({
          vehicle_id: p.vehicle_id,
          permit_id: p.permit_id ?? null,
          holder: p.holder ?? null,
          authorized_species: p.authorized_species ?? null,
          approved_route: p.approved_route ?? null,
          expiry: p.expiry ?? null,
          status: p.status,
          valid: p.valid,
          reason: p.reason,
          rto: "Live telemetry (RTO not reported by backend)",
        }));
        setPermits(mapped);
      }
    });
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg tracking-wide text-ash-100">Timber Transit Permit Registry</h1>
            <span className="rounded border border-forest-400/40 bg-forest-950/60 px-2 py-0.5 font-mono text-[9px] text-forest-300">
              TAMIL NADU &amp; KERALA FOREST FORM II / IV
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-ash-500">
            Official timber transit e-permits, authorized species manifests, and approved transit corridor compliance
          </p>
        </div>
        <BackendBadge />
      </div>

      <div className="overflow-x-auto border border-line/70">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="border-b border-line/70 bg-panel/60 text-ash-400">
              <th className="px-3 py-2.5 font-semibold">VEHICLE RTO REGISTRATION</th>
              <th className="px-3 py-2.5 font-semibold">PERMIT NUMBER</th>
              <th className="px-3 py-2.5 font-semibold">AUTHORIZED HOLDER</th>
              <th className="px-3 py-2.5 font-semibold">DECLARED SPECIES</th>
              <th className="px-3 py-2.5 font-semibold">APPROVED ROUTE</th>
              <th className="px-3 py-2.5 font-semibold">EXPIRY</th>
              <th className="px-3 py-2.5 font-semibold">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {permits.map((p, i) => (
              <motion.tr
                key={p.vehicle_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-line/50 last:border-0 hover:bg-panel/40"
              >
                <td className="px-3 py-2.5 font-bold text-ash-100">
                  {p.vehicle_id}
                  {p.rto && <div className="text-[9px] font-normal text-ash-500">{p.rto}</div>}
                </td>
                <td className="px-3 py-2.5 text-gold-400">{p.permit_id ?? "—"}</td>
                <td className="px-3 py-2.5 text-ash-200">{p.holder ?? "—"}</td>
                <td className="px-3 py-2.5 text-ash-300">{p.authorized_species ?? "—"}</td>
                <td className="px-3 py-2.5 text-ash-400 text-[10px] max-w-[180px] truncate">{p.approved_route ?? "—"}</td>
                <td className="px-3 py-2.5 text-ash-400">{p.expiry ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <span
                    className="rounded-sm px-2 py-0.5 text-[9px] font-bold tracking-wider"
                    style={{
                      color: STATUS_COLOR[p.status] ?? "var(--color-ash-300)",
                      border: `1px solid ${STATUS_COLOR[p.status] ?? "var(--color-line)"}66`,
                      backgroundColor: `${STATUS_COLOR[p.status] ?? "var(--color-line)"}18`,
                    }}
                  >
                    {p.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-line/60 bg-panel/30 p-3 font-mono text-[10px] text-ash-400">
          <div className="font-bold text-ash-200">FORM II PERMIT (PRIVATE TIMBER)</div>
          <div className="mt-1">Required for felling and inter-district transport of Teak, Rosewood, and timber extracted from private estates under TN Forest Rules.</div>
        </div>
        <div className="border border-line/60 bg-panel/30 p-3 font-mono text-[10px] text-ash-400">
          <div className="font-bold text-ash-200">FORM IV PERMIT (SCHEDULED TIMBER)</div>
          <div className="mt-1">Strict red sanders and sandalwood transit pass with mandated GPS tracking, biometric driver registry, and fixed route waypoints.</div>
        </div>
        <div className="border border-line/60 bg-panel/30 p-3 font-mono text-[10px] text-ash-400">
          <div className="font-bold text-ash-200">AUTOMATED AUDIT CHECKS</div>
          <div className="mt-1">Real-time cross validation of vehicle registration, active GPS waypoint route conformance, allowable payload weight, and expiry timestamps.</div>
        </div>
      </div>
    </div>
  );
}
