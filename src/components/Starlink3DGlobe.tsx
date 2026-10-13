import React, { useRef, useEffect, useState, useMemo } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import {
  RotateCw,
  Maximize2,
  Minimize2,
  Layers,
  Radio,
  Zap,
  Info,
  Wifi,
  HelpCircle,
  X,
  MapPin,
  Sun,
  Gauge,
  Activity,
} from "lucide-react";

interface Point3D {
  baseRadius: number;
  inclination: number; // in radians
  raan: number; // Right Ascension of the Ascending Node in radians
  meanAnomaly: number; // orbital position in radians
  speed: number;
  shellId: string;
  color: THREE.Color;
  size: number;
}

interface Starlink3DGlobeProps {
  activeSatellitesCount?: number;
  lastUpdatedIso?: string;
  isStale?: boolean;
}

const SHELL_TELEMETRY_META: Record<
  string,
  {
    label: string;
    altitudeKm: string;
    inclinationDeg: string;
    velocityKms: string;
    laserThroughputTbps: string;
    solarCaptureGw: string;
    planeCount: number;
  }
> = {
  all: {
    label: "Full Multi-Shell Constellation + Solar Ring",
    altitudeKm: "340–560 km LEO + 1,150 km SSO",
    inclinationDeg: "33.0° – 97.6° Multi-Plane",
    velocityKms: "7.59 km/s",
    laserThroughputTbps: "184.6 Tbps",
    solarCaptureGw: "4.85 GW AM0",
    planeCount: 160,
  },
  shell1: {
    label: "Shell 1 Primary LEO Backbone",
    altitudeKm: "550 km LEO",
    inclinationDeg: "53.0°",
    velocityKms: "7.58 km/s",
    laserThroughputTbps: "86.4 Tbps",
    solarCaptureGw: "1.12 GW AM0",
    planeCount: 72,
  },
  shell2: {
    label: "Shell 2 High-Inclination Mesh",
    altitudeKm: "540 km LEO",
    inclinationDeg: "53.2°",
    velocityKms: "7.59 km/s",
    laserThroughputTbps: "42.0 Tbps",
    solarCaptureGw: "0.68 GW AM0",
    planeCount: 72,
  },
  shell3: {
    label: "Shell 3 Direct-to-Cell (VLEO)",
    altitudeKm: "350 km VLEO",
    inclinationDeg: "53.0°",
    velocityKms: "7.70 km/s",
    laserThroughputTbps: "24.8 Tbps",
    solarCaptureGw: "0.45 GW AM0",
    planeCount: 48,
  },
  shell4: {
    label: "Shell 4 Polar Sun-Synchronous (SSO)",
    altitudeKm: "560 km Polar SSO",
    inclinationDeg: "97.6°",
    velocityKms: "7.57 km/s",
    laserThroughputTbps: "16.2 Tbps",
    solarCaptureGw: "0.52 GW AM0",
    planeCount: 36,
  },
  shell5: {
    label: "Shell 5 Starship V3 Heavy Compute",
    altitudeKm: "525 km LEO",
    inclinationDeg: "33.0°",
    velocityKms: "7.60 km/s",
    laserThroughputTbps: "15.2 Tbps",
    solarCaptureGw: "0.88 GW AM0",
    planeCount: 28,
  },
  dyson_ring: {
    label: "Dyson Solar Collector Swarm Ring",
    altitudeKm: "1,150 km Dawn-Dusk SSO",
    inclinationDeg: "98.2° Sun-Locked",
    velocityKms: "7.28 km/s",
    laserThroughputTbps: "64.0 Tbps Power-Link",
    solarCaptureGw: "3.40 GW Continuous AM0",
    planeCount: 12,
  },
};

