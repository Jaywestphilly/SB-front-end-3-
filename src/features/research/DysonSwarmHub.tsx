import React, { useState, useEffect } from "react";
import { useSubTabUrl } from "../../hooks/useSubTabUrl";
import { formatUtcTimestamp, isDataStale } from "../../utils/timeUtils";
import { Starlink3DGlobe } from "../../components/Starlink3DGlobe";
import {
  SPACEX_LAUNCHES,
  PLANET_LABS_MISSIONS,
  DYSON_POWER_METRICS,
  SPACEX_HISTORY_ROADMAP,
  SPACE_DOCUMENTARIES,
  NASA_ARTEMIS_MISSIONS,
  DYSON_SWARM_EXPLAINER_CONCEPTS,
  SPACEX_OFFICIAL_PORTALS,
  SpaceXLaunch,
} from "../../data/dysonSpaceData";
import {
  Orbit,
  Rocket,
  Satellite,
  Zap,
  Globe,
  Radio,
  RefreshCw,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  Shield,
  TrendingUp,
  Activity,
  Info,
  ChevronRight,
  Wifi,
  Calendar,
  Flame,
  Check,
  Film,
  Moon,
  Lightbulb,
  History,
  Play,
  Video,
  X,
  Youtube,
  Cpu,
  ArrowUpRight,
  Target,
  Sun,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { DysonLiveData, DysonLaunch, DysonStory } from "../../types";
import { OrbitalLaunchEconomics } from "./dyson/OrbitalLaunchEconomics";
import { SpacePowerArbitrage } from "./dyson/SpacePowerArbitrage";
import { LaserMeshLatencyMatrix } from "./dyson/LaserMeshLatencyMatrix";
import { ConstellationShellTracker } from "./dyson/ConstellationShellTracker";

type DysonSubTab =
  | "space_news"
  | "orbital_economics"
  | "power_arbitrage"
  | "laser_mesh_latency"
  | "constellation_shells"
  | "starlink_hub"
  | "starship_hub"
  | "launch_cadence"
  | "dyson_power"
  | "dyson_metaphor"
  | "spacex_history"
  | "planet_labs"
  | "space_docs";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

const calculateTimeRemaining = (targetIsoDate: string): TimeRemaining => {
  const target = new Date(targetIsoDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
};

const generateGoogleCalendarUrl = (launch: SpaceXLaunch) => {
  const startDate = new Date(launch.targetIsoDate);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const title = encodeURIComponent(`🚀 ${launch.provider}: ${launch.missionName}`);
  const details = encodeURIComponent(
    `${launch.summary}\n\nRocket: ${launch.rocket}\nSite: ${launch.launchSite}\nWebcast: ${launch.webcastUrl}`
  );
  const location = encodeURIComponent(launch.launchSite);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(
    startDate
  )}/${fmt(endDate)}&details=${details}&location=${location}`;
};

const downloadIcsFile = (launch: SpaceXLaunch) => {
  const startDate = new Date(launch.targetIsoDate);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dyson Swarm Hub//Rocket Launch Countdown//EN",
    "BEGIN:VEVENT",
    `UID:launch-${launch.id}@dysonswarm.hub`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:🚀 ${launch.provider}: ${launch.missionName}`,
    `DESCRIPTION:${launch.summary} | Rocket: ${launch.rocket} | Site: ${launch.launchSite}`,
    `LOCATION:${launch.launchSite}`,
    `URL:${launch.webcastUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${launch.missionName.replace(/[^a-z0-9]/gi, "_")}_Launch.ics`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const DysonSwarmHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useSubTabUrl<DysonSubTab>(
    "/research/dyson-swarm",
    [
      "space_news",
      "orbital_economics",
      "power_arbitrage",
      "laser_mesh_latency",
      "constellation_shells",
      "starlink_hub",
      "starship_hub",
      "launch_cadence",
      "dyson_power",
      "dyson_metaphor",
      "spacex_history",
      "planet_labs",
      "space_docs"
    ] as const,
    "space_news"
  );
  const [dysonLiveData, setDysonLiveData] = useState<DysonLiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [spaceNews, setSpaceNews] = useState<any[]>([]);
  const [isSpaceNewsLoading, setIsSpaceNewsLoading] = useState(false);
  const [liveLaunches, setLiveLaunches] = useState<any>(null);
  const [isLaunchesLoading, setIsLaunchesLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<(typeof SPACE_DOCUMENTARIES)[0] | null>(null);

  useEffect(() => {
    if (activeSubTab === "space_news" && spaceNews.length === 0) {
      setIsSpaceNewsLoading(true);
      fetch("/api/space/news")
        .then(r => r.json())
        .then(d => {
          setSpaceNews(d);
          setIsSpaceNewsLoading(false);
        })
        .catch(e => {
          console.error(e);
          setIsSpaceNewsLoading(false);
        });
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === "launch_cadence" && !liveLaunches) {
      setIsLaunchesLoading(true);
      fetch("/api/space/launches")
        .then(r => r.json())
        .then(d => {
          setLiveLaunches(d);
          setIsLaunchesLoading(false);
        })
        .catch(e => {
          console.error(e);
          setIsLaunchesLoading(false);
        });
    }
  }, [activeSubTab]);

  const fetchDysonData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/data/dyson");
      if (res.ok) {
        const json = await res.json();
        setDysonLiveData(json);
      }
    } catch (err) {
      console.warn("Failed to fetch dyson live data, using baseline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDysonData();
  }, []);

  

  const starlinkActiveCount =
    dysonLiveData?.fleet_metrics?.active_satellites || 10840;

  return (
    <div className="w-full px-4 pt-3 pb-36 sm:pb-40 space-y-6 text-white max-w-7xl mx-auto">
      {/* 1. DYSON SWARM HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#050b14] via-[#091524] to-[#040812] border border-cyan-500/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20">
                <Orbit className="w-7 h-7 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-amber-200 bg-clip-text text-transparent">
                    Dyson Swarm
                  </h1>
                  <span className="px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
                    Orbital Hub
                  </span>
                  {isDataStale(dysonLiveData?.updated_at) ? (
                    <span className="px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/40">
                      STALE DATA (&gt;24H)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
                      LIVE TELEMETRY
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 text-[10px] sm:text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 rounded-lg border border-cyan-500/30">
                    Updated: {formatUtcTimestamp(dysonLiveData?.updated_at || new Date().toISOString())}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 font-medium mt-1">
                  SpaceX Starlink Megaconstellations, Starship Milestones & Orbital Megastructure Metrology
                </p>
              </div>
            </div>

            <button
              onClick={fetchDysonData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Syncing Feed..." : "Refresh Telemetry"}</span>
            </button>
          </div>

          {/* COMPACT KEY NUMBERS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
            <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
                Working Starlink Sats
              </span>
              <span className="text-sm sm:text-base font-black text-white mt-0.5">
                ~10,840 Active (approx)
              </span>
              <span className="text-[9px] text-neutral-400">As of Aug 2026 · ~2/3 of active sats</span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20 flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                Falcon 9 Cadence
              </span>
              <span className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
                Launch Every ~2 Days (approx)
              </span>
              <span className="text-[9px] text-neutral-400">100+ booster flights / yr</span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-500/20 flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Starship V3 Era
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-300 mt-0.5">
                150+ Tons to LEO (approx)
              </span>
              <span className="text-[9px] text-neutral-400">Full rapid reusability target</span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-purple-500/20 flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                Global Orbit Share
              </span>
              <span className="text-sm sm:text-base font-black text-purple-300 mt-0.5">
                &gt;88% Mass-to-Orbit (approx)
              </span>
              <span className="text-[9px] text-neutral-400">Unassailable launch moat</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE PROJECT HUB NAV TABS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Interactive Project & Telemetry Hub
          </h2>
          <span className="text-[11px] font-mono text-neutral-400">Select Module:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: "space_news", label: "Live Space News", icon: Zap },
            { id: "orbital_economics", label: "Starship $/kg Engine", icon: Rocket },
            { id: "power_arbitrage", label: "SBSP vs AI Microgrids", icon: Sun },
            { id: "laser_mesh_latency", label: "Laser Mesh Latency", icon: Radio },
            { id: "constellation_shells", label: "Orbital Shells & Spectrum", icon: Satellite },
            { id: "starlink_hub", label: "Starlink Constellation", icon: Wifi },
            { id: "starship_hub", label: "Starship Program", icon: Rocket },
            { id: "launch_cadence", label: "Launch Windows", icon: Clock },
            { id: "dyson_power", label: "Solar Metrology", icon: Flame },
            { id: "dyson_metaphor", label: "Dyson Swarm Metaphor", icon: Lightbulb },
            { id: "spacex_history", label: "SpaceX History Roadmap", icon: History },
            { id: "planet_labs", label: "Planet Labs Fleet", icon: Globe },
            { id: "space_docs", label: "Video Vault", icon: Film },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveSubTab(tab.id as DysonSubTab);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 font-extrabold"
                    : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/10"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-cyan-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 0A: LIVE SPACE NEWS */}
        {activeSubTab === "space_news" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/40">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Live Spaceflight News</h3>
                <p className="text-sm text-cyan-300/70">Latest articles from Spaceflight News API</p>
              </div>
            </div>
            
            {isSpaceNewsLoading ? (
               <div className="flex items-center gap-2 text-cyan-400 p-4">
                 <div className="w-4 h-4 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                 Fetching live news...
               </div>
            ) : spaceNews.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {spaceNews.map((news: any) => (
                   <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
                     <div>
                       <div className="text-xs text-cyan-400 font-mono mb-2">{news.news_site}</div>
                       <h4 className="text-sm font-bold text-white mb-2">{news.title}</h4>
                       <p className="text-xs text-neutral-400 line-clamp-3">{news.summary}</p>
                     </div>
                     <div className="mt-4 text-[10px] text-neutral-500 font-mono">
                       {new Date(news.published_at).toLocaleString()}
                     </div>
                   </a>
                 ))}
               </div>
            ) : (
               <div className="p-4 bg-red-900/20 text-red-400 rounded-xl">No news found or failed to load.</div>
            )}
          </div>
        )}

        {/* TAB 0B: STARSHIP $/KG DECAY ENGINE */}
        {activeSubTab === "orbital_economics" && (
          <OrbitalLaunchEconomics />
        )}

        {/* TAB 0C: SBSP VS AI MICROGRIDS POWER ARBITRAGE */}
        {activeSubTab === "power_arbitrage" && (
          <SpacePowerArbitrage />
        )}

        {/* TAB 0D: ORBITAL LASER MESH & QUANT LATENCY */}
        {activeSubTab === "laser_mesh_latency" && (
          <LaserMeshLatencyMatrix />
        )}

        {/* TAB 0E: CONSTELLATION ORBITAL SHELLS & SPECTRUM */}
        {activeSubTab === "constellation_shells" && (
          <ConstellationShellTracker />
        )}

        {/* TAB 1: STARLINK HUB */}
        {activeSubTab === "starlink_hub" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Starlink Metrics Chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#080d1a]/90 border border-cyan-500/30 flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Active Constellation
                </span>
                <span className="text-xl font-black text-cyan-300 mt-1">~10,840 Sats</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                  ~10.8k working, Aug 2026
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d0a1a]/90 border border-amber-500/30 flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Primary Shell Altitude
                </span>
                <span className="text-xl font-black text-amber-300 mt-1">550 km LEO</span>
                <span className="text-[10px] text-amber-400/80 font-semibold mt-1">
                  Low Earth Orbit (20-30ms latency)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#030e14]/90 border border-emerald-500/30 flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Direct-to-Cell Shell
                </span>
                <span className="text-xl font-black text-emerald-300 mt-1">350 km Orbit</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                  LTE/5G to stock phones
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0f0714]/90 border border-purple-500/30 flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Laser Mesh Throughput
                </span>
                <span className="text-xl font-black text-purple-300 mt-1">648+ Tbps</span>
                <span className="text-[10px] text-purple-400 font-semibold mt-1">
                  100Gbps cross-links per sat
                </span>
              </div>
            </div>

            {/* V2 Mini vs V3 Explanation */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Starlink Generations: V2 Mini vs V3 Architecture
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-cyan-500/20 space-y-1.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                    Starlink V2 Mini (Falcon 9 Deployed)
                  </span>
                  <p className="text-neutral-300 leading-relaxed">
                    Mass: ~800 kg. Features dual E-band phased array antennas and 100Gbps inter-satellite optical lasers. Delivers 4x the backhaul capacity of V1.5 satellites and forms the core of today’s operational constellation.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-amber-500/20 space-y-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    Starlink V3 (Starship Payload Bay)
                  </span>
                  <p className="text-neutral-300 leading-relaxed">
                    Mass: ~1,500–2,000 kg. Full-size V3 satellites offer over 5x higher bandwidth capacity per satellite. Exclusively deployed via Starship’s Pez-style payload dispenser, quadrupling global network bandwidth.
                  </p>
                </div>
              </div>
            </div>

            
          </div>
        )}

        {/* TAB 2: STARSHIP HUB */}
        {activeSubTab === "starship_hub" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Starship Status Hero */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-cyan-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-black text-white">
                    Starship Flight Program Milestones
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-lg">
                  Flight 13 V3 Test Deploy Completed · Flight 14 Target
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Starship is the largest, most powerful rocket ever built (16.7M lbs thrust, 33 Raptor 3 engines). Full rapid reusability reduces cost per kilogram to LEO from $10,000/kg down to under $100/kg.
              </p>
            </div>

            {/* Visual Flight Timeline */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                Recent Starship Orbital Flight Tests
              </h3>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    flight: "Starship Flight 14 (Target)",
                    date: "Targeting Mid-2026",
                    payload: "First Operational Orbital V3 Starlink Pez Deployment & Cryo Propellant Transfer Test",
                    status: "Scheduled",
                    statusColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  },
                  {
                    flight: "Starship Flight 13",
                    date: "July 2026",
                    payload: "First Starlink V3 Test Satellite Deployment & Mechazilla Booster Catch",
                    status: "Success",
                    statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                  },
                  {
                    flight: "Starship Flight 6",
                    date: "Nov 2024",
                    payload: "In-Space Raptor Vacuum Re-Ignition & Soft Indian Ocean Splashdown",
                    status: "Success",
                    statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                  },
                  {
                    flight: "Starship Flight 5",
                    date: "Oct 2024",
                    payload: "Historic First Mechazilla Tower Chopstick Booster Catch at Starbase",
                    status: "Booster Catch Success",
                    statusColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                  },
                  {
                    flight: "Starship Flight 4",
                    date: "June 2024",
                    payload: "First Controlled Atmospheric Re-Entry & Dual Water Splashdown",
                    status: "Soft Splashdown",
                    statusColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-neutral-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm">{item.flight}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{item.payload}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-neutral-400">{item.date}</span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LAUNCH CADENCE & NEXT WINDOWS */}
        {activeSubTab === "launch_cadence" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Live Countdown Card for Next Launch */}
            {SPACEX_LAUNCHES[0] && (
              <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/60 via-neutral-900 to-amber-950/60 border border-cyan-500/40 shadow-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      Immediate Launch Window
                    </span>
                  </div>
                  <a
                    href="https://www.spacex.com/launches"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>SpaceX Live Stream Webcast</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {SPACEX_LAUNCHES[0].missionName}
                    </h3>
                    <p className="text-xs text-neutral-300 mt-1">
                      Vehicle: <span className="font-bold text-cyan-300">{SPACEX_LAUNCHES[0].rocket}</span> · Site: {SPACEX_LAUNCHES[0].launchSite}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={generateGoogleCalendarUrl(SPACEX_LAUNCHES[0])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Google Calendar</span>
                    </a>
                    <button
                      onClick={() => downloadIcsFile(SPACEX_LAUNCHES[0])}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all"
                    >
                      <span>Download .ics</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                  {SPACEX_LAUNCHES[0].summary}
                </p>
              </div>
            )}

            
            {/* Live Launch Manifest (from API) */}
            {isLaunchesLoading ? (
              <div className="flex items-center gap-2 text-cyan-400 p-4 bg-neutral-900/50 rounded-2xl border border-white/5">
                <div className="w-4 h-4 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                Fetching live SpaceX launches...
              </div>
            ) : liveLaunches ? (
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Rocket className="w-4 h-4" /> Live Upcoming Orbital Launch Schedule
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {(liveLaunches.upcoming || []).slice(0, 5).map((launch: any) => (
                    <div key={launch.id} className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-black text-white text-sm">{launch.name}</div>
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono text-[10px]">
                          {new Date(launch.date_utc).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Flight Number: {launch.flight_number}
                      </div>
                      {launch.links?.webcast && (
                         <a href={launch.links.webcast} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-[10px] hover:underline">Watch Webcast</a>
                      )}
                    </div>
                  ))}
                  {(!liveLaunches.upcoming || liveLaunches.upcoming.length === 0) && (
                    <div className="text-neutral-500 text-xs">No upcoming launches found in API.</div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Upcoming Launch Manifest */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                Upcoming Orbital Launch Schedule
              </h3>

              <div className="space-y-3 text-xs">
                {SPACEX_LAUNCHES.map((launch) => (
                  <div key={launch.id} className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-black text-white text-sm">{launch.missionName}</div>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono text-[10px]">
                        {launch.launchDate} {launch.launchTimeUTC}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-neutral-300">
                      <div><strong className="text-neutral-400">Rocket:</strong> {launch.rocket}</div>
                      <div><strong className="text-neutral-400">Site:</strong> {launch.launchSite}</div>
                      <div><strong className="text-neutral-400">Payload:</strong> {launch.payloadName}</div>
                    </div>

                    <p className="text-neutral-400 text-[11px]">{launch.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DYSON SWARM METAPHOR */}
        {activeSubTab === "dyson_metaphor" && (
          <div className="p-5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-3 text-xs leading-relaxed animate-fadeIn">
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              Why this is called a "Dyson Swarm" (Thematic Metaphor)
            </h3>

            <p className="text-neutral-200">
              In theoretical physics, a Freeman Dyson Swarm is a hypothetical solar megastructure composed of millions of autonomous satellite collectors harvesting the full energy output of a star.
            </p>

            <p className="text-neutral-300">
              For Stock Bloc users, Starlink is the first human-scale operational "swarm" in Earth orbit. Tens of thousands of autonomous machines communicate via laser beams, automatically avoid orbital space debris, harvest solar photovoltaic power, and deliver continuous global internet coverage. The name is a thematic homage to space infrastructure scale, not literal science fiction.
            </p>
          </div>
        )}

        {/* TAB 5: SPACEX ROADMAP */}
        {activeSubTab === "spacex_history" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                SpaceX Phases 1 through 6 Master Roadmap
              </h3>

              <div className="space-y-4">
                {SPACEX_HISTORY_ROADMAP.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black text-cyan-300">{item.phase} ({item.year})</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                    <p className="text-xs text-neutral-300">{item.milestone}</p>
                    <p className="text-xs text-neutral-400 italic font-mono bg-black/40 p-2 rounded border border-white/5">
                      💡 {item.highSchoolAnalogy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: VIDEO VAULT */}
        {activeSubTab === "space_docs" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {SPACE_DOCUMENTARIES.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-cyan-400 font-extrabold uppercase">
                      <span>{doc.thumbnailBadge}</span>
                      <span>{doc.duration}</span>
                    </div>
                    <h4 className="text-sm font-black text-white mt-1 leading-snug">{doc.title}</h4>
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-3">{doc.summary}</p>
                  </div>

                  <button
                    onClick={() => setActiveVideo(doc)}
                    className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Broadcast</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: PLANET LABS FLEET */}
        {activeSubTab === "planet_labs" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLANET_LABS_MISSIONS.map((mission) => (
                <div key={mission.id} className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-emerald-300 font-extrabold text-sm">
                    <span>{mission.constellationName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                      {mission.status}
                    </span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">{mission.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 font-mono pt-2 border-t border-white/10">
                    <div>Altitude: {mission.orbitAltitudeKm} km</div>
                    <div>Resolution: {mission.imagingResolution}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SOLAR METROLOGY */}
        {activeSubTab === "dyson_power" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DYSON_POWER_METRICS.map((metric, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/60 border border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">{metric.title}</span>
                  <div className="text-2xl font-black text-amber-300">{metric.value}</div>
                  <span className="text-[10px] text-emerald-400 font-mono">{metric.change}</span>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-2">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. LIVE 3D SATELLITE CONSTELLATION GLOBE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300">
              Interactive 3D Starlink Constellation Globe
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[11px] font-mono text-neutral-400">
              Drag to Rotate · Scroll to Zoom
            </span>
            <a href="/satellite-map" target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-3 py-1 bg-cyan-900/50 text-cyan-300 rounded-lg border border-cyan-500/30 hover:bg-cyan-800/80 transition-colors cursor-pointer flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              Open Full Map
            </a>
          </div>
        </div>

        <Starlink3DGlobe
          activeSatellitesCount={starlinkActiveCount}
          lastUpdatedIso={dysonLiveData?.updated_at}
          isStale={isDataStale(dysonLiveData?.updated_at)}
        />
      </div>

      {/* SPACEX STACK DIAGRAM */}
      <div className="p-5 rounded-3xl bg-[#07111e]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300">
              The SpaceX Integrated Stack (Falcon 9 → Starlink → Starship → Starshield)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">Commercial Architecture</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Step 1: Falcon 9 */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col justify-between space-y-2 relative group hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                Step 1: Launch Engine
              </span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Falcon 9</h4>
              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                Reusable first-stage workhorse driving frequent, low-cost access to LEO.
              </p>
            </div>
          </div>

          {/* Step 2: Starlink */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan-500/30 flex flex-col justify-between space-y-2 relative group hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                Step 2: Cash Engine
              </span>
              <Wifi className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Starlink</h4>
              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                Global satellite internet constellation generating high-margin recurring cash flow.
              </p>
            </div>
          </div>

          {/* Step 3: Starship */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-emerald-500/30 flex flex-col justify-between space-y-2 relative group hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                Step 3: Scale Engine
              </span>
              <Rocket className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Starship</h4>
              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                Next-gen super-heavy lift rocket lowering cost-per-kg to under $100/kg.
              </p>
            </div>
          </div>

          {/* Step 4: Starshield */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-purple-500/30 flex flex-col justify-between space-y-2 relative group hover:border-purple-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                Step 4: Defense Layer
              </span>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Starshield</h4>
              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                Secured government & defense satellite layer built on commercial mass production lines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO STORY: WHY SPACEX MATTERS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#060c18]/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-500/30">
              Strategic Market Intelligence
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1.5 leading-snug">
              SpaceX is building the infrastructure layer of the 21st century
            </h2>
          </div>
          <Rocket className="w-6 h-6 text-cyan-400 shrink-0 mt-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* A. Starlink */}
          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-sm">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span>A. Starlink (The Network in Sky)</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              <strong>~10,700+ working satellites</strong> in orbit — roughly 2 out of every 3 active satellites belong to Starlink.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Delivers high-speed global broadband for residential, maritime, aviation, disaster response, and direct-to-cell smartphones. The largest satellite constellation in human history by a wide margin.
            </p>
          </div>

          {/* B. Falcon 9 */}
          <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>B. Falcon 9 (The Workhorse)</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              <strong>Reusable first stage booster</strong> that lands vertically on autonomous drone ships and flies 20+ times.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Made frequent, low-cost access to space real. The vast majority of the world’s commercial launch payloads now fly on Falcon-class vehicles.
            </p>
          </div>

          {/* C. Starship */}
          <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-sm">
              <Rocket className="w-4 h-4 text-emerald-400" />
              <span>C. Starship (Heavy Lift & Next Horizon)</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              <strong>Full reusability goal</strong>, 150+ metric ton payload capacity, and Starlink V3 deployment engine.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Flight 13 deployed first Starlink V3 test sats; Flight 14 targets first operational orbital V3 deployment. One Starship carries more bandwidth capacity than multiple Falcon 9 launches.
            </p>
          </div>

          {/* D. Starshield */}
          <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/20 hover:border-purple-500/40 transition-all space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-extrabold text-sm">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>D. Starshield & Rideshare</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              Government and defense satellite layer built on the same industrial manufacturing line for the U.S. Space Force.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Transporter rideshare missions open low-cost space access for hundreds of satellite companies (Planet Labs, Carbon Mapper, earth observation).
            </p>
          </div>

          {/* E. Economic Point */}
          <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/20 hover:border-rose-500/40 transition-all md:col-span-2 lg:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-extrabold text-sm">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>E. The Economic Point (Investor Intelligence)</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              SpaceX is not just "rockets." It is a vertically integrated space logistics + telecom powerhouse. Starlink is the high-margin recurring cash flow engine ($6B+ annual revenue); Starship is the scale engine; the relentless launch cadence forms an unassailable moat.
            </p>
            <p className="text-neutral-400 leading-relaxed italic text-[11px]">
              Note: SpaceX remains a private company. Public equity exposure is available via partner ecosystem stocks (RKLB, ASTS, PL) or private equity funds (DXYZ). Treat as high-conviction thematic intelligence, not direct financial advice.
            </p>
          </div>
        </div>
      </div>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#09111e] border border-cyan-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-cyan-300 tracking-wider">
                SpaceX Broadcast • {activeVideo.thumbnailBadge}
              </span>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">{activeVideo.title}</h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{activeVideo.summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
