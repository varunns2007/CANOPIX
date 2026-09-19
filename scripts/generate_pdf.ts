import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputPath = path.resolve(process.cwd(), "CANOPIX_Comprehensive_System_and_AI_Agents_Guide.pdf");
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: 45, right: 45 },
  bufferPages: true,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Color Palette
const COLORS = {
  primary: "#064e3b",      // Deep Forest Green
  secondary: "#0f766e",    // Teal
  accent: "#10b981",       // Mint Green
  gold: "#b45309",         // Amber / Copper
  dark: "#0f172a",         // Slate 900
  body: "#334155",         // Slate 700
  muted: "#64748b",        // Slate 500
  lightBg: "#f8fafc",      // Slate 50
  cardBg: "#f1f5f9",       // Slate 100
  border: "#cbd5e1",       // Slate 300
  white: "#ffffff",
  danger: "#be123c",       // Rose Red
};

// Helper: Section Title
function addSectionHeader(title: string, subtitle?: string) {
  doc.moveDown(0.8);
  const y = doc.y;
  doc.rect(45, y, 4, 22).fill(COLORS.primary);
  doc.fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(title, 56, y + 2);
  if (subtitle) {
    doc.fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(9)
      .text(subtitle, 56, y + 15);
    doc.moveDown(0.6);
  } else {
    doc.moveDown(0.4);
  }
}

// Helper: Subsection Title
function addSubsection(title: string) {
  doc.moveDown(0.5);
  doc.fillColor(COLORS.secondary)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title);
  doc.moveDown(0.2);
}

// Helper: Callout Box
function addCalloutBox(title: string, text: string, color = COLORS.primary, bg = COLORS.lightBg) {
  const startY = doc.y;
  doc.rect(45, startY, 505, 52).fillAndStroke(bg, COLORS.border);
  doc.rect(45, startY, 4, 52).fill(color);
  
  doc.fillColor(color)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, 58, startY + 8);
    
  doc.fillColor(COLORS.body)
    .font("Helvetica")
    .fontSize(8.5)
    .text(text, 58, startY + 22, { width: 480, lineGap: 1.5 });
    
  doc.y = startY + 58;
}

// ==========================================
// COVER / HEADER BANNER
// ==========================================
doc.rect(45, 45, 505, 80).fill(COLORS.primary);
doc.fillColor(COLORS.white)
  .font("Helvetica-Bold")
  .fontSize(22)
  .text("CANOPIX SYSTEM ARCHITECTURE", 60, 60);

doc.fillColor("#a7f3d0")
  .font("Helvetica")
  .fontSize(10)
  .text("Pixel-Level Forest Intelligence & Autonomous Smuggling Interdiction", 60, 88);

doc.fillColor("#d1fae5")
  .font("Helvetica-Bold")
  .fontSize(8.5)
  .text("COMPLETE COMPONENT BREAKDOWN & MULTI-AGENT AI SPECIFICATION · VERSION 2.4", 60, 104);

doc.y = 140;

// ==========================================
// 1. EXECUTIVE OVERVIEW
// ==========================================
addSectionHeader("1. Executive Overview & System Mission");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(9)
  .text(
    "CANOPIX is an end-to-end, high-precision forest intelligence and anti-poaching interdiction platform designed to safeguard ecologically sensitive biosphere reserves (such as Seshachalam, Anamalai, and Mudumalai). It unifies Copernicus Sentinel-2 multispectral remote sensing, topological Dijkstra road interception routing, real-time vehicle GPS / FASTag toll telemetry, and an autonomous 4-tier LangGraph multi-agent AI system.",
    { width: 505, lineGap: 2.5 }
  );

doc.moveDown(0.5);

addCalloutBox(
  "CORE OPERATIONAL CAPABILITY",
  "Transforms raw satellite pixel reflectance and streaming highway pings into risk-scored, explainable tactical police intercept dossiers in under 50ms, achieving tactical roadblock interception before illegal timber convoys exit protected forest jurisdiction."
);

// ==========================================
// 2. DETAILED BREAKDOWN OF EVERY SYSTEM MODULE
// ==========================================
addSectionHeader("2. System Architecture: Module-by-Module Breakdown");

addSubsection("Module A: Command Center & Real-Time Overview");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "• Operational HUD: Live command telemetry displaying regional tree cover (82.4%), total protected canopy area (1,145.3 km²), active trouble spots, and annualized forest loss.\n" +
    "• Real-Time Interactive Canvas Map: Custom GPU-accelerated canvas renderer with zoom/pan capabilities, live vehicle markers, bounding reserve corridors, and pulsing threat beacons.\n" +
    "• Live Gauge & Donut Analytics: Instant visual breakdown of canopy health percentages and categorical risk distribution (Low, Moderate, High, Critical).",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.3);
