import React, { useState } from "react";
import { ViewTab } from "../types";
import {
  TrendingUp,
  Cpu,
  Building2,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  Terminal,
  BookOpen,
  Layers,
  Orbit,
  ShieldAlert,
  Sparkles,
  Briefcase,
  Radio,
  FileText,
  Youtube,
  Globe,
  BarChart3,
  Users,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface TopNavbarProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenTerminal?: () => void;
  onOpenMissionHub?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMissionHub,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const marketsMenu = [
    { id: "watchlist", label: "Live Watchlist Workstation", icon: TrendingUp },
    { id: "intelligence", label: "13F Hedge Fund & SEC Intel", icon: Layers },
    { id: "macro", label: "Macro Economic Briefings", icon: FileText },
    { id: "news", label: "Live Market News & Video Feed", icon: Radio },
  ];

  const aiMenu = [
    {
      id: "ai_revolution",
      label: "AI Infrastructure & MS Heatmap",
      icon: BarChart3,
    },
    { id: "dyson_swarm", label: "Dyson Swarm Compute Hub", icon: Orbit },
    {
      id: "war_gov_ufo",
      label: "Defense Tech, Gov & Aerospace",
      icon: ShieldAlert,
    },
    { id: "ai_insights", label: "Autonomous Agent Insights", icon: Cpu },
  ];

  const educationMenu = [
    {
      id: "youtube",
      label: "Stock Bloc YouTube Channel (@stockbloc)",
      icon: Youtube,
    },
    { id: "terminal_guide", label: "Terminal Guide & Manual", icon: Terminal },
    {
      id: "mit_courses",
      label: "MIT & University Quant Courses",
      icon: GraduationCap,
    },
    {
      id: "investopedia",
      label: "Investopedia Free Trading Sim",
      icon: Sparkles,
    },
    {
      id: "small_business",
      label: "Small Business & QSBS Tax Hub",
      icon: Briefcase,
    },
  ];

  const developersMenu = [
    { id: "developers", label: "Developers (x402 Portal)", icon: Terminal },
    { id: "agents", label: "Agents (Directory)", icon: Globe },
    {
      id: "developer_docs",
      label: "Docs (API & SDK Documentation)",
      icon: BookOpen,
    },
    { id: "agent_feed", label: "Live Agent Activity Stream", icon: Radio },
    { id: "agent_join", label: "Register an Agent Node", icon: Sparkles },
    {
      id: "web3_dot_btc",
      label: "Web3 Alpha & Vaults (DOT / BTC)",
      icon: ShieldCheck,
    },
    {
      id: "compare",
      label: "Compare vs Tavily & Twelve Data",
      icon: BarChart3,
    },
  ];

  const renderDropdown = (
    label: string,
    menuKey: string,
    IconHeader: React.ElementType,
    items: { id: string; label: string; icon: React.ElementType }[],
    isActive: boolean,
  ) => {
    const isOpen = activeDropdown === menuKey;
    return (
      <div
        className="relative group"
        onMouseEnter={() => setActiveDropdown(menuKey)}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <button
          onClick={() => {
            triggerHaptic("selection");
            if (items.length > 0) {
              onSelectTab(items[0].id as ViewTab);
            }
          }}
          className={`px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f5d4] ${
            isActive
              ? "xeno-cmd-btn xeno-cmd-btn-active font-black"
              : isOpen
                ? "xeno-cmd-btn text-white border-[#00f5d4]/80"
                : "xeno-cmd-btn text-cyan-100/90 hover:text-white"
          }`}
        >
          <IconHeader
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? "text-slate-950" : "text-[#00f5d4]"
            }`}
          />
          <span>{label}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#00f5d4]" : "opacity-75"
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 pt-2 min-w-[320px] w-max max-w-[380px] z-[50] animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="xeno-glow-shell">
              <div className="xeno-dropdown-tray p-2 overflow-hidden space-y-1 relative">
                {/* Animated Top Plasma Conduit */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-4 top-0 h-[1.5px] xeno-conduit-rail pointer-events-none"
                />
                {items.map((item, idx) => {
                  const Icon = item.icon;
                  const itemActive = activeTab === item.id;
                  const num = String(idx + 1).padStart(2, "0");
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        triggerHaptic("selection");
                        setActiveDropdown(null);
                        onSelectTab(item.id as ViewTab);
                      }}
                      className={`w-full px-3 py-2 xeno-clip-sm text-left font-mono text-[11.5px] flex items-center justify-between gap-3 transition-all cursor-pointer whitespace-nowrap group/item ${
                        itemActive
                          ? "bg-[#00f5d4]/18 text-[#00f5d4] border border-[#00f5d4]/55 font-bold"
                          : "text-slate-200 hover:bg-[#00f5d4]/12 hover:text-white border border-transparent hover:border-[#00f5d4]/30"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-[9.5px] text-cyan-400/75 tabular-nums-strict">
                          {num}
                        </span>
                        <span className="w-6 h-6 xeno-hex-pod bg-[#071b30] flex items-center justify-center shrink-0">
                          <Icon
                            className={`w-3 h-3 ${
                              itemActive ? "text-[#00f5d4]" : "text-cyan-300"
                            }`}
                          />
                        </span>
                        <span className="font-sans font-semibold text-xs">
                          {item.label}
                        </span>
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover/item:translate-x-0.5 ${
                          itemActive ? "text-[#00f5d4]" : "text-cyan-400/60"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isMarketsActive = [
    "watchlist",
    "intelligence",
    "macro",
    "news",
  ].includes(activeTab);
  const isAiActive = [
    "dyson_swarm",
    "war_gov_ufo",
    "ai_insights",
    "ai_revolution",
    "satellite_map",
  ].includes(activeTab);
  const isEducationActive = [
    "investopedia",
    "small_business",
    "youtube",
    "terminal_guide",
    "mit_courses",
  ].includes(activeTab);
  const isDevelopersActive = [
    "developers",
    "developer_docs",
    "agents",
    "agent_profile",
    "agent_feed",
    "agent_join",
    "agent_exchange",
    "developer_earnings",
    "web3_dot_btc",
    "compare",
  ].includes(activeTab);

  return (
    <nav
      className="hidden md:flex items-center justify-center px-3 py-2 liquid-glass-header border-t-0 overflow-visible font-martian text-xs select-none relative z-[30]"
      aria-label="Desktop Top Navigation"
    >
      <div className="max-w-[1800px] w-full flex items-center justify-center gap-1.5 flex-nowrap">
        {/* 0. THE BLOC - PRIMARY HIGHLIGHTED CALL TO ACTION */}
        <a
          href="/bloc"
          onClick={(e) => {
            e.preventDefault();
            triggerHaptic("selection");
            onSelectTab("bloc");
          }}
          className={`px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none transition-all ${
            activeTab === "bloc"
              ? "xeno-cmd-btn xeno-cmd-btn-active font-black"
              : "xeno-cmd-btn text-[#00f5d4] hover:text-white border-[#00f5d4]/60 font-bold"
          }`}
          title="The Bloc Membership - Weekly Filings, 13F & Alpha"
        >
          <Sparkles
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "bloc" ? "text-slate-950" : "text-[#00f5d4]"
            }`}
          />
          <span>THE BLOC</span>
        </a>

        {/* 1. WATCHLIST & MARKETS */}
        {renderDropdown(
          "MARKETS",
          "markets",
          TrendingUp,
          marketsMenu,
          isMarketsActive,
        )}

        {/* 2. AI & DEEP TECH */}
        {renderDropdown("AI & TECH", "ai", Cpu, aiMenu, isAiActive)}

        {/* 3. DEVELOPERS (AGENTS, DEVELOPERS, DOCS) */}
        {renderDropdown(
          "DEVELOPERS",
          "developers",
          Terminal,
          developersMenu,
          isDevelopersActive,
        )}

        {/* 4. REAL ESTATE */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            onSelectTab("real_estate");
          }}
          className={`px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none transition-all ${
            activeTab === "real_estate"
              ? "xeno-clip-sm bg-amber-400 text-slate-950 font-black shadow-[0_0_18px_rgba(245,158,11,0.5)] border border-amber-200"
              : "xeno-cmd-btn text-amber-200 hover:text-amber-100 border-amber-500/35"
          }`}
        >
          <Building2
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "real_estate" ? "text-slate-950" : "text-amber-400"
            }`}
          />
          <span>REAL ESTATE</span>
        </button>

        {/* 5. CREDIT */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            onSelectTab("credit");
          }}
          className={`px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none transition-all ${
            activeTab === "credit"
              ? "xeno-clip-sm bg-[#00ff9d] text-slate-950 font-black shadow-[0_0_18px_rgba(0,255,157,0.5)] border border-emerald-200"
              : "xeno-cmd-btn text-emerald-200 hover:text-emerald-100 border-emerald-500/35"
          }`}
        >
          <ShieldCheck
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "credit" ? "text-slate-950" : "text-[#00ff9d]"
            }`}
          />
          <span>CREDIT</span>
        </button>

        {/* 6. EDUCATION & YOUTUBE */}
        {renderDropdown(
          "EDUCATION",
          "education",
          GraduationCap,
          educationMenu,
          isEducationActive,
        )}

        {/* 7. COMMUNITY HUB */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            onSelectTab("community");
          }}
          className={`px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none transition-all ${
            activeTab === "community"
              ? "xeno-cmd-btn xeno-cmd-btn-active font-black"
              : "xeno-cmd-btn text-cyan-100/90 hover:text-white"
          }`}
          title="Community Alpha Theses, Profiles & Live Terminal Chat"
        >
          <Users
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "community" ? "text-slate-950" : "text-[#00f5d4]"
            }`}
          />
          <span>COMMUNITY</span>
        </button>

        {/* 8. BOOKS & STORE */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            onSelectTab("pricing");
          }}
          className={`px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none transition-all ${
            activeTab === "pricing"
              ? "xeno-clip-sm bg-[#a855f7] text-white font-black shadow-[0_0_18px_rgba(168,85,247,0.55)] border border-purple-200"
              : "xeno-cmd-btn text-purple-200 hover:text-purple-100 border-purple-500/40"
          }`}
        >
          <BookOpen
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "pricing" ? "text-white" : "text-[#c084fc]"
            }`}
          />
          <span>BOOKS</span>
        </button>

        {/* 9. SHOP (MERCH TEES) */}
        <a
          href="https://thestockbloc.myshopify.com/collections/all"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic("selection")}
          className="px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none xeno-cmd-btn text-cyan-100/90 hover:text-white transition-all"
          title="Stock Bloc Merch Tees - Shopify Store"
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-[#00f5d4]" />
          <span>SHOP</span>
        </a>

        {/* 10. ABOUT & MISSION HUB */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            if (onOpenMissionHub) {
              onOpenMissionHub();
            } else {
              onSelectTab("brand");
            }
          }}
          className={`px-3 py-1.5 font-alien-hud text-[10.5px] tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none transition-all ${
            activeTab === "brand"
              ? "xeno-cmd-btn xeno-cmd-btn-active font-black"
              : "xeno-cmd-btn text-cyan-100/90 hover:text-white"
          }`}
          title="About Stock Bloc, Mission Statement & Architecture"
        >
          <Sparkles
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "brand" ? "text-slate-950" : "text-amber-400"
            }`}
          />
          <span>ABOUT</span>
        </button>
      </div>
    </nav>
  );
};
