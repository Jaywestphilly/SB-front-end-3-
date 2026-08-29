
import { useMarketStore } from "../stores/marketStore";
import { useUserStore } from "../stores/userStore";
import { useModalStore } from "../stores/modalStore";
import { BackendWatchlistStock } from "../types";
import { formatUtcTimestamp, isDataStale } from "../utils/timeUtils";

import React, { useState, useMemo, useRef, useEffect, Suspense, lazy, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Header } from "../components/Header";
import { getRouteFromLocation, pushAppRoute } from "./router";
import { CategoryTabs } from "../components/CategoryTabs";
import { WatchlistIntelligenceHeader } from "../components/WatchlistIntelligenceHeader";
import { computeDeterministicSignal } from "../utils/signalCalculator";
import { StockCard } from "../features/market/StockCard";
import { HeatmapView } from "../features/market/HeatmapView";
import type { IntelligenceSubTab } from "../features/intelligence/MarketIntelligenceHub";
import { LaunchSplashModal } from "../components/LaunchSplashModal";
import { AffiliateLink } from "../components/AffiliateLink";
import { GlobalDisclaimerBar } from "../components/GlobalDisclaimerBar";
import { NotFinancialAdviceTag } from "../components/NotFinancialAdviceTag";
import { WatchlistNewsTicker } from "../components/WatchlistNewsTicker";
import { BottomNav } from "../components/BottomNav";
import { TopNavbar } from "../components/TopNavbar";
import { CommandPalette } from "../components/CommandPalette";
import { TsunamiVolatilityTicker } from "../components/TsunamiVolatilityTicker";
import { Footer } from "../components/Footer";
import { UsernamePromptModal } from "../components/UsernamePromptModal";
import { NewUserOnboardingModal } from "../components/NewUserOnboardingModal";

// Helper function for resilient dynamic imports with automatic retry and error recovery
function safeLazy<T = any>(
  importFn: () => Promise<any>,
  exportName?: string
): React.ComponentType<any> {
  return lazy(async () => {
    let lastError: any = null;
    // Attempt to load up to 3 times with progressive delays
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const module = await importFn();
        const Component = exportName ? (module[exportName] || module.default || module) : (module.default || module);
        if (Component) {
          return { default: Component };
        }
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
    }

    // Resilient inline recovery component if all async attempts encountered a network/iframe hiccup
    const FallbackComponent: React.FC<any> = (props) => {
      const [isLoading, setIsLoading] = useState(false);
      const [RecoveredComponent, setRecoveredComponent] = useState<React.ComponentType<any> | null>(null);

      const handleRetry = async () => {
        setIsLoading(true);
        try {
          const mod = await importFn();
          const Comp = exportName ? (mod[exportName] || mod.default || mod) : (mod.default || mod);
          if (Comp) {
            setRecoveredComponent(() => Comp);
          }
        } catch (retryErr) {
          console.warn("Module retry notice:", retryErr);
        } finally {
          setIsLoading(false);
        }
      };

      if (RecoveredComponent) {
        return <RecoveredComponent {...props} />;
      }

      return (
        <div className="p-6 m-4 rounded-xl bg-neutral-950/90 border border-cyan-500/30 text-neutral-300 font-mono text-xs text-center space-y-3 shadow-lg">
          <p className="text-cyan-400 font-bold tracking-wide uppercase">Module Stream Ready</p>
          <p className="text-neutral-400 text-[11px]">Click below to initialize and sync this workspace module.</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isLoading}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? "Connecting..." : "Load View"}
          </button>
        </div>
      );
    };

    return { default: FallbackComponent as unknown as T };
  });
}

// Lazy-loaded heavy modal components for code-splitting and bundle size optimization
const StockDetailModal = safeLazy(
  () => import("../components/StockDetailModal"),
  "StockDetailModal"
);
const AiCopilotModal = safeLazy(
  () => import("../components/AiCopilotModal"),
  "AiCopilotModal"
);
const BrandLinktreeModal = safeLazy(
  () => import("../components/BrandLinktreeModal"),
  "BrandLinktreeModal"
);
const SocialShareModal = safeLazy(
  () => import("../components/SocialShareModal"),
  "SocialShareModal"
);
const AuthModal = safeLazy(
  () => import("../components/AuthModal"),
  "AuthModal"
);
const ProSubscriptionModal = safeLazy(
  () => import("../components/ProSubscriptionModal"),
  "ProSubscriptionModal"
);
const BloombergTerminalModal = safeLazy(
  () => import("../components/BloombergTerminalModal"),
  "BloombergTerminalModal"
);
const BrokerageAffiliateModal = safeLazy(
  () => import("../components/BrokerageAffiliateModal"),
  "BrokerageAffiliateModal"
);
const DisclaimerModal = safeLazy(
  () => import("../components/DisclaimerModal"),
  "DisclaimerModal"
);
const DataStatusPanel = safeLazy(
  () => import("../components/DataStatusPanel"),
  "DataStatusPanel"
);

// Lazy-loaded hub components for code-splitting
const MarketIntelligenceHub = safeLazy(
  () => import("../features/intelligence/MarketIntelligenceHub"),
  "MarketIntelligenceHub"
);
const VacancyEmpireGame = safeLazy(() => import("../features/portfolio/VacancyEmpireGame"), "VacancyEmpireGame");
const RealEstateHub = safeLazy(
  () => import("../features/portfolio/RealEstateHub"),
  "RealEstateHub"
);
const CreditBuildingHub = safeLazy(
  () => import("../features/portfolio/CreditBuildingHub"),
  "CreditBuildingHub"
);
const SmallBusinessHub = safeLazy(
  () => import("../features/portfolio/SmallBusinessHub"),
  "SmallBusinessHub"
);
const YouTubeHub = safeLazy(
  () => import("../features/intelligence/YouTubeHub"),
  "YouTubeHub"
);
const InvestopediaTab = safeLazy(
  () => import("../features/education/InvestopediaTab"),
  "InvestopediaTab"
);
const DysonSwarmHub = safeLazy(
  () => import("../features/research/DysonSwarmHub"),
  "DysonSwarmHub"
);
const SatelliteMapHub = safeLazy(
  () => import("../features/research/SatelliteMapHub"),
  "SatelliteMapHub"
);
const WarGovUfoHub = safeLazy(
  () => import("../features/research/WarGovUfoHub"),
  "WarGovUfoHub"
);
const AiRevolutionHub = safeLazy(
  () => import("../features/research/AiRevolutionHub"),
  "AiRevolutionHub"
);
const PlaybooksHub = safeLazy(
  () => import("../features/education/PlaybooksHub"),
  "PlaybooksHub"
);
const ProductStorePricing = safeLazy(
  () => import("../components/ProductStorePricing"),
  "ProductStorePricing"
);
const MacroBriefingHub = safeLazy(
  () => import("../features/research/MacroBriefingHub"),
  "MacroBriefingHub"
);
const MyBlocDashboard = safeLazy(
  () => import("../features/portfolio/MyBlocDashboard"),
  "MyBlocDashboard"
);
const BrandLandingHub = safeLazy(
  () => import("../components/BrandLandingHub"),
  "BrandLandingHub"
);
const DocsHub = safeLazy(
  () => import("../features/education/DocsHub"),
  "DocsHub"
);
const MitCoursesHub = safeLazy(
  () => import("../features/education/MitCoursesHub"),
  "MitCoursesHub"
);
const TerminalGuideHub = safeLazy(
  () => import("../features/education/TerminalGuideHub"),
  "TerminalGuideHub"
);
const NewsHub = safeLazy(
  () => import("../features/intelligence/NewsHub"),
  "NewsHub"
);
const CheckoutSuccess = safeLazy(
  () => import("../components/CheckoutSuccess"),
  "CheckoutSuccess"
);
const CommunityHub = safeLazy(
  () => import("../features/community/CommunityHub"),
  "CommunityHub"
);
const DeveloperPortal = safeLazy(
  () => import("../features/developer/DeveloperPortal"),
  "DeveloperPortal"
);
const AgentDirectory = safeLazy(
  () => import("../features/agents/AgentDirectory"),
  "AgentDirectory"
);
const AgentProfile = safeLazy(
  () => import("../features/agents/AgentProfile"),
  "AgentProfile"
);
const AgentFeed = safeLazy(
  () => import("../features/agents/AgentFeed"),
  "AgentFeed"
);
const AgentLandingPage = safeLazy(
  () => import("../features/developer/AgentLandingPage"),
  "AgentLandingPage"
);
const DeveloperDocs = safeLazy(
  () => import("../features/developer/DeveloperDocs"),
  "DeveloperDocs"
);
const AgentExchange = safeLazy(
  () => import("../features/agents/AgentExchange"),
  "AgentExchange"
);
const DeveloperEarnings = safeLazy(
  () => import("../features/developer/DeveloperEarnings"),
  "DeveloperEarnings"
);
const DotBtcWeb3Hub = safeLazy(
  () => import("../features/web3/DotBtcWeb3Hub"),
  "DotBtcWeb3Hub"
);