addSubsection("Module B: Orbital Satellite Base Layer & Remote Sensing Pipeline");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "• Sentinel-2 MSI Ingestion: Processes Level-2A surface reflectance data focusing on Band 4 (Red, 665nm) and Band 8 (Near-Infrared NIR, 842nm) with Scene Classification Layer (SCL) cloud masking.\n" +
    "• Normalized Difference Vegetation Index (NDVI): Calculates NDVI = (B08 - B04) / (B08 + B04), segmenting land into dense canopy (>0.78), thinning/deciduous (0.45 - 0.78), and cleared zones (<0.45).\n" +
    "• Realistic Orbital Canvas: Top-down photographic composite featuring the Arabian Sea (left) and Bay of Bengal (right) with natural sun glint, lush Western Ghats tropical forest, and coastal farmland grid.",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.3);
addSubsection("Module C: Forest Explorer & Procedural 3D Canopy Simulation");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "• Three.js 3D Elevation Engine: Generates procedural heightmap terrain meshes with dynamic hill shading, elevation-driven tree placement, and interactive orbital camera controls.\n" +
    "• Canopy Raycast Inspector: Clicking any coordinate on the 3D surface executes a raycast query returning spot tree cover density, estimated canopy height (m), and proximity to valuable flora.\n" +
    "• Organic Texture Synthesizer: Renders density-weighted, gradient-blurred canopy blobs over vector river networks and highlights valuable timber loss patches (Red Sanders / Rosewood).",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.3);
addSubsection("Module D: Range Deforestation Detector & Polygon Segmentation");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "• Multi-Range Scanner: Allows selection or coordinate pinning across 6+ reserve zones (Anamalai, Mudumalai, Seshachalam, Sathyamangalam, Silent Valley, Agasthyamalai).\n" +
    "• Contiguous Polygon Extraction: Identifies clusters of vegetation loss and groups them into geo-referenced change polygons (e.g. CHG_POLY_001) with precise hectare metrics and centroid coordinates.\n" +
    "• Spectral Mode Toggle: Seamlessly toggles between True Color (RGB), False Color Infrared (CIR), NDVI Vegetation Index, and Loss Mask overlays.",
    { width: 505, lineGap: 2 }
  );

doc.addPage();

// PAGE 2
addSubsection("Module E: Satellite Temporal Comparator");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "• Historical Granule Synchronization: Compares baseline passes (e.g., Jan 2026) against recent observation passes (e.g., Jun 2026) using actual Copernicus granule metadata.\n" +
    "• Interactive Split-Screen Slider: Dual-pane wipe tool allowing officers to visually inspect deforestation tracks, logging roads, and canopy thinning side-by-side.\n" +
    "• Automated Plain-Language Explanation: Natural language generation engine explaining canopy changes in non-technical terms for forestry rangers and legal filings.",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.3);
addSubsection("Module F: Reports & Resource Optimization Matrix");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "• Detached Anti-Gravity Panes: Elevated floating dashboard panes displaying 6-month temporal canopy trends, risk spectrums, and protected area growth recovery metrics.\n" +
    "• 3D Hover Depth Resource Table: Dynamic perspective-tilted allocation table for drone patrol sweeps, ranger squads, thermal cameras, and acoustic sensor arrays.\n" +
    "• Interactive Gesture Control Overlay: Levitating waypoint nodes casting micro contact shadows on terrain with real-time force-ray linking and target-lock modes.",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.3);
addSubsection("Module G: Threat Intel & Explainable Risk Scoring Engine");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "• Multi-Factor XAI Risk Engine: Generates an Investigation Risk Score (0-100) with transparent, auditable factor weights:\n" +
    "   - Satellite Canopy Change Severity (+30 pts)\n" +
    "   - Timber Transit Permit Violation / Forgery (+25 pts)\n" +
    "   - Spatial Proximity to Active Deforestation Polygon (+20 pts)\n" +
    "   - Route Anomaly / Nocturnal Transit (+15 pts)\n" +
    "   - Historical Smuggling Corridor Hotspot (+10 pts)",
    { width: 505, lineGap: 2 }
  );

// ==========================================
// 3. COMPLETE MULTI-AGENT AI INTERDICTION ENGINE
// ==========================================
addSectionHeader("3. The Multi-Agent AI Interdiction Engine (LangGraph Pipeline)");

doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "The interdiction pipeline operates as a stateful, event-driven directed acyclic graph built on LangGraph and Pydantic v2. When a vehicle GPS ping or FASTag toll reader event arrives, it traverses 4 specialized autonomous agents in deterministic sequence:",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.6);

