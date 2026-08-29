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
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { useMarketStore } from "../stores/marketStore";
import { getDataAgeText, isDataStale } from "../utils/timeUtils";

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
}) => {
  const { marketDataUpdatedAt, marketDataIsStale } = useMarketStore();
  const [timeStr, setTimeStr] = useState("");

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
    <header className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-black/95 border-b border-cyan-500/30 text-white transition-colors relative overflow-hidden">
      {/* Top Cyber Telemetry Bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 pt-1.5 pb-1 text-[10px] font-martian tracking-widest text-cyan-400/90 bg-black/60 border-b border-cyan-500/20 select-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 animate-ping inline-block" />
            <span className="font-zen text-[9px] text-cyan-300">SYS.QUANT-88</span>
            <span className="text-cyan-600">//</span>
            <span className="text-cyan-200">{timeStr || "19:42:01"}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Compact Market Data Status Indicator */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              if (onOpenDataStatus) onOpenDataStatus();
            }}
            className={`px-2 py-0.5 rounded border text-[9px] font-martian font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              dataStale
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30"
            }`}
            title="Click to view live data feeds and system sync health"
          >
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${dataStale ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span>{compactStatusText}</span>
          </button>

          <span className="hidden md:inline text-[9px] text-emerald-300 font-martian font-bold bg-emerald-500/20 px-2 py-0.5 border border-emerald-400/40 rounded">
            [QUANT-NODE: ONLINE]
          </span>
        </div>
      </div>

      {/* Main Brand & Actions Header */}
      <div className="px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar relative">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
          onClick={() => {
            triggerHaptic("selection");
            if (onSelectTab) onSelectTab("brand");
            else onOpenLinktree();
          }}
        >
          <StockBlocLogo
            size="md"
            showText={false}
            className="group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-zen text-sm sm:text-base tracking-widest text-cyan-100 uppercase group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                STOCK BLOC<span className="text-cyan-400 animate-pulse">.</span>
              </h1>
            </div>
            <p className="text-[9px] text-cyan-400/80 font-martian tracking-wider uppercase leading-none mt-0.5">
              QUANT WEALTH MATRIX
            </p>
          </div>
        </div>

        {/* Action Toolbar with Blocky Alien Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("web3_dot_btc");
            }}
            className="px-2.5 py-1.5 bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-cyan-200 border border-cyan-400/50 hover:bg-cyan-950/40 alien-block-cut-sm text-[11px] font-mono font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 glow-cyan"
            title="Web3 Vaults, Proof-of-Alpha Merkle Roots & x402 Micropayments (DOT & BTC)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">WEB3 (DOT/BTC)</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("community");
            }}
            className="px-2.5 py-1.5 bg-neutral-900 border border-cyan-400/60 alien-block-cut-sm text-cyan-300 hover:bg-cyan-950/40 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer glow-cyan shadow-sm"
            title="Community Hub, Clickable Trader Profiles & Live Market Chat"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px] font-black uppercase font-alien-hud">Community</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("my_bloc");
            }}
            className="px-2.5 py-1.5 bg-neutral-900 border border-amber-500/40 alien-block-cut-sm text-amber-300 hover:bg-amber-950/30 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="My Bloc Dashboard"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px] font-black uppercase">My Bloc</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("apple_watch");
            }}
            className="p-1.5 bg-neutral-900 border border-emerald-500/40 alien-block-cut-sm text-emerald-300 hover:bg-emerald-950/30 transition-all active:scale-90 cursor-pointer shrink-0"
            title="Apple Watch Companion Mode & Glance View"
          >
            <Watch className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenSearch();
            }}
            className="p-1.5 bg-neutral-900 border border-cyan-500/40 alien-block-cut-sm text-cyan-300 hover:bg-cyan-950/30 transition-all active:scale-90 cursor-pointer"
            title="Search Watchlist"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("youtube");
            }}
            className="px-2.5 py-1.5 bg-red-600/20 text-red-300 border border-red-500/50 hover:bg-red-950/40 alien-block-cut-sm text-[11px] font-mono font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Stock Bloc YouTube Channel Videos (@stockbloc)"
          >
            <Youtube className="w-3.5 h-3.5 text-red-400 fill-red-500/20" />
            <span className="hidden sm:inline">YOUTUBE VIDEOS</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              if (onSelectTab) onSelectTab("pricing");
            }}
            className="px-2.5 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-400/50 hover:bg-purple-950/40 alien-block-cut-sm text-[11px] font-mono font-black transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
            title="Books, Playbooks Trilogy & Store"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xs:inline">BOOKS & STORE</span>
          </button>

          {onOpenBloombergTerminal && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenBloombergTerminal();
              }}
              className="px-2.5 py-1.5 bg-amber-400 text-black border border-amber-300 hover:bg-amber-300 alien-block-cut-sm text-[11px] font-mono font-black transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-lg shadow-amber-400/20 shrink-0"
              title="Open SB Terminal Workstation (100% Free & Unlocked)"
            >
              <Terminal className="w-3.5 h-3.5 text-black animate-pulse" />
              <span>FREE TERMINAL</span>
            </button>
          )}

          {onToggleDayMode && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onToggleDayMode();
              }}
              className={`px-2 py-1.5 border alien-block-cut-sm text-[10px] font-mono font-black transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 ${
                isDayMode
                  ? "bg-slate-200 text-slate-800 border-slate-400 shadow-lg"
                  : "bg-neutral-900 text-slate-300 border-slate-500/40 hover:bg-slate-800"
              }`}
              title="Toggle Day Mode / System Theme"
            >
              <Contrast className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-bold">DAY MODE</span>
            </button>
          )}

          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenShare();
            }}
            className="p-1.5 bg-neutral-900 border border-cyan-500/40 alien-block-cut-sm text-cyan-300 hover:bg-cyan-950/30 transition-all active:scale-90 cursor-pointer shrink-0"
            title="Share App"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
