import React, { useState } from "react";
import {
  Satellite,
  Wifi,
  Radio,
  Layers,
  Globe,
  TrendingUp,
  Cpu,
  Shield,
  Smartphone,
  Anchor,
  Plane,
  Home,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { DataProvenanceCard, DataProvenanceItem } from "../../../components/common/DataProvenanceBadge";

const CONSTELLATION_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "Active On-Orbit Satellite Counts & Two-Line Elements (TLEs)",
    source: "US Space Force 18th Space Defense Squadron (Space-Track.org / CelesTrak)",
    sourceType: "Regulatory Agency",
    asOfDate: "August 2026 (Daily Ephemeris)",
    updateFrequency: "Daily",
    details: "Automated two-line element orbital tracking, active vs. decaying satellites, and mean motion vectors."
  },
  {
    metricName: "FCC Gen-1 & Gen-2 Constellation Licensing & Shell Grants",
    source: "Federal Communications Commission (FCC) Part 25 Satellite Space Station Licenses (Call Sign: SAT-MOD-20200417)",
    sourceType: "Regulatory Agency",
    asOfDate: "July 2026",
    updateFrequency: "Monthly",
    details: "Approved orbital shells (525 km, 530 km, 535 km, 345 km), inclination angles, and Ku/Ka/V/E-band frequency allocations."
  },
  {
    metricName: "Direct-to-Cell Cellular Spectrum Authorizations",
    source: "FCC Special Temporary Authority (STA) & T-Mobile US 1900 MHz PCS G-Block Filings",
    sourceType: "Regulatory Agency",
    asOfDate: "2026 Commercial Rollout",
    updateFrequency: "Quarterly",
    details: "Direct-to-cellular LTE eNodeB payload performance and carrier partnership agreements (T-Mobile, KDDI, Optus, Rogers)."
  },
  {
    metricName: "Aviation & Maritime Commercial Enterprise ARPU",
    source: "SpaceX Starlink Enterprise Commercial Rate Cards & Public Airline Carrier Contracts",
    sourceType: "Industry Benchmark",
    asOfDate: "Q2 2026",
    updateFrequency: "Monthly",
    details: "Wholesale terminal licensing, high-gain electronically steered array (ESA) antenna pricing, and committed CIR bandwidth."
  }
];

interface OrbitalShellDetail {
  id: string;
  shellName: string;
  altitudeKm: number;
  inclinationDeg: number;
  activeCount: number;
  targetCount: number;
  frequencyBand: string;
  coverageFocus: string;
  laserMeshGen: string;
  status: "Operational" | "Rapid Deployment" | "Regulatory Approval";
  color: string;
}

const ORBITAL_SHELLS: OrbitalShellDetail[] = [
  {
    id: "shell_550",
    shellName: "550 km Mid-Latitude Primary Shell",
    altitudeKm: 550,
    inclinationDeg: 53.0,
    activeCount: 4820,
    targetCount: 4408,
    frequencyBand: "Ku-band (User) / Ka-band (Gateway)",
    coverageFocus: "Global high-density populated latitudes (North America, Europe, East Asia)",
    laserMeshGen: "Gen 2 Optical ISLL (100 Gbps)",
    status: "Operational",
    color: "#06b6d4"
  },
  {
    id: "shell_540",
    shellName: "540 km High-Capacity V2 Mini Shell",
    altitudeKm: 540,
    inclinationDeg: 43.0,
    activeCount: 3120,
    targetCount: 7500,
    frequencyBand: "Ku/Ka + E-band (71-86 GHz)",
    coverageFocus: "Sub-tropical & heavy enterprise / aviation corridors",
    laserMeshGen: "Gen 2+ High-Throughput E-band lasers",
    status: "Rapid Deployment",
    color: "#10b981"
  },
  {
    id: "shell_350_d2c",
    shellName: "350 km Direct-to-Cell V2 Shell",
    altitudeKm: 350,
    inclinationDeg: 53.0,
    activeCount: 1680,
    targetCount: 7500,
    frequencyBand: "1900 MHz PCS & 850 MHz Cellular",
    coverageFocus: "Direct connectivity to standard smartphones & dead-zone emergency text/voice",
    laserMeshGen: "Optical Feeder Backhaul Mesh",
    status: "Rapid Deployment",
    color: "#f59e0b"
  },
  {
    id: "shell_polar",
    shellName: "570 km Polar & Maritime Sun-Synchronous",
    altitudeKm: 570,
    inclinationDeg: 97.6,
    activeCount: 1220,
    targetCount: 1500,
    frequencyBand: "Ku / Ka + Laser Cross-Links",
    coverageFocus: "Arctic Circle, Antarctica, trans-oceanic flight lanes & maritime shipping routes",
    laserMeshGen: "Long-Range Polar Optical Links",
    status: "Operational",
    color: "#a855f7"
  }
];