// AGENT 1: SENTINEL AGENT
doc.rect(45, doc.y, 505, 82).fillAndStroke("#ecfdf5", COLORS.accent);
const a1Y = doc.y;
doc.fillColor(COLORS.primary)
  .font("Helvetica-Bold")
  .fontSize(11)
  .text("1. SENTINEL AGENT · Ingestion, Registry & Spatial Conformance", 55, a1Y + 6);

doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8)
  .text(
    "• Primary Responsibility: Telemetry normalization, permit registry cross-referencing, and spatial route validation.\n" +
    "• Operational Workflow:\n" +
    "  1. Ingests raw GPS / FASTag pings (vehicle_id, lat, lng, speed, cargo weight, declared species, timestamp).\n" +
    "  2. Queries the state timber_permits database to check validity, expiry dates, route authorization, and species quotas.\n" +
    "  3. Executes point-in-polygon & spatial buffer queries against gazetted highway corridors with a 500m tolerance band.\n" +
    "  4. Flags unauthorized vehicles, expired transit passes, or off-corridor deviations (+25 to +45 risk penalty).",
    55, a1Y + 20, { width: 485, lineGap: 1.5 }
  );

doc.y = a1Y + 88;
doc.moveDown(0.3);

// AGENT 2: SLEUTH AGENT
doc.rect(45, doc.y, 505, 82).fillAndStroke("#fefce8", COLORS.gold);
const a2Y = doc.y;
doc.fillColor(COLORS.gold)
  .font("Helvetica-Bold")
  .fontSize(11)
  .text("2. SLEUTH AGENT · Nocturnal Curfew & Convoy Correlation Engine", 55, a2Y + 6);

doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8)
  .text(
    "• Primary Responsibility: Temporal anomaly detection and multi-vehicle cartel correlation.\n" +
    "• Operational Workflow:\n" +
    "  1. Evaluates observation timestamps against nocturnal transit curfews (22:00 to 05:00 hrs IST).\n" +
    "  2. Scans spatial-temporal sliding windows for commercial timber vehicles traveling in close tandem (< 2.0 km gap).\n" +
    "  3. Identifies decoy/scout vehicle tactics (unloaded pilot vehicle followed by overloaded freight carrier).\n" +
    "  4. If composite Risk Score >= 80, triggers immediate state escalation to the Strategist Agent.",
    55, a2Y + 20, { width: 485, lineGap: 1.5 }
  );

doc.y = a2Y + 88;
doc.moveDown(0.3);

// AGENT 3: STRATEGIST AGENT
doc.rect(45, doc.y, 505, 82).fillAndStroke("#f0fdf4", COLORS.secondary);
const a3Y = doc.y;
doc.fillColor(COLORS.secondary)
  .font("Helvetica-Bold")
  .fontSize(11)
  .text("3. STRATEGIST AGENT · Topological Dijkstra Road Interceptor", 55, a3Y + 6);

doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8)
  .text(
    "• Primary Responsibility: Dynamic chokepoint optimization and police interception feasibility calculations.\n" +
    "• Operational Workflow:\n" +
    "  1. Replaces Euclidean straight-line distance with topological Dijkstra shortest-path graph traversal on actual roads.\n" +
    "  2. Computes Smuggler Exit Time (T_exit) to the nearest state border or highway exit.\n" +
    "  3. Computes Police Response Time (T_police) from nearby patrol stations to candidate chokepoints.\n" +
    "  4. Validates the Interception Inequality: T_police + 3.0 min (Tactical Safety Headroom) < T_exit to lock the optimal roadblock.",
    55, a3Y + 20, { width: 485, lineGap: 1.5 }
  );

doc.addPage();

// PAGE 3
// AGENT 4: DISPATCHER AGENT
doc.rect(45, doc.y, 505, 82).fillAndStroke("#fff1f2", COLORS.danger);
const a4Y = doc.y;
doc.fillColor(COLORS.danger)
  .font("Helvetica-Bold")
  .fontSize(11)
  .text("4. DISPATCHER AGENT · Emergency Tactical Disseminator & Dossier Generator", 55, a4Y + 6);

doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8)
  .text(
    "• Primary Responsibility: Automated incident response packaging, dossier compilation, and officer alerting.\n" +
    "• Operational Workflow:\n" +
    "  1. Formats Jinja2 emergency police dossiers detailing suspect vehicle license, cargo weight, and driver history.\n" +
    "  2. Embeds exact GPS roadblock coordinates, optimal deployment route, and estimated time-to-intercept (ETA).\n" +
    "  3. Attaches full XAI factor breakdown for immediate legal admissibility under Forest Conservation and Wildlife Acts.\n" +
    "  4. Broadcasts real-time Server-Sent Events (SSE) and webhook dispatches to the frontline police stations.",
    55, a4Y + 20, { width: 485, lineGap: 1.5 }
  );

