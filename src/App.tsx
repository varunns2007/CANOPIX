import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import CustomCursor from "./components/Cursor/CustomCursor";
import Sidebar from "./components/Layout/Sidebar";
import TopBar from "./components/Layout/TopBar";
import PageTransition from "./components/Layout/PageTransition";
import OrbitalSatelliteBase from "./components/Map/OrbitalSatelliteBase";
import { ComparisonProvider } from "./state/ComparisonContext";
import { AuthProvider } from "./state/AuthContext";
import type { PageId } from "./nav";

import Overview from "./pages/Overview";
import AntiGravityDashboard from "./components/AntiGravity/AntiGravityDashboard";
import MultiAgentInterdictionPage from "./pages/MultiAgentInterdictionPage";
import ForestExplorer from "./pages/ForestExplorer";
import SatelliteCompare from "./pages/SatelliteCompare";
import RangeDeforestationDetector from "./pages/RangeDeforestationDetector";
import ThreatIntel from "./pages/ThreatIntel";
import Settings from "./pages/Settings";

export default function App() {
  const [page, setPage] = useState<PageId>("overview");
  const [soundOn, setSoundOn] = useState(false);

  return (
    <AuthProvider>
      <ComparisonProvider>
        <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
          {/* Global Orbital Satellite Base Layer: Arabian Sea (left), Western Ghats, Farmland Grid, Bay of Bengal (right) */}
          <OrbitalSatelliteBase showGrid={true} showCoordinates={true} sunGlint={true} />

          <CustomCursor />

          <div className="relative z-10 flex h-full w-full">
            <Sidebar active={page} onNavigate={setPage} />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar active={page} />
              <main className="relative min-h-0 flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <PageTransition key={page}>
                    {page === "overview" && <Overview onNavigate={setPage} />}
                    {page === "reports" && <AntiGravityDashboard onNavigate={setPage} />}
                    {page === "multi-agent" && <MultiAgentInterdictionPage />}
                    {page === "range-detector" && <RangeDeforestationDetector onNavigate={setPage} />}
                    {page === "forest-explorer" && <ForestExplorer />}
                    {page === "satellite-compare" && <SatelliteCompare onNavigate={setPage} />}
                    {page === "threat-intel" && <ThreatIntel />}
                    {page === "settings" && <Settings soundOn={soundOn} setSoundOn={setSoundOn} />}
                  </PageTransition>
                </AnimatePresence>
              </main>
            </div>
          </div>
        </div>
      </ComparisonProvider>
    </AuthProvider>
  );
}
