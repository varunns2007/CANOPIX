import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import CustomCursor from "./components/Cursor/CustomCursor";
import Sidebar from "./components/Layout/Sidebar";
import TopBar from "./components/Layout/TopBar";
import PageTransition from "./components/Layout/PageTransition";
import { ComparisonProvider } from "./state/ComparisonContext";
import { AuthProvider } from "./state/AuthContext";
import type { PageId } from "./nav";

import Overview from "./pages/Overview";
import MultiAgentInterdictionPage from "./pages/MultiAgentInterdictionPage";
import CitizenReport from "./pages/CitizenReport";
import IntegrationHub from "./pages/IntegrationHub";
import ForestExplorer from "./pages/ForestExplorer";
import SatelliteCompare from "./pages/SatelliteCompare";
import RangeDeforestationDetector from "./pages/RangeDeforestationDetector";
import ThreatIntel from "./pages/ThreatIntel";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import Settings from "./pages/Settings";

export default function App() {
  const [page, setPage] = useState<PageId>("overview");
  const [soundOn, setSoundOn] = useState(false);

  return (
    <AuthProvider>
      <ComparisonProvider>
        <div className="relative h-screen w-screen overflow-hidden bg-void">
          <CustomCursor />

          <div className="flex h-full w-full">
            <Sidebar active={page} onNavigate={setPage} />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar active={page} />
              <main className="relative min-h-0 flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <PageTransition key={page}>
                    {page === "overview" && <Overview onNavigate={setPage} />}
                    {page === "multi-agent" && <MultiAgentInterdictionPage />}
                    {page === "citizen-report" && <CitizenReport />}
                    {page === "integration-hub" && <IntegrationHub />}
                    {page === "range-detector" && <RangeDeforestationDetector onNavigate={setPage} />}
                    {page === "forest-explorer" && <ForestExplorer />}
                    {page === "satellite-compare" && <SatelliteCompare onNavigate={setPage} />}
                    {page === "threat-intel" && <ThreatIntel />}
                    {page === "reports-analytics" && <ReportsAnalytics />}
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