export const Starlink3DGlobe: React.FC<Starlink3DGlobeProps> = ({
  activeSatellitesCount = 10840,
}) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction State
  const [isRotating, setIsRotating] = useState(true);
  const [selectedShellFilter, setSelectedShellFilter] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLaserMesh, setShowLaserMesh] = useState(true);
  const [showDysonRing, setShowDysonRing] = useState(true);
  const [orbitSpeedMultiplier, setOrbitSpeedMultiplier] = useState<number>(1);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Reactive Refs to guarantee animation loop uses latest state without lag or component re-mounts
  const selectedShellFilterRef = useRef(selectedShellFilter);
  selectedShellFilterRef.current = selectedShellFilter;

  const showLaserMeshRef = useRef(showLaserMesh);
  showLaserMeshRef.current = showLaserMesh;

  const showDysonRingRef = useRef(showDysonRing);
  showDysonRingRef.current = showDysonRing;

  const orbitSpeedMultiplierRef = useRef(orbitSpeedMultiplier);
  orbitSpeedMultiplierRef.current = orbitSpeedMultiplier;

  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute filtered working satellite estimate based on active shell
  const displayedSatelliteCount = useMemo(() => {
    if (selectedShellFilter === "all") return activeSatellitesCount;
    if (selectedShellFilter === "shell1") return Math.round(activeSatellitesCount * 0.55);
    if (selectedShellFilter === "shell2") return Math.round(activeSatellitesCount * 0.2);
    if (selectedShellFilter === "shell3") return Math.round(activeSatellitesCount * 0.12);
    if (selectedShellFilter === "shell4") return Math.round(activeSatellitesCount * 0.08);
    if (selectedShellFilter === "shell5") return Math.round(activeSatellitesCount * 0.05);
    if (selectedShellFilter === "dyson_ring") return 420;
    return activeSatellitesCount;
  }, [selectedShellFilter, activeSatellitesCount]);

  const activeShellMeta =
    SHELL_TELEMETRY_META[selectedShellFilter] || SHELL_TELEMETRY_META.all;

  // Generate 3D Satellite Shell particles + Dyson Solar Collector Ring
  const satellites = useMemo(() => {
    const points: Point3D[] = [];
    const GLOBE_RADIUS = 100;

    // Scale orbits realistic to Earth's radius
    const shells = [
      { id: "shell1", name: "Shell 1 (550km / 53°)", inc: 53.0, radius: GLOBE_RADIUS * 1.086, count: 750, color: "#22d3ee" }, // cyan
      { id: "shell2", name: "Shell 2 (540km / 53.2°)", inc: 53.2, radius: GLOBE_RADIUS * 1.085, count: 520, color: "#38bdf8" }, // sky
      { id: "shell3", name: "Direct-to-Cell (350km / 53°)", inc: 53.0, radius: GLOBE_RADIUS * 1.055, count: 380, color: "#fbbf24" }, // amber
      { id: "shell4", name: "Polar SSO (560km / 97.6°)", inc: 97.6, radius: GLOBE_RADIUS * 1.088, count: 320, color: "#34d399" }, // emerald
      { id: "shell5", name: "V3 Heavy (525km / 33°)", inc: 33.0, radius: GLOBE_RADIUS * 1.082, count: 280, color: "#c084fc" }, // purple
      { id: "dyson_ring", name: "Dyson Solar Collector Swarm (1,150km SSO)", inc: 98.2, radius: GLOBE_RADIUS * 1.22, count: 420, color: "#f59e0b" }, // solar bronze/gold
    ];

    shells.forEach((shell) => {
      const incRad = (shell.inc * Math.PI) / 180;
      const planes = shell.id === "dyson_ring" ? 6 : 32;
      for (let i = 0; i < shell.count; i++) {
        // Distribute RAAN across orbital planes
        const raan = (i % planes) * ((2 * Math.PI) / planes) + Math.random() * 0.03;
        // Distribute anomaly along the orbit ring
        const meanAnomaly = (i / shell.count) * 2 * Math.PI + Math.random() * 0.12;
        const speed = shell.id === "dyson_ring" ? 0.00055 : 0.0008 + Math.random() * 0.0004;

        points.push({
          baseRadius: shell.radius,
          inclination: incRad,
          raan: raan,
          meanAnomaly: meanAnomaly,
          speed: speed,
          shellId: shell.id,
          color: new THREE.Color(shell.color),
          size: shell.id === "dyson_ring" ? 3.2 : shell.id === "shell3" ? 3 : 2,
        });
      }
    });
    return points;
  }, []);

  // ThreeJS Animation Loop & Mesh Generation
  useEffect(() => {
    if (!globeRef.current) return;

    // Access underlying Three.js scene from react-globe.gl
    const scene = globeRef.current.scene();
    if (!scene) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(satellites.length * 3);
    const colors = new Float32Array(satellites.length * 3);

    satellites.forEach((pt, i) => {
      colors[i * 3] = pt.color.r;
      colors[i * 3 + 1] = pt.color.g;
      colors[i * 3 + 2] = pt.color.b;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom shader material for glowing orbital nodes
    const material = new THREE.PointsMaterial({
      size: 2.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);

    // Create a line mesh for the optical laser links
    const linesGeometry = new THREE.BufferGeometry();
    const maxLines = 1200;
    const linePositions = new Float32Array(maxLines * 2 * 3);
    linesGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    });
    const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
    scene.add(linesMesh);

    let animId: number;
    const animate = () => {
      const posAttr = geometry.attributes.position;
      const linePosAttr = linesGeometry.attributes.position;

      const currentFilter = selectedShellFilterRef.current;
      const currentShowLaser = showLaserMeshRef.current;
      const currentShowDyson = showDysonRingRef.current;
      const speedMult = orbitSpeedMultiplierRef.current;

      let lineIdx = 0;
      const shellPts: { x: number; y: number; z: number; id: string }[] = [];

      satellites.forEach((pt, i) => {
        // Orbit propagation scaled by user speed multiplier
        pt.meanAnomaly += pt.speed * speedMult;
        if (pt.meanAnomaly > Math.PI * 2) pt.meanAnomaly -= Math.PI * 2;

        const u = pt.meanAnomaly;
        const xOrb = pt.baseRadius * Math.cos(u);
        const yOrb = pt.baseRadius * Math.sin(u);

        const cosInc = Math.cos(pt.inclination);
        const sinInc = Math.sin(pt.inclination);
        const cosRaan = Math.cos(pt.raan);
        const sinRaan = Math.sin(pt.raan);

        // Convert orbital plane to 3D earth coordinates
        const x3d = xOrb * cosRaan - yOrb * cosInc * sinRaan;
        const z3d = -(xOrb * sinRaan + yOrb * cosInc * cosRaan);
        const y3d = yOrb * sinInc;

        // Check shell visibility filter
        const isDysonNode = pt.shellId === "dyson_ring";
        const isVisible =
          currentFilter === "all"
            ? isDysonNode
              ? currentShowDyson
              : true
            : pt.shellId === currentFilter;

        if (isVisible) {
          posAttr.setXYZ(i, x3d, y3d, z3d);
          if (currentShowLaser) {
            shellPts.push({ x: x3d, y: y3d, z: z3d, id: pt.shellId });
          }
        } else {
          // Hide filtered-out satellite inside Earth center
          posAttr.setXYZ(i, 0, 0, 0);
        }
      });

      // Calculate laser mesh connections
      if (currentShowLaser) {
        const sampleSize = Math.min(shellPts.length, 360);
        for (let i = 0; i < sampleSize; i++) {
          const p1 = shellPts[i];
          for (let j = i + 1; j < Math.min(i + 12, sampleSize); j++) {
            const p2 = shellPts[j];
            if (p1.id === p2.id) {
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dz = p1.z - p2.z;
              const distSq = dx * dx + dy * dy + dz * dz;
              if (distSq < 1550 && lineIdx < maxLines * 2) {
                linePosAttr.setXYZ(lineIdx++, p1.x, p1.y, p1.z);
                linePosAttr.setXYZ(lineIdx++, p2.x, p2.y, p2.z);
              }
            }
          }
        }
      }

      // Clear remaining lines
      while (lineIdx < maxLines * 2) {
        linePosAttr.setXYZ(lineIdx++, 0, 0, 0);
      }

      posAttr.needsUpdate = true;
      linePosAttr.needsUpdate = true;
      linesMesh.visible = currentShowLaser;

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      scene.remove(pointsMesh);
      scene.remove(linesMesh);
      geometry.dispose();
      material.dispose();
      linesGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [satellites]);

  // Handle auto rotation dynamically
  useEffect(() => {
    const applyAutoRotate = () => {
      if (globeRef.current?.controls) {
        const controls = globeRef.current.controls();
        if (controls) {
          controls.autoRotate = isRotating;
          controls.autoRotateSpeed = 0.6;
        }
      }
    };
    applyAutoRotate();
    const interval = setInterval(applyAutoRotate, 250);
    return () => clearInterval(interval);
  }, [isRotating]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationNotice("Geolocation unavailable in this browser.");
      setTimeout(() => setLocationNotice(null), 3500);
      return;
    }
    setLocating(true);
    setLocationNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
        setIsRotating(false); // Stop rotation to focus
        if (globeRef.current) {
          globeRef.current.pointOfView(
            { lat: position.coords.latitude, lng: position.coords.longitude, altitude: 1.5 },
            1500
          );
        }
      },
      (error) => {
        console.error(error);
        setLocating(false);
        setLocationNotice("Location permission declined — showing global orbital view.");
        setTimeout(() => setLocationNotice(null), 3500);
      }
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#030712] shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[520px] sm:h-[620px]"
      }`}
    >
      {/* 3D GLOBE CANVAS */}
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.15}
        width={dimensions.width}
        height={dimensions.height}
        htmlElementsData={
          userLocation ? [{ lat: userLocation.lat, lng: userLocation.lng, size: 20 }] : []
        }
        htmlElement={() => {
          const el = document.createElement("div");
          el.innerHTML = `
             <div class="relative flex h-5 w-5 -translate-x-1/2 -translate-y-1/2">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span class="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
             </div>
             <div class="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap border border-emerald-500/30 backdrop-blur-md">
               Ground Downlink Locked
             </div>
           `;
          return el;
        }}
      />

      {/* Top Left HUD Badge & Live Shell Telemetry Inspector */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[290px] sm:max-w-sm pointer-events-none">
        <div className="bg-[#050d1a]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-3 shadow-2xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-cyan-300">
                Orbital & Dyson Swarm 3D HUD
              </h2>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              ● 60FPS KEPLERIAN
            </span>
          </div>

          <div className="text-[10px] font-bold text-white truncate">
            {activeShellMeta.label}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10 font-mono tabular-nums text-[10px]">
            <div className="bg-black/50 px-2 py-1 rounded-lg border border-white/5">
              <div className="text-[8px] uppercase text-neutral-400">Altitude / Vector</div>
              <div className="text-cyan-300 font-bold truncate">{activeShellMeta.altitudeKm}</div>
            </div>
            <div className="bg-black/50 px-2 py-1 rounded-lg border border-white/5">
              <div className="text-[8px] uppercase text-neutral-400">Orbital Velocity</div>
              <div className="text-white font-bold">
                {activeShellMeta.velocityKms} · {activeShellMeta.inclinationDeg.split(" ")[0]}
              </div>
            </div>
            <div className="bg-black/50 px-2 py-1 rounded-lg border border-white/5">
              <div className="text-[8px] uppercase text-neutral-400">Optical Laser Mesh</div>
              <div className="text-emerald-300 font-bold">{activeShellMeta.laserThroughputTbps}</div>
            </div>
            <div className="bg-black/50 px-2 py-1 rounded-lg border border-amber-500/20">
              <div className="text-[8px] uppercase text-amber-400/90">Solar Swarm Flux</div>
              <div className="text-amber-300 font-bold">{activeShellMeta.solarCaptureGw}</div>
            </div>
          </div>
        </div>

        {locationNotice && (
          <div className="bg-amber-950/90 border border-amber-500/40 text-amber-200 text-[10px] font-mono px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg">
            {locationNotice}
          </div>
        )}
      </div>

      {/* Top Right Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
              userLocation
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : locating
                ? "bg-neutral-800/80 text-neutral-400 border-white/10"
                : "bg-[#050d1a]/85 hover:bg-neutral-800 text-white border-white/15"
            }`}
            title="Locate Me & Check Coverage"
          >
            <MapPin className={`w-3.5 h-3.5 ${locating ? "animate-pulse" : "text-emerald-400"}`} />
            <span className="hidden sm:inline">
              {locating ? "Locating..." : userLocation ? "Ground Locked" : "Ground Lock"}
            </span>
          </button>

          <button
            onClick={() => setShowDysonRing(!showDysonRing)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
              showDysonRing
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10"
                : "bg-[#050d1a]/85 text-neutral-400 border-white/10 hover:text-white"
            }`}
            title="Toggle Dyson Solar Collector Ring"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Solar Ring</span>
          </button>

          <button
            onClick={() => setShowLaserMesh(!showLaserMesh)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
              showLaserMesh
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-[#050d1a]/85 text-neutral-400 border-white/10 hover:text-white"
            }`}
            title="Toggle Optical Laser Mesh Links"
          >
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Laser Mesh</span>
          </button>

          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
              isRotating
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30"
                : "bg-[#050d1a]/85 text-neutral-400 border-white/10 hover:text-white"
            }`}
            title={isRotating ? "Pause Auto Rotation" : "Start Auto Rotation"}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRotating ? "Orbiting" : "Paused"}</span>
          </button>

          <button
            onClick={() => setShowInfoPopover(!showInfoPopover)}
            className={`p-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer ${
              showInfoPopover
                ? "bg-cyan-400 text-black border-cyan-300 shadow-lg shadow-cyan-400/30"
                : "bg-[#050d1a]/85 text-cyan-300 border-cyan-500/30 hover:bg-cyan-950"
            }`}
            title="Orbital Mechanics Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-[#050d1a]/85 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/30 backdrop-blur-md transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Orbital Propagation Speed Scrubber */}
        <div className="flex items-center gap-1 bg-[#050d1a]/85 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/15 text-[10px] font-mono">
          <Gauge className="w-3 h-3 text-cyan-400 mr-1" />
          <span className="text-neutral-400 uppercase mr-1">Sim Speed:</span>
          {[0.5, 1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setOrbitSpeedMultiplier(spd)}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                orbitSpeedMultiplier === spd
                  ? "bg-cyan-400 text-black font-black"
                  : "text-neutral-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* ONE-CLICK INFO POPOVER MODAL */}
      {showInfoPopover && (
        <div className="absolute top-28 right-4 z-30 max-w-sm sm:max-w-md p-4 rounded-2xl bg-[#07111e]/95 border border-cyan-400/50 backdrop-blur-xl shadow-2xl space-y-2 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-extrabold text-cyan-300 border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Orbital Shells & Dyson Solar Collector HUD
            </span>
            <button
              onClick={() => setShowInfoPopover(false)}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed font-sans">
            This 3D WebGL telemetry globe renders the 5 operational Starlink LEO shells (340–560 km) alongside the 1,150 km Dawn-Dusk Sun-Synchronous <strong>Dyson Solar Collector Swarm Ring</strong> (gold nodes). Use the shell selector below or the speed scrubber above to inspect inclination planes, optical laser mesh links, and continuous 1,361 W/m² AM0 solar flux.
          </p>
          <div className="pt-1 flex justify-end">
            <button
              onClick={() => setShowInfoPopover(false)}
              className="px-3 py-1 rounded-lg bg-cyan-400 text-black font-extrabold text-[11px] hover:bg-cyan-300 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Filter & Metrics HUD */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Shell Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-[#050d1a]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/15 shadow-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            Shell:
          </span>
          {[
            { id: "all", label: "All Shells" },
            { id: "shell1", label: "Main LEO (53°)" },
            { id: "shell2", label: "Shell 2 (53.2°)" },
            { id: "shell3", label: "Direct-Cell (350km)" },
            { id: "shell4", label: "Polar SSO (97°)" },
            { id: "shell5", label: "V3 Heavy (33°)" },
            { id: "dyson_ring", label: "☀️ Dyson Solar Ring" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedShellFilter(f.id)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                selectedShellFilter === f.id
                  ? f.id === "dyson_ring"
                    ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30 font-black"
                    : "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 font-black"
                  : "text-neutral-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Live Metric Chip */}
        <div className="flex items-center gap-3 bg-[#050d1a]/90 backdrop-blur-xl px-3.5 py-1.5 rounded-2xl border border-cyan-500/30 text-[11px] font-mono tabular-nums text-cyan-300 shadow-xl">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-white">~{displayedSatelliteCount.toLocaleString()}</span>
            <span className="text-neutral-400">
              {selectedShellFilter === "dyson_ring" ? "Solar Collectors" : "Active Nodes"}
            </span>
          </div>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">1,361 W/m² AM0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