doc.y = a4Y + 92;

// ==========================================
// 4. MATHEMATICAL & ALGORITHMIC SPECIFICATIONS
// ==========================================
addSectionHeader("4. Mathematical & Algorithmic Foundations");

addSubsection("A. Multispectral NDVI Formulation");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "NDVI = (NIR - RED) / (NIR + RED) = (Band 8 - Band 4) / (Band 8 + Band 4)\n" +
    "Delta_NDVI = NDVI_Observation - NDVI_Baseline. Negative deltas < -0.15 flag active canopy degradation.",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.3);
addSubsection("B. Topological Interception Feasibility Condition");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "For each candidate chokepoint C_k on road network graph G = (V, E):\n" +
    "T_exit(C_k) = dist_road(P_vehicle, C_k) / Speed_vehicle\n" +
    "T_police(C_k) = dist_road(P_station, C_k) / Speed_patrol + T_mobilization\n" +
    "Interception Feasible IF: T_police(C_k) + T_safety_margin <= T_exit(C_k), where T_safety_margin = 180 seconds.",
    { width: 505, lineGap: 2 }
  );

doc.moveDown(0.3);
addSubsection("C. Explainable Risk Engine Weight Vector");
doc.fillColor(COLORS.body)
  .font("Helvetica")
  .fontSize(8.5)
  .text(
    "Risk_Score = min(100, W_change * S_change + W_permit * S_permit + W_prox * S_prox + W_route * S_route + W_hist * S_hist)\n" +
    "Where: W_change=30, W_permit=25, W_prox=20, W_route=15, W_hist=10.",
    { width: 505, lineGap: 2 }
  );

// ==========================================
// 5. SUMMARY COMPARISON TABLE
// ==========================================
addSectionHeader("5. Multi-Agent AI Capability Matrix");

const tableTop = doc.y + 4;
doc.rect(45, tableTop, 505, 18).fill(COLORS.primary);
doc.fillColor(COLORS.white)
  .font("Helvetica-Bold")
  .fontSize(8)
  .text("AGENT NAME", 52, tableTop + 5)
  .text("CORE FOCUS", 145, tableTop + 5)
  .text("KEY INPUT DATA", 270, tableTop + 5)
  .text("OUTPUT ARTIFACT", 410, tableTop + 5);

const rows = [
  { name: "Sentinel Agent", focus: "Registry & Highway Buffer", input: "FASTag, Permits, Road GPS", output: "Permit Clearance Status" },
  { name: "Sleuth Agent", focus: "Curfew & Convoy Engine", input: "Timestamps, Nearby Vehicles", output: "Convoy Cluster Flag & Risk" },
  { name: "Strategist Agent", focus: "Topological Interception", input: "Road Graph, Speeds, Stations", output: "Optimal Chokepoint & ETA" },
  { name: "Dispatcher Agent", focus: "Tactical Police Alerting", input: "Candidate Dossier, XAI Matrix", output: "Dispatch Ticket & SSE Event" },
];

rows.forEach((r, i) => {
  const rowY = tableTop + 18 + i * 20;
  doc.rect(45, rowY, 505, 20).fill(i % 2 === 0 ? COLORS.lightBg : COLORS.white);
  doc.rect(45, rowY, 505, 20).stroke(COLORS.border);
  
  doc.fillColor(COLORS.dark).font("Helvetica-Bold").fontSize(7.5).text(r.name, 52, rowY + 6);
  doc.fillColor(COLORS.body).font("Helvetica").fontSize(7.5).text(r.focus, 145, rowY + 6);
  doc.fillColor(COLORS.body).font("Helvetica").fontSize(7.5).text(r.input, 270, rowY + 6);
  doc.fillColor(COLORS.primary).font("Helvetica-Bold").fontSize(7.5).text(r.output, 410, rowY + 6);
});

doc.y = tableTop + 18 + rows.length * 20 + 15;

addCalloutBox(
  "CONCLUSION & OPERATIONAL READINESS",
  "The PUSHPA system provides forest protection divisions with proactive, automated, and explainable decision support. By coupling orbital remote sensing change detection with instant road interception calculations, illegal logging convoys can be halted before leaving protected biosphere reserves."
);

// ==========================================
// FOOTER & PAGE NUMBERING (ALL PAGES)
// ==========================================
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  doc.rect(45, 785, 505, 0.75).fill(COLORS.border);
  doc.fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(7.5)
    .text("CANOPIX Forest Intelligence & Interdiction System · Confidential & Tactical Reference", 45, 792)
    .text(`Page ${i + 1} of ${totalPages}`, 480, 792, { align: "right" });
}

doc.end();

writeStream.on("finish", () => {
  console.log(`PDF successfully created at: ${outputPath}`);
});
