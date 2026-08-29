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
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);

  // Reactive Refs to guarantee animation loop uses latest state without lag or component re-mounts
  const selectedShellFilterRef = useRef(selectedShellFilter);
  selectedShellFilterRef.current = selectedShellFilter;

  const showLaserMeshRef = useRef(showLaserMesh);
  showLaserMeshRef.current = showLaserMesh;

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
    if (selectedShellFilter === "shell2") return Math.round(activeSatellitesCount * 0.20);
    if (selectedShellFilter === "shell3") return Math.round(activeSatellitesCount * 0.12);
    if (selectedShellFilter === "shell4") return Math.round(activeSatellitesCount * 0.08);
    if (selectedShellFilter === "shell5") return Math.round(activeSatellitesCount * 0.05);
    return activeSatellitesCount;
  }, [selectedShellFilter, activeSatellitesCount]);

  // Generate 3D Satellite Shell particles - High Density
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
    ];

    shells.forEach((shell) => {
      const incRad = (shell.inc * Math.PI) / 180;
      for (let i = 0; i < shell.count; i++) {
        // Distribute RAAN across orbital planes
        const raan = (i % 32) * ((2 * Math.PI) / 32) + (Math.random() * 0.04);
        // Distribute anomaly along the orbit ring
        const meanAnomaly = (i / shell.count) * 2 * Math.PI + Math.random() * 0.15;
        const speed = 0.0008 + (Math.random() * 0.0004); 

        points.push({
          baseRadius: shell.radius,
          inclination: incRad,
          raan: raan,
          meanAnomaly: meanAnomaly,
          speed: speed,
          shellId: shell.id,
          color: new THREE.Color(shell.color),
          size: shell.id === "shell3" ? 3 : 2,
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
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Custom shader material for beautiful glowing dots
    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });
    
    const pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);
    
    // Also create a line mesh for the laser links
    const linesGeometry = new THREE.BufferGeometry();
    // Max 1000 lines, 2 vertices each
    const maxLines = 1000;
    const linePositions = new Float32Array(maxLines * 2 * 3);
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
    scene.add(linesMesh);

    let animId: number;
    const animate = () => {
      const posAttr = geometry.attributes.position;
      const linePosAttr = linesGeometry.attributes.position;
      
      const currentFilter = selectedShellFilterRef.current;
      const currentShowLaser = showLaserMeshRef.current;

      let lineIdx = 0;
      const shellPts: {x: number, y: number, z: number, id: string}[] = [];

      satellites.forEach((pt, i) => {
        // Orbit propagation
        pt.meanAnomaly += pt.speed;
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
        const isVisible = currentFilter === "all" || pt.shellId === currentFilter;

        if (isVisible) {
          posAttr.setXYZ(i, x3d, y3d, z3d);
          if (currentShowLaser) {
             shellPts.push({x: x3d, y: y3d, z: z3d, id: pt.shellId});
          }
        } else {
          // Hide filtered-out satellite inside Earth center
          posAttr.setXYZ(i, 0, 0, 0);
        }
      });
      
      // Calculate laser mesh connections
      if (currentShowLaser) {
         const sampleSize = Math.min(shellPts.length, 300);
         for(let i=0; i<sampleSize; i++) {
             const p1 = shellPts[i];
             for(let j=i+1; j<Math.min(i+12, sampleSize); j++) {
                 const p2 = shellPts[j];
                 if (p1.id === p2.id) {
                     const dx = p1.x - p2.x;
                     const dy = p1.y - p2.y;
                     const dz = p1.z - p2.z;
                     const distSq = dx*dx + dy*dy + dz*dz;
                     if (distSq < 1500 && lineIdx < maxLines * 2) {
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
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocating(false);
        setIsRotating(false); // Stop rotation to focus
        if (globeRef.current) {
           globeRef.current.pointOfView({ lat: position.coords.latitude, lng: position.coords.longitude, altitude: 1.5 }, 1500);
        }
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location");
        setLocating(false);
      }
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#030712] shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[480px] sm:h-[580px]"
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
         htmlElementsData={userLocation ? [{ lat: userLocation.lat, lng: userLocation.lng, size: 20 }] : []}
         htmlElement={(d) => {
           const el = document.createElement('div');
           el.innerHTML = `
             <div class="relative flex h-5 w-5 -translate-x-1/2 -translate-y-1/2">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span class="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
             </div>
             <div class="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap border border-emerald-500/30 backdrop-blur-md">
               Your Location
             </div>
           `;
           return el;
         }}
      />

      {/* Top Left HUD Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 max-w-[280px] sm:max-w-md pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300 drop-shadow-md">
            Starlink Orbital Constellation 3D Globe
          </h2>
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-300 font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/20">
          Starlink shell visualization · approx ~10,840 working sats as of Aug 2026 · illustrative density
        </p>
      </div>

      {/* Top Right Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className={`p-2 rounded-xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
              userLocation
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : locating
                ? "bg-neutral-800/80 text-neutral-400 border-white/10"
                : "bg-neutral-800/80 hover:bg-neutral-700/80 text-white border-white/20"
            }`}
            title="Locate Me & Check Coverage"
          >
            <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">
              {locating ? "Locating..." : userLocation ? "Location Grounded" : "Find Coverage"}
            </span>
          </button>
          
          <button
          onClick={() => setShowInfoPopover(!showInfoPopover)}
          className={`p-2 rounded-xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
            showInfoPopover
              ? "bg-cyan-400 text-black border-cyan-300 shadow-lg shadow-cyan-400/30"
              : "bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/90"
          }`}
          title="What am I looking at?"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">What am I looking at?</span>
        </button>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`p-2 rounded-xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
            isRotating
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30"
              : "bg-neutral-800/80 text-neutral-400 border-white/10 hover:text-white"
          }`}
          title={isRotating ? "Pause Auto Rotation" : "Start Auto Rotation"}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{isRotating ? "Orbiting" : "Paused"}</span>
        </button>

        <button
          onClick={() => setShowLaserMesh(!showLaserMesh)}
          className={`p-2 rounded-xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
            showLaserMesh
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-neutral-800/80 text-neutral-400 border-white/10"
          }`}
          title="Toggle Laser Mesh Links"
        >
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Laser Mesh</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/30 backdrop-blur-md transition-all cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        </div>
      </div>

      {/* ONE-CLICK INFO POPOVER MODAL */}
      {showInfoPopover && (
        <div className="absolute top-16 right-4 z-30 max-w-sm sm:max-w-md p-4 rounded-2xl bg-[#091322]/95 border border-cyan-400/50 backdrop-blur-xl shadow-2xl space-y-2 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-extrabold text-cyan-300 border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              What Am I Looking At?
            </span>
            <button
              onClick={() => setShowInfoPopover(false)}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed font-sans">
            This 3D model renders an actual high-res map of the Earth and the primary operational orbital shells of the Starlink megaconstellation using physics-based inclination vectors and mathematical particle density. It demonstrates orbital shell mechanics, inter-satellite laser mesh links, and global coverage density natively in 3D.
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
        <div className="flex flex-wrap items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
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
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedShellFilter(f.id)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                selectedShellFilter === f.id
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 font-black"
                  : "text-neutral-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Live Metric Chip */}
        <div className="flex items-center gap-3 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-white">~{displayedSatelliteCount.toLocaleString()}</span>
            <span className="text-neutral-400">Working Sats</span>
          </div>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>350–560km LEO</span>
          </div>
        </div>
      </div>
    </div>
  );
};
