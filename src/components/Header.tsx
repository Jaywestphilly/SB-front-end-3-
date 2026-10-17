import React, { useState, useEffect } from "react";
import { StockBlocLogo } from "./StockBlocLogo";
import {
  Sparkles,
  ExternalLink,
  Search,
  Share2,
  Radio,
  Camera,
  Globe,
  Music,
  UserCheck,
  Terminal,
  Zap,
  DollarSign,
  Building2,
  ShieldCheck,
  Eye,
  Contrast,
  BookOpen,
  Youtube,
  Database,
  Watch,
  Users,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { useMarketStore } from "../stores/marketStore";
import { getDataAgeText, isDataStale } from "../utils/timeUtils";
import { AgentActivityCounter } from "./AgentActivityCounter";

import { ViewTab } from "../types";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAiAssistant: () => void;
  onOpenLinktree: () => void;
  onOpenShare: () => void;
  onOpenImageScanner?: () => void;
  onOpenGroundingSearch?: () => void;
  onOpenMusicPlayer?: () => void;
  onOpenAuth: () => void;
  onOpenBloombergTerminal?: () => void;
  onOpenProSubscription?: () => void;
  onOpenBrokerages?: () => void;
  onOpenDataStatus?: () => void;
  userPlan?: "free" | "pro" | "institutional";
  onSelectTab?: (tab: ViewTab) => void;
  isDayMode?: boolean;
  onToggleDayMode?: () => void;
  onOpenMissionHub?: () => void;
  compact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenAiAssistant,
  onOpenLinktree,
  onOpenShare,
  onOpenImageScanner,
  onOpenGroundingSearch,
  onOpenMusicPlayer,
  onOpenAuth,
  onOpenBloombergTerminal,
  onOpenProSubscription,
  onOpenBrokerages,
  onOpenDataStatus,
  userPlan = "pro",
  onSelectTab,
  isDayMode = false,
  onToggleDayMode,
  onOpenMissionHub,
  compact = false,
}) => {
  const { marketDataUpdatedAt, marketDataIsStale } = useMarketStore();
  const [timeStr, setTimeStr] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dataStale = marketDataIsStale || isDataStale(marketDataUpdatedAt);
  const dataAge = getDataAgeText(marketDataUpdatedAt);
  const compactStatusText = dataStale
    ? "Market data · STALE"
    : `Market data · updated ${dataAge.toLowerCase()}`;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full obsidian-glass-header text-white transition-all relative overflow-hidden">
      {/* Subtle Top Specular Cyan-Bronze Luminescence Line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

      {/* Unified Command Header Row */}
      <div className="max-w-[1800px] mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 relative">
        {/* Left: Brand Identity + Live Feed Health Pill */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("watchlist");
              else onOpenLinktree();
            }}
            title="Stock Bloc Quantitative Workstation"
          >
            <div className="relative">
              <StockBlocLogo
                size="md"
                showText={false}
                className="group-hover:scale-105 transition-transform duration-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#030712]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-zen text-sm sm:text-base tracking-widest text-cyan-50 uppercase group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  STOCK BLOC<span className="text-cyan-400 animate-pulse">.</span>
                </h1>
              </div>
              <p className="text-[9px] text-cyan-400/80 font-martian tracking-wider uppercase leading-none mt-0.5 flex items-center gap-1.5">
                <span>QUANT TERMINAL</span>
                {!compact && (
                  <>
                    <span className="text-cyan-600">•</span>
                    <span className="text-amber-300/90 tabular-telemetry">{timeStr || "LIVE"}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Live Data Status Pill & Agent Activity (Desktop/Tablet) */}
          {!compact && (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-cyan-500/20">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  if (onOpenDataStatus) onOpenDataStatus();
                }}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-martian font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  dataStale
                    ? "bg-amber-950/60 text-amber-300 border-amber-500/40 hover:border-amber-400/70"
                    : "bg-emerald-950/50 text-emerald-300 border-emerald-500/35 hover:border-emerald-400/70 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                }`}
                title="View live data feeds and system sync health"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block ${
                    dataStale ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"
                  }`}
                />
                <span className="tabular-telemetry">{compactStatusText}</span>
              </button>

              <div className="hidden xl:block">
                <AgentActivityCounter variant="compact" />
              </div>
            </div>
          )}
        </div>

        {/* Center: Interactive Command Search Trigger (⌘K) */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onOpenSearch();
            }}
            className="w-full px-3.5 py-1.5 rounded-xl obsidian-pill-btn text-left flex items-center justify-between gap-2 text-xs text-cyan-200/80 hover:text-white group cursor-pointer"
            title="Search tickers, sectors, 13F filings, or commands (⌘K)"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-mono text-[11px] text-slate-300 group-hover:text-cyan-100 truncate">
                Search tickers, SB Scores, or command matrix...
              </span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-martian font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 rounded shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Mobile Quick Actions & Hamburger (< 640px) */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onOpenSearch();
            }}
            className="p-2 rounded-lg obsidian-pill-btn text-cyan-300 flex items-center justify-center cursor-pointer"
            aria-label="Search Watchlist"
          >
            <Search className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              if (onOpenAiAssistant) onOpenAiAssistant();
            }}
            className="p-2 rounded-lg obsidian-pill-btn text-cyan-300 flex items-center justify-center cursor-pointer"
            aria-label="Open AI Copilot"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setIsMobileMenuOpen((prev) => !prev);
            }}
            className="p-2 rounded-lg obsidian-pill-btn text-cyan-300 flex items-center justify-center cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-cyan-400" />
            ) : (
              <Menu className="w-5 h-5 text-cyan-400" />
            )}
          </button>
        </div>

        {/* Right: Streamlined Global Workstation Utilities (>= 640px) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Search button on small tablets where center bar is hidden */}
          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenSearch();
            }}
            className="md:hidden p-2 rounded-lg obsidian-pill-btn text-cyan-300 hover:text-white cursor-pointer"
            title="Search Watchlist (⌘K)"
          >
            <Search className="w-4 h-4 text-cyan-400" />
          </button>

          {/* AI Market Copilot */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onOpenAiAssistant) onOpenAiAssistant();
            }}
            className="px-3 py-1.5 rounded-lg obsidian-pill-btn text-cyan-100 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0 border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.15)]"
            title="Launch AI Market Copilot Chat"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>COPILOT</span>
          </button>

          {/* The Bloc Membership Quick Link */}
          <a
            href="/bloc"
            onClick={(e) => {
              e.preventDefault();
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("bloc");
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-400/40 hover:to-blue-400/40 text-cyan-200 hover:text-white border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            title="The Bloc Membership - Weekly Filings & High Conviction Theses"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>THE BLOC</span>
          </a>

          {/* My Bloc Portfolio Shortcut */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("my_bloc");
            }}
            className="px-3 py-1.5 rounded-lg obsidian-pill-btn text-amber-200 hover:text-amber-100 border-amber-500/40 hover:border-amber-400/70 text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            title="My Bloc Saved Portfolio & Conviction Tracker"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>MY BLOC</span>
          </button>

          {/* SB Terminal Workstation */}
          {onOpenBloombergTerminal && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenBloombergTerminal();
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border border-amber-200 text-[11px] font-mono font-black transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0"
              title="Open SB Terminal Workstation (100% Free & Unlocked)"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-950" />
              <span>TERMINAL</span>
            </button>
          )}

          {/* Apple Watch Companion Glance View */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("apple_watch");
            }}
            className="p-1.5 rounded-lg obsidian-pill-btn text-emerald-300 hover:text-emerald-200 border-emerald-500/35 cursor-pointer shrink-0"
            title="Apple Watch Companion Mode & Glance View"
          >
            <Watch className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Day / Dark Theme Mode Toggle */}
          {onToggleDayMode && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onToggleDayMode();
              }}
              className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 ${
                isDayMode
                  ? "bg-slate-200 text-slate-900 border-slate-400 shadow-md"
                  : "obsidian-pill-btn text-slate-300 hover:text-white"
              }`}
              title="Toggle Day Mode / System Theme"
            >
              <Contrast className="w-4 h-4" />
            </button>
          )}

          {/* Share Workstation */}
          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenShare();
            }}
            className="p-1.5 rounded-lg obsidian-pill-btn text-cyan-300 hover:text-white cursor-pointer shrink-0"
            title="Share Stock Bloc Workstation"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Overflow Menu (< 640px) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-[#020b17]/98 border-t border-cyan-500/40 p-3 shadow-2xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-martian text-cyan-400 uppercase tracking-widest px-1 pb-1 border-b border-cyan-500/20 flex items-center justify-between">
            <span>COMMAND & NAVIGATION MATRIX</span>
            <span className="text-cyan-600">// MOBILE</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* THE BLOC - PRIMARY HIGHLIGHTED CALL TO ACTION */}
            <a
              href="/bloc"
              onClick={(e) => {
                e.preventDefault();
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("bloc");
              }}
              className="col-span-2 p-3 bg-gradient-to-r from-cyan-500/30 via-cyan-400/25 to-blue-500/30 text-white border-2 border-cyan-400 alien-block-cut-sm text-xs font-mono font-black flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer hover:bg-cyan-900/40"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span className="text-sm font-bold tracking-wider">THE BLOC (MEMBERSHIP)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-black uppercase">
                JOIN
              </span>
            </a>

            {/* DEVELOPERS ITEM (AGENTS, DEVELOPERS, DOCS) */}
            <a
              href="/developers"
              onClick={(e) => {
                e.preventDefault();
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("developers");
              }}
              className="col-span-2 p-2.5 bg-neutral-900/90 text-cyan-200 border border-cyan-400/50 alien-block-cut-sm text-xs font-mono font-bold flex items-center justify-between cursor-pointer hover:bg-neutral-800"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>DEVELOPERS (AGENTS, DEVELOPERS, DOCS)</span>
              </span>
              <span className="text-[9px] text-cyan-400/80 uppercase font-mono">EXPLORE &rarr;</span>
            </a>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onOpenAiAssistant) onOpenAiAssistant();
              }}
              className="p-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-400/60 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-cyan-950/40"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>COPILOT CHAT</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("compare");
              }}
              className="p-2.5 bg-neutral-900 text-cyan-300 border border-cyan-400/60 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>COMPARE</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("web3_dot_btc");
              }}
              className="p-2.5 bg-neutral-900 text-cyan-200 border border-cyan-400/50 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>WEB3 (DOT/BTC)</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("community");
              }}
              className="p-2.5 bg-neutral-900 text-cyan-300 border border-cyan-400/60 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>COMMUNITY</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("my_bloc");
              }}
              className="p-2.5 bg-neutral-900 text-amber-300 border border-amber-500/40 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>MY BLOC</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("pricing");
              }}
              className="p-2.5 bg-purple-500/20 text-purple-300 border border-purple-400/50 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-purple-950/40"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>BOOKS & STORE</span>
            </button>

            {onOpenBloombergTerminal && (
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setIsMobileMenuOpen(false);
                  onOpenBloombergTerminal();
                }}
                className="p-2.5 bg-amber-400 text-black border border-amber-300 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-amber-300"
              >
                <Terminal className="w-4 h-4 text-black" />
                <span>TERMINAL</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("youtube");
              }}
              className="p-2.5 bg-red-600/20 text-red-300 border border-red-500/50 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-red-950/40"
            >
              <Youtube className="w-4 h-4 text-red-400" />
              <span>YOUTUBE</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("apple_watch");
              }}
              className="p-2.5 bg-neutral-900 text-emerald-300 border border-emerald-500/40 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <Watch className="w-4 h-4 text-emerald-400" />
              <span>WATCH MODE</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setIsMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="p-2.5 bg-neutral-900 text-cyan-300 border border-cyan-500/40 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>SEARCH</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setIsMobileMenuOpen(false);
                onOpenShare();
              }}
              className="p-2.5 bg-neutral-900 text-cyan-300 border border-cyan-500/40 alien-block-cut-sm text-xs font-mono font-bold flex items-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>SHARE</span>
            </button>
          </div>

          {onOpenMissionHub && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                onOpenMissionHub();
              }}
              className="w-full p-2.5 bg-neutral-900 text-cyan-300 border border-cyan-400/40 alien-block-cut-sm text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-800"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>OPEN MISSION HUB & SPECS</span>
            </button>
          )}

          {onToggleDayMode && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onToggleDayMode();
              }}
              className={`w-full p-2 border alien-block-cut-sm text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer ${
                isDayMode
                  ? "bg-slate-200 text-slate-800 border-slate-400"
                  : "bg-neutral-900 text-slate-300 border-slate-500/40"
              }`}
            >
              <Contrast className="w-4 h-4" />
              <span>TOGGLE THEME ({isDayMode ? "DAY MODE" : "DARK MODE"})</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
