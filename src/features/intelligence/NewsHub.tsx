import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Youtube,
  Bookmark,
  Sparkles,
  Search,
  Filter,
  X,
  Radio,
  AlertTriangle,
  Users,
  Landmark,
  Rocket,
  Zap,
  List,
  LayoutGrid,
  TrendingUp,
  Cpu,
  BookmarkCheck,
  RotateCcw,
  ArrowDownUp,
  Clock,
  Flame,
  Star,
  Eye,
  Volume2,
} from "lucide-react";
import { YouTubeVideo } from "../../types";
import { triggerHaptic } from "../../utils/haptics";
import { getStoredYouTubeVideos, syncYouTubeFeeds, formatTimeSinceSync } from "../../utils/youtubeSync";
import { useMarketStore } from "../../stores/marketStore";
import {
  UnifiedFeedItem,
  FeedSortOption,
  normalizeAndUnifyFeed,
  sortUnifiedFeed,
} from "./newsUtils";
import { NewsItemWireRow, NewsItemDossierCard } from "./NewsItemCards";

export type CatalystType = "BREAKING" | "MACRO_FOMC" | "WHALE_13F" | "ORBITAL_TECH";

export interface CatalystBadgeConfig {
  id: CatalystType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
}

// 1. SMART TICKER TAGGER REGEX & COMPONENT
export const renderTextWithTickers = (
  text: string,
  onTickerClick: (symbol: string) => void
): React.ReactNode => {
  if (!text) return null;
  const tickerRegex = /\$([A-Z]{1,6})\b/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tickerRegex.exec(text)) !== null) {
    const preText = text.substring(lastIndex, match.index);
    if (preText) {
      parts.push(preText);
    }
    const symbol = match[1];
    parts.push(
      <button
        key={`ticker-${match.index}-${symbol}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTickerClick(symbol);
        }}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-cyan-950/90 hover:bg-cyan-400 text-cyan-300 hover:text-black border border-cyan-500/40 hover:border-cyan-400 font-mono font-black text-[10px] tracking-tight transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)] align-baseline active:scale-95 z-10"
        title={`Inspect $${symbol} fundamentals & technical metrics`}
      >
        <span>${symbol}</span>
      </button>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

// 2. CATALYST & URGENCY CLASSIFIER
export const getCatalystBadges = (item: {
  title?: string;
  description?: string;
  summary?: string;
  channel_name?: string;
  channelName?: string;
  keyTakeaways?: string[];
}): CatalystBadgeConfig[] => {
  const text = `${item.title || ""} ${item.description || ""} ${item.summary || ""} ${
    item.keyTakeaways ? item.keyTakeaways.join(" ") : ""
  }`.toLowerCase();
  const badges: CatalystBadgeConfig[] = [];

  // BREAKING CATALYST
  if (
    text.includes("breaking") ||
    text.includes("urgent") ||
    text.includes("alert") ||
    text.includes("surprise") ||
    text.includes("fda") ||
    text.includes("earnings") ||
    text.includes("unveiled") ||
    text.includes("halts") ||
    text.includes("guidance") ||
    text.includes("catalyst") ||
    text.includes("disclosed")
  ) {
    badges.push({
      id: "BREAKING",
      label: "BREAKING CATALYST",
      shortLabel: "BREAKING",
      icon: Zap,
      colorClass: "text-amber-300",
      bgClass: "bg-amber-950/70",
      borderClass: "border-amber-500/50",
      dotClass: "bg-amber-400 animate-ping",
    });
  }

  // MACRO / FOMC
  if (
    text.includes("fed ") ||
    text.includes("fomc") ||
    text.includes("powell") ||
    text.includes("rate cut") ||
    text.includes("rate hike") ||
    text.includes("interest rate") ||
    text.includes("cpi") ||
    text.includes("pce") ||
    text.includes("inflation") ||
    text.includes("treasury") ||
    text.includes("yield") ||
    text.includes("liquidity") ||
    text.includes("macro") ||
    text.includes("gdp") ||
    text.includes("recession") ||
    text.includes("debt ceiling")
  ) {
    badges.push({
      id: "MACRO_FOMC",
      label: "MACRO / FOMC",
      shortLabel: "MACRO",
      icon: Landmark,
      colorClass: "text-indigo-300",
      bgClass: "bg-indigo-950/70",
      borderClass: "border-indigo-500/50",
      dotClass: "bg-indigo-400 animate-pulse",
    });
  }

  // 13F / INSIDER FLOW
  if (
    text.includes("13f") ||
    text.includes("hedge fund") ||
    text.includes("berkshire") ||
    text.includes("buffett") ||
    text.includes("tepper") ||
    text.includes("appaloosa") ||
    text.includes("insider") ||
    text.includes("form 4") ||
    text.includes("whale") ||
    text.includes("accumulation") ||
    text.includes("institutional") ||
    text.includes("portfolio") ||
    text.includes("druckenmiller") ||
    text.includes("pershing")
  ) {
    badges.push({
      id: "WHALE_13F",
      label: "13F / INSIDER FLOW",
      shortLabel: "13F WHALE",
      icon: Users,
      colorClass: "text-emerald-300",
      bgClass: "bg-emerald-950/70",
      borderClass: "border-emerald-500/50",
      dotClass: "bg-emerald-400 animate-pulse",
    });
  }

  // ORBITAL / DEEP TECH
  if (
    text.includes("spacex") ||
    text.includes("starlink") ||
    text.includes("orbital") ||
    text.includes("satellite") ||
    text.includes("dyson") ||
    text.includes("computronium") ||
    text.includes("fusion") ||
    text.includes("supercomputer") ||
    text.includes("quantum") ||
    text.includes("qubit") ||
    text.includes("rocket")
  ) {
    badges.push({
      id: "ORBITAL_TECH",
      label: "ORBITAL / DEEP TECH",
      shortLabel: "ORBITAL",
      icon: Rocket,
      colorClass: "text-purple-300",
      bgClass: "bg-purple-950/70",
      borderClass: "border-purple-500/50",
      dotClass: "bg-purple-400 animate-pulse",
    });
  }

  return badges;
};

// 3. CROSS-MODULE CONTEXT JUMPERS INSPECTOR
export const getContextJumpers = (item: {
  title?: string;
  description?: string;
  summary?: string;
}): Array<{ label: string; tab: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }> => {
  const text = `${item.title || ""} ${item.description || ""} ${item.summary || ""}`.toLowerCase();
  const jumpers: Array<{ label: string; tab: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }> = [];

  if (
    text.includes("13f") ||
    text.includes("buffett") ||
    text.includes("berkshire") ||
    text.includes("whale") ||
    text.includes("hedge fund")
  ) {
    jumpers.push({
      label: "Whale Consensus Matrix",
      tab: "intelligence",
      icon: Users,
      colorClass: "bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500 hover:text-black",
    });
  }

  if (
    text.includes("fed") ||
    text.includes("fomc") ||
    text.includes("inflation") ||
    text.includes("yield") ||
    text.includes("cpi") ||
    text.includes("liquidity")
  ) {
    jumpers.push({
      label: "Macro Economic Briefing",
      tab: "macro",
      icon: Landmark,
      colorClass: "bg-indigo-950/50 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500 hover:text-white",
    });
  }

  if (
    text.includes("spacex") ||
    text.includes("starlink") ||
    text.includes("orbital") ||
    text.includes("satellite") ||
    text.includes("dyson") ||
    text.includes("computronium")
  ) {
    jumpers.push({
      label: "SpaceX Orbital & Dyson Dossier",
      tab: "dyson_swarm",
      icon: Rocket,
      colorClass: "bg-purple-950/50 text-purple-300 border-purple-500/40 hover:bg-purple-500 hover:text-white",
    });
  }

  if (
    text.includes("blackwell") ||
    text.includes("gpu") ||
    text.includes("datacenter") ||
    text.includes("semiconductor") ||
    text.includes("foundry") ||
    text.includes("ai infra")
  ) {
    jumpers.push({
      label: "AI Revolution Infrastructure",
      tab: "ai_revolution",
      icon: Cpu,
      colorClass: "bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500 hover:text-black",
    });
  }

  return jumpers;
};

// Sector Categorizer Helper
export const getItemTags = (item: {
  title?: string;
  description?: string;
  summary?: string;
  keyTakeaways?: string[];
}): string[] => {
  const tags: string[] = [];
  const text = `${item.title || ""} ${item.description || ""} ${item.summary || ""} ${
    item.keyTakeaways ? item.keyTakeaways.join(" ") : ""
  }`.toLowerCase();

  if (
    text.includes("ai ") ||
    text.includes(" ai") ||
    text.includes("artificial intelligence") ||
    text.includes("computronium") ||
    text.includes("gpu") ||
    text.includes("semiconductor") ||
    text.includes("foundries") ||
    text.includes("foundry") ||
    text.includes("hbm") ||
    text.includes("blackwell") ||
    text.includes("neural") ||
    text.includes("agents") ||
    text.includes("agentic")
  ) {
    tags.push("AI");
  }

  if (
    text.includes("biotech") ||
    text.includes("biology") ||
    text.includes("longevity") ||
    text.includes("gene") ||
    text.includes("crispr") ||
    text.includes("addiction") ||
    text.includes("drug") ||
    text.includes("medicine") ||
    text.includes("clinical") ||
    text.includes("health")
  ) {
    tags.push("Biotech");
  }

  if (
    text.includes("robot") ||
    text.includes("robotics") ||
    text.includes("optimus") ||
    text.includes("humanoid") ||
    text.includes("automation") ||
    text.includes("drone")
  ) {
    tags.push("Robotics");
  }

  if (
    text.includes("self-driving") ||
    text.includes("autonomous") ||
    text.includes("robotaxi") ||
    text.includes("driving") ||
    text.includes("fleet") ||
    text.includes("fsd") ||
    text.includes("uber") ||
    text.includes("vehicle")
  ) {
    tags.push("Self-Driving");
  }

  if (
    text.includes("space") ||
    text.includes("orbital") ||
    text.includes("satellite") ||
    text.includes("starlink") ||
    text.includes("rocket")
  ) {
    tags.push("Space");
  }

  if (
    text.includes("quantum") ||
    text.includes("qubit") ||
    text.includes("annealing") ||
    text.includes("d-wave")
  ) {
    tags.push("Quantum");
  }

  return tags;
};

interface NewsHubProps {
  onNavigateTab?: (tab: string) => void;
}

export const NewsHub: React.FC<NewsHubProps> = ({ onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState<"ALL" | "YOUTUBE" | "NEWS_VIDEOS" | "BOOKMARKS">("ALL");
  const [sortOption, setSortOption] = useState<FeedSortOption>("NEWEST");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeCatalystFilter, setActiveCatalystFilter] = useState<CatalystType | null>(null);
  const [viewMode, setViewMode] = useState<"FULL" | "COMPACT">("FULL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideoModal, setActiveVideoModal] = useState<UnifiedFeedItem | null>(null);
  const [feedVideos, setFeedVideos] = useState<YouTubeVideo[]>(() => getStoredYouTubeVideos());
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(0);
  const [intelFeed, setIntelFeed] = useState<any[]>([]);

  // 6. AUDIO BRIEFING (TTS) STATE
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechStatus, setSpeechStatus] = useState<"idle" | "playing" | "paused">("idle");
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleToggleAudioBriefing = (item: UnifiedFeedItem) => {
    triggerHaptic("selection");
    if (!synthRef.current) return;

    const id = item.youtubeId || item.id;

    if (speakingId === id && speechStatus === "playing") {
      synthRef.current.pause();
      setSpeechStatus("paused");
      return;
    }

    if (speakingId === id && speechStatus === "paused") {
      synthRef.current.resume();
      setSpeechStatus("playing");
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Prepare speech script
    let script = `Intelligence briefing from ${item.channelName || "Stock Bloc"}. ${item.title}. `;
    if (item.keyTakeaways && item.keyTakeaways.length > 0) {
      script += `Key market takeaways: ${item.keyTakeaways.join(". ")}. `;
    } else if (item.description) {
      script += `Summary: ${item.description.slice(0, 300)}. `;
    }

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = synthRef.current.getVoices();
    const naturalVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => {
      setSpeakingId(null);
      setSpeechStatus("idle");
    };

    utterance.onerror = () => {
      setSpeakingId(null);
      setSpeechStatus("idle");
    };

    synthRef.current.speak(utterance);
    setSpeakingId(id);
    setSpeechStatus("playing");
  };

  // BOOKMARKS VAULT STATE
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("stock_bloc_bookmarked_news");
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string) => {
    triggerHaptic("selection");
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("stock_bloc_bookmarked_news", JSON.stringify(next));
        }
      } catch (err) {
        console.warn("Could not save bookmarks:", err);
      }
      return next;
    });
  };

  const clearAllBookmarks = () => {
    triggerHaptic("medium");
    setBookmarkedIds([]);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("stock_bloc_bookmarked_news");
      }
    } catch (err) {
      console.warn("Could not clear bookmarks:", err);
    }
  };

  const stocks = useMarketStore((s) => s.stocks);
  const setSelectedStock = useMarketStore((s) => s.setSelectedStock);

  // Deep Link Ticker Click Handler
  const handleTickerClick = (tickerSymbol: string) => {
    triggerHaptic("selection");
    const raw = tickerSymbol.replace("$", "").toUpperCase();
    const found = stocks.find((s) => s.symbol.toUpperCase() === raw);
    if (found) {
      setSelectedStock(found);
    }
    if (onNavigateTab) {
      onNavigateTab("watchlist");
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  // Initial feed loading
  useEffect(() => {
    if (typeof window === "undefined") return;

    fetch("/api/data/news")
      .then((res) => {
        if (!res.ok) return fetch("/intel_news_feed.json");
        return res;
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.intel_feed && Array.isArray(data.intel_feed)) {
          setIntelFeed(data.intel_feed);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch intel news feed, using fallback:", err);
        fetch("/intel_news_feed.json")
          .then((res) => res.json())
          .then((data) => {
            if (data.intel_feed && Array.isArray(data.intel_feed)) {
              setIntelFeed(data.intel_feed);
            }
          })
          .catch(console.error);
      });
  }, []);

  // Sync background feed
  useEffect(() => {
    if (typeof window === "undefined") return;

    syncYouTubeFeeds(false).then((res) => {
      if (res.videos && res.videos.length > 0) {
        setFeedVideos(res.videos);
      }
      if (res.syncedAt) {
        setLastSyncedAt(res.syncedAt);
      }
    });
  }, []);

  // Unified stream (deduplicated & normalized)
  const unifiedStream = useMemo(() => {
    return normalizeAndUnifyFeed(intelFeed, feedVideos);
  }, [intelFeed, feedVideos]);

  // Counts
  const stockBlocVideosCount = unifiedStream.filter((v) => v.isStockBloc).length;
  const newsVideosCount = unifiedStream.filter((v) => !v.isStockBloc).length;

  // Filtered and sorted feed (Single source of truth)
  const filteredAndSortedFeed = useMemo(() => {
    const filtered = unifiedStream.filter((item) => {
      const itemId = item.youtubeId || item.id;

      // Bookmark filter
      if (activeTab === "BOOKMARKS" && !bookmarkedIds.includes(itemId) && !bookmarkedIds.includes(item.id)) {
        return false;
      }

      // Catalyst filter
      if (activeCatalystFilter) {
        const catalysts = getCatalystBadges(item);
        if (!catalysts.some((c) => c.id === activeCatalystFilter)) return false;
      }

      // Sector filter
      if (activeTags.length > 0) {
        const tags = getItemTags(item);
        const hasMatch = activeTags.some((t) => tags.includes(t));
        if (!hasMatch) return false;
      }

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.channelName.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (activeTab === "YOUTUBE") return item.isStockBloc;
      if (activeTab === "NEWS_VIDEOS") return !item.isStockBloc;
      return true; // ALL or BOOKMARKS
    });

    return sortUnifiedFeed(filtered, sortOption);
  }, [unifiedStream, activeTab, bookmarkedIds, activeCatalystFilter, activeTags, searchQuery, sortOption]);

  const totalResultsCount = filteredAndSortedFeed.length;

  return (
    <div className="w-full flex flex-col gap-5 font-mono text-neutral-300 p-3 sm:p-5 pb-32 max-w-4xl mx-auto relative z-10 select-none">
      {/* HEADER BANNER */}
      <div className="bg-[#020b14]/95 border-2 border-cyan-500/50 p-5 rounded-2xl alien-block-cut shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
        {/* Ambient glow backdrop */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 bg-black border border-cyan-400 text-cyan-300 text-[10px] font-black rounded tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                LIVE UNIFIED STREAM
              </span>
              <a
                href="https://www.youtube.com/@stockbloc"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-black rounded tracking-widest flex items-center gap-1 hover:border-rose-400 transition-colors"
              >
                <Youtube className="w-3 h-3 text-rose-400" />
                @stockbloc
              </a>
              <a
                href="https://x.com/TheStockBloc"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-black rounded tracking-widest flex items-center gap-1 hover:border-cyan-400 transition-colors"
              >
                <span className="font-bold">𝕏</span>
                @TheStockBloc
              </a>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 uppercase">
              <span className="text-rose-400 flex items-center gap-1">YouTube</span>
              <span className="text-cyan-400">&</span>
              <span className="text-white">Intel Feed</span>
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl relative z-10">
          Real-time institutional intelligence dispatches, Stock Bloc YouTube video breakdowns, frontier science dispatches, and deep-linked ticker catalysts.
        </p>

        {/* CHANNEL STATS BAR */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold text-neutral-400">
          <a
            href="https://www.youtube.com/@stockbloc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-black/60 rounded-lg border border-neutral-800 hover:border-rose-500/40 transition-colors group"
          >
            <Youtube className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-white block leading-none">Stock Bloc YT</span>
              <span className="text-[9px] text-neutral-500">Official Channel</span>
            </div>
          </a>

          <a
            href="https://x.com/TheStockBloc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-black/60 rounded-lg border border-neutral-800 hover:border-cyan-500/40 transition-colors group"
          >
            <span className="font-black text-white text-sm group-hover:scale-110 transition-transform">𝕏</span>
            <div>
              <span className="text-white block leading-none">@TheStockBloc</span>
              <span className="text-[9px] text-neutral-500">Official 𝕏 Feed</span>
            </div>
          </a>

          <div className="flex items-center gap-2 p-2 bg-black/60 rounded-lg border border-neutral-800">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <span className="text-emerald-300 block leading-none">{formatTimeSinceSync(lastSyncedAt)}</span>
              <span className="text-[9px] text-neutral-500">Auto-Synced 5 AM</span>
            </div>
          </div>

          <a
            href="https://x.com/JayWestPhilly"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-black/60 rounded-lg border border-neutral-800 hover:border-amber-500/40 transition-colors group"
          >
            <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-amber-300 block leading-none">@JayWestPhilly</span>
              <span className="text-[9px] text-neutral-500">Macro Analyst</span>
            </div>
          </a>
        </div>
      </div>

      {/* FILTER TABS, VIEW MODE & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#020912]/90 border border-neutral-800 p-2.5 rounded-xl">
        {/* Feed Source Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("ALL");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/30"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ALL FEEDS ({totalResultsCount})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("YOUTUBE");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "YOUTUBE"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                : "text-neutral-400 hover:text-rose-400 hover:bg-neutral-900"
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>STOCK BLOC YT ({stockBlocVideosCount})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("NEWS_VIDEOS");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "NEWS_VIDEOS"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                : "text-neutral-400 hover:text-purple-300 hover:bg-neutral-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>DISPATCHES ({newsVideosCount})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("BOOKMARKS");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "BOOKMARKS"
                ? "bg-amber-400 text-black shadow-md shadow-amber-400/30"
                : "text-neutral-400 hover:text-amber-300 hover:bg-neutral-900"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>SAVED ({bookmarkedIds.length})</span>
          </button>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-2 justify-between md:justify-end">
          {/* VIEW MODE TOGGLE (FULL DOSSIER vs TERMINAL WIRE) */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setViewMode("FULL");
              }}
              className={`px-2 py-1 rounded text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "FULL" ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow" : "text-neutral-500 hover:text-white"
              }`}
              title="Full Dossier Mode: Rich cards with video players and takeaways"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dossier</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setViewMode("COMPACT");
              }}
              className={`px-2 py-1 rounded text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "COMPACT" ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow" : "text-neutral-500 hover:text-white"
              }`}
              title="Terminal Wire Mode: Compact high-density feed"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wire</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feed, $NVDA, fed..."
              className="w-full bg-black/80 border border-neutral-800 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-1.5 text-xs text-cyan-200 placeholder-neutral-600 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SORTING CONTROLS & TAG FILTERS BAR */}
      <div className="bg-[#020912]/60 border border-neutral-900 p-3 rounded-xl flex flex-col gap-2.5">
        {/* Sorting Mechanism Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-neutral-900/80">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1 mr-1">
            <ArrowDownUp className="w-3 h-3 text-cyan-400" />
            Feed Sort:
          </span>

          {[
            { id: "NEWEST" as FeedSortOption, label: "Newest First", icon: Clock },
            { id: "OLDEST" as FeedSortOption, label: "Oldest First", icon: Clock },
            { id: "CATALYSTS" as FeedSortOption, label: "Catalysts & Breaking", icon: Flame },
            { id: "OFFICIAL" as FeedSortOption, label: "Stock Bloc Official", icon: Star },
            { id: "POPULAR" as FeedSortOption, label: "Most Viewed", icon: Eye },
          ].map((s) => {
            const isActive = sortOption === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setSortOption(s.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-cyan-400 text-black border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                    : "bg-black/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sector Tag Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-neutral-600" />
            Sectors:
          </span>
          {[
            { name: "AI", colorClass: "border-cyan-500/20 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-500/40", activeClass: "bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]" },
            { name: "Biotech", colorClass: "border-emerald-500/20 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500/40", activeClass: "bg-emerald-400 text-black border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" },
            { name: "Robotics", colorClass: "border-purple-500/20 text-purple-400 bg-purple-950/20 hover:bg-purple-950/40 hover:border-purple-500/40", activeClass: "bg-purple-400 text-white border-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.3)]" },
            { name: "Self-Driving", colorClass: "border-amber-500/20 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-500/40", activeClass: "bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" },
            { name: "Space", colorClass: "border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-950/20 hover:bg-fuchsia-950/40 hover:border-fuchsia-500/40", activeClass: "bg-fuchsia-400 text-black border-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.3)]" },
            { name: "Quantum", colorClass: "border-blue-500/20 text-blue-400 bg-blue-950/20 hover:bg-blue-950/40 hover:border-blue-500/40", activeClass: "bg-blue-400 text-white border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]" },
          ].map((sec) => {
            const isActive = activeTags.includes(sec.name);
            return (
              <button
                key={sec.name}
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveTags((prev) => (prev.includes(sec.name) ? prev.filter((t) => t !== sec.name) : [...prev, sec.name]));
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                  isActive ? sec.activeClass : sec.colorClass
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-current animate-pulse" : "bg-neutral-600"}`} />
                {sec.name}
              </button>
            );
          })}
        </div>

        {/* CATALYST / EVENT TYPE BADGE SELECTOR */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-900/80">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Catalysts:
          </span>
          {[
            { id: "BREAKING" as CatalystType, label: "⚡ Breaking Catalyst", activeClass: "bg-amber-400 text-black border-amber-400", defaultClass: "bg-amber-950/20 border-amber-500/20 text-amber-400 hover:border-amber-500/40" },
            { id: "MACRO_FOMC" as CatalystType, label: "🏛️ Macro / FOMC", activeClass: "bg-indigo-400 text-black border-indigo-400", defaultClass: "bg-indigo-950/20 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40" },
            { id: "WHALE_13F" as CatalystType, label: "🐋 13F / Whale Flow", activeClass: "bg-emerald-400 text-black border-emerald-400", defaultClass: "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40" },
            { id: "ORBITAL_TECH" as CatalystType, label: "🚀 Orbital / Deep Tech", activeClass: "bg-purple-400 text-white border-purple-400", defaultClass: "bg-purple-950/20 border-purple-500/20 text-purple-400 hover:border-purple-500/40" },
          ].map((cat) => {
            const isActive = activeCatalystFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveCatalystFilter(isActive ? null : cat.id);
                }}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                  isActive ? cat.activeClass : cat.defaultClass
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          {(activeTags.length > 0 || activeCatalystFilter || searchQuery || sortOption !== "NEWEST") && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                setActiveTags([]);
                setActiveCatalystFilter(null);
                setSearchQuery("");
                setSortOption("NEWEST");
              }}
              className="text-[9px] font-black tracking-wider uppercase text-cyan-400 hover:text-cyan-300 ml-auto px-2 py-0.5 hover:bg-neutral-900 rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Reset all</span>
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* FEED STREAM CONTAINER */}
      <div className="space-y-4">
        {/* BOOKMARKS EMPTY STATE */}
        {activeTab === "BOOKMARKS" && totalResultsCount === 0 && (
          <div className="p-10 text-center border border-amber-500/20 bg-[#0a0802]/90 rounded-2xl space-y-3 shadow-xl">
            <Bookmark className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">No Saved Dispatches Yet</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              Click the bookmark icon on any dispatch card or wire row to save items offline into your personal reading vault.
            </p>
            <button
              onClick={() => setActiveTab("ALL")}
              className="px-4 py-2 bg-amber-400 text-black font-black text-xs rounded-lg hover:bg-amber-300 transition-colors shadow-md cursor-pointer"
            >
              Explore Live Feed
            </button>
          </div>
        )}

        {/* BOOKMARKS ACTION HEADER */}
        {activeTab === "BOOKMARKS" && totalResultsCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
              <span className="font-black uppercase tracking-wider">
                Saved Bookmarks Vault ({bookmarkedIds.length} items)
              </span>
            </div>
            <button
              onClick={clearAllBookmarks}
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
            >
              Clear All Saved
            </button>
          </div>
        )}

        {/* COMPACT TERMINAL WIRE MODE */}
        {viewMode === "COMPACT" ? (
          <div className="bg-[#020912]/90 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800/80 shadow-2xl">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-black/60 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800">
              <div className="col-span-3 sm:col-span-2">Source / Cat</div>
              <div className="col-span-7 sm:col-span-8">Dispatch & Tickers</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Unified Feed Rows in Wire Mode */}
            {filteredAndSortedFeed.map((item) => {
              const itemId = item.youtubeId || item.id;
              const catalystBadges = getCatalystBadges(item);
              const contextJumpers = getContextJumpers(item);
              const itemTags = getItemTags(item);
              const isBookmarked = bookmarkedIds.includes(itemId) || bookmarkedIds.includes(item.id);
              const isSpeaking = speakingId === itemId && speechStatus === "playing";

              return (
                <NewsItemWireRow
                  key={itemId}
                  item={item}
                  isBookmarked={isBookmarked}
                  isSpeaking={isSpeaking}
                  catalystBadges={catalystBadges}
                  contextJumpers={contextJumpers}
                  itemTags={itemTags}
                  onToggleBookmark={toggleBookmark}
                  onToggleAudioBriefing={handleToggleAudioBriefing}
                  onOpenModal={setActiveVideoModal}
                  onTickerClick={handleTickerClick}
                  onNavigateTab={onNavigateTab}
                />
              );
            })}
          </div>
        ) : (
          /* FULL DOSSIER MODE */
          <div className="space-y-4">
            {filteredAndSortedFeed.map((item) => {
              const itemId = item.youtubeId || item.id;
              const catalystBadges = getCatalystBadges(item);
              const contextJumpers = getContextJumpers(item);
              const itemTags = getItemTags(item);
              const isBookmarked = bookmarkedIds.includes(itemId) || bookmarkedIds.includes(item.id);
              const isSpeaking = speakingId === itemId && speechStatus === "playing";

              return (
                <NewsItemDossierCard
                  key={itemId}
                  item={item}
                  isBookmarked={isBookmarked}
                  isSpeaking={isSpeaking}
                  catalystBadges={catalystBadges}
                  contextJumpers={contextJumpers}
                  itemTags={itemTags}
                  onToggleBookmark={toggleBookmark}
                  onToggleAudioBriefing={handleToggleAudioBriefing}
                  onOpenModal={setActiveVideoModal}
                  onTickerClick={handleTickerClick}
                  onNavigateTab={onNavigateTab}
                />
              );
            })}
          </div>
        )}

        {/* Empty state for search / filters */}
        {totalResultsCount === 0 && activeTab !== "BOOKMARKS" && (
          <div className="p-12 text-center border border-neutral-800 bg-[#020912]/80 rounded-xl space-y-3">
            <Search className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-bold text-neutral-400">
              No feed items match your active filters {searchQuery ? `("${searchQuery}")` : ""}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTags([]);
                setActiveCatalystFilter(null);
                setSortOption("NEWEST");
                setActiveTab("ALL");
              }}
              className="px-4 py-1.5 bg-neutral-900 border border-neutral-700 text-cyan-300 rounded text-xs hover:bg-cyan-950 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* EDUCATIONAL DISCLAIMER NOTICE */}
      <div className="p-4 border border-cyan-500/20 bg-[#020912]/90 rounded-xl text-[11px] text-neutral-400 leading-relaxed flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Educational Intelligence Notice</span>
          Content provided across YouTube, 𝕏, and live dispatches is for informational, quantitative research, and educational purposes only. Stock Bloc does not provide individualized financial or investment advice.
        </div>
      </div>

      {/* EMBEDDED YOUTUBE VIDEO PLAYER MODAL */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="w-full max-w-3xl bg-neutral-950 border-2 border-rose-500/80 rounded-2xl p-4 sm:p-6 alien-block-cut shadow-2xl space-y-4 relative text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider line-clamp-1">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 bg-neutral-900 border border-rose-500/40 rounded-lg text-rose-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Responsive iFrame Player */}
            {activeVideoModal.youtubeId ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0`}
                  title={activeVideoModal.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full absolute inset-0 border-0"
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center">
                <img
                  src={activeVideoModal.thumbnailUrl}
                  alt={activeVideoModal.title}
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <a
                    href={activeVideoModal.watchUrl || activeVideoModal.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg flex items-center gap-2 shadow-xl hover:bg-rose-500"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>Watch Dispatch on YouTube</span>
                  </a>
                </div>
              </div>
            )}

            {/* Takeaways & Info */}
            <div className="space-y-2">
              <div className="text-xs text-neutral-300 leading-relaxed">
                {renderTextWithTickers(activeVideoModal.description, handleTickerClick)}
              </div>

              {activeVideoModal.keyTakeaways && activeVideoModal.keyTakeaways.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">
                    Key Market Takeaways
                  </span>
                  <div className="flex flex-col gap-1 text-xs text-rose-200">
                    {activeVideoModal.keyTakeaways.map((t, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <div>{renderTextWithTickers(t, handleTickerClick)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {activeVideoModal.channelName || "Stock Bloc"}
                </span>

                <button
                  onClick={() => handleToggleAudioBriefing(activeVideoModal)}
                  className="px-2.5 py-1 rounded bg-neutral-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Audio Brief</span>
                </button>
              </div>

              {activeVideoModal.watchUrl && (
                <a
                  href={activeVideoModal.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <span>Watch on YouTube</span>
                  <Youtube className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsHub;