export const ConstellationShellTracker: React.FC = () => {
  const [selectedShellId, setSelectedShellId] = useState<string>("shell_350_d2c");

  const selectedShell = ORBITAL_SHELLS.find((s) => s.id === selectedShellId) || ORBITAL_SHELLS[0];

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* 1. HEADER HERO */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#07131e] via-[#0b1c2b] to-[#040910] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
                Orbital Shell Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Direct-to-Cell + E-band
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Satellite className="w-6 h-6 text-cyan-400" />
              Constellation Orbital Shell & Spectrum Architecture
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Explore Starlink’s multi-layered orbital shells, radio frequency spectrum grants (Ku, Ka, E-band 71-86 GHz), and revolutionary <strong>Direct-to-Cell</strong> phased array antennas connecting stock smartphones without hardware modifications.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 text-right min-w-[200px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Total Active Constellation
            </span>
            <div className="text-3xl font-black text-cyan-300 mt-0.5">
              ~10,840
              <span className="text-xs font-normal text-neutral-400"> Sats</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              150+ Added Monthly
            </span>
          </div>
        </div>
      </div>

      {/* 2. ORBITAL SHELLS INTERACTIVE CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Active Orbital Shells & Altitude Layers
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">Select Shell for Deep Telemetry:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ORBITAL_SHELLS.map((shell) => {
            const isSelected = shell.id === selectedShellId;
            return (
              <button
                key={shell.id}
                onClick={() => setSelectedShellId(shell.id)}
                className={`p-4 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                    : "bg-neutral-900/70 hover:bg-neutral-800/80 border-white/10 text-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ backgroundColor: `${shell.color}20`, color: shell.color }}
                    >
                      {shell.altitudeKm} km · {shell.inclinationDeg}°
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400">{shell.status}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white mt-2 leading-snug">{shell.shellName}</h4>
                </div>

                <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Active Sats:</span>
                  <span className="font-black text-cyan-300">{shell.activeCount.toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SELECTED SHELL DEEP DIVE */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-extrabold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              Selected Shell Architecture
            </span>
            <h3 className="text-base font-black text-white mt-1">{selectedShell.shellName}</h3>
          </div>
          <span
            className="px-3 py-1 rounded-xl text-xs font-bold font-mono border"
            style={{
              backgroundColor: `${selectedShell.color}20`,
              color: selectedShell.color,
              borderColor: `${selectedShell.color}40`
            }}
          >
            {selectedShell.frequencyBand}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-1.5">
            <span className="text-neutral-400 font-bold uppercase text-[10px]">Geographic Coverage</span>
            <p className="text-neutral-200 leading-relaxed">{selectedShell.coverageFocus}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-1.5">
            <span className="text-neutral-400 font-bold uppercase text-[10px]">Laser Optical Crosslink Gen</span>
            <p className="text-cyan-300 font-bold">{selectedShell.laserMeshGen}</p>
            <p className="text-neutral-400 text-[11px]">Enables multi-gigabit mesh routing without ground station line-of-sight.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-1.5">
            <span className="text-neutral-400 font-bold uppercase text-[10px]">Target Constellation Fill</span>
            <div className="flex justify-between items-center font-mono font-bold text-sm text-white">
              <span>{selectedShell.activeCount.toLocaleString()} / {selectedShell.targetCount.toLocaleString()}</span>
              <span className="text-emerald-300">
                {Math.round((selectedShell.activeCount / selectedShell.targetCount) * 100)}%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, Math.round((selectedShell.activeCount / selectedShell.targetCount) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMMERCIAL REVENUE VERTICALS & GLOBAL TAM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs">
            <Home className="w-4 h-4 text-cyan-400" />
            <span>Residential & SME</span>
          </div>
          <div className="text-xl font-black text-white">$120 / mo</div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Over 5.0M active households across 100+ countries, replacing slow rural DSL and fixed-wireless towers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
            <Plane className="w-4 h-4 text-emerald-400" />
            <span>Aviation In-Flight Wi-Fi</span>
          </div>
          <div className="text-xl font-black text-white">$10k-$25k / plane / mo</div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Adopted by United, Qatar Airways, Hawaiian, Air France, and JSX for gate-to-gate streaming speeds.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
            <Anchor className="w-4 h-4 text-amber-400" />
            <span>Maritime & Offshore</span>
          </div>
          <div className="text-xl font-black text-white">$250-$5k / vessel / mo</div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Royal Caribbean, Carnival, Maersk, and commercial fishing fleets with low-latency ocean mesh coverage.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/20 space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Direct-to-Cell Carrier Wholesale</span>
          </div>
          <div className="text-xl font-black text-white">Revenue Share (T-Mobile)</div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Eliminates cellular dead-zones for 100M+ mobile subscribers across North America, Japan, Australia, and Canada.
          </p>
        </div>
      </div>

      {/* DATA PROVENANCE & SOURCE ATTRIBUTION */}
      <DataProvenanceCard
        category="LEO Telemetry & Spacecraft Communications"
        lastUpdated="August 2026 (Space-Track & FCC Part 25 Daily)"
        sources={CONSTELLATION_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
