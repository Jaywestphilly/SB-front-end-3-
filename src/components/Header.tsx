import React, { useState, useEffect } from "react";
import { StockBlocLogo } from "./StockBlocLogo";
import {
  Sparkles,
  ExternalLink,
  Search,
  Share2,
  UserCheck,
  Terminal,
  Zap,
  ShieldCheck,
  Contrast,
  BookOpen,
  Youtube,
  Users,
  Menu,
  X,
  BarChart3,
  ShoppingBag,
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
  onOpenBloombergTerminal,
  onOpenDataStatus,
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
    <header className="sticky top-0 z-[40] w-full liquid-glass-header text-white transition-all relative overflow-hidden">
      {/* Animated Top Alien Plasma Conduit Line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] xeno-conduit-rail pointer-events-none"
      />

      {/* Unified Single-Row Starship Command Bridge */}
      <div className="max-w-[1800px] mx-auto px-3 sm:px-5 h-[60px] flex items-center justify-between gap-3 relative">
        {/* Left: Brand Identity + Live Data Freshness Readout */}
        <div className="flex items-center gap-3 min-w-0">
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
                className="group-hover:scale-105 transition-transform duration-200 drop-shadow-[0_0_12px_rgba(0,245,212,0.5)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-sm sm:text-base tracking-[0.16em] text-[#f2faff] uppercase group-hover:text-[#00f5d4] transition-colors flex items-center gap-1 leading-none xeno-neon-text">
                  STOCK BLOC<span className="text-[#00f5d4]">.</span>
                </h1>
              </div>
              <p className="text-[9px] text-[#00e5ff]/85 font-martian tracking-[0.16em] uppercase leading-none mt-1 flex items-center gap-1.5">
                <span>QUANT TERMINAL</span>
                {!compact && (
                  <>
                    <span className="text-cyan-600">·</span>
                    <span className="text-amber-300/90 tabular-nums-strict">
                      {timeStr || "LIVE"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Real Live Market Feed Status Control */}
          {!compact && (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#00f5d4]/25">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  if (onOpenDataStatus) onOpenDataStatus();
                }}
                className={`xeno-clip-sm px-2.5 py-1 border text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                  dataStale
                    ? "bg-amber-950/65 text-amber-300 border-amber-500/50 hover:border-amber-400"
                    : "bg-[#041d24]/80 text-[#00ff9d] border-[#00ff9d]/40 hover:border-[#00ff9d]/80 shadow-[0_0_16px_rgba(0,255,157,0.16)]"
                }`}
                title="View live data feeds and system sync health"
              >
                <span className="tabular-nums-strict">
                  {dataStale ? "FEED STALE" : `LIVE · ${dataAge.toUpperCase()}`}
                </span>
              </button>

              <div className="hidden 2xl:block">
                <AgentActivityCounter variant="compact" />
              </div>
            </div>
          )}
        </div>

        {/* Center: Chamfered Holographic Command Search Scanner (⌘K) */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onOpenSearch();
            }}
            className="w-full px-3.5 py-1.5 xeno-clip-sm bg-[#041122]/90 hover:bg-[#071c36]/95 border border-[#00f5d4]/30 hover:border-[#00f5d4]/75 text-left flex items-center justify-between gap-2 text-xs text-slate-200 hover:text-white group cursor-pointer transition-all shadow-[inset_0_0_16px_rgba(0,245,212,0.08)]"
            title="Search tickers, sectors, 13F filings, or commands (⌘K)"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#00f5d4] group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-mono text-[11px] text-slate-300 group-hover:text-cyan-50 truncate">
                Search tickers, SB Scores, or command matrix...
              </span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[9.5px] font-martian font-bold text-[#00f5d4] bg-[#020a15] border border-[#00f5d4]/45 shrink-0">
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
            className="p-2 xeno-cmd-btn text-[#00f5d4] flex items-center justify-center cursor-pointer"
            aria-label="Search Watchlist"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              if (onOpenAiAssistant) onOpenAiAssistant();
            }}
            className="p-2 xeno-cmd-btn text-[#c084fc] border-[#a855f7]/50 flex items-center justify-center cursor-pointer"
            aria-label="Open AI Copilot"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setIsMobileMenuOpen((prev) => !prev);
            }}
            className="p-2 xeno-cmd-btn text-[#00f5d4] flex items-center justify-center cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Right: Global Starship Workstation Actions (>= 640px) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenSearch();
            }}
            className="md:hidden p-2 xeno-cmd-btn text-[#00f5d4] hover:text-white cursor-pointer"
            title="Search Watchlist (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* AI Market Copilot */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onOpenAiAssistant) onOpenAiAssistant();
            }}
            className="px-3 py-1.5 xeno-cmd-btn text-cyan-100 hover:text-white text-[11px] font-alien-hud font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 border-[#00f5d4]/55"
            title="Launch AI Market Copilot Chat"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00f5d4]" />
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
            className="px-3 py-1.5 xeno-clip-sm bg-gradient-to-r from-[#00f5d4]/25 to-[#a855f7]/25 hover:from-[#00f5d4]/40 hover:to-[#a855f7]/40 text-cyan-100 hover:text-white border border-[#00f5d4]/65 shadow-[0_0_16px_rgba(0,245,212,0.22)] text-[11px] font-alien-hud font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
            title="The Bloc Membership - Weekly Filings & High Conviction Theses"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00f5d4]" />
            <span>THE BLOC</span>
          </a>

          {/* My Bloc Portfolio Shortcut */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("my_bloc");
            }}
            className="px-3 py-1.5 xeno-cmd-btn text-amber-200 hover:text-amber-100 border-amber-500/45 hover:border-amber-400/80 text-[11px] font-alien-hud font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
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
              className="px-3 py-1.5 xeno-clip-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border border-amber-200 text-[11px] font-alien-hud font-black tracking-wider transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.38)] shrink-0"
              title="Open SB Terminal Workstation (100% Free & Unlocked)"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-950" />
              <span>TERMINAL</span>
            </button>
          )}

          {/* Day / Dark Theme Mode Toggle */}
          {onToggleDayMode && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onToggleDayMode();
              }}
              className={`p-1.5 xeno-clip-sm border text-[10px] font-mono font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 ${
                isDayMode
                  ? "bg-slate-200 text-slate-900 border-slate-400 shadow-md"
                  : "xeno-cmd-btn text-slate-300 hover:text-white"
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
            className="p-1.5 xeno-cmd-btn text-[#00f5d4] hover:text-white cursor-pointer shrink-0"
            title="Share Stock Bloc Workstation"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alien Holographic Mobile Command Matrix Drawer (< 640px) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-[#020814]/98 border-t border-[#00f5d4]/45 p-3.5 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150 relative xeno-hex-grid">
          <div className="text-[10.5px] font-display text-[#00f5d4] uppercase tracking-[0.18em] px-1 pb-2 border-b border-[#00f5d4]/25 flex items-center justify-between xeno-neon-text">
            <span>COMMAND MATRIX</span>
            <span className="text-purple-300 font-mono text-[10px]">
              MOBILE DECK
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <a
              href="/bloc"
              onClick={(e) => {
                e.preventDefault();
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("bloc");
              }}
              className="col-span-2 p-3 xeno-clip-sm bg-gradient-to-r from-[#00f5d4]/28 via-[#00e5ff]/22 to-[#a855f7]/28 text-white border border-[#00f5d4]/75 text-xs font-alien-hud font-black flex items-center justify-between shadow-[0_0_20px_rgba(0,245,212,0.28)] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00f5d4]" />
                <span className="text-sm font-bold tracking-wider">
                  THE BLOC MEMBERSHIP
                </span>
              </span>
              <span className="text-[10px] px-2.5 py-0.5 xeno-clip-sm bg-[#00f5d4] text-slate-950 font-black uppercase">
                JOIN
              </span>
            </a>

            <a
              href="/developers"
              onClick={(e) => {
                e.preventDefault();
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("developers");
              }}
              className="col-span-2 p-2.5 xeno-cmd-btn text-cyan-100 text-xs font-alien-hud font-bold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00f5d4]" />
                <span>DEVELOPERS (AGENTS &amp; DOCS)</span>
              </span>
              <span className="text-[10px] text-[#00f5d4] uppercase font-mono">
                OPEN →
              </span>
            </a>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onOpenAiAssistant) onOpenAiAssistant();
              }}
              className="p-2.5 xeno-cmd-btn text-cyan-100 border-[#00f5d4]/50 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#00f5d4]" />
              <span>COPILOT</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("compare");
              }}
              className="p-2.5 xeno-cmd-btn text-cyan-100 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-[#00e5ff]" />
              <span>COMPARE</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("web3_dot_btc");
              }}
              className="p-2.5 xeno-cmd-btn text-cyan-100 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
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
              className="p-2.5 xeno-cmd-btn text-cyan-100 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#00f5d4]" />
              <span>COMMUNITY</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("my_bloc");
              }}
              className="p-2.5 xeno-cmd-btn text-amber-200 border-amber-500/45 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
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
              className="p-2.5 xeno-cmd-btn text-purple-200 border-[#a855f7]/50 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#c084fc]" />
              <span>BOOKS</span>
            </button>

            <a
              href="https://thestockbloc.myshopify.com/collections/all"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 xeno-cmd-btn text-cyan-100 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#00f5d4]" />
              <span>SHOP</span>
              <ExternalLink className="w-3 h-3 text-[#00f5d4]/80 ml-auto" />
            </a>

            {onOpenBloombergTerminal && (
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setIsMobileMenuOpen(false);
                  onOpenBloombergTerminal();
                }}
                className="p-2.5 xeno-clip-sm bg-amber-400 text-slate-950 border border-amber-200 text-xs font-alien-hud font-black flex items-center gap-2 cursor-pointer hover:bg-amber-300"
              >
                <Terminal className="w-4 h-4 text-slate-950" />
                <span>TERMINAL</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsMobileMenuOpen(false);
                if (onSelectTab) onSelectTab("youtube");
              }}
              className="p-2.5 xeno-cmd-btn text-rose-200 border-rose-500/50 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
            >
              <Youtube className="w-4 h-4 text-rose-400" />
              <span>YOUTUBE</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setIsMobileMenuOpen(false);
                onOpenShare();
              }}
              className="p-2.5 xeno-cmd-btn text-cyan-100 text-xs font-alien-hud font-bold flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#00f5d4]" />
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
              className="w-full p-2.5 xeno-cmd-btn text-cyan-200 text-xs font-alien-hud font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>OPEN MISSION HUB &amp; SPECS</span>
            </button>
          )}

          {onToggleDayMode && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onToggleDayMode();
              }}
              className={`w-full p-2 xeno-clip-sm border text-xs font-alien-hud font-bold flex items-center justify-center gap-2 cursor-pointer ${
                isDayMode
                  ? "bg-slate-200 text-slate-900 border-slate-400"
                  : "xeno-cmd-btn text-slate-200"
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
