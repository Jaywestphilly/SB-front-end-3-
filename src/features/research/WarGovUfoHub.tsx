import React, { useState, useEffect, useRef } from "react";
import { StockTicker } from "../../types";
import { useSubTabUrl } from "../../hooks/useSubTabUrl";
import {
  ShieldAlert,
  Radar,
  Radio,
  ExternalLink,
  Eye,
  Cpu,
  Layers,
  Search,
  Sparkles,
  FileText,
  AlertTriangle,
  Zap,
  Info,
  ChevronRight,
  Lock,
  Globe,
  Activity,
  Award,
  Terminal,
  Compass,
  Building2,
  TrendingUp,
  Maximize2,
  X,
  Clock,
  DollarSign,
  Filter,
  CheckCircle2,
  ArrowUpRight,
  Briefcase,
  Crosshair,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

interface WarGovUfoHubProps {
  allStocks?: StockTicker[];
  onSelectStock?: (stock: StockTicker) => void;
}

interface ContractAward {
  id: string;
  contractor: string;
  ticker: string;
  branch: string;
  amountMillions: number;
  awardDate: string;
  title: string;
  category: "Air & Space" | "Defense AI & Cyber" | "Autonomous Swarms" | "Missiles & Hypersonics" | "Maritime & Submarines";
  uapTechBridge: string;
  revenueImpactPercent: number;
}

interface ContractPeriod {
  periodId: string;
  periodName: string;
  totalAwardedMillions: number;
  topContractor: string;
  contractCount: number;
  lastUpdated: string;
  nextPeriodSync: string;
  awards: ContractAward[];
}

interface DefenseWatchlistStock {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  dividendYield: number;
  dodBacklogBillions: number;
  ytdContractAwardsMillions: number;
  primaryBranch: string;
  clearanceLevel: string;
  domain: string;
  uapTechRole: string;
  investmentThesis: string;
  analystRating: string;
}

const FALLBACK_PERIOD: ContractPeriod = {
  periodId: "2026-08-T2",
  periodName: "AUG 2026 — PERIOD 2 (AUG 01 - AUG 14, 2026)",
  totalAwardedMillions: 18450,
  topContractor: "Lockheed Martin (LMT)",
  contractCount: 14,
  lastUpdated: new Date().toISOString(),
  nextPeriodSync: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  awards: [
    {
      id: "DOD-2026-0824-LMT",
      contractor: "Lockheed Martin Corp",
      ticker: "LMT",
      branch: "US Air Force / Space Development Agency",
      amountMillions: 4250,
      awardDate: "AUG 11, 2026",
      title: "F-35 Block 4 Avionics & Hypersonic Glide Vehicle Integration",
      category: "Missiles & Hypersonics",
      uapTechBridge: "Exotic Propulsion Airframe Thermal Absorption & Low-Observable RCS",
      revenueImpactPercent: 6.2,
    },
    {
      id: "DOD-2026-0822-PLTR",
      contractor: "Palantir Technologies",
      ticker: "PLTR",
      branch: "DoD AARO / US Space Command",
      amountMillions: 880,
      awardDate: "AUG 09, 2026",
      title: "Maven AI C4ISR Cloud Matrix & UAP Anomaly Telemetry Ingestion",
      category: "Defense AI & Cyber",
      uapTechBridge: "AARO Sensor Telemetry Aggregation & Gravitational Anomaly Trajectory Processing",
      revenueImpactPercent: 22.4,
    },
    {
      id: "DOD-2026-0820-RTX",
      contractor: "RTX Corp (Raytheon)",
      ticker: "RTX",
      branch: "US Navy NAVAIR",
      amountMillions: 3120,
      awardDate: "AUG 07, 2026",
      title: "APG-79 AESA Radar Upgrades & ATFLIR Sensor Array Expansion",
      category: "Air & Space",
      uapTechBridge: "AESA Active Jamming Suppression & Gimbal Optical IR Tracking",
      revenueImpactPercent: 4.5,
    },
    {
      id: "DOD-2026-0818-NOC",
      contractor: "Northrop Grumman",
      ticker: "NOC",
      branch: "US Air Force Global Strike Command",
      amountMillions: 3890,
      awardDate: "AUG 05, 2026",
      title: "B-21 Raider Stealth Bomber Production Batch 3 & Space Tracking Array",
      category: "Air & Space",
      uapTechBridge: "Byeman-Class Deep Space Radar & Plasma Envelope Stealth Shielding",
      revenueImpactPercent: 9.8,
    },
    {
      id: "DOD-2026-0815-AVAV",
      contractor: "AeroVironment",
      ticker: "AVAV",
      branch: "US Army Special Operations Command",
      amountMillions: 620,
      awardDate: "AUG 03, 2026",
      title: "Switchblade 600 Precision Loitering Munitions & Autonomous Drone Swarms",
      category: "Autonomous Swarms",
      uapTechBridge: "Low-Acoustic Muted Hydro-Aero Flight Dynamics & Swarm Mesh Networking",
      revenueImpactPercent: 18.5,
    },
    {
      id: "DOD-2026-0812-KTOS",
      contractor: "Kratos Defense",
      ticker: "KTOS",
      branch: "US Air Force Research Lab (AFRL)",
      amountMillions: 440,
      awardDate: "AUG 02, 2026",
      title: "XQ-58A Valkyrie High-Speed Unmanned Tactical Target Drones",
      category: "Autonomous Swarms",
      uapTechBridge: "Mach 5+ Hypersonic Unmanned Target Simulation Array",
      revenueImpactPercent: 14.1,
    },
    {
      id: "DOD-2026-0810-RKLB",
      contractor: "Rocket Lab USA",
      ticker: "RKLB",
      branch: "US Space Force / SDA",
      amountMillions: 515,
      awardDate: "AUG 01, 2026",
      title: "Tactical Response Space Launch & Military Satellite Constellation Bus",
      category: "Air & Space",
      uapTechBridge: "Orbital Rapid Insertion & Hypersonic Re-entry Trajectory Telemetry",
      revenueImpactPercent: 21.0,
    },
  ],
};

const FALLBACK_WATCHLIST: DefenseWatchlistStock[] = [
  {
    ticker: "LMT",
    name: "Lockheed Martin Corp",
    price: 468.20,
    changePercent: 1.85,
    marketCap: "$114.2B",
    peRatio: 17.4,
    dividendYield: 2.75,
    dodBacklogBillions: 160.5,
    ytdContractAwardsMillions: 24850,
    primaryBranch: "US Air Force / Space Force",
    clearanceLevel: "TOP SECRET // SCI // SAP",
    domain: "Air & Space",
    uapTechRole: "Skunk Works exotic airframe prototyping, F-35 Block 4 avionics & hypersonic glide interceptors.",
    investmentThesis: "Dominant prime contractor holding massive $160B backlog with steady 2.75% dividend yield and recurring F-35 cash flow.",
    analystRating: "Strong Buy"
  },
  {
    ticker: "NOC",
    name: "Northrop Grumman Corp",
    price: 504.60,
    changePercent: 2.10,
    marketCap: "$75.8B",
    peRatio: 19.8,
    dividendYield: 1.62,
    dodBacklogBillions: 84.2,
    ytdContractAwardsMillions: 16400,
    primaryBranch: "US Air Force / Global Strike",
    clearanceLevel: "TOP SECRET // BYEMAN",
    domain: "Air & Space",
    uapTechRole: "B-21 Raider stealth bomber, next-gen ICBM Sentinel program, and deep space surveillance optics.",
    investmentThesis: "Sole-source provider for America's nuclear triad modernization (B-21 & Sentinel) ensuring 10+ year revenue visibility.",
    analystRating: "Strong Buy"
  },
  {
    ticker: "RTX",
    name: "RTX Corp (Raytheon)",
    price: 120.40,
    changePercent: 0.95,
    marketCap: "$160.5B",
    peRatio: 22.1,
    dividendYield: 2.10,
    dodBacklogBillions: 202.0,
    ytdContractAwardsMillions: 28900,
    primaryBranch: "US Navy & Air Force",
    clearanceLevel: "SECRET // NOFORN",
    domain: "Missiles & Hypersonics",
    uapTechRole: "APG-79 AESA Radars, ATFLIR optical trackers, Patriot missile defense & directed energy lasers.",
    investmentThesis: "Record $202B backlog driven by global rearmament, Patriot interceptor demand, and commercial aerospace recovery.",
    analystRating: "Buy"
  },
  {
    ticker: "PLTR",
    name: "Palantir Technologies",
    price: 46.80,
    changePercent: 4.80,
    marketCap: "$102.4B",
    peRatio: 84.5,
    dividendYield: 0.0,
    dodBacklogBillions: 8.5,
    ytdContractAwardsMillions: 2880,
    primaryBranch: "DoD AARO / US Space Command",
    clearanceLevel: "SECRET // FEDRAMP HIGH",
    domain: "Defense AI & Cyber",
    uapTechRole: "Project Maven AI C4ISR operating system, Titan ground stations, & AARO anomaly telemetry ingestion.",
    investmentThesis: "Clear monopoly in battle-management AI and intelligence data integration for US DoD and Allied defense forces.",
    analystRating: "Strong Buy"
  },
  {
    ticker: "KTOS",
    name: "Kratos Defense & Security",
    price: 25.90,
    changePercent: 3.25,
    marketCap: "$3.95B",
    peRatio: 42.0,
    dividendYield: 0.0,
    dodBacklogBillions: 1.4,
    ytdContractAwardsMillions: 820,
    primaryBranch: "US Air Force AFRL",
    clearanceLevel: "SECRET // SPECIAL ACCESS",
    domain: "Autonomous Swarms",
    uapTechRole: "XQ-58A Valkyrie collaborative combat aircraft (CCA) & high-speed hypersonic target drones.",
    investmentThesis: "Pure-play leader in low-cost attritable unmanned fighter drones and hypersonic rocket testing platforms.",
    analystRating: "Buy"
  },
  {
    ticker: "AVAV",
    name: "AeroVironment Inc",
    price: 198.50,
    changePercent: 5.40,
    marketCap: "$5.6B",
    peRatio: 52.1,
    dividendYield: 0.0,
    dodBacklogBillions: 1.1,
    ytdContractAwardsMillions: 950,
    primaryBranch: "US Army / USMC / SOCOM",
    clearanceLevel: "SECRET // SOCOM",
    domain: "Autonomous Swarms",
    uapTechRole: "Switchblade 300/600 loitering munition drones, Puma tactical UAS, and autonomous swarm AI.",
    investmentThesis: "Unrivaled leader in battlefield kamikaze loitering drones, seeing exponential growth in international & DoD orders.",
    analystRating: "Strong Buy"
  },
  {
    ticker: "GD",
    name: "General Dynamics",
    price: 298.10,
    changePercent: 1.15,
    marketCap: "$81.2B",
    peRatio: 18.2,
    dividendYield: 1.92,
    dodBacklogBillions: 93.6,
    ytdContractAwardsMillions: 19800,
    primaryBranch: "US Navy NAVSEA",
    clearanceLevel: "TOP SECRET // NAVSEA",
    domain: "Maritime & Submarines",
    uapTechRole: "Virginia and Columbia-class nuclear submarines, Abrams tank platforms, & IT defense infrastructure.",
    investmentThesis: "Sole manufacturer of US nuclear submarine hull structures with guaranteed multi-decade naval funding.",
    analystRating: "Buy"
  },
  {
    ticker: "RKLB",
    name: "Rocket Lab USA",
    price: 9.85,
    changePercent: 6.20,
    marketCap: "$4.9B",
    peRatio: 0,
    dividendYield: 0.0,
    dodBacklogBillions: 1.05,
    ytdContractAwardsMillions: 640,
    primaryBranch: "US Space Force / SDA",
    clearanceLevel: "SECRET // SPACE FORCE",
    domain: "Air & Space",
    uapTechRole: "Electron & Neutron orbital launch rockets, SDA satellite constellation buses, and hypersonic re-entry testing.",
    investmentThesis: "Number 2 commercial launcher globally behind SpaceX, rapidly winning high-margin Space Force defense satellite contracts.",
    analystRating: "Buy"
  },
  {
    ticker: "LHX",
    name: "L3Harris Technologies",
    price: 232.40,
    changePercent: 1.40,
    marketCap: "$43.8B",
    peRatio: 18.9,
    dividendYield: 2.05,
    dodBacklogBillions: 33.5,
    ytdContractAwardsMillions: 8900,
    primaryBranch: "US Space Force & Army",
    clearanceLevel: "TOP SECRET // SCI",
    domain: "Air & Space",
    uapTechRole: "Tactical radios, missile tracking satellite payloads, and Aerojet Rocketdyne solid rocket motors.",
    investmentThesis: "Essential provider of battlefield communications and sole domestic producer of hypersonic solid rocket motors.",
    analystRating: "Buy"
  },
  {
    ticker: "LDOS",
    name: "Leidos Holdings",
    price: 158.20,
    changePercent: 2.05,
    marketCap: "$21.5B",
    peRatio: 16.8,
    dividendYield: 0.98,
    dodBacklogBillions: 38.0,
    ytdContractAwardsMillions: 6700,
    primaryBranch: "DISA / Intelligence Community",
    clearanceLevel: "TOP SECRET // SCI",
    domain: "Defense AI & Cyber",
    uapTechRole: "Mayhem air-breathing hypersonic system, DISA cloud migration, and intelligence threat analytics.",
    investmentThesis: "Largest defense IT and intelligence systems integrator benefiting from DoD digital cloud transformation.",
    analystRating: "Buy"
  }
];

export const WarGovUfoHub: React.FC<WarGovUfoHubProps> = ({
  allStocks,
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useSubTabUrl(
    "/war-gov-ufo",
    ["awards", "watchlist", "whistleblower"] as const,
    "awards"
  );

  const [activePeriod, setActivePeriod] = useState<ContractPeriod>(FALLBACK_PERIOD);
  const [allPeriods, setAllPeriods] = useState<ContractPeriod[]>([FALLBACK_PERIOD]);
  const [defenseWatchlist, setDefenseWatchlist] = useState<DefenseWatchlistStock[]>(FALLBACK_WATCHLIST);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [periodCategoryFilter, setPeriodCategoryFilter] = useState<string>("all");
  const [periodSearch, setPeriodSearch] = useState<string>("");
  const [watchlistDomainFilter, setWatchlistDomainFilter] = useState<string>("all");
  const [watchlistSortKey, setWatchlistSortKey] = useState<"backlog" | "change" | "marketCap" | "awards">("backlog");
  

  // Fetch API Data
  useEffect(() => {
    let isMounted = true;
    const fetchDefenseData = async () => {
      try {
        setIsLoading(true);
        const [periodsRes, watchlistRes] = await Promise.all([
          fetch("/api/defense/periods").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/defense/watchlist").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (isMounted) {
          if (periodsRes && periodsRes.activePeriod) {
            setActivePeriod(periodsRes.activePeriod);
            if (periodsRes.allPeriods) setAllPeriods(periodsRes.allPeriods);
          }
          if (watchlistRes && Array.isArray(watchlistRes)) {
            setDefenseWatchlist(watchlistRes);
          }
        }
      } catch (err) {
        console.warn("Using fallback defense data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDefenseData();
    return () => {
      isMounted = false;
    };
  }, []);


  // Filtered Period Awards
  const filteredAwards = (activePeriod?.awards || []).filter((award) => {
    const matchesSearch =
      award.contractor.toLowerCase().includes(periodSearch.toLowerCase()) ||
      award.ticker.toLowerCase().includes(periodSearch.toLowerCase()) ||
      award.title.toLowerCase().includes(periodSearch.toLowerCase()) ||
      award.branch.toLowerCase().includes(periodSearch.toLowerCase());

    if (periodCategoryFilter === "all") return matchesSearch;
    return matchesSearch && award.category === periodCategoryFilter;
  });

  // Filtered Watchlist
  const filteredWatchlist = defenseWatchlist
    .filter((s) => {
      if (watchlistDomainFilter === "all") return true;
      return s.domain === watchlistDomainFilter;
    })
    .sort((a, b) => {
      if (watchlistSortKey === "backlog") {
        if (a.ticker === "ANDURIL") return -1;
        if (b.ticker === "ANDURIL") return 1;
        return b.dodBacklogBillions - a.dodBacklogBillions;
      }
      if (watchlistSortKey === "change") return b.changePercent - a.changePercent;
      if (watchlistSortKey === "awards") return b.ytdContractAwardsMillions - a.ytdContractAwardsMillions;
      return parseFloat(b.marketCap.replace(/[^0-9.]/g, "")) - parseFloat(a.marketCap.replace(/[^0-9.]/g, ""));
    });

    const handleSelectTicker = (tickerSymbol: string) => {
    triggerHaptic("selection");
    let query = tickerSymbol;
    if (tickerSymbol === "ANDURIL") {
      query = "ANDURIL";
    }
    window.open(`https://finance.yahoo.com/quote/${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full space-y-4 font-mono select-none">
      {/* DoD War.gov / Defense Matrix Security Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#020b14] border-2 border-cyan-500/40 alien-block-cut relative overflow-hidden shadow-2xl shadow-cyan-500/20">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 shadow-lg shadow-cyan-500/30 alien-block-cut-sm">
              <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/40 alien-block-cut-sm">
                  PENTAGON DOD PROCUREMENT & AARO MATRIX
                </span>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-500/40 alien-block-cut-sm flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 text-emerald-400 animate-spin-slow" />
                  BI-WEEKLY DATA SYNC ACTIVE
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-cyan-100 tracking-wider mt-1 uppercase">
                DEFENSE & AEROSPACE INVESTMENT MATRIX
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.defense.gov/News/Contracts/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 alien-block-cut-sm bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>DEFENSE.GOV CONTRACTS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Live Metrics Header Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
            <span className="text-[9px] text-cyan-400/80 uppercase font-extrabold block">
              Bi-Weekly Award Volume
            </span>
            <span className="text-sm font-black text-amber-300 mt-0.5 block">
              ${(activePeriod?.totalAwardedMillions / 1000 || 18.45).toFixed(2)}B Awarded
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
            <span className="text-[9px] text-cyan-400/80 uppercase font-extrabold block">
              Award Cycle
            </span>
            <span className="text-sm font-black text-cyan-200 mt-0.5 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              14-Day Automated Sync
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
            <span className="text-[9px] text-cyan-400/80 uppercase font-extrabold block">
              DoD Prime Backlog
            </span>
            <span className="text-sm font-black text-emerald-300 mt-0.5 block">
              $730B+ Combined Backlog
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
            <span className="text-[9px] text-cyan-400/80 uppercase font-extrabold block">
              UAP Sensor Tech Bridge
            </span>
            <span className="text-sm font-black text-purple-300 mt-0.5 block">
              AESA / Optics / Hypersonics
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: "awards", label: "Bi-Weekly Contract Awards", icon: Briefcase },
          { id: "watchlist", label: "Defense Department Watchlist", icon: BarChart3 },
          { id: "whistleblower", label: "Congressional Briefings", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic("selection");
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-2 alien-block-cut-sm text-xs font-black shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 border border-cyan-200"
                  : "bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: Bi-Weekly Contract Awards */}
      {activeTab === "awards" && (
        <div className="space-y-4">
          {/* Award Selector & Filter Bar */}
          <div className="p-4 rounded-3xl bg-[#020b14] border-2 border-cyan-500/40 alien-block-cut space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/80 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  Active Period:
                </span>
                <select
                  value={activePeriod.periodId}
                  onChange={(e) => {
                    const match = allPeriods.find((t) => t.periodId === e.target.value);
                    if (match) setActivePeriod(match);
                  }}
                  className="bg-cyan-950 text-cyan-100 font-bold text-xs border border-cyan-500/40 px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                >
                  {allPeriods.map((t) => (
                    <option key={t.periodId} value={t.periodId}>
                      {t.periodName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[10px] text-cyan-400/80 flex items-center gap-3">
                <span className="bg-cyan-950/80 px-2.5 py-1 border border-cyan-500/30 rounded-lg">
                  Top Winner: <strong className="text-amber-300">{activePeriod.topContractor}</strong>
                </span>
                <span className="bg-cyan-950/80 px-2.5 py-1 border border-cyan-500/30 rounded-lg">
                  Awards in Period: <strong className="text-emerald-300">{activePeriod.contractCount} Major Awards</strong>
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Search contractor, ticker, branch, or project..."
                  value={periodSearch}
                  onChange={(e) => setPeriodSearch(e.target.value)}
                  className="bg-[#010810] text-xs text-cyan-100 placeholder-cyan-600 outline-none w-full sm:w-72 px-3 py-1.5 rounded-xl border border-cyan-500/30 font-mono"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
                {[
                  { id: "all", label: "All Categories" },
                  { id: "Air & Space", label: "Air & Space" },
                  { id: "Defense AI & Cyber", label: "AI & Cyber" },
                  { id: "Autonomous Swarms", label: "Autonomous Swarms" },
                  { id: "Missiles & Hypersonics", label: "Missiles & Hypersonics" },
                  { id: "Maritime & Submarines", label: "Maritime" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPeriodCategoryFilter(f.id)}
                    className={`px-2.5 py-1 alien-block-cut-sm text-[10px] font-black uppercase transition-all cursor-pointer shrink-0 ${
                      periodCategoryFilter === f.id
                        ? "bg-amber-400 text-black"
                        : "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contract Award Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAwards.map((award) => (
              <div
                key={award.id}
                className="p-4 rounded-2xl bg-[#020b14] border border-cyan-500/30 hover:border-cyan-400/80 transition-all space-y-3 relative group overflow-hidden shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectTicker(award.ticker)}
                      className="text-xs font-black text-amber-300 bg-amber-950/80 hover:bg-amber-400 hover:text-black transition-colors px-2.5 py-1 border border-amber-500/40 alien-block-cut-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span>${award.ticker}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-cyan-100">{award.contractor}</span>
                  </div>

                  <span className="text-sm font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 border border-emerald-500/40 rounded-lg">
                    +${(award.amountMillions >= 1000 ? (award.amountMillions / 1000).toFixed(2) + "B" : award.amountMillions + "M")}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block">
                    {award.branch} • {award.awardDate}
                  </span>
                  <h3 className="text-sm font-extrabold text-cyan-50 group-hover:text-amber-200 transition-colors leading-snug">
                    {award.title}
                  </h3>
                </div>

                {/* UAP / Exotic Tech Bridge Note */}
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[10px] space-y-0.5">
                  <div className="flex items-center gap-1.5 text-purple-300 font-extrabold uppercase">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>UAP & Advanced Physics Tech Bridge:</span>
                  </div>
                  <p className="text-cyan-200/90 font-medium leading-relaxed">
                    {award.uapTechBridge}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-cyan-400/80 font-mono">
                  <span className="bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    Category: {award.category}
                  </span>
                  <span className="text-emerald-300 font-bold">
                    Est. Revenue Impact: +{award.revenueImpactPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: Defense Department Watchlist */}
      {activeTab === "watchlist" && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#020b14] border-2 border-cyan-500/40 alien-block-cut space-y-4 shadow-2xl relative">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest block">
                DEPARTMENT OF DEFENSE ADJACENT WATCHLIST & SCREENER
              </span>
              <h2 className="text-base sm:text-lg font-black text-cyan-100 mt-0.5">
                INSTITUTIONAL AEROSPACE & DEFENSE PRIME EQUITIES
              </h2>
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] text-cyan-400/80 uppercase font-bold">Sort By:</span>
              {(["backlog", "change", "awards"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setWatchlistSortKey(key)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase alien-block-cut-sm transition-all cursor-pointer ${
                    watchlistSortKey === key
                      ? "bg-amber-400 text-black"
                      : "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30"
                  }`}
                >
                  {key === "backlog" ? "DoD Backlog" : key === "change" ? "24h %" : "YTD Awards"}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: "all", label: "All Equities" },
              { id: "Air & Space", label: "Air & Space" },
              { id: "Missiles & Hypersonics", label: "Missiles & Hypersonics" },
              { id: "Defense AI & Cyber", label: "AI & Cyber" },
              { id: "Autonomous Swarms", label: "Autonomous Swarms" },
              { id: "Maritime & Submarines", label: "Maritime Submarines" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setWatchlistDomainFilter(f.id)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase alien-block-cut-sm transition-all cursor-pointer shrink-0 ${
                  watchlistDomainFilter === f.id
                    ? "bg-cyan-400 text-black font-extrabold shadow-md"
                    : "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Equity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredWatchlist.map((stock) => {
              const isUp = stock.changePercent >= 0;
              return (
                <div
                  key={stock.ticker}
                  onClick={() => handleSelectTicker(stock.ticker)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 group ${
                    isUp
                      ? "bg-gradient-to-br from-[#031c12]/90 via-[#02140d]/90 to-[#020d18]/90 border-emerald-500/40 hover:border-emerald-400/80 shadow-lg shadow-emerald-950/30"
                      : "bg-gradient-to-br from-[#24050d]/90 via-[#180308]/90 to-[#020d18]/90 border-rose-500/40 hover:border-rose-400/80 shadow-lg shadow-rose-950/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-amber-300 group-hover:text-amber-200 transition-colors">
                        ${stock.ticker}
                      </span>
                      <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 border border-cyan-500/30 alien-block-cut-sm">
                        {stock.clearanceLevel}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold text-sm text-cyan-100">${stock.price.toFixed(2)}</span>
                      <span
                        className={`text-[10px] font-black block ${
                          isUp ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isUp ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                <div>
                  <h3 className="text-xs font-black text-cyan-100">{stock.name}</h3>
                  <span className="text-[10px] text-cyan-400/80">{stock.primaryBranch}</span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-[10px] bg-[#010810] p-2 rounded-xl border border-cyan-500/20">
                  <div>
                    <span className="text-cyan-500 uppercase font-bold block">DoD Backlog</span>
                    <span className="text-amber-300 font-extrabold">${stock.dodBacklogBillions}B</span>
                  </div>
                  <div>
                    <span className="text-cyan-500 uppercase font-bold block">YTD Awards</span>
                    <span className="text-emerald-300 font-extrabold">
                      ${(stock.ytdContractAwardsMillions / 1000).toFixed(1)}B
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-500 uppercase font-bold block">Div Yield</span>
                    <span className="text-cyan-200 font-extrabold">{stock.dividendYield}%</span>
                  </div>
                </div>

                {/* Investment Thesis & UAP Role */}
                <p className="text-[11px] text-neutral-300 leading-relaxed font-sans bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/20">
                  <strong className="text-amber-300 font-mono text-[10px] uppercase block mb-0.5">
                    Institutional Thesis:
                  </strong>
                  {stock.investmentThesis}
                </p>

                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-purple-300 font-extrabold">
                    Analyst Rating: {stock.analystRating}
                  </span>
                  <button className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black alien-block-cut-sm flex items-center gap-1 cursor-pointer">
                    <span>INSPECT TICKER</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* VIEW 6: Whistleblower & Congressional Briefings */}
      {activeTab === "whistleblower" && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#020b14] border-2 border-cyan-500/40 alien-block-cut space-y-4 shadow-2xl relative">
            <div className="hud-corner-tl" />
            <div className="hud-corner-tr" />
            <div className="hud-corner-bl" />
            <div className="hud-corner-br" />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest block">
                  US CONGRESSIONAL OVERSIGHT & WAR.GOV/UFO RELEASES
                </span>
                <h2 className="text-base sm:text-lg font-black text-cyan-100 mt-0.5">
                  DECLASSIFIED BRIEFINGS & OFFICIAL REPORTS
                </h2>
              </div>
              <a
                href="https://www.defense.gov/UFO/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 alien-block-cut-sm bg-cyan-950/80 hover:bg-cyan-500 hover:text-black text-cyan-300 font-black text-[10px] transition-all flex items-center gap-1.5 cursor-pointer border border-cyan-500/30"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>WAR.GOV/UFO (AARO)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              
              {/* Column 1: Hearings */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-amber-300 uppercase flex items-center gap-2 border-b border-amber-500/20 pb-2">
                  <Award className="w-4 h-4" />
                  Congressional UAP Hearings & Testimony
                </h3>
                
                {[
                  {
                    title: "House Oversight Subcommittee on National Security",
                    date: "July 26, 2023",
                    desc: "Testimony from David Grusch (Former NGA/NRO), Cmdr. David Fravor, and Ryan Graves on multi-decade legacy crash retrieval programs, UAP capabilities, and airspace safety.",
                    link: "https://oversight.house.gov/hearing/unidentified-anomalous-phenomena-implications-on-national-security-public-safety-and-government-transparency/"
                  },
                  {
                    title: "Senate Armed Services Subcommittee (AARO)",
                    date: "April 19, 2023",
                    desc: "Open hearing with Dr. Sean Kirkpatrick on the All-domain Anomaly Resolution Office (AARO) operations and mission capabilities.",
                    link: "https://www.armed-services.senate.gov/hearings/to-receive-testimony-on-the-mission-activities-oversight-and-budget-of-the-all-domain-anomaly-resolution-office"
                  },
                  {
                    title: "House Intelligence Counterterrorism Subcommittee",
                    date: "May 17, 2022",
                    desc: "First public hearing on UFOs in over 50 years, featuring testimony from top Pentagon intelligence officials regarding ongoing sightings.",
                    link: "https://intelligence.house.gov/news/documentsingle.aspx?DocumentID=1264"
                  }
                ].map((hearing, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#030e18] border border-cyan-500/30 space-y-1.5 hover:border-cyan-400 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-300 uppercase bg-amber-950 px-2 py-0.5 border border-amber-500/40 alien-block-cut-sm shrink-0">
                        {hearing.date}
                      </span>
                      <a href={hearing.link} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-300">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-cyan-100 font-bold">{hearing.title}</p>
                    <p className="text-neutral-300 leading-relaxed font-sans text-[11px]">{hearing.desc}</p>
                  </div>
                ))}
              </div>

              {/* Column 2: War.gov / UFO Releases */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-cyan-400 uppercase flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                  <FileText className="w-4 h-4" />
                  Official Releases (war.gov/ufo)
                </h3>
                
                {[
                  {
                    id: "REL-01",
                    title: "Declassified FLIR, GOFAST, and GIMBAL Videos",
                    desc: "Official release of US Navy F/A-18 videos capturing Unidentified Aerial Phenomena encounters.",
                    link: "https://www.war.gov/UFO/?release=01"
                  },
                  {
                    id: "REL-02",
                    title: "UAP Historical Record Report (Volume I)",
                    desc: "Comprehensive review of US government involvement in UAP investigations dating back to 1945.",
                    link: "https://www.war.gov/UFO/?release=02"
                  },
                  {
                    id: "REL-03",
                    title: "AARO Strategic Plan and UAP Framework",
                    desc: "Methodology and strategic guidelines for tracking, analyzing, and resolving anomalous sightings.",
                    link: "https://www.war.gov/UFO/?release=03"
                  },
                  {
                    id: "REL-04",
                    title: "DoD/IC UAP Reporting Mechanism",
                    desc: "Secure reporting portal launched for current/former government and military personnel.",
                    link: "https://www.war.gov/UFO/?release=04"
                  },
                  {
                    id: "REL-05",
                    title: "Annual Report on Unidentified Anomalous Phenomena",
                    desc: "Yearly unclassified summary of incoming reports, resolved cases, and technological characterizations.",
                    link: "https://www.war.gov/UFO/?release=05"
                  }
                ].map((release, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#030e18]/80 border border-cyan-500/30 space-y-1.5 hover:border-cyan-400 transition-colors group">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-cyan-300 uppercase bg-cyan-950 px-2 py-0.5 border border-cyan-500/40 alien-block-cut-sm">
                        {release.id}
                      </span>
                      <a href={release.link} target="_blank" rel="noopener noreferrer" className="text-cyan-500/50 group-hover:text-cyan-300 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-cyan-100 font-bold">{release.title}</p>
                    <p className="text-neutral-400 leading-relaxed font-sans text-[11px]">{release.desc}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
