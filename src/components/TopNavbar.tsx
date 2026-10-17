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
  MessageSquare,
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
    { id: "ai_revolution", label: "AI Infrastructure & MS Heatmap", icon: BarChart3 },
    { id: "dyson_swarm", label: "Dyson Swarm Compute Hub", icon: Orbit },
    { id: "war_gov_ufo", label: "Defense Tech, Gov & Aerospace", icon: ShieldAlert },
    { id: "ai_insights", label: "Autonomous Agent Insights", icon: Cpu },
  ];

  const educationMenu = [
    { id: "youtube", label: "Stock Bloc YouTube Channel (@stockbloc)", icon: Youtube },
    { id: "terminal_guide", label: "Terminal Guide & Manual", icon: Terminal },
    { id: "mit_courses", label: "MIT & University Quant Courses", icon: GraduationCap },
    { id: "investopedia", label: "Investopedia Free Trading Sim", icon: Sparkles },
    { id: "small_business", label: "Small Business & QSBS Tax Hub", icon: Briefcase },
  ];

  const developersMenu = [
    { id: "developers", label: "Developers (x402 Portal)", icon: Terminal },
    { id: "agents", label: "Agents (Directory)", icon: Globe },
    { id: "developer_docs", label: "Docs (API & SDK Documentation)", icon: BookOpen },
    { id: "agent_feed", label: "Live Agent Activity Stream", icon: Radio },
    { id: "agent_join", label: "Register an Agent Node", icon: Sparkles },
    { id: "web3_dot_btc", label: "Web3 Alpha & Vaults (DOT / BTC)", icon: ShieldCheck },
    { id: "compare", label: "Compare vs Tavily & Twelve Data", icon: BarChart3 },
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
          className={`px-3 py-1.5 rounded-lg font-alien-hud text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none ${
            isActive
              ? "obsidian-pill-btn obsidian-pill-btn-active font-bold"
              : isOpen
                ? "obsidian-pill-btn text-white border-cyan-400/70"
                : "obsidian-pill-btn text-cyan-200/90 hover:text-white"
          }`}
        >
          <IconHeader
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? "text-slate-950" : "text-cyan-400"
            }`}
          />
          <span>{label}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${
              isOpen ? "rotate-180" : "opacity-70"
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 pt-1.5 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="obsidian-dropdown-glass rounded-xl p-1.5 overflow-hidden">
              {items.map((item) => {
                const Icon = item.icon;
                const itemActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerHaptic("selection");
                      setActiveDropdown(null);
                      onSelectTab(item.id as ViewTab);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left font-alien-hud text-[10px] flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      itemActive
                        ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 font-bold"
                        : "text-slate-200 hover:bg-cyan-500/15 hover:text-white border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          itemActive ? "text-cyan-300" : "text-cyan-400/80"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {itemActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const isMarketsActive = ["watchlist", "intelligence", "macro", "news"].includes(activeTab);
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
      className="hidden md:flex items-center justify-center px-4 py-2 obsidian-glass-nav overflow-visible font-martian text-xs select-none relative z-20"
      aria-label="Desktop Top Navigation"
    >
      <div className="max-w-[1800px] w-full flex items-center justify-center gap-2 flex-wrap">
        {/* 0. THE BLOC - PRIMARY HIGHLIGHTED CALL TO ACTION */}
        <a
          href="/bloc"
          onClick={(e) => {
            e.preventDefault();
            triggerHaptic("selection");
            onSelectTab("bloc");
          }}
          className={`px-3.5 py-1.5 rounded-lg font-alien-hud text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none transition-all ${
            activeTab === "bloc"
              ? "bg-cyan-400 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-200"
              : "bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-400/40 hover:to-blue-400/40 text-cyan-200 hover:text-white border border-cyan-400/70 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black"
          }`}
          title="The Bloc Membership - Weekly Filings, 13F & Alpha"
        >
          <Sparkles
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "bloc" ? "text-slate-950" : "text-cyan-300 animate-pulse"
            }`}
          />
          <span>THE BLOC</span>
          <span
            className={`text-[9px] px-1 py-0.5 rounded font-black uppercase tracking-wider ${
              activeTab === "bloc" ? "bg-slate-950 text-cyan-300" : "bg-cyan-400 text-slate-950"
            }`}
          >
            JOIN
          </span>
        </a>

        {/* 1. WATCHLIST & MARKETS */}
        {renderDropdown(
          "MARKETS & WATCHLIST",
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
          className={`px-3 py-1.5 rounded-lg font-alien-hud text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none ${
            activeTab === "real_estate"
              ? "bg-amber-400 text-slate-950 font-bold shadow-[0_0_18px_rgba(245,158,11,0.4)] border border-amber-200"
              : "obsidian-pill-btn text-amber-200/90 hover:text-amber-100 border-amber-500/30"
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
          className={`px-3 py-1.5 rounded-lg font-alien-hud text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none ${
            activeTab === "credit"
              ? "bg-emerald-400 text-slate-950 font-bold shadow-[0_0_18px_rgba(16,185,129,0.4)] border border-emerald-200"
              : "obsidian-pill-btn text-emerald-200/90 hover:text-emerald-100 border-emerald-500/30"
          }`}
        >
          <ShieldCheck
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "credit" ? "text-slate-950" : "text-emerald-400"
            }`}
          />
          <span>CREDIT</span>
        </button>

        {/* 6. EDUCATION & YOUTUBE */}
        {renderDropdown(
          "EDUCATION & VIDEO",
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
          className={`px-3 py-1.5 rounded-lg font-alien-hud text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none ${
            activeTab === "community"
              ? "obsidian-pill-btn obsidian-pill-btn-active font-bold"
              : "obsidian-pill-btn text-cyan-200/90 hover:text-white"
          }`}
          title="Community Alpha Theses, Profiles & Live Terminal Chat"
        >
          <Users
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "community" ? "text-slate-950" : "text-cyan-400"
            }`}
          />
          <span>COMMUNITY</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeTab === "community"
                ? "bg-slate-950"
                : "bg-emerald-400 animate-pulse"
            }`}
          />
        </button>

        {/* 8. BOOKS & STORE */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            onSelectTab("pricing");
          }}
          className={`px-3 py-1.5 rounded-lg font-alien-hud text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none ${
            activeTab === "pricing"
              ? "bg-purple-400 text-slate-950 font-bold shadow-[0_0_18px_rgba(168,85,247,0.4)] border border-purple-200"
              : "obsidian-pill-btn text-purple-200/90 hover:text-purple-100 border-purple-500/30"
          }`}
        >
          <BookOpen
            className={`w-3.5 h-3.5 shrink-0 ${
              activeTab === "pricing" ? "text-slate-950" : "text-purple-400"
            }`}
          />
          <span>STORE & BOOKS</span>
        </button>

        {/* 9. ABOUT & MISSION HUB */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            if (onOpenMissionHub) {
              onOpenMissionHub();
            } else {
              onSelectTab("brand");
            }
          }}
          className={`px-3 py-1.5 rounded-lg font-alien-hud text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none ${
            activeTab === "brand"
              ? "obsidian-pill-btn obsidian-pill-btn-active font-bold"
              : "obsidian-pill-btn text-cyan-200/90 hover:text-white"
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

