import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  SPACE_ACADEMY_GLOSSARY,
  ORBITAL_CHALLENGES,
  AEROSPACE_RESEARCH_PROMPTS,
  SPACEX_OFFICIAL_PORTALS,
} from "../../data/dysonSpaceData";
import {
  Orbit,
  Rocket,
  Satellite,
  Zap,
  Globe,
  Radio,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  Shield,
  TrendingUp,
  Activity,
  ChevronRight,
  Wifi,
  Calendar,
  Flame,
  Film,
  Moon,
  Lightbulb,
  History,
  Play,
  X,
  Cpu,
  ArrowUpRight,
  Sun,
  Sliders,
  GraduationCap,
  BookOpen,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { DysonLiveData } from "../../types";
import { OrbitalLaunchEconomics } from "./dyson/OrbitalLaunchEconomics";
import { SpacePowerArbitrage } from "./dyson/SpacePowerArbitrage";
import { LaserMeshLatencyMatrix } from "./dyson/LaserMeshLatencyMatrix";
import { ConstellationShellTracker } from "./dyson/ConstellationShellTracker";

type DysonSubTab =
  | "space_news"
  | "orbital_academy"
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

interface NormalizedLaunch {
  id: string;
  name: string;
  missionName: string;
  provider: string;
  rocket: string;
  launchSite: string;
  net: string;
  date_utc: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  statusAbbrev: string;
  missionDescription: string;
  missionType: string;
  orbitName: string | null;
  webcastUrl: string;
}

interface LaunchesPayload {
  upcoming: NormalizedLaunch[];
  past: NormalizedLaunch[];
  asOf: string;
  source: string;
  stale: boolean;
}

interface StarlinkSatcatSummary {
  totalInOrbit: number;
  operationalCount: number;
  raisingOrPartialCount: number;
  decayedCount: number;
  latestLaunchDate: string | null;
  inclinationBreakdown: {
    shell53Deg: number;
    shell43Deg: number;
    polarSso97Deg: number;
    otherOr33To70Deg: number;
  };
  asOf: string;
  source: string;
  stale: boolean;
}

interface SpaceQuoteItem {
  symbol: string;
  name: string;
  role: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  lastUpdated: string | null;
  priceLabel: string;
  available: boolean;
}

interface SpaceQuotesPayload {
  asOf: string;
  quotes: SpaceQuoteItem[];
  unavailableTickers: string[];
}

interface ExtendedDysonLiveData extends DysonLiveData {
  stale?: boolean;
  source?: string;
  fleet_metrics?: DysonLiveData["fleet_metrics"] & {
    total_in_orbit?: number | null;
    raising_or_partial?: number;
    decayed_historical?: number;
    latest_starlink_launch_date?: string | null;
    inclination_breakdown?: {
      shell53Deg: number;
      shell43Deg: number;
      polarSso97Deg: number;
      otherOr33To70Deg: number;
    };
    satcat_as_of?: string;
    satcat_source?: string;
    satcat_stale?: boolean;
  };
  next_launch?: NormalizedLaunch | null;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const computeCountdown = (targetIsoDate: string, nowMs: number): TimeRemaining | null => {
  const target = new Date(targetIsoDate).getTime();
  if (Number.isNaN(target) || target <= nowMs) return null;
  const diff = target - nowMs;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const generateGoogleCalendarUrl = (launch: NormalizedLaunch) => {
  const startDate = new Date(launch.net);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const title = encodeURIComponent(`${launch.provider}: ${launch.missionName}`);
  const details = encodeURIComponent(
    `${launch.missionDescription || launch.name}\n\nVehicle: ${launch.rocket}\nSite: ${launch.launchSite}\nStream: ${launch.webcastUrl}`
  );
  const location = encodeURIComponent(launch.launchSite);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(
    startDate
  )}/${fmt(endDate)}&details=${details}&location=${location}`;
};

const downloadIcsFile = (launch: NormalizedLaunch) => {
  const startDate = new Date(launch.net);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const cleanSummary = (launch.missionDescription || launch.name).replace(/\r?\n/g, " ");
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Stock Bloc//Orbital Launch Schedule//EN",
    "BEGIN:VEVENT",
    `UID:launch-${launch.id}@stockbloc.ai.studio`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:${launch.provider}: ${launch.missionName}`,
    `DESCRIPTION:${cleanSummary} | Rocket: ${launch.rocket} | Site: ${launch.launchSite}`,
    `LOCATION:${launch.launchSite}`,
    `URL:${launch.webcastUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${launch.missionName.replace(/[^a-z0-9]/gi, "_")}_Launch.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface MissionCategory {
  id: string;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tabIds: DysonSubTab[];
  tabs: {
    id: DysonSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tag: string;
  }[];
}

const MISSION_CATEGORIES: MissionCategory[] = [
  {
    id: "telemetry",
    label: "Live Telemetry & Launches",
    shortLabel: "Telemetry & Windows",
    badge: "Live Upstream",
    description: "Spaceflight wire, Launch Library 2 schedule, CelesTrak Starlink catalog & Planet fleet",
    icon: Zap,
    tabIds: ["space_news", "launch_cadence", "starlink_hub", "planet_labs"],
    tabs: [
      { id: "space_news", label: "Live Space News", icon: Zap, tag: "SFN Wire" },
      { id: "launch_cadence", label: "Launch Windows", icon: Clock, tag: "LL2 Feed" },
      { id: "starlink_hub", label: "Starlink Constellation", icon: Wifi, tag: "CelesTrak" },
      { id: "planet_labs", label: "Planet Labs Fleet", icon: Globe, tag: "Earth Obs" },
    ],
  },
  {
    id: "academy",
    label: "Orbital Academy & Artemis Lab",
    shortLabel: "Academy & Quiz Lab",
    badge: "Interactive Ed",
    description: "Physics challenge quiz, Artemis 2026-2028 tracker, searchable glossary & verified portals",
    icon: GraduationCap,
    tabIds: ["orbital_academy", "space_docs"],
    tabs: [
      { id: "orbital_academy", label: "Orbital Academy & Quiz", icon: GraduationCap, tag: "Simulator" },
      { id: "space_docs", label: "Aerospace Video Vault", icon: Film, tag: "Verified Media" },
    ],
  },
  {
    id: "economics",
    label: "Orbital Economics & Power Arbitrage",
    shortLabel: "Economics & SBSP",
    badge: "Unit Models",
    description: "Starship $/kg model, SBSP conceptual benchmark vs AI microgrids, AM0 solar & Dyson theory",
    icon: Rocket,
    tabIds: ["orbital_economics", "power_arbitrage", "dyson_power", "dyson_metaphor"],
    tabs: [
      { id: "orbital_economics", label: "Starship $/kg Model", icon: Rocket, tag: "Sensitivity" },
      { id: "power_arbitrage", label: "SBSP vs AI Microgrids", icon: Sun, tag: "LCOE Model" },
      { id: "dyson_power", label: "Solar Metrology (AM0)", icon: Flame, tag: "1,361 W/m²" },
      { id: "dyson_metaphor", label: "Dyson Concept Guide", icon: Lightbulb, tag: "Theory Lab" },
    ],
  },
  {
    id: "vehicles",
    label: "Constellation Shells & Starship Program",
    shortLabel: "Shells & Starship",
    badge: "Architecture",
    description: "Orbital shells, optical laser link latencies, Flight 14/15 Ship 42 & milestone roadmap",
    icon: Satellite,
    tabIds: ["constellation_shells", "laser_mesh_latency", "starship_hub", "spacex_history"],
    tabs: [
      { id: "constellation_shells", label: "Orbital Shells & Spectrum", icon: Satellite, tag: "SATCAT" },
      { id: "laser_mesh_latency", label: "Laser Mesh Latency", icon: Radio, tag: "Vacuum c" },
      { id: "starship_hub", label: "Starship Program", icon: Rocket, tag: "Flight 15" },
      { id: "spacex_history", label: "SpaceX Milestone Roadmap", icon: History, tag: "2002-2035" },
    ],
  },
];

export const DysonSwarmHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useSubTabUrl<DysonSubTab>(
    "/research/dyson-swarm",
    [
      "space_news",
      "orbital_academy",
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
      "space_docs",
    ] as const,
    "space_news"
  );

  const [dysonLiveData, setDysonLiveData] = useState<ExtendedDysonLiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [spaceNews, setSpaceNews] = useState<any[]>([]);
  const [isSpaceNewsLoading, setIsSpaceNewsLoading] = useState(false);

  const [liveLaunches, setLiveLaunches] = useState<LaunchesPayload | null>(null);
  const [isLaunchesLoading, setIsLaunchesLoading] = useState(false);

  const [satcatData, setSatcatData] = useState<StarlinkSatcatSummary | null>(null);
  const [spaceQuotes, setSpaceQuotes] = useState<SpaceQuotesPayload | null>(null);
  const [isQuotesLoading, setIsQuotesLoading] = useState(false);

  const [activeVideo, setActiveVideo] = useState<(typeof SPACE_DOCUMENTARIES)[0] | null>(null);
  const [viewAllFlatTabs, setViewAllFlatTabs] = useState(false);

  // Interactive Education Lab state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] = useState<string>("All");
  const [selectedConceptId, setSelectedConceptId] = useState<string>(DYSON_SWARM_EXPLAINER_CONCEPTS[0].id);
  const [selectedArtemisId, setSelectedArtemisId] = useState<string>("artemis-3");
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // 1Hz clock for live countdown ticks against confirmed upcoming launches
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCategory = useMemo(() => {
    const found = MISSION_CATEGORIES.find((cat) => cat.tabIds.includes(activeSubTab));
    return found || MISSION_CATEGORIES[0];
  }, [activeSubTab]);

  const fetchAllTelemetry = useCallback(async (force = false) => {
    setIsLoading(true);
    setIsLaunchesLoading(true);
    setIsQuotesLoading(true);
    const qs = force ? "?force=true" : "";
    try {
      const [dysonRes, launchesRes, satcatRes, quotesRes] = await Promise.allSettled([
        fetch(`/api/data/dyson${qs}`),
        fetch(`/api/space/launches${qs}`),
        fetch(`/api/space/starlink-status${qs}`),
        fetch(`/api/space/quotes${qs}`),
      ]);

      if (dysonRes.status === "fulfilled" && dysonRes.value.ok) {
        setDysonLiveData(await dysonRes.value.json());
      }
      if (launchesRes.status === "fulfilled" && launchesRes.value.ok) {
        setLiveLaunches(await launchesRes.value.json());
      }
      if (satcatRes.status === "fulfilled" && satcatRes.value.ok) {
        setSatcatData(await satcatRes.value.json());
      }
      if (quotesRes.status === "fulfilled" && quotesRes.value.ok) {
        setSpaceQuotes(await quotesRes.value.json());
      }
    } catch (err) {
      console.warn("Space telemetry fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsLaunchesLoading(false);
      setIsQuotesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTelemetry(false);
  }, [fetchAllTelemetry]);

  useEffect(() => {
    if (activeSubTab === "space_news" && spaceNews.length === 0) {
      setIsSpaceNewsLoading(true);
      fetch("/api/space/news")
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          setSpaceNews(Array.isArray(d) ? d : []);
          setIsSpaceNewsLoading(false);
        })
        .catch(() => setIsSpaceNewsLoading(false));
    }
  }, [activeSubTab, spaceNews.length]);

  const operationalSats =
    satcatData?.operationalCount && satcatData.operationalCount > 0
      ? satcatData.operationalCount
      : dysonLiveData?.fleet_metrics?.active_satellites || null;

  const totalInOrbitSats =
    satcatData?.totalInOrbit && satcatData.totalInOrbit > 0
      ? satcatData.totalInOrbit
      : dysonLiveData?.fleet_metrics?.total_in_orbit || null;

  const raisingSats =
    typeof satcatData?.raisingOrPartialCount === "number"
      ? satcatData.raisingOrPartialCount
      : dysonLiveData?.fleet_metrics?.raising_or_partial ?? null;

  const inclinationBreakdown =
    satcatData?.inclinationBreakdown || dysonLiveData?.fleet_metrics?.inclination_breakdown || null;

  // Next confirmed future orbital launch ONLY (never synthetic countdowns)
  const nextUpcomingLaunch = useMemo(() => {
    const candidates: NormalizedLaunch[] = [];
    if (Array.isArray(liveLaunches?.upcoming)) {
      candidates.push(...liveLaunches.upcoming);
    }
    if (dysonLiveData?.next_launch) {
      candidates.push(dysonLiveData.next_launch);
    }
    for (const candidate of candidates) {
      const remaining = computeCountdown(candidate.net, currentTime);
      if (remaining) {
        return { launch: candidate, remaining };
      }
    }
    return null;
  }, [liveLaunches, dysonLiveData, currentTime]);

  const isTelemetryStale =
    Boolean(dysonLiveData?.stale) || isDataStale(dysonLiveData?.updated_at || null);

  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.trim().toLowerCase();
    return SPACE_ACADEMY_GLOSSARY.filter((item) => {
      const catOk = glossaryCategory === "All" || item.category === glossaryCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.plainEnglish.toLowerCase().includes(q) ||
        item.technicalNote.toLowerCase().includes(q)
      );
    });
  }, [glossarySearch, glossaryCategory]);

  const quizScore = useMemo(() => {
    let answered = 0;
    let correct = 0;
    for (const q of ORBITAL_CHALLENGES) {
      if (typeof quizAnswers[q.id] === "number") {
        answered++;
        if (quizAnswers[q.id] === q.correctIndex) correct++;
      }
    }
    return { answered, correct, total: ORBITAL_CHALLENGES.length };
  }, [quizAnswers]);

  const handleCopyPrompt = (id: string, promptText: string) => {
    triggerHaptic("selection");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(promptText).catch(() => {});
    }
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const selectedConcept =
    DYSON_SWARM_EXPLAINER_CONCEPTS.find((c) => c.id === selectedConceptId) ||
    DYSON_SWARM_EXPLAINER_CONCEPTS[0];

  const selectedArtemis =
    NASA_ARTEMIS_MISSIONS.find((m) => m.id === selectedArtemisId) || NASA_ARTEMIS_MISSIONS[2];

  return (
    <div className="w-full px-4 pt-3 pb-36 sm:pb-40 space-y-6 text-white max-w-7xl mx-auto">
      {/* 1. DYSON SWARM COMMAND DECK HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#030914] via-[#071322] to-[#020610] border border-cyan-500/35 p-5 sm:p-6 shadow-2xl">
        <div className="space-y-5">
          {/* Top Title & Real Provenance Strip */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shrink-0">
                <Orbit className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-neutral-400 flex flex-wrap items-center gap-2">
                  <span className={isTelemetryStale ? "text-amber-300 font-semibold" : "text-emerald-300 font-semibold"}>
                    {isLoading
                      ? "Loading upstream telemetry"
                      : isTelemetryStale
                      ? "● Cached / Stale Telemetry"
                      : "● Live Upstream Feeds"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    As of{" "}
                    {dysonLiveData?.updated_at
                      ? formatUtcTimestamp(dysonLiveData.updated_at)
                      : "Awaiting upstream sync"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    UTC {new Date(currentTime).toISOString().slice(11, 19)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white text-balance">
                  Dyson Swarm & Orbital Infrastructure Hub
                </h1>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl">
                  Real-time Launch Library 2 flight schedule, CelesTrak Starlink SATCAT tracking, space & power equities, interactive orbital physics academy, and conceptual SBSP unit economics.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => fetchAllTelemetry(true)}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "Syncing..." : "Refresh Feeds"}</span>
              </button>
            </div>
          </div>

          {/* LIVE NEXT CONFIRMED ORBITAL LAUNCH WINDOW (NO SYNTHETIC FALLBACK) */}
          <div className="p-4 rounded-2xl bg-[#020813]/90 border border-amber-500/35">
            {nextUpcomingLaunch ? (
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="text-[11px] font-mono text-amber-300 flex flex-wrap items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold uppercase tracking-wider">Confirmed Upcoming Launch</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-white font-semibold">{nextUpcomingLaunch.launch.provider}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-300">{nextUpcomingLaunch.launch.rocket}</span>
                    <span aria-hidden="true">·</span>
                    <span>{nextUpcomingLaunch.launch.status}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {nextUpcomingLaunch.launch.missionName}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Site: <span className="text-neutral-200">{nextUpcomingLaunch.launch.launchSite}</span> · NET:{" "}
                    <span className="text-cyan-300">{formatUtcTimestamp(nextUpcomingLaunch.launch.net)}</span>
                    {nextUpcomingLaunch.launch.orbitName ? ` · Orbit: ${nextUpcomingLaunch.launch.orbitName}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 bg-black/70 px-3 py-2.5 rounded-xl border border-amber-500/35 justify-center font-mono tabular-nums">
                  {[
                    { val: nextUpcomingLaunch.remaining.days, label: "Days" },
                    { val: nextUpcomingLaunch.remaining.hours, label: "Hours" },
                    { val: nextUpcomingLaunch.remaining.minutes, label: "Mins" },
                    { val: nextUpcomingLaunch.remaining.seconds, label: "Secs" },
                  ].map((seg, idx) => (
                    <React.Fragment key={seg.label}>
                      {idx > 0 && <span className="text-amber-500 font-bold text-lg">:</span>}
                      <div className="text-center px-1.5">
                        <div className="text-xl sm:text-2xl font-black text-amber-300">
                          {String(seg.val).padStart(2, "0")}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400">{seg.label}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex sm:flex-col justify-end gap-1.5 shrink-0">
                  <a
                    href={generateGoogleCalendarUrl(nextUpcomingLaunch.launch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Google Cal</span>
                  </a>
                  <button
                    onClick={() => downloadIcsFile(nextUpcomingLaunch.launch)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Export .ics</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Awaiting next confirmed Launch Library 2 window</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    No synthetic countdown timers are generated here. Check the official SpaceX launch manifest or Launch Windows tab for the next verified NET time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.spacex.com/launches"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>SpaceX Launches</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* LIVE CELESTRAK SATCAT FLEET & ORBITAL TELEMETRY STRIP */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                CelesTrak SATCAT Starlink Telemetry
              </span>
              <span>
                {satcatData?.source || dysonLiveData?.fleet_metrics?.satcat_source || "Pending CelesTrak Poll"}
                {satcatData?.latestLaunchDate ? ` · Latest SATCAT launch: ${satcatData.latestLaunchDate}` : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono tabular-nums">
              <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/25">
                <div className="text-[10px] uppercase text-neutral-400">Operational (+)</div>
                <div className="text-lg font-black text-cyan-300 mt-0.5">
                  {operationalSats ? operationalSats.toLocaleString() : "Unavailable"}
                </div>
                <div className="text-[10px] text-neutral-400">Confirmed active bus</div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/15">
                <div className="text-[10px] uppercase text-neutral-400">Total In Orbit</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {totalInOrbitSats ? totalInOrbitSats.toLocaleString() : "Unavailable"}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {raisingSats !== null ? `${raisingSats.toLocaleString()} raising / check` : "SATCAT group"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/15">
                <div className="text-[10px] uppercase text-neutral-400">51°-56° Shells</div>
                <div className="text-lg font-black text-emerald-300 mt-0.5">
                  {inclinationBreakdown ? inclinationBreakdown.shell53Deg.toLocaleString() : "—"}
                </div>
                <div className="text-[10px] text-neutral-400">Core mid-latitude</div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/15">
                <div className="text-[10px] uppercase text-neutral-400">40°-51° Inclined</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {inclinationBreakdown ? inclinationBreakdown.shell43Deg.toLocaleString() : "—"}
                </div>
                <div className="text-[10px] text-neutral-400">Gen-2 V2/V3 shells</div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/15">
                <div className="text-[10px] uppercase text-neutral-400">97° Polar SSO</div>
                <div className="text-lg font-black text-purple-300 mt-0.5">
                  {inclinationBreakdown ? inclinationBreakdown.polarSso97Deg.toLocaleString() : "—"}
                </div>
                <div className="text-[10px] text-neutral-400">High-latitude mesh</div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-amber-500/25">
                <div className="text-[10px] uppercase text-amber-300">AM0 Solar Flux</div>
                <div className="text-lg font-black text-amber-300 mt-0.5">1,361 W/m²</div>
                <div className="text-[10px] text-neutral-400">Orbital constant</div>
              </div>
            </div>
          </div>

          {/* LIVE SPACE & ORBITAL POWER EQUITIES STRIP */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Live Public Space & Power Infrastructure Equities
              </span>
              <span>
                {spaceQuotes?.asOf
                  ? `Quotes updated ${formatUtcTimestamp(spaceQuotes.asOf)}`
                  : isQuotesLoading
                  ? "Fetching market quotes..."
                  : "Live equity stream"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono tabular-nums">
              {(spaceQuotes?.quotes || []).map((q) => {
                const isUp = typeof q.changePercent === "number" && q.changePercent >= 0;
                return (
                  <div
                    key={q.symbol}
                    className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-white">${q.symbol}</span>
                      {typeof q.changePercent === "number" ? (
                        <span className={`text-[10px] font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                          {isUp ? "+" : ""}
                          {q.changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500">N/A</span>
                      )}
                    </div>
                    <div className="text-sm font-black text-cyan-200 mt-1">
                      {typeof q.price === "number" ? `$${q.price.toFixed(2)}` : "Unavailable"}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate" title={q.role}>
                      {q.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODULE NAVIGATION */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pb-2 border-b border-white/10">
          <div>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Command Bays & Interactive Modules
            </h2>
            <p className="text-[11px] text-neutral-400">
              Telemetry wires, interactive Orbital Academy simulator, economic models, and orbital architecture.
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setViewAllFlatTabs((v) => !v);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border whitespace-nowrap shrink-0 self-start md:self-auto ${
              viewAllFlatTabs
                ? "bg-cyan-400 text-black border-cyan-400"
                : "bg-black/60 border-white/15 text-neutral-300 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{viewAllFlatTabs ? "Grouped View" : "All 14 Modules"}</span>
          </button>
        </div>

        {!viewAllFlatTabs ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {MISSION_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isCatActive = activeCategory.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      triggerHaptic("selection");
                      if (!cat.tabIds.includes(activeSubTab)) {
                        setActiveSubTab(cat.tabs[0].id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                      isCatActive
                        ? "bg-[#07192d] border-cyan-400"
                        : "bg-[#040b17]/80 hover:bg-[#071324] border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div
                        className={`p-2 rounded-xl ${
                          isCatActive ? "bg-cyan-400 text-black" : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">{cat.badge}</span>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white">{cat.shortLabel}</div>
                      <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{cat.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-2 rounded-2xl bg-[#030914]/90 border border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-mono text-neutral-400 px-2 shrink-0 flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                Bay Modules:
              </span>
              {activeCategory.tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      triggerHaptic("selection");
                      setActiveSubTab(tab.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-cyan-400 text-black font-extrabold"
                        : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/10"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-cyan-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {MISSION_CATEGORIES.flatMap((c) => c.tabs).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveSubTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-cyan-500 text-black font-extrabold"
                      : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/10"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-cyan-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. ACTIVE SUBTAB VIEWS */}
      <div className="space-y-4 pt-1">
        {/* LIVE SPACE NEWS */}
        {activeSubTab === "space_news" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">Live Spaceflight News Wire</h3>
                <p className="text-xs text-neutral-400">
                  Live articles ingested from Spaceflight News API v4 (`spaceflightnewsapi.net`)
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveSubTab("orbital_academy");
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Open Orbital Academy & Quiz</span>
              </button>
            </div>

            {isSpaceNewsLoading ? (
              <div className="flex items-center gap-2 text-cyan-400 p-4">
                <div className="w-4 h-4 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                Fetching live spaceflight news...
              </div>
            ) : spaceNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spaceNews.map((news: any) => (
                  <a
                    key={news.id}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs text-cyan-400 font-mono mb-1.5">
                        {news.news_site} · {formatUtcTimestamp(news.published_at)}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">{news.title}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-3">{news.summary}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-neutral-900/80 border border-amber-500/30 text-amber-200 rounded-xl text-xs">
                Upstream Spaceflight News API v4 returned no articles or is currently unreachable.
              </div>
            )}
          </div>
        )}

        {/* ORBITAL ACADEMY & ARTEMIS INTERACTIVE LAB */}
        {activeSubTab === "orbital_academy" && (
          <div className="space-y-6">
            {/* Academy Header */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#061422] via-[#0a1c2e] to-[#040a14] border border-cyan-500/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-cyan-300">
                    Interactive Aerospace Learning Sandbox · Formulas, Artemis & Live Telemetry
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-cyan-400" />
                    Orbital Academy, Physics Challenge & Artemis Lab
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl">
                    Test your intuition on launch cost curves, CelesTrak ephemeris counts, vacuum optical lasers, and Space-Based Solar Power economics—with primary-source citations and copyable research prompts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 font-mono tabular-nums text-right min-w-[200px]">
                  <div className="text-[10px] uppercase text-neutral-400">Challenge Score</div>
                  <div className="text-2xl font-black text-cyan-300 mt-0.5">
                    {quizScore.correct} / {quizScore.total}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {quizScore.answered} answered
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Interactive Physics & Launch Economics Challenge Simulator */}
            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">
                    Interactive Orbital Mechanics & Unit-Economics Challenge
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Select an answer for immediate grading, formula derivation, and empirical verification.
                  </p>
                </div>
                <button
                  onClick={() => setQuizAnswers({})}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/15 text-xs font-bold text-neutral-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Quiz</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ORBITAL_CHALLENGES.map((q, qIdx) => {
                  const chosen = quizAnswers[q.id];
                  const isAnswered = typeof chosen === "number";
                  const isCorrect = isAnswered && chosen === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                          <span>Question 0{qIdx + 1} · {q.topic}</span>
                          {isAnswered && (
                            <span className={isCorrect ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {isCorrect ? "✓ Correct" : "✖ Review Answer"}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{q.question}</h4>

                        <div className="space-y-1.5">
                          {q.options.map((opt, idx) => {
                            const selected = chosen === idx;
                            const isRightOpt = idx === q.correctIndex;
                            let btnStyle = "bg-black/50 hover:bg-black/80 border-white/10 text-neutral-300";
                            if (isAnswered) {
                              if (isRightOpt) {
                                btnStyle = "bg-emerald-950/60 border-emerald-400/60 text-emerald-200";
                              } else if (selected && !isRightOpt) {
                                btnStyle = "bg-rose-950/60 border-rose-400/60 text-rose-200";
                              }
                            }
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  triggerHaptic("selection");
                                  setQuizAnswers((prev) => ({ ...prev, [q.id]: idx }));
                                }}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${btnStyle}`}
                              >
                                <span className="font-mono font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {isAnswered && (
                        <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/25 space-y-1 text-xs">
                          <div className="font-mono text-[11px] text-amber-300">{q.formulaHint}</div>
                          <p className="text-neutral-300 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. NASA Artemis 2022–2028 Program Tracker */}
            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-cyan-400" />
                    NASA Artemis Cislunar Roadmap (Updated November 2026)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Select any mission phase to inspect crew assignments, docking milestones, and off-world propellant logic.
                  </p>
                </div>
                <a
                  href="https://www.nasa.gov/humans-in-space/artemis/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Official NASA Artemis Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {NASA_ARTEMIS_MISSIONS.map((m) => {
                  const isSel = m.id === selectedArtemis.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedArtemisId(m.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                        isSel
                          ? "bg-cyan-950/70 border-cyan-400"
                          : "bg-neutral-900/70 hover:bg-neutral-800/80 border-white/10"
                      }`}
                    >
                      <div className="text-[10px] font-mono text-neutral-400">
                        {m.status} · {m.targetDate}
                      </div>
                      <div className="text-sm font-black text-white mt-1 leading-snug">{m.missionName}</div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-black text-white">{selectedArtemis.missionName}</h4>
                  <span className="font-mono text-cyan-300">{selectedArtemis.rocketAndVehicle}</span>
                </div>
                <p className="text-neutral-200 leading-relaxed">{selectedArtemis.objective}</p>
                <p className="text-amber-200 bg-black/50 p-3 rounded-xl border border-amber-500/20">
                  <strong>Plain-English Summary:</strong> {selectedArtemis.highSchoolBreakdown}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-[11px] font-mono text-neutral-400 uppercase mb-1">Crew & Key Hardware</div>
                    <p className="text-neutral-300">{selectedArtemis.crew.join(", ")}</p>
                    <p className="text-neutral-400 mt-1">{selectedArtemis.keyTechnologies.join(" · ")}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-neutral-400 uppercase mb-1">Role in Off-World Infrastructure</div>
                    <p className="text-neutral-300">{selectedArtemis.roleInDysonFuture}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Searchable Aerospace & Orbital Mechanics Glossary */}
            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    Aerospace & Orbital Physics Glossary
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Search physical equations, SATCAT codes, and primary institutional references.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder="Filter glossary terms..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {["All", "Orbital Mechanics", "Propulsion & Launch", "Constellation Comms", "Solar & Energy", "Dyson Theory"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setGlossaryCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                        glossaryCategory === cat
                          ? "bg-cyan-400 text-black"
                          : "bg-neutral-900 text-neutral-300 border border-white/10 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredGlossary.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2 flex flex-col justify-between text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                        <span>{item.category}</span>
                        {item.formulaOrMetric && <span className="text-amber-300">{item.formulaOrMetric}</span>}
                      </div>
                      <h4 className="text-sm font-black text-white">{item.term}</h4>
                      <p className="text-neutral-200 leading-relaxed">{item.plainEnglish}</p>
                      <p className="text-neutral-400 leading-relaxed">{item.technicalNote}</p>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Source: {item.sourceLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Copyable Aerospace & SEC Research Prompt Deck */}
            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">
                  Copyable Aerospace & SEC Research Prompt Deck
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Copy structured prompts to analyze Stock Bloc SEC 8-K/10-K filings, CelesTrak feeds, and energy economics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AEROSPACE_RESEARCH_PROMPTS.map((p) => {
                  const isCopied = copiedPromptId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3 flex flex-col justify-between text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-neutral-400">
                          {p.category} · {p.targetModel}
                        </div>
                        <h4 className="text-sm font-black text-white">{p.title}</h4>
                        <p className="text-neutral-300">{p.description}</p>
                        <pre className="p-2.5 rounded-xl bg-black/70 border border-white/10 text-[11px] font-mono text-neutral-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {p.promptText}
                        </pre>
                      </div>
                      <button
                        onClick={() => handleCopyPrompt(p.id, p.promptText)}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied Prompt" : "Copy Research Prompt"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Verified External Primary Portals */}
            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
                Verified Official Aerospace & Research Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {SPACEX_OFFICIAL_PORTALS.map((portal) => (
                  <a
                    key={portal.id}
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10 hover:border-cyan-500/40 transition-colors space-y-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-mono text-cyan-300">{portal.category} · {portal.badge}</div>
                      <div className="font-bold text-white text-sm mt-0.5 flex items-center justify-between gap-2">
                        <span>{portal.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      </div>
                      <p className="text-neutral-400 mt-1 leading-relaxed">{portal.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STARSHIP $/KG SENSITIVITY ENGINE */}
        {activeSubTab === "orbital_economics" && <OrbitalLaunchEconomics />}

        {/* SBSP VS AI MICROGRIDS ARBITRAGE */}
        {activeSubTab === "power_arbitrage" && (
          <SpacePowerArbitrage
            liveQuotes={(spaceQuotes?.quotes || []).map((q) => ({
              symbol: q.symbol,
              price: q.price,
              changePercent: q.changePercent,
            }))}
          />
        )}

        {/* LASER MESH LATENCY MATRIX */}
        {activeSubTab === "laser_mesh_latency" && <LaserMeshLatencyMatrix />}

        {/* CONSTELLATION SHELL TRACKER */}
        {activeSubTab === "constellation_shells" && (
          <ConstellationShellTracker
            operationalCount={operationalSats}
            totalInOrbit={totalInOrbitSats}
            raisingOrPartialCount={raisingSats}
            satcatAsOf={satcatData?.asOf || dysonLiveData?.fleet_metrics?.satcat_as_of}
            satcatSource={satcatData?.source || dysonLiveData?.fleet_metrics?.satcat_source}
          />
        )}

        {/* STARLINK HUB */}
        {activeSubTab === "starlink_hub" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono tabular-nums">
              <div className="p-4 rounded-2xl bg-[#080d1a]/90 border border-cyan-500/30">
                <div className="text-[10px] font-extrabold uppercase text-neutral-400">
                  CelesTrak Operational (+)
                </div>
                <div className="text-xl font-black text-cyan-300 mt-1">
                  {operationalSats ? `${operationalSats.toLocaleString()} Sats` : "Unavailable"}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">
                  {totalInOrbitSats ? `${totalInOrbitSats.toLocaleString()} total in orbit` : "SATCAT Poll"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d0a1a]/90 border border-amber-500/30">
                <div className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Orbit Raising / Checkout
                </div>
                <div className="text-xl font-black text-amber-300 mt-1">
                  {raisingSats !== null ? `${raisingSats.toLocaleString()} Sats` : "Unavailable"}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {satcatData?.latestLaunchDate ? `Latest batch ${satcatData.latestLaunchDate}` : "Electric orbit climb"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#030e14]/90 border border-emerald-500/30">
                <div className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Direct-to-Cell Shell
                </div>
                <div className="text-xl font-black text-emerald-300 mt-1">350 km Orbit</div>
                <div className="text-[11px] text-neutral-400 mt-1">1900 MHz PCS LTE/5G</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0f0714]/90 border border-purple-500/30">
                <div className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Starship V3 Deployment
                </div>
                <div className="text-xl font-black text-purple-300 mt-1">26 V3 / Flight</div>
                <div className="text-[11px] text-neutral-400 mt-1">Flights 14 & 15 verified</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Starlink Generations: V2 Mini vs V3 Architecture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-cyan-500/20 space-y-1.5">
                  <div className="text-cyan-300 font-bold">Starlink V2 Mini (Falcon 9 Deployed)</div>
                  <p className="text-neutral-300 leading-relaxed">
                    E-band phased array antennas paired with optical inter-satellite laser links form the operational core across 53° and 43° shells.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-amber-500/20 space-y-1.5">
                  <div className="text-amber-300 font-bold">Starlink V3 (Starship Flight 14 & 15 Verified)</div>
                  <p className="text-neutral-300 leading-relaxed">
                    Full-scale V3 broadband spacecraft deployed in batches of 26 via Starship Pez dispenser, scaling per-launch constellation throughput far beyond Falcon 9 payload fairing envelopes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STARSHIP HUB */}
        {activeSubTab === "starship_hub" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-cyan-950/40 border border-emerald-500/30 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-emerald-400" />
                  Starship Flight Program Milestones (Through Nov 2026)
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  Ship 42 Upper-Stage Tower Catch Achieved (Nov 14, 2026)
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                With Flight 14 inserting 26 V3 satellites into orbit (Sep 28, 2026) and Flight 15's Ship 42 becoming the first orbital upper stage caught by Mechazilla (Nov 13–14, 2026), both booster and spacecraft recovery have now been demonstrated.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300">
                Starship Orbital Flight Progression
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  {
                    flight: "Starship Flight 15 (Booster 22 + Ship 42)",
                    date: "Nov 13–14, 2026",
                    payload:
                      "14 orbits (~22h), deployed 26 Starlink V3 sats (incl. tile-inspection units), historic FIRST orbital upper-stage tower catch of Ship 42 at Starbase; B22 diverted offshore.",
                    status: "Ship Catch Success",
                    statusClass: "text-emerald-300",
                  },
                  {
                    flight: "Starship Flight 14",
                    date: "Sep 28, 2026",
                    payload:
                      "First full Low Earth Orbit insertion and deployment of 26 operational Starlink V3 satellites followed by controlled oceanic splashdown.",
                    status: "Orbital Success",
                    statusClass: "text-emerald-300",
                  },
                  {
                    flight: "Starship Flight 6",
                    date: "Nov 2024",
                    payload: "In-Space Raptor Vacuum Re-Ignition & daytime Indian Ocean splashdown.",
                    status: "Success",
                    statusClass: "text-emerald-300",
                  },
                  {
                    flight: "Starship Flight 5",
                    date: "Oct 2024",
                    payload: "Historic first Mechazilla tower chopstick Super Heavy booster catch.",
                    status: "Booster Catch Success",
                    statusClass: "text-cyan-300",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="max-w-3xl">
                      <div className="font-bold text-white text-sm">{item.flight}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{item.payload}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] shrink-0">
                      <div className="text-neutral-400">{item.date}</div>
                      <div className={`font-bold ${item.statusClass}`}>● {item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LAUNCH CADENCE & CONFIRMED LAUNCH LIBRARY 2 SCHEDULE */}
        {activeSubTab === "launch_cadence" && (
          <div className="space-y-4">
            {isLaunchesLoading ? (
              <div className="flex items-center gap-2 text-cyan-400 p-4 bg-neutral-900/50 rounded-2xl border border-white/5">
                <div className="w-4 h-4 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                Fetching Launch Library 2 schedule...
              </div>
            ) : liveLaunches ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      Upcoming Confirmed Windows ({liveLaunches.upcoming?.length || 0})
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {liveLaunches.source}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {(liveLaunches.upcoming || []).slice(0, 8).map((launch) => (
                      <div key={launch.id} className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-black text-white text-sm">{launch.name}</div>
                          <span className="font-mono text-cyan-300 text-[11px]">
                            {formatUtcTimestamp(launch.net)}
                          </span>
                        </div>
                        <div className="text-neutral-400 font-mono text-[11px]">
                          {launch.provider} · {launch.launchSite} · Status: {launch.status}
                        </div>
                        {launch.missionDescription && (
                          <p className="text-neutral-300 line-clamp-2">{launch.missionDescription}</p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                          <a
                            href={launch.webcastUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-300 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <span>Launch Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => downloadIcsFile(launch)}
                            className="text-neutral-300 hover:text-white cursor-pointer"
                          >
                            Export .ics
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!liveLaunches.upcoming || liveLaunches.upcoming.length === 0) && (
                      <div className="text-neutral-400 text-xs">
                        No upcoming launches returned from Launch Library 2. Check{" "}
                        <a href="https://www.spacex.com/launches" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">
                          spacex.com/launches
                        </a>
                        .
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Recent Completed Flights ({liveLaunches.past?.length || 0})
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Updated {formatUtcTimestamp(liveLaunches.asOf)}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {(liveLaunches.past || []).slice(0, 6).map((launch) => (
                      <div key={launch.id} className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-white">{launch.name}</div>
                          <span className="font-mono text-emerald-300 text-[11px]">{launch.status}</span>
                        </div>
                        <div className="text-neutral-400 font-mono text-[11px]">
                          {formatUtcTimestamp(launch.net)} · {launch.provider} · {launch.launchSite}
                        </div>
                      </div>
                    ))}
                    {SPACEX_LAUNCHES.map((ref) => (
                      <div key={ref.id} className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-white">{ref.missionName}</div>
                          <span className="font-mono text-cyan-300 text-[11px]">{ref.launchDate}</span>
                        </div>
                        <p className="text-neutral-400">{ref.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* DYSON CONCEPT GUIDE & EXPLAINER LEVELS */}
        {activeSubTab === "dyson_metaphor" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>CONCEPT / PROJECTION — NOT LIVE INFRASTRUCTURE:</strong> A Freeman Dyson Swarm is theoretical physics/long-horizon aerospace engineering. Commercial Starlink broadband satellites do not beam electrical power to Earth today.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {DYSON_SWARM_EXPLAINER_CONCEPTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConceptId(c.id)}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    selectedConcept.id === c.id
                      ? "bg-cyan-950/70 border-cyan-400"
                      : "bg-neutral-900/80 border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="text-[10px] font-mono text-cyan-300">{c.difficultyRating}</div>
                  <div className="text-xs font-bold text-white mt-1 line-clamp-2">{c.title}</div>
                </button>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-3 text-xs leading-relaxed">
              <div className="text-[11px] font-mono text-cyan-300">{selectedConcept.difficultyRating}</div>
              <h3 className="text-lg font-black text-white">{selectedConcept.title}</h3>
              <p className="text-neutral-400 font-semibold">{selectedConcept.subtitle}</p>
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10">
                <strong className="text-amber-300">Everyday Analogy: </strong>
                <span className="text-neutral-200">{selectedConcept.simpleAnalogy}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10">
                  <div className="font-bold text-rose-300 mb-1">The Physics Constraint</div>
                  <p className="text-neutral-300">{selectedConcept.theBigProblem}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10">
                  <div className="font-bold text-emerald-300 mb-1">The Engineering Path</div>
                  <p className="text-neutral-300">{selectedConcept.theEngineeringSolution}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono tabular-nums pt-1">
                {selectedConcept.keyStats.map((st) => (
                  <div key={st.label} className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                    <div className="text-[10px] text-neutral-400 uppercase">{st.label}</div>
                    <div className="text-sm font-black text-cyan-300 mt-0.5">{st.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SPACEX ROADMAP */}
        {activeSubTab === "spacex_history" && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300">
              SpaceX Phases 1 through 6 Master Roadmap (Updated Through Nov 2026)
            </h3>
            <div className="space-y-3">
              {SPACEX_HISTORY_ROADMAP.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="font-bold text-cyan-300">
                      {item.phase} ({item.year})
                    </span>
                    <span className="text-neutral-300">{item.status}</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                  <p className="text-xs text-neutral-300">{item.milestone}</p>
                  <p className="text-xs text-neutral-400 bg-black/40 p-2.5 rounded border border-white/5">
                    <strong className="text-amber-300">Intuition: </strong>
                    {item.highSchoolAnalogy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VERIFIED AEROSPACE VIDEO VAULT */}
        {activeSubTab === "space_docs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SPACE_DOCUMENTARIES.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase">
                    {doc.thumbnailBadge} · {doc.duration} · {doc.year}
                  </div>
                  <h4 className="text-sm font-black text-white mt-1 leading-snug">{doc.title}</h4>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-3">{doc.summary}</p>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveVideo(doc)}
                    className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Broadcast</span>
                  </button>
                  <a
                    href={doc.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-[11px] text-neutral-400 hover:text-cyan-300"
                  >
                    Open on YouTube ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLANET LABS FLEET */}
        {activeSubTab === "planet_labs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANET_LABS_MISSIONS.map((mission) => (
              <div
                key={mission.id}
                className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between text-emerald-300 font-extrabold text-sm">
                  <span>{mission.constellationName}</span>
                  <span className="text-[11px] font-mono text-emerald-300">● {mission.status}</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">{mission.description}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 font-mono pt-2 border-t border-white/10">
                  <div>Altitude: {mission.orbitAltitudeKm} km</div>
                  <div>Resolution: {mission.imagingResolution}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SOLAR METROLOGY (AM0 + CONCEPTUAL WARNINGS) */}
        {activeSubTab === "dyson_power" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>DISTINCTION BETWEEN EMPIRICAL & CONCEPTUAL METRICS:</strong> AM0 Solar Irradiance (1,361 W/m²) and Planet Labs daily imaging (350M km²/day) are measured empirical baselines. Fleet photovoltaic sums and Dyson Type-II values below are modeled conceptual benchmarks—not live utility power infrastructure.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DYSON_POWER_METRICS.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-black/60 border border-amber-500/20 space-y-2 font-mono tabular-nums"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider">
                    <span className="text-amber-400 font-bold">{metric.title}</span>
                    <span className={metric.isConceptualProjection ? "text-amber-300" : "text-emerald-400"}>
                      {metric.isConceptualProjection ? "▲ CONCEPT / PROJECTION" : "● EMPIRICAL BASELINE"}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-300">{metric.value}</div>
                  <div className="text-[11px] text-neutral-400">{metric.unit}</div>
                  <p className="text-xs font-sans text-neutral-300 leading-relaxed mt-1">{metric.description}</p>
                  {metric.calculationNote && (
                    <div className="text-[11px] text-neutral-500 pt-1 border-t border-white/10">
                      {metric.calculationNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. INTERACTIVE 3D SATELLITE GLOBE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300">
              Interactive 3D Starlink & Conceptual Solar Swarm Globe
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[11px] font-mono text-neutral-400">
              Drag to Rotate · Scroll to Zoom
            </span>
            <a
              href="/satellite-map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-3 py-1 bg-cyan-900/50 text-cyan-300 rounded-lg border border-cyan-500/30 hover:bg-cyan-800/80 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Full Map</span>
            </a>
          </div>
        </div>

        <Starlink3DGlobe
          activeSatellitesCount={operationalSats ?? undefined}
          lastUpdatedIso={satcatData?.asOf || dysonLiveData?.updated_at || undefined}
          isStale={Boolean(satcatData?.stale ?? isTelemetryStale)}
        />
      </div>

      {/* 5. SPACEX INTEGRATED STACK */}
      <div className="p-5 rounded-3xl bg-[#07111e]/90 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            The SpaceX Integrated Stack (Falcon 9 → Starlink → Starship → Starshield)
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">Commercial Architecture</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {[
            {
              step: "Step 1: Launch Engine",
              title: "Falcon 9",
              desc: "Reusable first-stage workhorse driving frequent, low-cost access to LEO.",
              icon: Flame,
              color: "text-amber-400",
            },
            {
              step: "Step 2: Network Engine",
              title: "Starlink",
              desc: `${operationalSats ? operationalSats.toLocaleString() : "10,900+"} operational satellites tracked via CelesTrak SATCAT delivering global broadband.`,
              icon: Wifi,
              color: "text-cyan-400",
            },
            {
              step: "Step 3: Heavy Scale Engine",
              title: "Starship V3",
              desc: "Flight 14 & Flight 15 (Ship 42 catch) proved 26-satellite V3 orbital deployments and upper-stage recovery.",
              icon: Rocket,
              color: "text-emerald-400",
            },
            {
              step: "Step 4: Defense Layer",
              title: "Starshield",
              desc: "Government & defense satellite layer leveraging mass orbital manufacturing.",
              icon: Shield,
              color: "text-purple-400",
            },
          ].map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.title}
                className="p-3.5 rounded-2xl bg-black/60 border border-white/15 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{card.step}</span>
                  <CardIcon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{card.title}</h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-snug">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#09111e] border border-cyan-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-cyan-300 tracking-wider">
                Broadcast · {activeVideo.thumbnailBadge} · {activeVideo.year}
              </span>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
                aria-label="Close video"
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
