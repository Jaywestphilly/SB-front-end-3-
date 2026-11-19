import React, { useState, useEffect } from "react";
import { ViewTab } from "../types";
import {
  TrendingUp,
  Cpu,
  Building2,
  ShieldCheck,
  GraduationCap,
  Layers,
  Orbit,
  ShieldAlert,
  Sparkles,
  X,
  ChevronRight,
  Home,
  Briefcase,
  Radio,
  FileText,
  Terminal,
  Globe,
  BarChart3,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { LiquidGlassSurface, LiquidGlassAccent } from "./ui/LiquidGlassSurface";

interface BottomNavProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenTerminal?: () => void;
  isTerminalOpen?: boolean;
  demoted?: boolean;
  magmaMode?: "standard" | "surge" | "slow" | "off";
}

interface HoloModuleItem {
  tab: ViewTab;
  index: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  hexBg: string;
  ringStroke: string;
  hoverBorder: string;
  hoverTitle: string;
  chevronColor: string;
}

interface HoloSectorConfig {
  id: "markets" | "ai" | "education";
  title: string;
  subtitle: string;
  closeLabel: string;
  accent: LiquidGlassAccent;
  glowShellClass: string;
  headerIcon: React.ElementType;
  headerColor: string;
  headerRing: string;
  items: HoloModuleItem[];
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  isTerminalOpen = false,
  demoted = false,
}) => {
  const [activeSheet, setActiveSheet] = useState<
    "markets" | "ai" | "education" | null
  >(null);

  // Auto-close category sheets immediately whenever activeTab changes from anywhere
  useEffect(() => {
    setActiveSheet(null);
  }, [activeTab]);

  // Escape key closes active category sheet
  useEffect(() => {
    if (!activeSheet) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSheet(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSheet]);

  const handleOpenSheet = (sheet: "markets" | "ai" | "education") => {
    triggerHaptic("selection");
    setActiveSheet((prev) => (prev === sheet ? null : sheet));
  };

  const handleNavigate = (tab: ViewTab) => {
    triggerHaptic("medium");
    setActiveSheet(null);
    onSelectTab(tab);
  };

  const isBlocActive = !isTerminalOpen && activeTab === "bloc";
  const isIntelActive = !isTerminalOpen && activeTab === "news";
  const isMarketsActive =
    !isTerminalOpen &&
    ["watchlist", "brand", "macro", "intelligence"].includes(activeTab);
  const isAiActive =
    !isTerminalOpen &&
    [
      "dyson_swarm",
      "war_gov_ufo",
      "ai_insights",
      "ai_revolution",
      "satellite_map",
      "agents",
      "developers",
    ].includes(activeTab);
  const isRealEstateActive = !isTerminalOpen && activeTab === "real_estate";
  const isCreditActive = !isTerminalOpen && activeTab === "credit";
  const isEducationActive =
    !isTerminalOpen &&
    [
      "investopedia",
      "small_business",
      "youtube",
      "terminal_guide",
      "mit_courses",
    ].includes(activeTab);

  const dockItems: {
    id: string;
    label: string;
    shortLines?: [string, string];
    icon: React.ElementType;
    isActive: boolean;
    accentColor: string;
    beamGradient: string;
    barColor: string;
    activeBorder: string;
    onClick: () => void;
  }[] = [
    {
      id: "bloc",
      label: "THE BLOC",
      icon: Sparkles,
      isActive: isBlocActive,
      accentColor: "text-[#00f5d4]",
      beamGradient:
        "linear-gradient(180deg, rgba(0,245,212,0.34) 0%, rgba(0,245,212,0.06) 75%, transparent 100%)",
      barColor: "bg-[#00f5d4] shadow-[0_0_12px_#00f5d4]",
      activeBorder: "border-[#00f5d4]/70 text-white",
      onClick: () => handleNavigate("bloc"),
    },
    {
      id: "intel",
      label: "INTEL",
      icon: Globe,
      isActive: isIntelActive,
      accentColor: "text-[#00e5ff]",
      beamGradient:
        "linear-gradient(180deg, rgba(0,229,255,0.34) 0%, rgba(0,229,255,0.06) 75%, transparent 100%)",
      barColor: "bg-[#00e5ff] shadow-[0_0_12px_#00e5ff]",
      activeBorder: "border-[#00e5ff]/70 text-white",
      onClick: () => handleNavigate("news"),
    },
    {
      id: "markets",
      label: "MARKETS",
      icon: TrendingUp,
      isActive: isMarketsActive || activeSheet === "markets",
      accentColor: "text-[#00f5d4]",
      beamGradient:
        "linear-gradient(180deg, rgba(0,245,212,0.36) 0%, rgba(0,229,255,0.06) 75%, transparent 100%)",
      barColor: "bg-[#00f5d4] shadow-[0_0_12px_#00f5d4]",
      activeBorder: "border-[#00f5d4]/75 text-white",
      onClick: () => handleOpenSheet("markets"),
    },
    {
      id: "ai",
      label: "AI",
      icon: Cpu,
      isActive: isAiActive || activeSheet === "ai",
      accentColor: "text-[#c084fc]",
      beamGradient:
        "linear-gradient(180deg, rgba(168,85,247,0.38) 0%, rgba(168,85,247,0.08) 75%, transparent 100%)",
      barColor: "bg-[#a855f7] shadow-[0_0_12px_#a855f7]",
      activeBorder: "border-[#a855f7]/80 text-white",
      onClick: () => handleOpenSheet("ai"),
    },
    {
      id: "real_estate",
      label: "REAL ESTATE",
      shortLines: ["REAL", "ESTATE"],
      icon: Building2,
      isActive: isRealEstateActive,
      accentColor: "text-amber-400",
      beamGradient:
        "linear-gradient(180deg, rgba(245,158,11,0.34) 0%, rgba(245,158,11,0.06) 75%, transparent 100%)",
      barColor: "bg-amber-400 shadow-[0_0_12px_#f59e0b]",
      activeBorder: "border-amber-400/75 text-amber-50",
      onClick: () => handleNavigate("real_estate"),
    },
    {
      id: "credit",
      label: "CREDIT",
      icon: ShieldCheck,
      isActive: isCreditActive,
      accentColor: "text-[#00ff9d]",
      beamGradient:
        "linear-gradient(180deg, rgba(0,255,157,0.34) 0%, rgba(0,255,157,0.06) 75%, transparent 100%)",
      barColor: "bg-[#00ff9d] shadow-[0_0_12px_#00ff9d]",
      activeBorder: "border-[#00ff9d]/75 text-emerald-50",
      onClick: () => handleNavigate("credit"),
    },
    {
      id: "education",
      label: "EDUCATION",
      icon: GraduationCap,
      isActive: isEducationActive || activeSheet === "education",
      accentColor: "text-[#38bdf8]",
      beamGradient:
        "linear-gradient(180deg, rgba(56,189,248,0.34) 0%, rgba(56,189,248,0.06) 75%, transparent 100%)",
      barColor: "bg-[#38bdf8] shadow-[0_0_12px_#38bdf8]",
      activeBorder: "border-[#38bdf8]/75 text-sky-50",
      onClick: () => handleOpenSheet("education"),
    },
  ];

  const sectorConfigs: Record<"markets" | "ai" | "education", HoloSectorConfig> =
    {
      markets: {
        id: "markets",
        title: "MARKETS MATRIX",
        subtitle: "Select a live market intelligence desk",
        closeLabel: "Close Markets Matrix",
        accent: "cyan",
        glowShellClass: "xeno-glow-shell",
        headerIcon: TrendingUp,
        headerColor: "text-[#00f5d4]",
        headerRing: "#00f5d4",
        items: [
          {
            tab: "watchlist",
            index: "01",
            icon: TrendingUp,
            title: "Live Watchlist Workstation",
            desc: "Live stock quotes, SB Scores & technical screeners.",
            hexBg: "bg-[#00f5d4]/18 text-[#00f5d4]",
            ringStroke: "#00f5d4",
            hoverBorder: "hover:border-[#00f5d4]/80",
            hoverTitle: "group-hover:text-[#00f5d4]",
            chevronColor: "text-[#00f5d4]",
          },
          {
            tab: "intelligence",
            index: "02",
            icon: Layers,
            title: "13F Hedge Fund Intel",
            desc: "Institutional SEC filings, whale tracking & Senate trades.",
            hexBg: "bg-[#00e5ff]/18 text-[#00e5ff]",
            ringStroke: "#00e5ff",
            hoverBorder: "hover:border-[#00e5ff]/80",
            hoverTitle: "group-hover:text-[#00e5ff]",
            chevronColor: "text-[#00e5ff]",
          },
          {
            tab: "macro",
            index: "03",
            icon: FileText,
            title: "Macro Economic Briefings",
            desc: "Fed rates, treasury yield curves & global liquidity trackers.",
            hexBg: "bg-[#00ff9d]/18 text-[#00ff9d]",
            ringStroke: "#00ff9d",
            hoverBorder: "hover:border-[#00ff9d]/80",
            hoverTitle: "group-hover:text-[#00ff9d]",
            chevronColor: "text-[#00ff9d]",
          },
          {
            tab: "brand",
            index: "04",
            icon: Home,
            title: "Stock Bloc Brand Landing",
            desc: "Platform philosophy, manifesto & architecture overview.",
            hexBg: "bg-[#a855f7]/20 text-[#c084fc]",
            ringStroke: "#a855f7",
            hoverBorder: "hover:border-[#a855f7]/80",
            hoverTitle: "group-hover:text-[#d8b4fe]",
            chevronColor: "text-[#c084fc]",
          },
        ],
      },
      ai: {
        id: "ai",
        title: "AI & TECH MATRIX",
        subtitle: "Deep-tech infrastructure, orbital compute & agent rails",
        closeLabel: "Close AI & Tech Matrix",
        accent: "purple",
        glowShellClass: "xeno-glow-shell-purple",
        headerIcon: Cpu,
        headerColor: "text-[#c084fc]",
        headerRing: "#a855f7",
        items: [
          {
            tab: "ai_revolution",
            index: "01",
            icon: BarChart3,
            title: "AI Infra & MS Value Chain",
            desc: "Morgan Stanley Heatmap, Power Generation, Data Centers & Chips.",
            hexBg: "bg-amber-400/18 text-amber-300",
            ringStroke: "#fbbf24",
            hoverBorder: "hover:border-amber-400/80",
            hoverTitle: "group-hover:text-amber-300",
            chevronColor: "text-amber-300",
          },
          {
            tab: "dyson_swarm",
            index: "02",
            icon: Orbit,
            title: "Dyson Swarm & Compute",
            desc: "SpaceX orbital launches, space telemetry & Megawatt grids.",
            hexBg: "bg-[#a855f7]/22 text-[#d8b4fe]",
            ringStroke: "#a855f7",
            hoverBorder: "hover:border-[#c084fc]/85",
            hoverTitle: "group-hover:text-[#d8b4fe]",
            chevronColor: "text-[#c084fc]",
          },
          {
            tab: "war_gov_ufo",
            index: "03",
            icon: ShieldAlert,
            title: "Defense Tech & Aerospace",
            desc: "Autonomous defense systems, procurement & aerospace moats.",
            hexBg: "bg-[#38bdf8]/20 text-[#38bdf8]",
            ringStroke: "#38bdf8",
            hoverBorder: "hover:border-[#38bdf8]/80",
            hoverTitle: "group-hover:text-[#7dd3fc]",
            chevronColor: "text-[#38bdf8]",
          },
          {
            tab: "agents",
            index: "04",
            icon: Globe,
            title: "AI Agent Directory",
            desc: "Discover autonomous AI agents analyzing live filings.",
            hexBg: "bg-[#00f5d4]/18 text-[#00f5d4]",
            ringStroke: "#00f5d4",
            hoverBorder: "hover:border-[#00f5d4]/80",
            hoverTitle: "group-hover:text-[#00f5d4]",
            chevronColor: "text-[#00f5d4]",
          },
          {
            tab: "developers",
            index: "05",
            icon: Terminal,
            title: "Developer Portal",
            desc: "Register external AI agents and provision x402 API rails.",
            hexBg: "bg-[#00ff9d]/18 text-[#00ff9d]",
            ringStroke: "#00ff9d",
            hoverBorder: "hover:border-[#00ff9d]/80",
            hoverTitle: "group-hover:text-[#00ff9d]",
            chevronColor: "text-[#00ff9d]",
          },
        ],
      },
      education: {
        id: "education",
        title: "EDUCATION MATRIX",
        subtitle: "University courses, terminal manual & financial playbooks",
        closeLabel: "Close Education Matrix",
        accent: "cobalt",
        glowShellClass: "xeno-glow-shell-cobalt",
        headerIcon: GraduationCap,
        headerColor: "text-[#38bdf8]",
        headerRing: "#38bdf8",
        items: [
          {
            tab: "mit_courses",
            index: "01",
            icon: GraduationCap,
            title: "MIT & University Courses",
            desc: "Official lectures from MIT OpenCourseWare, Yale & Stanford.",
            hexBg: "bg-[#a855f7]/22 text-[#d8b4fe]",
            ringStroke: "#a855f7",
            hoverBorder: "hover:border-[#c084fc]/80",
            hoverTitle: "group-hover:text-[#d8b4fe]",
            chevronColor: "text-[#c084fc]",
          },
          {
            tab: "terminal_guide",
            index: "02",
            icon: Terminal,
            title: "Terminal Guide & Manual",
            desc: "SB Terminal command codes, shortcuts & quantitative workflows.",
            hexBg: "bg-amber-400/18 text-amber-300",
            ringStroke: "#fbbf24",
            hoverBorder: "hover:border-amber-400/80",
            hoverTitle: "group-hover:text-amber-300",
            chevronColor: "text-amber-300",
          },
          {
            tab: "investopedia",
            index: "03",
            icon: Sparkles,
            title: "Investopedia Free Trading Game",
            desc: "Zero-risk paper trading simulator with live market order books.",
            hexBg: "bg-[#38bdf8]/20 text-[#38bdf8]",
            ringStroke: "#38bdf8",
            hoverBorder: "hover:border-[#38bdf8]/80",
            hoverTitle: "group-hover:text-[#7dd3fc]",
            chevronColor: "text-[#38bdf8]",
          },
          {
            tab: "small_business",
            index: "04",
            icon: Briefcase,
            title: "Small Business & QSBS Tax Hub",
            desc: "QSBS capital gains frameworks & founder equity term sheets.",
            hexBg: "bg-[#00ff9d]/18 text-[#00ff9d]",
            ringStroke: "#00ff9d",
            hoverBorder: "hover:border-[#00ff9d]/80",
            hoverTitle: "group-hover:text-[#00ff9d]",
            chevronColor: "text-[#00ff9d]",
          },
          {
            tab: "youtube",
            index: "05",
            icon: Radio,
            title: "Free Game Educational Videos",
            desc: "Curated YouTube breakdown videos & quantitative playbooks.",
            hexBg: "bg-[#00f5d4]/18 text-[#00f5d4]",
            ringStroke: "#00f5d4",
            hoverBorder: "hover:border-[#00f5d4]/80",
            hoverTitle: "group-hover:text-[#00f5d4]",
            chevronColor: "text-[#00f5d4]",
          },
        ],
      },
    };

  const currentSector = activeSheet ? sectorConfigs[activeSheet] : null;

  return (
    <>
      {/* ALIEN STARSHIP HOLOGRAPHIC COMMAND DOCK */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={
          demoted
            ? "fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] w-[96%] max-w-[640px] font-mono select-none md:hidden opacity-95 hover:opacity-100 transition-opacity"
            : "fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] w-[96%] max-w-[640px] font-mono select-none"
        }
      >
        <div className="xeno-dock-wrap relative">
          <div className="xeno-dock-console border border-[#00f5d4]/40 px-2 py-1.5 grid grid-cols-7 gap-1 relative overflow-hidden">
            {/* Animated Top Plasma Energy Conduit */}
            <div
              aria-hidden="true"
              className="absolute inset-x-5 top-0 h-[2px] xeno-conduit-rail pointer-events-none"
            />
            {/* Subtle Hex Micro-Grid */}
            <div
              aria-hidden="true"
              className="absolute inset-0 xeno-hex-grid opacity-45 pointer-events-none"
            />
            {/* Bottom Violet-Cyan Laser Trim */}
            <div
              aria-hidden="true"
              className="absolute inset-x-8 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#a855f7]/70 to-transparent pointer-events-none"
            />

            {dockItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  aria-pressed={item.isActive}
                  className={`dock-item-spring xeno-clip-sm relative min-h-[52px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 cursor-pointer w-full min-w-0 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f5d4] overflow-hidden ${
                    item.isActive
                      ? `${item.activeBorder} bg-[#061c33]/90`
                      : "border-transparent text-slate-300 hover:text-white hover:bg-[#00f5d4]/10 hover:border-[#00f5d4]/30"
                  }`}
                >
                  {/* Holographic Vertical Projection Pillar on Active Tab */}
                  {item.isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: item.beamGradient }}
                    />
                  )}

                  {/* Precision Corner Targeting Notches on Active Module */}
                  {item.isActive && (
                    <svg
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 80 54"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M 3 14 L 3 4 L 14 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className={item.accentColor}
                      />
                      <path
                        d="M 66 50 L 77 50 L 77 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className={item.accentColor}
                      />
                    </svg>
                  )}

                  <Icon
                    className={`relative z-10 w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 transition-transform ${item.accentColor} ${
                      item.isActive
                        ? "drop-shadow-[0_0_8px_currentColor] scale-110"
                        : ""
                    }`}
                  />

                  {item.shortLines ? (
                    <span className="relative z-10 font-tech text-[7px] sm:text-[8.5px] font-bold uppercase tracking-wider text-center leading-[1.05] flex flex-col items-center">
                      <span>{item.shortLines[0]}</span>
                      <span>{item.shortLines[1]}</span>
                    </span>
                  ) : (
                    <span className="relative z-10 font-tech text-[7.5px] sm:text-[9px] font-bold uppercase tracking-wider whitespace-nowrap leading-none">
                      {item.label}
                    </span>
                  )}

                  {/* Active Plasma Base Laser Bar */}
                  {item.isActive && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0.5 w-6 h-[2px] ${item.barColor}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* MOVIE-GRADE ALIEN HOLOGRAPHIC SECTOR MATRIX MODAL */}
      {currentSector && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-[#01040a]/86 backdrop-blur-lg animate-in fade-in duration-150 p-3 sm:p-4 font-mono"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className={`w-full max-w-2xl z-[75] mb-20 sm:mb-0 ${currentSector.glowShellClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <LiquidGlassSurface
              accent={currentSector.accent}
              variant="modal"
              shape="chamfered-lg"
              reticles={true}
              scanBeam={true}
              className="p-5 sm:p-6"
            >
              {/* Top Animated Plasma Conduit Rail */}
              <div
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-[2px] xeno-conduit-rail pointer-events-none"
              />

              {/* Holographic Matrix Header */}
              <div className="flex items-center justify-between gap-3 border-b border-[#00f5d4]/25 pb-4 mb-5">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rotating Alien Astrolabe Hex Emblem */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 48 48"
                      className="absolute inset-0 w-full h-full xeno-spin-slow"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        fill="none"
                        stroke={currentSector.headerRing}
                        strokeWidth="1.2"
                        strokeDasharray="10 6 4 6"
                        strokeOpacity="0.8"
                      />
                    </svg>
                    <div
                      className={`w-9 h-9 xeno-hex-pod bg-[#06182c] flex items-center justify-center ${currentSector.headerColor}`}
                    >
                      <currentSector.headerIcon className="w-4 h-4 drop-shadow-[0_0_8px_currentColor]" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3
                      className={`font-display text-sm sm:text-base font-black uppercase tracking-[0.14em] text-white ${
                        currentSector.id === "ai"
                          ? "xeno-neon-text-purple"
                          : "xeno-neon-text"
                      }`}
                    >
                      {currentSector.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-sans mt-0.5 truncate">
                      {currentSector.subtitle}
                    </p>
                  </div>
                </div>

                {/* Angular Chamfered Close Trigger */}
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  aria-label={currentSector.closeLabel}
                  className="xeno-cmd-btn w-10 h-10 flex items-center justify-center text-cyan-200 hover:text-white cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f5d4]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alien Holographic Command Module Grid (Zero Generic Rounded Cards!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[62vh] overflow-y-auto pr-0.5 no-scrollbar">
                {currentSector.items.map((card) => {
                  const Icon = card.icon;
                  const isCurrentTab = activeTab === card.tab;
                  return (
                    <button
                      key={card.tab}
                      type="button"
                      onClick={() => handleNavigate(card.tab)}
                      className={`xeno-clip-md relative p-4 bg-gradient-to-br from-[#061528]/92 via-[#040d1c]/95 to-[#061124]/95 hover:from-[#0a223f]/95 hover:to-[#081730]/95 border text-left transition-all duration-200 group flex items-start gap-3.5 cursor-pointer active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f5d4] overflow-hidden ${
                        isCurrentTab
                          ? "border-[#00f5d4]/85 shadow-[inset_0_0_24px_rgba(0,245,212,0.16)]"
                          : `border-[#00f5d4]/22 ${card.hoverBorder}`
                      }`}
                    >
                      {/* Subtle Laser Diagonal Corner Accent */}
                      <svg
                        aria-hidden="true"
                        className="absolute top-0 left-0 w-5 h-5 pointer-events-none opacity-75 group-hover:opacity-100 transition-opacity"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M 1 15 L 1 13 L 13 1 L 19 1"
                          stroke={card.ringStroke}
                          strokeWidth="1.6"
                        />
                      </svg>
                      <svg
                        aria-hidden="true"
                        className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none opacity-65 group-hover:opacity-100 transition-opacity"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M 19 5 L 19 7 L 7 19 L 1 19"
                          stroke={card.ringStroke}
                          strokeWidth="1.6"
                        />
                      </svg>

                      {/* Hexagonal Holographic Emitter Pod with Orbiting Targeting Ring */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0 mt-0.5">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 48 48"
                          className="absolute inset-0 w-full h-full opacity-55 group-hover:opacity-100 transition-opacity duration-300 group-hover:rotate-90"
                        >
                          <circle
                            cx="24"
                            cy="24"
                            r="22"
                            fill="none"
                            stroke={card.ringStroke}
                            strokeWidth="1.2"
                            strokeDasharray="8 6"
                          />
                        </svg>
                        <div
                          className={`w-9 h-9 xeno-hex-pod flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${card.hexBg}`}
                        >
                          <Icon className="w-4 h-4 drop-shadow-[0_0_6px_currentColor]" />
                        </div>
                      </div>

                      {/* Crisp High-Contrast Module Text */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] tracking-[0.18em] text-cyan-300/80 tabular-nums-strict">
                            {card.index}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${card.chevronColor}`}
                          />
                        </div>
                        <h4
                          className={`font-alien-hud font-bold text-xs sm:text-[13.5px] tracking-wide text-white transition-colors leading-snug ${card.hoverTitle}`}
                        >
                          {card.title}
                        </h4>
                        <p className="text-[11.5px] text-slate-300 font-sans leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </LiquidGlassSurface>
          </div>
        </div>
      )}
    </>
  );
};
