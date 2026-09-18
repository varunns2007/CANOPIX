import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { motion, AnimatePresence } from "framer-motion";
import { Trees, Compass, Mountain, Sparkles, Layers, ShieldCheck, AlertTriangle } from "lucide-react";
import { useComparison } from "../state/ComparisonContext";

interface Readout {
  x: number;
  y: number;
  z: number;
  densityPct: number;
  canopyHeightM: number;
  valuable: boolean;
  slopeDeg: number;
  biome: string;
}

export default function Forest3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [readout, setReadout] = useState<Readout | null>(null);
  const { comparison } = useComparison();
  const comparisonRef = useRef(comparison);
  comparisonRef.current = comparison;


  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06110d);
    scene.fog = new THREE.FogExp2(0x081912, 0.0055);

    const camera = new THREE.PerspectiveCamera(
      45,
      Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
      0.5,
      1000
    );
    camera.position.set(0, 75, 130);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 240;
    controls.target.set(0, 8, 0);

    // LIGHTING
    const hemiLight = new THREE.HemisphereLight(0xbbf7d0, 0x062817, 2.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff3c4, 3.8);
    sunLight.position.set(90, 140, 70);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 350;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fillLight.position.set(-80, 50, -60);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x062819, 1.2);
    scene.add(ambientLight);

    // TERRAIN GENERATION (Multi-frequency organic fractal relief)
    const size = 200;
    const segments = 140;

    const heightAt = (x: number, z: number) => {
      const e1 = Math.sin(x * 0.035) * 5.0 + Math.cos(z * 0.04) * 4.5;
      const e2 = Math.sin((x + z) * 0.02) * 8.0 + Math.cos((x - z) * 0.015) * 3.5;
      const e3 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 2.2;
      // River valley trough through center diagonal
      const distToRiver = Math.abs(x - z * 0.8 + 10);
      const valleyCarve = Math.max(0, 1 - distToRiver / 35) * 7.5;
      return Math.max(-4, e1 + e2 + e3 - valleyCarve);
    };

    const terrainGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    // Color gradient based on elevation & slope
    const cDeepForest = new THREE.Color(0x0a331c);
    const cLushForest = new THREE.Color(0x156338);
    const cHilltop = new THREE.Color(0x2d7a4c);
    const cRockCliff = new THREE.Color(0x3b4a41);
    const cRiverBank = new THREE.Color(0x1b4332);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = heightAt(x, z);
      pos.setY(i, h);

      // Vertex color blending
      let vertexColor = cLushForest.clone();
      if (h < 0) {
        vertexColor.lerp(cRiverBank, 0.7);
      } else if (h > 10) {
        vertexColor.lerp(cHilltop, 0.6);
        if (h > 13) vertexColor.lerp(cRockCliff, 0.5);
      } else {
        vertexColor.lerp(cDeepForest, 0.35);
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false,
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    terrain.name = "terrain";
    scene.add(terrain);

    // BACKGROUND SURROUNDING MOUNTAIN PEAKS
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x0c291c,
      roughness: 0.95,
      metalness: 0.05,
    });
    const mountainGeo = new THREE.ConeGeometry(26, 65, 8);
    const mountainCoords = [
      [-120, -90, 1.9],
      [-75, -115, 1.6],
      [-20, -130, 2.1],
      [40, -120, 1.8],
      [100, -100, 2.0],
      [135, -45, 1.7],
      [-135, 30, 1.5],
      [-110, 85, 1.8],
      [125, 75, 1.6],
    ];
    mountainCoords.forEach(([mx, mz, ms]) => {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(mx, 22, mz);
      m.scale.set(ms, ms, ms);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    });

    // PROCEDURAL FLOWING RIVER
    const riverCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-95, -1.8, -90),
      new THREE.Vector3(-55, -0.8, -50),
      new THREE.Vector3(-15, -1.2, -15),
      new THREE.Vector3(25, -0.5, 15),
      new THREE.Vector3(65, -0.2, 50),
      new THREE.Vector3(95, -0.1, 85),
    ]);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 90, 2.2, 12, false);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.1,
      metalness: 0.4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.88,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    scene.add(riverMesh);

    // INSTANCED HIGH-DENSITY PROCEDURAL TREES (2,000+ trees with natural variance)
    const treeCount = 1600;
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.35, 2.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2e1f14, roughness: 0.9 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    trunks.castShadow = true;
    trunks.receiveShadow = true;

    const foliageGeo = new THREE.ConeGeometry(1.6, 4.2, 7);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.75,
      metalness: 0.05,
    });
    const foliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
    foliage.castShadow = true;
    foliage.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const treePositions: Array<{ x: number; y: number; z: number; scale: number }> = [];

    let placed = 0;
    for (let i = 0; i < treeCount * 2 && placed < treeCount; i++) {
      const rx = (Math.random() - 0.5) * (size - 25);
      const rz = (Math.random() - 0.5) * (size - 25);
      const distToRiver = Math.abs(rx - rz * 0.8 + 10);

      // Skip trees inside riverbed
      if (distToRiver < 4.0) continue;

      const hy = heightAt(rx, rz);
      if (hy < -0.5 || hy > 14) continue;

      const scale = 0.75 + Math.random() * 0.65;
      treePositions.push({ x: rx, y: hy, z: rz, scale });

      // Position trunk
      dummy.position.set(rx, hy + (2.2 * scale) / 2, rz);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      // Position foliage
      dummy.position.set(rx, hy + 2.0 * scale + (4.2 * scale) / 2, rz);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      foliage.setMatrixAt(placed, dummy.matrix);

      // Varying shades of lush green
      const treeColor = new THREE.Color().setHSL(0.35 + (Math.random() - 0.5) * 0.06, 0.75, 0.28 + Math.random() * 0.15);
      foliage.setColorAt(placed, treeColor);

      placed++;
    }

    trunks.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
    if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;

    scene.add(trunks);
    scene.add(foliage);

    // HOLOGRAPHIC DETECTED CLEARING ZONES
    const clearingGeo = new THREE.RingGeometry(2.5, 7.5, 32);
    clearingGeo.rotateX(-Math.PI / 2);
    const clearingMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const clearingRing = new THREE.Mesh(clearingGeo, clearingMat);
    clearingRing.position.set(15, heightAt(15, -10) + 0.3, -10);
    scene.add(clearingRing);

    // PULSING DIAMOND MARKER OVER CHG_POLY_001
    const diamondGeo = new THREE.OctahedronGeometry(1.8, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const diamondMarker = new THREE.Mesh(diamondGeo, diamondMat);
    diamondMarker.position.set(15, heightAt(15, -10) + 9, -10);
    scene.add(diamondMarker);

    // PARTICLES / ATMOSPHERIC SPORES
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 160;
      particlePositions[i + 1] = 2 + Math.random() * 35;
      particlePositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xa7f3d0,
      size: 0.7,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // RAYCASTER FOR INTERACTIVE INSPECTION

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(terrain);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const distToClearing = Math.hypot(point.x - 15, point.z - (-10));
        const density = Math.max(18, Math.min(96, Math.round(92 - Math.max(0, 15 - distToClearing) * 4.8)));
        const canopyH = Math.max(4, Math.min(32, Math.round(28 - Math.max(0, 15 - distToClearing) * 1.6)));
        const slope = Math.round(Math.abs(Math.sin(point.x * 0.05)) * 28);
        const valuable = distToClearing < 12;

        setReadout({
          x: Math.round(point.x * 10) / 10,
          y: Math.round(point.y * 10) / 10,
          z: Math.round(point.z * 10) / 10,
          densityPct: density,
          canopyHeightM: canopyH,
          valuable,
          slopeDeg: slope,
          biome: point.y > 8 ? "Montane Shola Ridge" : "Dense Tropical Evergreen",
        });
      }
    };

    mount.addEventListener("click", handleClick);

    // RESIZE HANDLER
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Diamond float and spin
      diamondMarker.rotation.y = t * 1.2;
      diamondMarker.position.y = heightAt(15, -10) + 9 + Math.sin(t * 2.0) * 0.8;

      // Clearing ring pulse
      clearingRing.scale.setScalar(1 + Math.sin(t * 3.0) * 0.05);

      // Particle float
      const pArr = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < pArr.length; i += 3) {
        pArr[i] += Math.sin(t + i) * 0.02;
        if (pArr[i] > 38) pArr[i] = 2;
      }
      particleGeo.attributes.position.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      mount.removeEventListener("click", handleClick);
      mount.innerHTML = "";
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      foliageGeo.dispose();
      foliageMat.dispose();
      trunkGeo.dispose();
      trunkMat.dispose();
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 font-sans">
      {/* 3D WEBGL MOUNT */}
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* TOP OVERLAY CONTROLS */}
      <div className="absolute left-5 top-5 z-10 flex flex-wrap items-center gap-3">
        <div className="glass-panel rounded-xl px-4 py-2.5 shadow-xl border border-white/10 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Trees className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              3D Digital Elevation Canopy Terrain
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-300 font-semibold">
                60 FPS WebGL
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Nilgiri Biosphere Reserve &bull; Zone A High-Density Model
            </div>
          </div>
        </div>

        <div className="glass-panel hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300 border border-white/10">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Click anywhere to inspect localized canopy metrics</span>
        </div>
      </div>

      {/* COMPASS / CAMERA TARGET INDICATOR */}
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2 glass-panel rounded-xl px-3 py-2 text-xs font-mono text-slate-300 border border-white/10">
        <Compass className="h-4 w-4 text-emerald-400 animate-spin" style={{ animationDuration: "20s" }} />
        <span>BEARING: 042&deg; NE</span>
      </div>

      {/* BOTTOM-LEFT INSPECTION READOUT MODAL */}
      <AnimatePresence>
        {readout && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-6 left-6 z-10 w-80 glass-panel rounded-2xl p-5 shadow-2xl border border-emerald-500/30 glow-emerald"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Mountain className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Spot Analysis</span>
              </div>
              <button
                onClick={() => setReadout(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Biome Class:</span>
                <span className="font-semibold text-emerald-300">{readout.biome}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Terrain Coordinates:</span>
                <span className="font-mono text-slate-200">
                  X: {readout.x}, Y: {readout.y}, Z: {readout.z}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Canopy Density:</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        readout.densityPct > 70 ? "bg-emerald-500" : readout.densityPct > 45 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${readout.densityPct}%` }}
                    />
                  </div>
                  <span className="font-bold font-mono text-white">{readout.densityPct}%</span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Canopy Height:</span>
                <span className="font-mono font-bold text-emerald-400">{readout.canopyHeightM} meters</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Slope Gradient:</span>
                <span className="font-mono text-slate-200">{readout.slopeDeg}&deg;</span>
              </div>

              {readout.valuable ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-amber-300 text-[11px]">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>High-Value Timber Habitat (Red Sanders / Teak Reserve)</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-emerald-300 text-[11px]">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Protected Native Rainforest Buffer</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM-RIGHT LEGEND & CAMERA HINT */}
      <div className="absolute bottom-6 right-6 z-10 hidden sm:flex flex-col gap-2">
        <div className="glass-panel rounded-xl p-3 text-[11px] text-slate-300 space-y-1.5 border border-white/10">
          <div className="flex items-center gap-2 font-bold text-white mb-1">
            <Layers className="h-3.5 w-3.5 text-emerald-400" /> Visual Terrain Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-sm shadow-emerald-500/50" />
            <span>Dense Mature Canopy (&gt;75% density)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>Detected Clear-Cut Void (CHG_POLY_001)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
            <span>Perennial Stream / Hydrological Basin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