const HubLoadingFallback: React.FC = () => (
  <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[320px] font-mono text-cyan-400 space-y-4 bg-neutral-950/40 border border-cyan-500/20 rounded-xl my-4 mx-2">
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping" />
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="text-xs uppercase font-black tracking-widest text-cyan-300 animate-pulse flex items-center gap-2">
      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
      LOADING MODULE...
    </div>
  </div>
);

import { AppleWatchGlanceView } from "../components/AppleWatchGlanceView";
import { DisclaimerBar } from "../components/DisclaimerBar";
import { trackEvent } from "../utils/analytics";
import { FloatingCommunityButton } from "../components/FloatingCommunityButton";
import { MissionHubModal } from "../components/MissionHubModal";
import { INITIAL_STOCKS, STOCK_NEWS_FEED } from "../data/stocks";
import { StockTicker, SectorCategory, SortField, ViewTab } from "../types";
import {
  Search,
  TrendingUp,
  Radio,
  Globe,
  ExternalLink,
  X,
  Newspaper,
  Plus,
  Camera,
  Music,
  Database,
  RefreshCw,
  ArrowDown,
  Orbit,
  ShieldAlert,
  LayoutList,
  SlidersHorizontal,
  Activity,
  BarChart3,
  ArrowUpDown,
  Download,
  Zap,
  Clock,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { isAgentOrHeadless } from "../utils/agentDetection";

export function App() {
  const { stocks, setStocks } = useMarketStore();
  const { selectedCategory, setSelectedCategory } = useMarketStore();
  const { sortField, setSortField } = useMarketStore();
  const { sortDirection, setSortDirection } = useMarketStore();
  const { searchQuery, setSearchQuery } = useModalStore();
  const { isSearchOpen, setIsSearchOpen } = useModalStore();
  const { isSyncingLiveQuotes, setIsSyncingLiveQuotes } = useMarketStore();
  const { lastSyncTime, setLastSyncTime } = useMarketStore();
  const { marketDataUpdatedAt } = useMarketStore();
  const { selectedStock, setSelectedStock } = useMarketStore();

  const formattedDataUpdateTime = useMemo(() => {
    const d = marketDataUpdatedAt ? new Date(marketDataUpdatedAt) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [marketDataUpdatedAt]);

  // Route & High Contrast Initial State
  const initialRoute = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("watch") === "true" || params.get("mode") === "watch") {
        return { tab: "apple_watch" as ViewTab, isTerminalOpen: false, stockSymbol: undefined };
      }
    }
    return getRouteFromLocation();
  }, []);
  const [activeTab, setActiveTab] = useState<ViewTab>(initialRoute.tab);
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useModalStore();
  const { isBloombergTerminalOpen, setIsBloombergTerminalOpen } = useModalStore();
  useEffect(() => {
    if (initialRoute.isTerminalOpen) setIsBloombergTerminalOpen(true);
  }, [initialRoute.isTerminalOpen, setIsBloombergTerminalOpen]);

  // Automatically open stock analysis card if a stock symbol is in the URL deep link
  useEffect(() => {
    if (initialRoute.stockSymbol && !selectedStock) {
      const symUpper = initialRoute.stockSymbol.toUpperCase();
      const targetStock =
        stocks.find((s) => s.symbol.toUpperCase() === symUpper) ||
        INITIAL_STOCKS.find((s) => s.symbol.toUpperCase() === symUpper);
      if (targetStock) {
        setSelectedStock(targetStock);
      } else {
        setSelectedStock({
          symbol: symUpper,
          name: `${symUpper} Asset`,
          price: 100.0,
          change: 0,
          changePercent: 0,
          category: "tsunami",
          sparkline: [100, 100, 100],
          history: {
            "1D": [{ time: "09:30", price: 100 }, { time: "16:00", price: 100 }],
            "1W": [{ time: "Day 1", price: 100 }, { time: "Day 5", price: 100 }],
            "1M": [{ time: "Week 1", price: 100 }, { time: "Week 4", price: 100 }],
            "1Y": [{ time: "Q1", price: 100 }, { time: "Q4", price: 100 }],
            "ALL": [{ time: "2024", price: 100 }, { time: "2026", price: 100 }],
          },
          marketCap: "$1.0B",
          high52: 120,
          low52: 80,
          volume: "1.0M",
          description: `Quantitative intelligence, technical momentum, and financial metrics for ${symUpper}.`,
          tags: ["Quant Momentum", "AI Infrastructure"],
          isPinned: false,
        });
      }
    }
  }, [initialRoute.stockSymbol, stocks]);
  const { isDayMode, setIsDayMode } = useUserStore();

  const { watchlistSubTab, setWatchlistSubTab, starredTickers, toggleStarredTicker } = useUserStore();

  // Helper to close all modal overlays
  const closeAllModals = useCallback(() => {
    setIsBloombergTerminalOpen(false);
    setSelectedStock(null);
    setIsProSubscriptionOpen(false);
    setIsAuthOpen(false);
    setIsAiCopilotOpen(false);
    setIsCommandPaletteOpen(false);
    setIsBrandLinktreeOpen(false);
    setIsDisclaimerOpen(false);
    setIsBrokerageModalOpen(false);
    setIsShareModalOpen(false);
    setIsDataStatusOpen(false);
    setShareStock(null);
    setBrokerageStock(null);
  }, []);

  // Helper to push history state when an overlay opens for back button handling
  const pushOverlayHistory = (isTerminal = false) => {
    if (typeof window !== "undefined") {
      pushAppRoute(activeTab, isTerminal, selectedStock?.symbol);
    }
  };

  // Sync route history and window popstate
  useEffect(() => {
    pushAppRoute(activeTab, isBloombergTerminalOpen, selectedStock?.symbol);
  }, [activeTab, isBloombergTerminalOpen, selectedStock?.symbol]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromLocation();
      setActiveTab(route.tab);
      if (route.stockSymbol) {
        const symUpper = route.stockSymbol.toUpperCase();
        const found =
          stocks.find((s) => s.symbol.toUpperCase() === symUpper) ||
          INITIAL_STOCKS.find((s) => s.symbol.toUpperCase() === symUpper);
        if (found) {
          setSelectedStock(found);
        }
      } else {
        setSelectedStock(null);
      }
      if (route.isTerminalOpen) {
        setIsBloombergTerminalOpen(true);
      } else {
        setIsBloombergTerminalOpen(false);
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [stocks]);

  // Ensure scroll resets when category or subtab changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [selectedCategory, watchlistSubTab]);

  // Clear lazy loading script reload attempt flag on successful mount to allow resilient page reloads on next version update
  useEffect(() => {
    try {
      sessionStorage.removeItem("app_script_reload_attempt");
    } catch (e) {
      console.warn("Could not clear reload flag:", e);
    }
  }, []);

  // Global Keyboard Shortcuts ('/', 'Esc', Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = activeElement?.tagName;
      const isInputFocused =
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT" ||
        activeElement?.isContentEditable;

      // '/' shortcut to open terminal or focus terminal command line
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        if (!isBloombergTerminalOpen) {
          setIsBloombergTerminalOpen(true);
          pushOverlayHistory(true);
        }
        setTimeout(() => {
          const inputEl = document.getElementById("terminal-command-input");
          if (inputEl) {
            (inputEl as HTMLInputElement).focus();
            (inputEl as HTMLInputElement).select();
          }
        }, 60);
        return;
      }

      // 'Escape' or 'Esc' shortcut to close overlays/modals
      if (e.key === "Escape" || e.key === "Esc") {
        closeAllModals();
        pushAppRoute(activeTab, false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBloombergTerminalOpen, activeTab, isCommandPaletteOpen, setIsCommandPaletteOpen, setIsBloombergTerminalOpen]);

  // Switch tab and default watchlist to tsunami list with route push
  const handleSelectTab = (tab: ViewTab) => {
    if (tab === "watchlist") {
      setSelectedCategory("tsunami");
      setWatchlistSubTab("tickers");
    }
    setActiveTab(tab);
    setIsBloombergTerminalOpen(false);
    pushAppRoute(tab, false);
  };

  const handleOpenBloombergTerminal = () => {
    setIsBloombergTerminalOpen(true);
    pushAppRoute(activeTab, true);
  };

  const handleCloseBloombergTerminal = () => {
    setIsBloombergTerminalOpen(false);
    pushAppRoute(activeTab, false);
  };

  useEffect(() => {
    if (isDayMode) {
      document.documentElement.classList.add("day-mode");
    } else {
      document.documentElement.classList.remove("day-mode");
    }
  }, [isDayMode]);

  // Sync with OS/System Theme changes when user hasn't explicitly overridden preference
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      let stored = null; try { stored = localStorage.getItem("stockbloc_day_mode"); } catch (e) {}
      if (stored === null) {
        setIsDayMode(e.matches);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }
  }, [setIsDayMode]);

  const handleToggleDayMode = () => {
    setIsDayMode(!isDayMode);
  };

  const { shareStock, setShareStock, shareTarget, setShareTarget } = useModalStore();
  const { isShareModalOpen, setIsShareModalOpen } = useModalStore();
  const { isAiCopilotOpen, setIsAiCopilotOpen } = useModalStore();
  const { isBrandLinktreeOpen, setIsBrandLinktreeOpen } = useModalStore();

  // New Feature Modals
  const { isAuthOpen, setIsAuthOpen } = useModalStore();
  const { isDisclaimerOpen, setIsDisclaimerOpen } = useModalStore();
  const { isMissionHubOpen, setIsMissionHubOpen } = useModalStore();

  // Command Palette & Data Status
    const { isDataStatusOpen, setIsDataStatusOpen } = useModalStore();
  const { isProSubscriptionOpen, setIsProSubscriptionOpen } = useModalStore();
  const { isBrokerageModalOpen, setIsBrokerageModalOpen } = useModalStore();
  const { brokerageStock, setBrokerageStock } = useModalStore();
  const { userPlan, setUserPlan } = useUserStore();

  const handleOpenBrokerage = (stk?: StockTicker | null) => {
    setBrokerageStock(stk || selectedStock || stocks[0]);
    setIsBrokerageModalOpen(true);
  };

  // Extract REITs for Real Estate Hub
  const reitStocks = useMemo(
    () => stocks.filter((s) => s.category === "reits"),
    [stocks],
  );

  // Toggle Pinned status
  const handleTogglePin = (symbol: string) => {
    triggerHaptic("selection");
    setStocks(
      stocks.map((s) =>
        s.symbol === symbol ? { ...s, isPinned: !s.isPinned } : s,
      ),
    );
  };

  // Remove Stock from Watchlist
  const handleRemoveStock = (symbol: string) => {
    triggerHaptic("warning");
    setStocks(stocks.filter((s) => s.symbol !== symbol));
  };

  // Helpers for Numerical & Statistical Parsing
  const parseNumericValue = (val?: string | number): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    const clean = String(val).trim().toUpperCase();
    if (clean === "N/A" || clean === "--" || clean === "") return 0;

    let multiplier = 1;
    if (clean.includes("T")) multiplier = 1_000_000_000_000;
    else if (clean.includes("B")) multiplier = 1_000_000_000;
    else if (clean.includes("M")) multiplier = 1_000_000;
    else if (clean.includes("K")) multiplier = 1_000;

    const match = clean.match(/[0-9]+(\.[0-9]+)?/);
    if (!match) return 0;
    const num = parseFloat(match[0]);
    return isNaN(num) ? 0 : num * multiplier;
  };

  const getStockVolume = (stock: StockTicker): number => {
    if (typeof stock.volumeNum === "number" && stock.volumeNum > 0) return stock.volumeNum;
    return parseNumericValue(stock.volume);
  };

  const getStockMarketCap = (stock: StockTicker): number => {
    return parseNumericValue(stock.marketCap);
  };

  const getStockRsi = (stock: StockTicker): number => {
    if (typeof stock.rsi === "number" && !isNaN(stock.rsi)) return stock.rsi;
    if (typeof stock.quantMetrics?.rsi14 === "number" && !isNaN(stock.quantMetrics.rsi14)) {
      return stock.quantMetrics.rsi14;
    }
    if (stock.sparkline && stock.sparkline.length > 2) {
      const prices = stock.sparkline;
      let gains = 0;
      let losses = 0;
      for (let i = 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      if (gains + losses === 0) return 50;
      const rs = losses === 0 ? 100 : gains / losses;
      return Math.round(100 - 100 / (1 + rs));
    }
    return 50;
  };

  const calculateStockVolatility = (stock: StockTicker): number => {
    if (!stock) return 0;
    if (typeof stock.quantMetrics?.volatility === "number" && !isNaN(stock.quantMetrics.volatility) && stock.quantMetrics.volatility > 0) {
      return stock.quantMetrics.volatility;
    }
    const range52 =
      (stock.low52 || 0) > 0
        ? (((stock.high52 || 0) - stock.low52) / stock.low52) * 100
        : 0;
    const absChange = Math.abs(stock.changePercent || 0);
    let sparklineVariance = 0;
    if (stock.sparkline && stock.sparkline.length > 1) {
      const min = Math.min(...stock.sparkline);
      const max = Math.max(...stock.sparkline);
      if (min > 0) sparklineVariance = ((max - min) / min) * 100;
    }
    return absChange * 3 + range52 + sparklineVariance * 2;
  };

  // Filter and Sort stocks
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (selectedCategory === "my_bloc") {
      result = result.filter((s) => starredTickers.includes(s.symbol));
    } else if (selectedCategory === "asymmetry") {
      result = result.filter(
        (s) =>
          s.asymmetryPotentialStars !== undefined ||
          s.tags.includes("High Asymmetry"),
      );
    } else if (selectedCategory === "robotics") {
      result = result.filter(
        (s) =>
          s.category === "robotics" ||
          s.tags.some(
            (t) =>
              t.toLowerCase().includes("robot") ||
              t.toLowerCase().includes("autonomous") ||
              t.toLowerCase().includes("self-driving"),
          ),
      );
    } else if (selectedCategory === "tsunami" || selectedCategory === "all") {
      // Wholesale include all stocks in Super Sonic Tsunami and All Watchlist
    } else {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    result.sort((a, b) => {
      const dir = sortDirection === "desc" ? 1 : -1;

      // In curated "stack" view, maintain pinned items and SPCX at the top
      if (sortField === "stack") {
        if (a.symbol.toUpperCase() === "SPCX") return -1;
        if (b.symbol.toUpperCase() === "SPCX") return 1;
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        const aLevel = (a as any).stack_level ?? 99;
        const bLevel = (b as any).stack_level ?? 99;
        if (aLevel !== bLevel) return aLevel - bLevel;
        return ((b.changePercent || 0) - (a.changePercent || 0)) * dir;
      }

      // For all statistical and directional sort fields (SB Score, Gainers, Losers, Volume, RSI, Volatility, Price, Market Cap, etc.),
      // sort purely by the chosen metric across the ENTIRE watchlist
      if (sortField === "signal") {
        const scoreA = computeDeterministicSignal(a).score;
        const scoreB = computeDeterministicSignal(b).score;
        const diff = (scoreB - scoreA) * dir;
        if (diff !== 0) return diff;
        return ((b.changePercent || 0) - (a.changePercent || 0));
      }
      if (sortField === "changePercent") {
        const diff = ((b.changePercent || 0) - (a.changePercent || 0)) * dir;
        if (diff !== 0) return diff;
        return a.symbol.localeCompare(b.symbol);
      }
      if (sortField === "volume") {
        const diff = (getStockVolume(b) - getStockVolume(a)) * dir;
        if (diff !== 0) return diff;
        return ((b.changePercent || 0) - (a.changePercent || 0));
      }
      if (sortField === "price") {
        const diff = ((b.price || 0) - (a.price || 0)) * dir;
        if (diff !== 0) return diff;
        return a.symbol.localeCompare(b.symbol);
      }
      if (sortField === "marketCap") {
        const diff = (getStockMarketCap(b) - getStockMarketCap(a)) * dir;
        if (diff !== 0) return diff;
        return ((b.changePercent || 0) - (a.changePercent || 0));
      }
      if (sortField === "rsi") {
        const diff = (getStockRsi(b) - getStockRsi(a)) * dir;
        if (diff !== 0) return diff;
        return ((b.changePercent || 0) - (a.changePercent || 0));
      }
      if (sortField === "volatility") {
        const diff = (calculateStockVolatility(b) - calculateStockVolatility(a)) * dir;
        if (diff !== 0) return diff;
        return ((b.changePercent || 0) - (a.changePercent || 0));
      }
      if (sortField === "name") {
        return a.symbol.localeCompare(b.symbol) * dir;
      }
      if (sortField === "companyName") {
        return (a.name || a.symbol).localeCompare(b.name || b.symbol) * dir;
      }
      if (sortField === "asymmetry") {
        const aStars = a.asymmetryPotentialStars ?? (a.tags.includes("High Asymmetry") ? 4 : 0);
        const bStars = b.asymmetryPotentialStars ?? (b.tags.includes("High Asymmetry") ? 4 : 0);
        const diff = (bStars - aStars) * dir;
        if (diff !== 0) return diff;
        return ((b.changePercent || 0) - (a.changePercent || 0));
      }
      return 0;
    });

    // Enforce 1:1 symbol uniqueness in the rendered output
    const seenSymbols = new Set<string>();
    return result.filter((stk) => {
      const sym = stk.symbol?.toUpperCase();
      if (!sym || seenSymbols.has(sym)) return false;
      seenSymbols.add(sym);
      return true;
    });
  }, [stocks, selectedCategory, searchQuery, sortField, sortDirection, starredTickers]);

  // Export Watchlist as CSV
  const handleExportWatchlistCsv = () => {
    triggerHaptic("success");
    const headers = [
      "Symbol",
      "Name",
      "Price ($)",
      "Change (%)",
      "Volume",
      "Market Cap",
      "RSI",
      "Asymmetry Stars",
      "Category",
    ];
    const rows = filteredStocks.map((s) => [
      `"${s.symbol}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      s.price,
      s.changePercent,
      `"${s.volume}"`,
      `"${s.marketCap}"`,
      getStockRsi(s),
      s.asymmetryPotentialStars ?? 0,
      `"${s.category}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StockBloc_Watchlist_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open Share for stock
  const handleOpenShareStock = (stock: StockTicker) => {
    setShareStock(stock);
    setIsShareModalOpen(true);
  };

  // Open Analyze directly for stock
  const handleAiAnalyzeStock = (stock: StockTicker) => {
    setSelectedStock(stock);
  };

  // Pull to refresh state & gesture handlers
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartRef = useRef<number>(0);
  const pullDistanceRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const triggeredHapticRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
      setIsPulling(true);
      triggeredHapticRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    if (diff > 0) {
      const distance = Math.min(diff * 0.45, 90);
      pullDistanceRef.current = distance;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPullDistance(pullDistanceRef.current);
          if (pullDistanceRef.current >= 60 && !triggeredHapticRef.current) {
            triggerHaptic("refresh");
            triggeredHapticRef.current = true;
          }
          rafRef.current = null;
        });
      }
    }
  };

  const handleTouchEnd = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pullDistanceRef.current >= 60) {
      triggerHaptic("success");
      handleSyncLiveQuotes();
    }
    pullDistanceRef.current = 0;
    setPullDistance(0);
    setIsPulling(false);
    triggeredHapticRef.current = false;
  };

  // Sync Live Market Stock Quotes via raw GitHub watchlist data
  const handleSyncLiveQuotes = useCallback(async () => {
    if (useMarketStore.getState().isSyncingLiveQuotes) return;
    setIsSyncingLiveQuotes(true);
    triggerHaptic("refresh");

    try {
      let res = await fetch("/api/data/market");
      let sourceName = "CDN Proxy / Market Watchlist";
      if (!res.ok) {
        res = await fetch("/market_watchlist_data.json");
        sourceName = "Local Proxy Fallback";
      }
      if (!res.ok) throw new Error("Failed to fetch market watchlist");
      const json = await res.json();
      if (json && json.watchlist && Array.isArray(json.watchlist)) {
        const uniqueMap = new Map<string, any>();
        json.watchlist.forEach((backendStock: any) => {
          if (!backendStock || !backendStock.symbol) return;
          const symKey = backendStock.symbol.toUpperCase();
          if (uniqueMap.has(symKey)) return;

          const history1D = (backendStock.sparkline || []).map((price: number, i: number) => ({
            time: new Date(Date.now() - ((backendStock.sparkline || []).length - 1 - i) * 60 * 60 * 1000).toISOString(),
            price
          }));
          const fakeHistory = {
             "1D": history1D,
             "1W": history1D,
             "1M": history1D,
             "1Y": history1D,
             "ALL": history1D
          };

          const volVal = backendStock.volume || 0;
          const avgVolVal = backendStock.avgVolume || volVal;
          const volRatio = avgVolVal > 0 && volVal > 0 ? (volVal / avgVolVal).toFixed(2) : "1.00";
          const formattedVol = volVal >= 1_000_000_000 
            ? `${(volVal / 1_000_000_000).toFixed(2)}B`
            : volVal >= 1_000_000
            ? `${(volVal / 1_000_000).toFixed(1)}M`
            : volVal > 0
            ? `${(volVal / 1_000).toFixed(0)}K`
            : "1.2x avg";

          let mktCapStr = backendStock.market_cap || "N/A";
          if (typeof mktCapStr === "number" || (!isNaN(Number(mktCapStr)) && Number(mktCapStr) > 0)) {
            const num = Number(mktCapStr);
            if (num >= 1e12) mktCapStr = `${(num / 1e12).toFixed(2)}T`;
            else if (num >= 1e9) mktCapStr = `${(num / 1e9).toFixed(2)}B`;
            else if (num >= 1e6) mktCapStr = `${(num / 1e6).toFixed(1)}M`;
          }

          const lastUpdatedIso = backendStock.last_updated || json.updated_at || new Date().toISOString();

          uniqueMap.set(symKey, {
            symbol: backendStock.symbol,
            name: backendStock.name || backendStock.symbol,
            price: backendStock.price,
            change: backendStock.change ?? 0,
            changePercent: backendStock.percent_change ?? 0,
            category: backendStock.sector
              ? backendStock.sector.toLowerCase().includes("crypto") || backendStock.sector.toLowerCase().includes("index") || backendStock.sector.toLowerCase().includes("market")
                ? "indexes"
                : backendStock.sector.toLowerCase().includes("robot")
                ? "robotics"
                : backendStock.sector.toLowerCase().includes("asymmetry")
                ? "asymmetry"
                : backendStock.sector.toLowerCase().includes("reit")
                ? "reits"
                : backendStock.sector.toLowerCase().includes("credit") || backendStock.sector.toLowerCase().includes("fin")
                ? "credit_fin"
                : backendStock.sector.toLowerCase().includes("memory")
                ? "memory"
                : backendStock.sector.toLowerCase().includes("energy") || backendStock.sector.toLowerCase().includes("power")
                ? "energy"
                : backendStock.sector.toLowerCase().includes("infra")
                ? "ai_infra"
                : backendStock.sector.toLowerCase().replace(/[^a-z0-9]/g, "_")
              : "tsunami",
            sparkline: backendStock.sparkline || [],
            history: fakeHistory,
            marketCap: mktCapStr,
            peRatio: "N/A",
            high52: backendStock.high52 ?? Number((backendStock.price * 1.15).toFixed(2)),
            low52: backendStock.low52 ?? Number((backendStock.price * 0.85).toFixed(2)),
            volume: formattedVol,
            volumeNum: volVal,
            avgVolumeNum: avgVolVal,
            volumeVsAvgRatio: parseFloat(volRatio),
            description: backendStock.analysis_summary || "",
            tags: backendStock.sector ? [backendStock.sector] : [],
            isPinned: backendStock.pinned,
            theme: backendStock.theme || backendStock.cardColor || backendStock.color,
            cardColor: backendStock.cardColor || backendStock.theme || backendStock.color,
            color: backendStock.color || backendStock.theme || backendStock.cardColor,
            targetPrice: backendStock.target_price,
            rating: backendStock.rating,
            instHolders: backendStock.inst_holders,
            headlines: backendStock.headlines || [],
            news: backendStock.news || [],
            signalScore: backendStock.signal?.signalScore ?? 75,
            signalLabel: backendStock.signal?.signalLabel ?? "Bullish",
            quantMetrics: backendStock.quant || null,
            lastUpdatedIso
          });
        });

        // Retain any initial stocks missing from backend watchlist feed
        INITIAL_STOCKS.forEach((initStock) => {
          const symKey = initStock.symbol.toUpperCase();
          if (!uniqueMap.has(symKey)) {
            uniqueMap.set(symKey, initStock);
          }
        });

        const mappedStocks = Array.from(uniqueMap.values());
        setStocks(mappedStocks);

        // Read updated_at from GitHub JSON and set fetch time
        const rawUpdatedAt = json.updated_at || new Date().toISOString();
        const formattedUtc = formatUtcTimestamp(rawUpdatedAt);
        const stale = isDataStale(rawUpdatedAt);

        const store = useMarketStore.getState();
        store.setMarketDataUpdatedAt(rawUpdatedAt);
        store.setMarketDataIsStale(stale);
        store.setMarketDataSource(json.source || sourceName);
        setLastSyncTime(formattedUtc);
        triggerHaptic("success");
      }
    } catch (err) {
      console.warn("Live quotes sync error:", err);
    } finally {
      setIsSyncingLiveQuotes(false);
    }
  }, []);

  // Auto-sync real-time market stock quotes on initial load and every 30 seconds
  useEffect(() => {
    handleSyncLiveQuotes();
    const interval = setInterval(() => {
      handleSyncLiveQuotes();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleSyncLiveQuotes]);

  // Priority marquee items ensuring SPCX is #1, followed by QQQ and DXYZ
  const spacexStock =
    stocks.find((s) => s.symbol.toUpperCase() === "SPCX") ||
    INITIAL_STOCKS.find((s) => s.symbol.toUpperCase() === "SPCX");
  const qqqStock =
    stocks.find((s) => s.symbol.toUpperCase() === "QQQ") ||
    INITIAL_STOCKS.find((s) => s.symbol.toUpperCase() === "QQQ");
  const dxyzStock =
    stocks.find((s) => s.symbol.toUpperCase() === "DXYZ") ||
    INITIAL_STOCKS.find((s) => s.symbol.toUpperCase() === "DXYZ");
  const restStocks = stocks.filter(
    (s) =>
      s.symbol.toUpperCase() !== "SPCX" &&
      s.symbol.toUpperCase() !== "QQQ" &&
      s.symbol.toUpperCase() !== "DXYZ",
  );

  const marqueeItems = [
    ...(spacexStock ? [spacexStock] : []),
    ...(qqqStock ? [qqqStock] : []),
    ...(dxyzStock ? [dxyzStock] : []),
    ...restStocks,
  ];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`min-h-screen bg-black grid-bg scanlines text-cyan-100 pb-24 font-mono select-none antialiased relative overflow-hidden`}
    >
      {/* Alien Laser Scan Beam */}
      <div className="scan-beam-line" />

      {/* iOS Pull to Refresh Visual Indicator */}
      {(pullDistance > 0 || isSyncingLiveQuotes) && (
        <div
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 transition-all duration-150 ease-out pointer-events-none"
          style={{
            transform: `translate(-50%, ${Math.min(pullDistance, 60)}px)`,
          }}
        >
          <div className="px-4 py-2 alien-block-cut-sm bg-neutral-950/90 border-2 border-cyan-400 backdrop-blur-xl shadow-2xl flex items-center gap-2 text-xs font-black text-cyan-300 uppercase tracking-wider">
            <RefreshCw
              className={`w-4 h-4 text-cyan-400 ${isSyncingLiveQuotes ? "animate-spin" : ""}`}
            />
            <span>
              {isSyncingLiveQuotes
                ? "CALIBRATING QUANT NODES..."
                : pullDistance >= 60
                  ? "RELEASE TO RE-SCAN"
                  : "PULL TO RE-SCAN"}
            </span>
          </div>
        </div>
      )}

      {/* Top Main iOS Header */}
      <Header
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onOpenAiAssistant={() => setIsAiCopilotOpen(true)}
        onOpenLinktree={() => setIsBrandLinktreeOpen(true)}
        onOpenShare={() => {
          setShareStock(selectedStock || null);
          setShareTarget({ tab: activeTab });
          setIsShareModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenBloombergTerminal={handleOpenBloombergTerminal}
        onOpenDataStatus={() => setIsDataStatusOpen(true)}
        userPlan={userPlan}
        onSelectTab={handleSelectTab}
        isDayMode={isDayMode}
        onToggleDayMode={handleToggleDayMode}
        onOpenMissionHub={() => setIsMissionHubOpen(true)}
      />

      {/* Desktop Top Navigation Bar */}
      <TopNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenTerminal={handleOpenBloombergTerminal}
        onOpenMissionHub={() => setIsMissionHubOpen(true)}
      />

      <>
        {/* Ticker Tape Marquee Pill Banner */}
        <div
          className={`w-full bg-[#020912]/90 border-b py-2 px-3 flex items-center gap-3 text-xs font-mono transition-all relative z-10 ${
            isSyncingLiveQuotes
              ? "border-cyan-400 glitch-border-refresh"
              : "border-cyan-500/30"
          }`}
        >
            <span
              className={`text-[10px] uppercase font-black bg-cyan-950/95 px-2.5 py-1 border border-cyan-500/50 alien-block-cut-sm shrink-0 flex items-center gap-1.5 tracking-wider z-20 shadow-lg shadow-black/80 ${
                isSyncingLiveQuotes
                  ? "text-amber-300 glitch-text-refresh border-amber-400"
                  : "text-cyan-300"
              }`}
            >
              <Clock className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <span>UPDATED {formattedDataUpdateTime}</span>
            </span>

            <div className="overflow-hidden w-full relative flex items-center py-1 -my-1">
              <div className="animate-marquee-scroll flex items-center gap-2">
                {[...marqueeItems, ...marqueeItems].map((s, idx) => (
                  <button
                    key={`${s.symbol}-${idx}`}
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedStock(s);
                    }}
                    style={{ animationDelay: `${idx * 0.3}s` }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 alien-block-cut-sm bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 shrink-0 font-bold active:scale-95 transition-all cursor-pointer text-xs ${
                      isSyncingLiveQuotes
                        ? "glitch-border-refresh"
                        : "animate-periodic-border-glitch"
                    }`}
                  >
                    <span
                      style={{ animationDelay: `${idx * 0.3}s` }}
                      className={`font-black ${isSyncingLiveQuotes ? "glitch-text-refresh text-cyan-300" : "animate-periodic-text-glitch text-cyan-100"}`}
                    >
                      ${s.symbol}
                    </span>
                    <span className="font-mono text-cyan-300/80">
                      $
                      {s.price >= 1000
                        ? s.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : s.price.toFixed(2)}
                    </span>
                    <span
                      className={`font-black font-mono text-[10px] ${s.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {s.changePercent >= 0 ? "+" : ""}
                      {s.changePercent.toFixed(1)}%
                    </span>
                    <NotFinancialAdviceTag className="scale-[0.6] origin-left -ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>

      {/* Main Tab Views */}
      <main className="max-w-3xl md:max-w-6xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto w-full px-2 sm:px-4 transition-all duration-300">
        <Suspense fallback={<HubLoadingFallback />}>
          {(activeTab === "watchlist" || activeTab === "podcasts") && (
          <div className="w-full">
            {/* Centralized Market Intelligence Control & Freshness Header */}
            <WatchlistIntelligenceHeader
              isSyncing={isSyncingLiveQuotes}
              onRefresh={handleSyncLiveQuotes}
              marketDataUpdatedAt={useMarketStore.getState().marketDataUpdatedAt}
              marketDataSource={useMarketStore.getState().marketDataSource}
              marketDataIsStale={useMarketStore.getState().marketDataIsStale}
              totalStocks={stocks.length}
            />

            {/* Category Selector Tabs */}
            <CategoryTabs
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              itemCount={filteredStocks.length}
            />

            {/* Brokerage Affiliate Action Bar */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <AffiliateLink
                href="https://robinhood.com"
                ctaText="OPEN BROKERAGE ACCOUNT"
                partnerName="Robinhood"
                category="watchlist"
                variant="cyan"
              />
            </div>

            {/* Quick Intelligence Action Bar */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={handleSyncLiveQuotes}
                disabled={isSyncingLiveQuotes}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingLiveQuotes ? "animate-spin" : ""}`}
                />
                <span>
                  {isSyncingLiveQuotes
                    ? "Syncing Real Prices..."
                    : "Sync Real Market Prices"}
                </span>
                {lastSyncTime && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ({lastSyncTime})
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firebase Sync</span>
              </button>

              <button
                onClick={() => setActiveTab("dyson_swarm")}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 border border-amber-500/40 text-xs font-extrabold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <Orbit className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>Dyson Swarm Hub</span>
              </button>

              <button
                onClick={() => setActiveTab("war_gov_ufo")}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 border border-amber-500/40 text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>WAR.GOV / UFO Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab("intelligence")}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>13F & Intel Matrix</span>
              </button>
            </div>

            {/* Single Unified Watchlist Sorting Bar */}
            <div className="px-4 py-2.5 bg-[#030a12]/90 border-y border-cyan-500/30 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar my-2 backdrop-blur-md">
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono font-black text-cyan-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-tech uppercase tracking-wider text-[11px] text-cyan-200">
                  Sort:
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Single High / Low Direction Toggle */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                  }}
                  className="px-2.5 py-1.5 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 text-[10px] font-black font-mono flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Toggle Sort Direction (High-to-Low or Low-to-High)"
                >
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  <span>{sortDirection === "desc" ? "HIGH → LOW" : "LOW → HIGH"}</span>
                </button>

                {/* SB Score Quant Rating */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    if (sortField === "signal") {
                      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                    } else {
                      setSortField("signal");
                      setSortDirection("desc");
                    }
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    sortField === "signal"
                      ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 text-black shadow-md shadow-emerald-400/40 border border-emerald-300 font-bold"
                      : "bg-neutral-900/90 text-emerald-300 hover:bg-neutral-800 border border-emerald-500/40 shadow-sm"
                  }`}
                  title="Sort by Stock Bloc Quant Score (0-100 Rating)"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 ${sortField === "signal" ? "text-black fill-current" : "text-emerald-400 fill-emerald-400/30"}`}
                  />
                  <span>SB Score</span>
                </button>

                {/* Market Cap */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    if (sortField === "marketCap") {
                      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                    } else {
                      setSortField("marketCap");
                    }
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    sortField === "marketCap"
                      ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/30 border border-cyan-300 font-bold"
                      : "bg-neutral-900/90 text-cyan-300 hover:bg-neutral-800 border border-cyan-500/30"
                  }`}
                  title="Sort by Market Capitalization (High/Low)"
                >
                  <DollarSign
                    className={`w-3.5 h-3.5 ${sortField === "marketCap" ? "text-black" : "text-cyan-400"}`}
                  />
                  <span>Market Cap</span>
                </button>

                {/* Top Gainers */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setSortField("changePercent");
                    setSortDirection("desc");
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    sortField === "changePercent" && sortDirection === "desc"
                      ? "bg-emerald-400 text-black shadow-md shadow-emerald-400/30 border border-emerald-300 font-bold"
                      : "bg-neutral-900/90 text-emerald-300 hover:bg-neutral-800 border border-emerald-500/30"
                  }`}
                  title="Sort by Top Gainers (% Change High to Low)"
                >
                  <TrendingUp
                    className={`w-3.5 h-3.5 ${sortField === "changePercent" && sortDirection === "desc" ? "text-black" : "text-emerald-400"}`}
                  />
                  <span>Gainers</span>
                </button>

                {/* Top Losers */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setSortField("changePercent");
                    setSortDirection("asc");
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    sortField === "changePercent" && sortDirection === "asc"
                      ? "bg-rose-400 text-black shadow-md shadow-rose-400/30 border border-rose-300 font-bold"
                      : "bg-neutral-900/90 text-rose-300 hover:bg-neutral-800 border border-rose-500/30"
                  }`}
                  title="Sort by Top Losers (% Change Low to High)"
                >
                  <TrendingUp
                    className={`w-3.5 h-3.5 rotate-180 ${sortField === "changePercent" && sortDirection === "asc" ? "text-black" : "text-rose-400"}`}
                  />
                  <span>Losers</span>
                </button>

                {/* Volume */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    if (sortField === "volume") {
                      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                    } else {
                      setSortField("volume");
                    }
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    sortField === "volume"
                      ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/30 border border-cyan-300 font-bold"
                      : "bg-neutral-900/90 text-cyan-300 hover:bg-neutral-800 border border-cyan-500/30"
                  }`}
                  title="Sort by Trading Volume"
                >
                  <BarChart3
                    className={`w-3.5 h-3.5 ${sortField === "volume" ? "text-black" : "text-cyan-400"}`}
                  />
                  <span>Volume</span>
                </button>

                {/* RSI */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    if (sortField === "rsi") {
                      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                    } else {
                      setSortField("rsi");
                    }
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    sortField === "rsi"
                      ? "bg-purple-400 text-black shadow-md shadow-purple-400/30 border border-purple-300 font-bold"
                      : "bg-neutral-900/90 text-purple-300 hover:bg-neutral-800 border border-purple-500/30"
                  }`}
                  title="Sort by RSI Momentum"
                >
                  <Activity
                    className={`w-3.5 h-3.5 ${sortField === "rsi" ? "text-black" : "text-purple-400"}`}
                  />
                  <span>RSI</span>
                </button>

                {/* Volatility */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    if (sortField === "volatility") {
                      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                    } else {
                      setSortField("volatility");
                    }
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    sortField === "volatility"
                      ? "bg-amber-400 text-black shadow-md shadow-amber-400/30 border border-amber-300 font-bold"
                      : "bg-neutral-900/90 text-amber-300 hover:bg-neutral-800 border border-amber-500/30"
                  }`}
                  title="Sort by Volatility"
                >
                  <Zap
                    className={`w-3.5 h-3.5 ${sortField === "volatility" ? "text-black" : "text-amber-400"}`}
                  />
                  <span>Volatility</span>
                </button>

                {/* Price */}
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    if (sortField === "price") {
                      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
                    } else {
                      setSortField("price");
                    }
                  }}
                  className={`px-2.5 py-1.5 alien-block-cut-sm font-black text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    sortField === "price"
                      ? "bg-blue-400 text-black shadow-md shadow-blue-400/30 border border-blue-300 font-bold"
                      : "bg-neutral-900/90 text-blue-300 hover:bg-neutral-800 border border-blue-500/30"
                  }`}
                  title="Sort by Share Price"
                >
                  <DollarSign
                    className={`w-3.5 h-3.5 ${sortField === "price" ? "text-black" : "text-blue-400"}`}
                  />
                  <span>Price</span>
                </button>

                {/* Export CSV */}
                <button
                  onClick={handleExportWatchlistCsv}
                  data-testid="export-watchlist-csv"
                  className="px-2.5 py-1.5 alien-block-cut-sm bg-emerald-400 hover:bg-emerald-300 text-black font-black text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-400/20"
                  title="Export Watchlist to CSV File"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>EXPORT CSV</span>
                </button>
              </div>
            </div>

            {/* Ticker List Container */}
            <div className="w-full border-t border-neutral-900 mt-1">
              <AnimatePresence mode="popLayout">
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock, index) => (
                    <StockCard
                      key={stock.symbol}
                      index={index}
                      stock={stock}
                      onSelect={setSelectedStock}
                      onTogglePin={handleTogglePin}
                      onShare={handleOpenShareStock}
                      onAiAnalyze={handleAiAnalyzeStock}
                      onOpenNewsFeed={() => {
                        setActiveTab("youtube");
                      }}
                      onRemove={handleRemoveStock}
                      isSyncing={isSyncingLiveQuotes}
                      onOpenBrokerages={(st) => handleOpenBrokerage(st)}
                    />
                  ))
                ) : (
                  <div className="p-12 text-center text-neutral-500 space-y-3">
                    <p className="text-sm font-semibold">
                      {stocks.length === 0
                        ? "Your Watchlist is empty."
                        : "No tickers found for search or category."}
                    </p>
                    {stocks.length === 0 ? (
                      <button
                        onClick={() => {
                          setStocks(INITIAL_STOCKS);
                          setSelectedCategory("all");
                          triggerHaptic("success");
                        }}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        Restore Default Watchlist
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("all");
                        }}
                        className="text-xs text-cyan-400 underline font-bold cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === "heatmap" && (
          <HeatmapView stocks={stocks} onSelectStock={setSelectedStock} />
        )}

        {[
          "intelligence",
          "earnings",
          "rankings",
          "ipos",
          "ma",
          "regulatory",
          "hedge_funds",
          "report_repository",
        ].includes(activeTab) && (
          <div className="p-4">
            <MarketIntelligenceHub
              initialSubTab={
                ([
                  "earnings",
                  "rankings",
                  "ipos",
                  "ma",
                  "regulatory",
                  "hedge_funds",
                  "report_repository",
                ].includes(activeTab)
                  ? activeTab
                  : "report_repository") as IntelligenceSubTab
              }
              onSubTabChange={(subTab) => setActiveTab(subTab)}
              stocks={stocks}
              activeTicker={selectedStock}
            />
          </div>
        )}

        {activeTab === "macro" && (
          <MacroBriefingHub
            stocks={stocks}
            onSelectTicker={(symbol) => {
              const matched = stocks.find(
                (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
              );
              if (matched) {
                setSelectedStock(matched);
              } else {
                setSearchQuery(symbol);
                setActiveTab("watchlist");
              }
            }}
          />
        )}

        {activeTab === "war_gov_ufo" && (
          <div className="p-4">
            <WarGovUfoHub
              allStocks={stocks}
              onSelectStock={(stock) => setSelectedStock(stock)}
            />
          </div>
        )}

        {activeTab === "dyson_swarm" && <DysonSwarmHub stocks={stocks} />}
        
        {activeTab === "satellite_map" && <SatelliteMapHub onNavigateTab={handleSelectTab} />}

        {activeTab === "vacancy_empire" && (
          <div className="p-2 sm:p-4 w-full">
            <VacancyEmpireGame />
          </div>
        )}

        {activeTab === "real_estate" && (
          <RealEstateHub
            reitStocks={reitStocks}
            onSelectTab={handleSelectTab}
            onSelectStock={setSelectedStock}
          />
        )}

        {activeTab === "small_business" && <SmallBusinessHub />}

        {activeTab === "credit" && <CreditBuildingHub />}

        {activeTab === "youtube" && <YouTubeHub />}

        {activeTab === "news" && <NewsHub onNavigateTab={handleSelectTab} />}

        {activeTab === "terminal_guide" && (
          <TerminalGuideHub
            onOpenTerminal={handleOpenBloombergTerminal}
            onNavigateTab={handleSelectTab}
          />
        )}
        
        {activeTab === "mit_courses" && <MitCoursesHub />}

        {activeTab === "investopedia" && (
          <div className="p-4">
            <InvestopediaTab
              stocks={stocks}
              initialTicker={selectedStock}
              onSelectStock={(stock) => setSelectedStock(stock)}
            />
          </div>
        )}

        {(activeTab === "ai_insights" || activeTab === "ai_revolution") && (
          <AiRevolutionHub initialTab={activeTab === "ai_insights" ? "intent_engine" : "value_chain"} />
        )}

        {activeTab === "playbooks" && (
          <PlaybooksHub
            onSelectTab={handleSelectTab}
          />
        )}

        {activeTab === "pricing" && (
          <div className="p-4 sm:p-6">
            <ProductStorePricing
              onSelectTab={handleSelectTab}
              onSuccessCheckout={(sessionId) => {
                handleSelectTab("checkout_success");
              }}
            />
          </div>
        )}

        {activeTab === "checkout_success" && (
          <div className="p-4 sm:p-6">
            <CheckoutSuccess onSelectTab={handleSelectTab} />
          </div>
        )}

        {activeTab === "my_bloc" && (
          <MyBlocDashboard
            stocks={stocks}
            onSelectStock={(stk) => {
              setSelectedStock(stk);
              setActiveTab("watchlist");
            }}
            onSelectTab={handleSelectTab}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === "community" && <CommunityHub onOpenAuth={() => setIsAuthOpen(true)} />}

        {activeTab === "brand" && (
          <BrandLandingHub
            onSelectTab={handleSelectTab}
            onOpenLinktree={() => setIsBrandLinktreeOpen(true)}
          />
        )}

        {activeTab === "apple_watch" && (
          <AppleWatchGlanceView
            stocks={stocks}
            onExitWatchMode={() => setActiveTab("watchlist")}
            onSelectStock={(stk) => {
              setSelectedStock(stk);
              setActiveTab("watchlist");
            }}
          />
        )}

        {activeTab === "docs" && <DocsHub />}

        {activeTab === "developers" && <DeveloperPortal onNavigateTab={handleSelectTab} />}
        {activeTab === "developer_earnings" && <DeveloperEarnings onNavigateTab={handleSelectTab} onOpenAuth={() => setIsAuthOpen(true)} />}
        {activeTab === "agents" && <AgentDirectory onNavigateTab={handleSelectTab} />}
        {activeTab === "agent_exchange" && <AgentExchange onNavigateTab={handleSelectTab} onOpenAuth={() => setIsAuthOpen(true)} />}
        {activeTab === "agent_profile" && <AgentProfile onNavigateTab={handleSelectTab} />}
        {activeTab === "agent_feed" && <AgentFeed onNavigateTab={handleSelectTab} />}
        {activeTab === "agent_join" && <AgentLandingPage onNavigate={handleSelectTab} onOpenAuth={() => setIsAuthOpen(true)} />}
        {activeTab === "developer_docs" && <DeveloperDocs onNavigateTab={handleSelectTab} />}
        {activeTab === "web3_dot_btc" && <DotBtcWeb3Hub onNavigateTab={handleSelectTab} />}
        </Suspense>
      </main>

      {/* Institutional Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenLinktree={() => setIsBrandLinktreeOpen(true)}
        onOpenDataStatus={() => setIsDataStatusOpen(true)}
      />

      {/* Floating X / Twitter / Community Action Button */}
      <FloatingCommunityButton />

      <Suspense fallback={null}>
        {/* Full Disclaimer Modal */}
        <DisclaimerModal
          isOpen={isDisclaimerOpen}
          onClose={() => setIsDisclaimerOpen(false)}
        />

      {/* Search Drawer Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-lg bg-neutral-950 border border-white/15 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search BTC, ASML, SKHY, BE, PLPC, POET..."
                  className="w-full bg-transparent text-sm font-medium text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-full bg-white/10 text-neutral-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {stocks
                .filter(
                  (s) =>
                    s.symbol
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .slice(0, 8)
                .map((s, idx) => (
                  <div
                    key={`${s.symbol}-${idx}`}
                    onClick={() => {
                      setSelectedStock(s);
                      setIsSearchOpen(false);
                    }}
                    className="p-3 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-white text-sm block">
                        {s.symbol}
                      </span>
                      <span className="text-xs text-neutral-400">{s.name}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-white">
                      $
                      {s.price >= 1000
                        ? s.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : s.price.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Stock Detail Modal */}
      <StockDetailModal
        stock={selectedStock}
        onClose={() => setSelectedStock(null)}
        onTogglePin={handleTogglePin}
        onShare={handleOpenShareStock}
        onOpenBloombergTerminal={(st) => {
          setSelectedStock(st);
          setIsBloombergTerminalOpen(true);
        }}
        onOpenBrokerages={(st) => handleOpenBrokerage(st)}
      />

      {/* Copilot Drawer Modal */}
      <AiCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        activeTicker={selectedStock?.symbol}
      />

      {/* Stock Bloc Brand Linktree Modal */}
      <BrandLinktreeModal
        isOpen={isBrandLinktreeOpen}
        onClose={() => setIsBrandLinktreeOpen(false)}
      />

      {/* Social Share Snapshot Modal */}
      <SocialShareModal
        stock={shareStock}
        target={shareTarget}
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareStock(null);
          setShareTarget(null);
        }}
      />

      {/* Firebase Authentication & Storage Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <UsernamePromptModal />
      <NewUserOnboardingModal onNavigateTab={handleSelectTab} />

      {/* Pro Subscription Modal */}
      <ProSubscriptionModal
        isOpen={isProSubscriptionOpen}
        onClose={() => setIsProSubscriptionOpen(false)}
        onSelectPlan={(_plan) => {
          setIsProSubscriptionOpen(false);
          handleSelectTab("pricing");
        }}
      />

      {/* SB Terminal Workstation Modal */}
      <BloombergTerminalModal
        isOpen={isBloombergTerminalOpen}
        onClose={handleCloseBloombergTerminal}
        stocks={stocks}
        selectedStock={selectedStock}
      />

      {/* Brokerage Referral Affiliate Network Modal */}
      <BrokerageAffiliateModal
        stock={brokerageStock}
        isOpen={isBrokerageModalOpen}
        onClose={() => setIsBrokerageModalOpen(false)}
      />

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleSelectTab}
        onSelectStock={(stk) => {
          setSelectedStock(stk);
          setActiveTab("watchlist");
        }}
        stocks={stocks}
      />

      {/* Data Status Audit Panel Modal */}
      <DataStatusPanel
        isOpen={isDataStatusOpen}
        onClose={() => setIsDataStatusOpen(false)}
        lastSyncTime={lastSyncTime}
      />

      {/* Stock Bloc Mission & Business Model Hub Modal */}
      <MissionHubModal
        isOpen={isMissionHubOpen}
        onClose={() => setIsMissionHubOpen(false)}
        onSelectTab={handleSelectTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      </Suspense>

      {/* App Launch Splash Overlay with Official Stock Bloc Emblem */}
      <LaunchSplashModal />

      {/* Floating Bottom Navigation */}

      <GlobalDisclaimerBar onOpenDisclaimerModal={() => setIsDisclaimerOpen(true)} />
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenTerminal={handleOpenBloombergTerminal}
        isTerminalOpen={isBloombergTerminalOpen}
      />
    </div>
  );
}

export default App;
