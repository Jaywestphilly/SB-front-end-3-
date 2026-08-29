import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { StockTicker, PricePoint } from "../../types";
import { INITIAL_STOCKS } from "../../data/stocks";
import { getTickerSentiment } from "../../utils/sentiment";
import { formatChartTimestamp, formatYAxisTick, calculateCleanYAxisTicks } from "../../utils/chartFormatters";
import {
  Pin,
  Share2,
  Zap,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Maximize2,
  Star,
  Newspaper,
  ExternalLink,
  Loader2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { TrendSentimentVisualizer } from "../../components/TrendSentimentVisualizer";
import { computeDeterministicSignal, getStockDataFreshness, getSBScoreColor } from "../../utils/signalCalculator";
import { triggerHaptic } from "../../utils/haptics";
import { useUserStore } from "../../stores/userStore";
import { useMarketStore } from "../../stores/marketStore";
import { getDataAgeText } from "../../utils/timeUtils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface StockCardProps {
  stock: StockTicker;
  index?: number;
  onSelect: (stock: StockTicker) => void;
  onTogglePin: (symbol: string) => void;
  onShare: (stock: StockTicker) => void;
  onAiAnalyze: (stock: StockTicker) => void;
  onOpenNewsFeed?: () => void;
  onOpenBrokerages?: (stock: StockTicker) => void;
  onRemove?: (symbol: string) => void;
  isSyncing?: boolean;
}

// Custom Chart Tooltip for Stock Card Area Chart
const CustomCandleTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PricePoint & { open?: number; close?: number; high?: number; low?: number } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isUp = (data.close ?? data.price) >= (data.open ?? data.price);
    const displayPrice = data.close ?? data.price;
    return (
      <div className="bg-[#031322]/95 border border-cyan-500/50 rounded-xl p-2.5 text-xs font-mono shadow-xl backdrop-blur-md z-50 text-white space-y-1">
        <div className="flex items-center justify-between gap-3 text-[10px] text-cyan-400 border-b border-cyan-900/60 pb-1 font-bold">
          <span>{data.time}</span>
          <span
            className={
              isUp
                ? "text-emerald-400 font-extrabold"
                : "text-rose-400 font-extrabold"
            }
          >
            {isUp ? "▲ UP" : "▼ DOWN"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
          <span className="text-neutral-400">
            Price:{" "}
            <strong className="text-white">${typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}</strong>
          </span>
          {data.volume && (
            <span className="text-neutral-400">
              Vol:{" "}
              <strong className="text-cyan-200">{data.volume.toLocaleString()}</strong>
            </span>
          )}
          {data.high && (
            <span className="text-neutral-400">
              High:{" "}
              <strong className="text-emerald-300">
                ${data.high.toFixed(2)}
              </strong>
            </span>
          )}
          {data.low && (
            <span className="text-neutral-400">
              Low:{" "}
              <strong className="text-rose-300">${data.low.toFixed(2)}</strong>
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Generate Heikin-Ashi (平均足) Japanese Candlestick data points for smooth, clean, uniform trend visualization
const generateHeikinAshiCandlesticks = (
  stock: StockTicker,
  targetBars: number = 14
) => {
  const points = stock.history?.["1D"] || [];
  const rawBars: { open: number; close: number; high: number; low: number; time: string }[] = [];

  if (!points || points.length === 0) {
    const spark =
      stock.sparkline && stock.sparkline.length > 0
        ? stock.sparkline
        : [stock.price * 0.98, stock.price * 1.02];
    const step = Math.max(1, Math.floor(spark.length / targetBars));
    for (let i = 0; i < spark.length; i += step) {
      const p = spark[i];
      const prev = i > 0 ? spark[i - step] || p * 0.995 : p * 0.995;
      const open = prev;
      const close = p;
      const spread = Math.max(0.04, open * 0.003);
      rawBars.push({
        open,
        close,
        high: Math.max(open, close) + spread,
        low: Math.min(open, close) - spread,
        time: `T${i + 1}`,
      });
      if (rawBars.length >= targetBars) break;
    }
  } else {
    const chunkSize = Math.max(1, Math.floor(points.length / targetBars));
    for (let i = 0; i < points.length; i += chunkSize) {
      const chunk = points.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;
      const open = chunk[0].price;
      const close = chunk[chunk.length - 1].price;
      const prices = chunk.map((p) => p.price);
      const maxP = Math.max(...prices);
      const minP = Math.min(...prices);
      const spread = Math.max(0.05, open * 0.002);
      rawBars.push({
        open,
        close,
        high: Math.max(maxP, open, close) + spread,
        low: Math.min(minP, open, close) - spread,
        time: chunk[chunk.length - 1].time || `T-${i + 1}`,
      });
      if (rawBars.length >= targetBars) break;
    }
  }

  // Convert Standard OHLC into Heikin-Ashi formulas:
  // HA-Close = (Open + High + Low + Close) / 4
  // HA-Open = (Prev HA-Open + Prev HA-Close) / 2
  const haCandles: {
    open: number;
    close: number;
    high: number;
    low: number;
    isUp: boolean;
    time: string;
  }[] = [];

  let prevHaOpen = rawBars.length > 0 ? (rawBars[0].open + rawBars[0].close) / 2 : 100;
  let prevHaClose = rawBars.length > 0 ? (rawBars[0].open + rawBars[0].high + rawBars[0].low + rawBars[0].close) / 4 : 100;

  for (let i = 0; i < rawBars.length; i++) {
    const raw = rawBars[i];
    const haClose = (raw.open + raw.high + raw.low + raw.close) / 4;
    const haOpen = i === 0 ? (raw.open + raw.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const isUp = haClose >= haOpen;

    // Authentic Japanese Heikin-Ashi wick logic:
    // Pure uptrend has flat base (no lower shadow), pure downtrend has flat top (no upper shadow)
    let haHigh = Math.max(raw.high, haOpen, haClose);
    let haLow = Math.min(raw.low, haOpen, haClose);

    if (isUp) {
      // In a strong uptrend, Heikin-Ashi candle has no lower shadow (flat bottom at haOpen)
      haLow = haOpen;
    } else {
      // In a strong downtrend, Heikin-Ashi candle has no upper shadow (flat top at haOpen)
      haHigh = haOpen;
    }

    haCandles.push({
      open: haOpen,
      close: haClose,
      high: haHigh,
      low: haLow,
      isUp,
      time: raw.time,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return haCandles;
};

// Generate OHLC Candlestick data points for inline chart
const generateCandlestickData = (
  stock: StockTicker,
  timeframe: "1D" | "1W" = "1D",
) => {
  const points = stock.history?.[timeframe] || [];
  const targetBars = 24;
  const candles: {
    time: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    isUp: boolean;
  }[] = [];

  if (!points || points.length === 0) {
    const spark =
      stock.sparkline && stock.sparkline.length > 0
        ? stock.sparkline
        : [stock.price * 0.98, stock.price * 1.02];
    for (let i = 0; i < spark.length; i++) {
      const p = spark[i];
      const prev = i > 0 ? spark[i - 1] : p * 0.995;
      const open = prev;
      const close = p;
      const variance = Math.max(0.05, open * 0.003);
      const high = Math.max(open, close) + variance;
      const low = Math.min(open, close) - variance;
      candles.push({
        time: `T${i + 1}`,
        open,
        close,
        high,
        low,
        volume: Math.floor(1000 + ((i * 350) % 5000)),
        isUp: close >= open,
      });
    }
    return candles;
  }

  const chunkSize = Math.max(1, Math.floor(points.length / targetBars));
  for (let i = 0; i < points.length; i += chunkSize) {
    const chunk = points.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    let open = chunk[0].price;
    let close = chunk[chunk.length - 1].price;
    const prices = chunk.map((p) => p.price);
    const maxP = Math.max(...prices);
    const minP = Math.min(...prices);

    if (Math.abs(close - open) < open * 0.001) {
      const prevClose =
        candles.length > 0 ? candles[candles.length - 1].close : open * 0.998;
      open = prevClose;
      const delta =
        open * 0.003 * ((i % 2 === 0 ? 1 : -1) + Math.sin(i * 1.3) * 0.4);
      close = open + delta;
    }

    const variance = Math.max(0.08, open * 0.0025);
    const high = Math.max(maxP, open, close) + variance;
    const low = Math.min(minP, open, close) - variance;
    const timeLabel = formatChartTimestamp(chunk[chunk.length - 1].time) || `T-${i + 1}`;

    candles.push({
      time: timeLabel,
      open,
      close,
      high,
      low,
      volume: chunk.reduce((sum, p) => sum + (p.volume || 100), 0),
      isUp: close >= open,
    });
  }

  return candles;
};

interface StockHeadline {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: "bullish" | "bearish" | "neutral";
  url?: string;
}

const fetchHeadlines = async (
  stock: StockTicker,
): Promise<StockHeadline[]> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (stock.headlines && stock.headlines.length > 0) {
    return stock.headlines.map((item, idx) => ({
      id: `hl-live-${idx}`,
      title: item.title,
      source: item.source || "SB Terminal",
      time: item.time || "Today",
      sentiment: (item.sentiment?.toLowerCase() === "positive" || item.sentiment?.toLowerCase() === "bullish" ? "bullish" : item.sentiment?.toLowerCase() === "negative" || item.sentiment?.toLowerCase() === "bearish" ? "bearish" : "neutral"),
      url: item.url,
    }));
  }

  if (stock.news && stock.news.length > 0) {
    return stock.news.slice(0, 3).map((item, idx) => ({
      id: `news-${idx}`,
      title: item.title,
      source: item.source || "SB Terminal",
      time: item.time || "Today",
      sentiment: (item.sentiment?.toLowerCase() === "positive" || item.sentiment?.toLowerCase() === "bullish" ? "bullish" : item.sentiment?.toLowerCase() === "negative" || item.sentiment?.toLowerCase() === "bearish" ? "bearish" : "neutral"),
      url: item.url,
    }));
  }

  const sentiment = getTickerSentiment(stock.symbol, stock);
  if (sentiment.headlines && sentiment.headlines.length > 0) {
    return sentiment.headlines.slice(0, 3).map((h) => ({
      id: h.id,
      title: h.title,
      source: h.source,
      time: h.timeAgo,
      sentiment: h.sentiment.toLowerCase() as "bullish" | "bearish" | "neutral",
      url: h.url,
    }));
  }

  return [];
};

// Volatility helper
const getStockVolatility = (stk: StockTicker): number => {
  const weekPrices = stk.history?.["1W"]?.map((p) => p.price);
  const prices =
    weekPrices && weekPrices.length >= 2
      ? weekPrices
      : stk.sparkline && stk.sparkline.length >= 2
        ? stk.sparkline
        : [stk.price * 0.98, stk.price * 1.02];

  const min7d = Math.min(...prices, stk.price);
  const max7d = Math.max(...prices, stk.price);
  return ((max7d - min7d) / (min7d || 1)) * 100;
};

// Calculate sector averages statically using INITIAL_STOCKS
const SECTOR_VOLATILITY_AVERAGES = (() => {
  const sectors: Record<string, { total: number; count: number }> = {};
  if (typeof INITIAL_STOCKS !== "undefined" && Array.isArray(INITIAL_STOCKS)) {
    INITIAL_STOCKS.forEach((stk) => {
      const vol = getStockVolatility(stk);
      const cat = stk.category;
      if (!sectors[cat]) {
        sectors[cat] = { total: 0, count: 0 };
      }
      sectors[cat].total += vol;
      sectors[cat].count += 1;
    });
  }

  const averages: Record<string, number> = {};
  Object.keys(sectors).forEach((cat) => {
    averages[cat] = sectors[cat].total / (sectors[cat].count || 1);
  });
  return averages;
})();

export const StockCard: React.FC<StockCardProps> = React.memo(({
  stock,
  index = 0,
  onSelect,
  onTogglePin,
  onShare,
  onAiAnalyze,
  onOpenNewsFeed,
  onOpenBrokerages,
  onRemove,
  isSyncing,
}) => {
  const { marketDataUpdatedAt, marketDataIsStale, watchlistChartStyle } = useMarketStore();
  const [dragOffset, setDragOffset] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [priceFlashState, setPriceFlashState] = useState<"up" | "down" | null>(
    null,
  );
  const prevPriceRef = useRef<number>(stock?.price || 0);
  const { starredTickers, toggleStarredTicker } = useUserStore();
  const isStarred = starredTickers.includes(stock.symbol);

  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  const handleQuickSaveToPortfolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("success");
    try {
      const rawPositions = localStorage.getItem("stockbloc_portfolio_positions");
      let currentPositions: Array<{
        id: string;
        symbol: string;
        shares: number;
        avgCost: number;
        targetPrice?: number;
        notes?: string;
      }> = rawPositions ? JSON.parse(rawPositions) : [];

      const targetSym = stock.symbol.toUpperCase();
      const existingIdx = currentPositions.findIndex((p) => p.symbol.toUpperCase() === targetSym);

      if (existingIdx >= 0) {
        currentPositions[existingIdx] = {
          ...currentPositions[existingIdx],
          shares: currentPositions[existingIdx].shares + 1,
          notes: `Added 1 share from Watchlist (${new Date().toLocaleDateString()})`,
        };
      } else {
        currentPositions.push({
          id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          symbol: targetSym,
          shares: 1,
          avgCost: stock.price,
          targetPrice: Math.round(stock.price * 1.25 * 100) / 100,
          notes: `Saved from Watchlist (${new Date().toLocaleDateString()})`,
        });
      }

      localStorage.setItem("stockbloc_portfolio_positions", JSON.stringify(currentPositions));
      window.dispatchEvent(new Event("stockbloc_portfolio_updated"));

      setSaveSuccessToast(`Saved ${stock.symbol} to My Bloc Portfolio!`);
      setTimeout(() => setSaveSuccessToast(null), 2000);
    } catch (err) {
      console.error("Failed to save position", err);
    }
  };

  const ROBINHOOD_REFERRAL_URL = "https://join.robinhood.com/jumannc3";

  const handleQuickTradeRobinhood = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("success");
    window.open(ROBINHOOD_REFERRAL_URL, "_blank");
  };

  const isPositive = (stock.changePercent ?? 0) >= 0;
  const isHighVolatility = Math.abs(stock.changePercent ?? 0) >= 3;

  const isGold =
    stock.theme === "gold" ||
    stock.theme === "golden" ||
    stock.cardColor === "gold" ||
    stock.cardColor === "golden" ||
    stock.color === "gold" ||
    stock.color === "golden" ||
    stock.symbol.toUpperCase() === "GLD" ||
    stock.symbol.toUpperCase() === "GOLD" ||
    stock.symbol.toUpperCase() === "XAU-USD" ||
    (typeof stock.name === "string" && stock.name.toLowerCase().includes("gold trust"));

  const isSilver =
    stock.theme === "silver" ||
    stock.cardColor === "silver" ||
    stock.color === "silver" ||
    stock.symbol.toUpperCase() === "SLV" ||
    stock.symbol.toUpperCase() === "SILVER" ||
    stock.symbol.toUpperCase() === "XAG-USD" ||
    (typeof stock.name === "string" && stock.name.toLowerCase().includes("silver trust"));

  const isCopper =
    stock.theme === "copper" ||
    stock.cardColor === "copper" ||
    stock.color === "copper" ||
    stock.symbol.toUpperCase() === "CPER" ||
    stock.symbol.toUpperCase() === "COPPER" ||
    stock.symbol.toUpperCase() === "HG=F" ||
    (typeof stock.name === "string" && stock.name.toLowerCase().includes("copper fund"));

  const isPurple =
    stock.theme === "purple" ||
    stock.cardColor === "purple" ||
    stock.color === "purple" ||
    stock.symbol.toUpperCase() === "DOT" ||
    stock.symbol.toUpperCase() === "DOT-USD" ||
    (typeof stock.name === "string" && stock.name.toLowerCase().includes("polkadot"));

  const isOrange =
    stock.theme === "orange" ||
    stock.theme === "bitcoin" ||
    stock.cardColor === "orange" ||
    stock.cardColor === "bitcoin" ||
    stock.color === "orange" ||
    stock.color === "bitcoin" ||
    stock.symbol.toUpperCase() === "BTC" ||
    stock.symbol.toUpperCase() === "BTC-USD" ||
    stock.symbol.toUpperCase() === "WBTC" ||
    stock.symbol.toUpperCase() === "IBIT" ||
    (typeof stock.name === "string" && (stock.name.toLowerCase().includes("bitcoin") || stock.name.toLowerCase().includes("btc")));

  // Determine vibrant, high-contrast Metallic / Purple / Orange (Bitcoin) / Green / Red card styling
  const cardTheme = useMemo(() => {
    const isLiveUpFlash = priceFlashState === "up";
    const isLiveDownFlash = priceFlashState === "down";

    if (isOrange) {
      // CUSTOM BITCOIN ORANGE CARD THEME (e.g. Bitcoin BTC-USD)
      const baseRgb = "247, 147, 26"; // iconic bitcoin orange (#f7931a)
      const glowRgb = "255, 170, 51"; // amber-orange (#ffaa33)
      const deepRgb = "154, 52, 18"; // orange-900 (#9a3412)
      const darkOrangeRgb = "194, 65, 12"; // orange-700 (#c2410c)

      const effectiveOpacity = isLiveUpFlash || isLiveDownFlash ? 0.48 : 0.35;

      return {
        isPositive: isPositive,
        isCustom: true,
        background: `radial-gradient(ellipse at 35% 50%, rgba(${baseRgb}, ${effectiveOpacity * 1.5}) 0%, rgba(${deepRgb}, ${effectiveOpacity * 0.8}) 60%, rgba(26, 12, 2, 0.95) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(255, 170, 51, 0.98)"
          : stock.isPinned
            ? "rgba(255, 170, 51, 0.92)"
            : "rgba(247, 147, 26, 0.75)",
        boxShadow: stock.isPinned
          ? `0 0 28px rgba(${glowRgb}, 0.50), inset 0 0 20px rgba(${darkOrangeRgb}, 0.30)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 0 36px rgba(${glowRgb}, 0.70), inset 0 0 24px rgba(${glowRgb}, 0.40)`
            : `0 0 24px rgba(${baseRgb}, 0.35), inset 0 0 16px rgba(${baseRgb}, 0.18)`,
      };
    }

    if (isGold) {
      // CUSTOM GOLD / GOLDEN CARD THEME (e.g. SPDR Gold Shares GLD)
      const baseRgb = "245, 158, 11"; // amber-500 (#f59e0b)
      const glowRgb = "251, 191, 36"; // amber-400 (#fbbf24)
      const deepRgb = "120, 53, 15"; // amber-900 (#78350f)
      const darkGoldRgb = "180, 83, 9"; // amber-700

      const effectiveOpacity = isLiveUpFlash || isLiveDownFlash ? 0.45 : 0.32;

      return {
        isPositive: isPositive,
        isCustom: true,
        background: `radial-gradient(ellipse at 35% 50%, rgba(${baseRgb}, ${effectiveOpacity * 1.5}) 0%, rgba(${deepRgb}, ${effectiveOpacity * 0.8}) 60%, rgba(26, 16, 3, 0.95) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(252, 211, 77, 0.95)"
          : stock.isPinned
            ? "rgba(251, 191, 36, 0.90)"
            : "rgba(245, 158, 11, 0.70)",
        boxShadow: stock.isPinned
          ? `0 0 28px rgba(${glowRgb}, 0.50), inset 0 0 20px rgba(${darkGoldRgb}, 0.28)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 0 34px rgba(${glowRgb}, 0.65), inset 0 0 24px rgba(${glowRgb}, 0.35)`
            : `0 0 24px rgba(${baseRgb}, 0.30), inset 0 0 16px rgba(${baseRgb}, 0.15)`,
      };
    }

    if (isSilver) {
      // CUSTOM SILVER / PLATINUM CARD THEME (e.g. iShares Silver Trust SLV)
      const baseRgb = "203, 213, 225"; // slate-300 (#cbd5e1)
      const glowRgb = "248, 250, 252"; // slate-50 (#f8fafc)
      const deepRgb = "51, 65, 85"; // slate-700 (#334155)
      const darkSilverRgb = "100, 116, 139"; // slate-500

      const effectiveOpacity = isLiveUpFlash || isLiveDownFlash ? 0.45 : 0.32;

      return {
        isPositive: isPositive,
        isCustom: true,
        background: `radial-gradient(ellipse at 35% 50%, rgba(226, 232, 240, ${effectiveOpacity * 1.4}) 0%, rgba(${deepRgb}, ${effectiveOpacity * 0.9}) 60%, rgba(15, 23, 42, 0.95) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(255, 255, 255, 0.98)"
          : stock.isPinned
            ? "rgba(248, 250, 252, 0.90)"
            : "rgba(203, 213, 225, 0.70)",
        boxShadow: stock.isPinned
          ? `0 0 26px rgba(${glowRgb}, 0.45), inset 0 0 20px rgba(${darkSilverRgb}, 0.25)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 0 32px rgba(${glowRgb}, 0.6), inset 0 0 22px rgba(${glowRgb}, 0.3)`
            : `0 0 22px rgba(${baseRgb}, 0.25), inset 0 0 16px rgba(${baseRgb}, 0.12)`,
      };
    }

    if (isCopper) {
      // CUSTOM COPPER / BRONZE CARD THEME (e.g. United States Copper Fund CPER)
      const baseRgb = "234, 88, 12"; // orange-600 (#ea580c)
      const glowRgb = "251, 146, 60"; // orange-400 (#fb923c)
      const deepRgb = "124, 45, 18"; // orange-900 (#7c2d12)
      const darkCopperRgb = "194, 65, 12"; // orange-700

      const effectiveOpacity = isLiveUpFlash || isLiveDownFlash ? 0.45 : 0.32;

      return {
        isPositive: isPositive,
        isCustom: true,
        background: `radial-gradient(ellipse at 35% 50%, rgba(${baseRgb}, ${effectiveOpacity * 1.5}) 0%, rgba(${deepRgb}, ${effectiveOpacity * 0.8}) 60%, rgba(28, 10, 4, 0.95) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(253, 186, 116, 0.95)"
          : stock.isPinned
            ? "rgba(251, 146, 60, 0.90)"
            : "rgba(234, 88, 12, 0.70)",
        boxShadow: stock.isPinned
          ? `0 0 28px rgba(${glowRgb}, 0.48), inset 0 0 20px rgba(${darkCopperRgb}, 0.28)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 0 34px rgba(${glowRgb}, 0.65), inset 0 0 24px rgba(${glowRgb}, 0.35)`
            : `0 0 22px rgba(${baseRgb}, 0.28), inset 0 0 16px rgba(${baseRgb}, 0.14)`,
      };
    }

    if (isPurple) {
      // CUSTOM PURPLE CARD THEME (e.g. Polkadot DOT)
      const baseRgb = "168, 85, 247"; // purple-500 (#a855f7)
      const glowRgb = "217, 70, 239"; // fuchsia-500 (#d946ef)
      const deepRgb = "88, 28, 135"; // purple-900 (#581c87)
      const darkVioletRgb = "147, 51, 234"; // purple-600 (#9333ea)

      const effectiveOpacity = isLiveUpFlash || isLiveDownFlash ? 0.45 : 0.30;

      return {
        isPositive: isPositive,
        isCustom: true,
        background: `radial-gradient(ellipse at 35% 50%, rgba(${baseRgb}, ${effectiveOpacity * 1.5}) 0%, rgba(${deepRgb}, ${effectiveOpacity * 0.8}) 60%, rgba(22, 6, 36, 0.94) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(232, 121, 249, 0.95)"
          : stock.isPinned
            ? "rgba(217, 70, 239, 0.90)"
            : "rgba(168, 85, 247, 0.65)",
        boxShadow: stock.isPinned
          ? `0 0 26px rgba(${glowRgb}, 0.45), inset 0 0 20px rgba(${darkVioletRgb}, 0.25)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 0 32px rgba(${glowRgb}, 0.6), inset 0 0 22px rgba(${glowRgb}, 0.3)`
            : `0 0 22px rgba(${baseRgb}, 0.25), inset 0 0 16px rgba(${baseRgb}, 0.12)`,
      };
    }

    if (isPositive) {
      // POSITIVE GAINER (GREEN)
      const baseRgb = "16, 185, 129"; // emerald-500 (#10b981)
      const glowRgb = "0, 255, 136"; // cyan-emerald (#00ff88)
      const deepRgb = "4, 120, 87"; // emerald-700
      
      // Dynamic depth scaling based on magnitude of gain
      const gainIntensity = Math.min(0.26, 0.10 + Math.min(6, Math.max(0, stock.changePercent)) * 0.025);
      const effectiveOpacity = isLiveUpFlash ? 0.38 : gainIntensity;

      return {
        isPositive: true,
        isCustom: false,
        background: `radial-gradient(ellipse at 35% 50%, rgba(${baseRgb}, ${effectiveOpacity * 1.5}) 0%, rgba(${deepRgb}, ${effectiveOpacity * 0.6}) 60%, rgba(3, 20, 14, 0.92) 100%)`,
        borderColor: isLiveUpFlash
          ? "rgba(52, 211, 153, 0.95)"
          : stock.isPinned
            ? "rgba(0, 255, 136, 0.85)"
            : "rgba(16, 185, 129, 0.45)",
        boxShadow: stock.isPinned
          ? `0 0 25px rgba(${glowRgb}, 0.35), inset 0 0 20px rgba(${glowRgb}, 0.15)`
          : isLiveUpFlash
            ? `0 0 32px rgba(${glowRgb}, 0.5), inset 0 0 20px rgba(${glowRgb}, 0.25)`
            : `0 0 20px rgba(${baseRgb}, 0.15), inset 0 0 15px rgba(${baseRgb}, 0.08)`,
      };
    } else {
      // NEGATIVE LOSER (RED)
      const baseRgb = "239, 68, 68"; // rose-500 (#ef4444)
      const glowRgb = "255, 0, 85"; // rose-neon (#ff0055)
      const deepRgb = "190, 18, 60"; // rose-700
      
      // Dynamic depth scaling based on magnitude of drop
      const dropIntensity = Math.min(0.26, 0.10 + Math.min(6, Math.max(0, Math.abs(stock.changePercent))) * 0.025);
      const effectiveOpacity = isLiveDownFlash ? 0.38 : dropIntensity;

      return {
        isPositive: false,
        isCustom: false,
        background: `radial-gradient(ellipse at 35% 50%, rgba(${baseRgb}, ${effectiveOpacity * 1.5}) 0%, rgba(${deepRgb}, ${effectiveOpacity * 0.6}) 60%, rgba(28, 4, 10, 0.92) 100%)`,
        borderColor: isLiveDownFlash
          ? "rgba(251, 113, 133, 0.95)"
          : stock.isPinned
            ? "rgba(255, 0, 85, 0.85)"
            : "rgba(239, 68, 68, 0.45)",
        boxShadow: stock.isPinned
          ? `0 0 25px rgba(${glowRgb}, 0.35), inset 0 0 20px rgba(${glowRgb}, 0.15)`
          : isLiveDownFlash
            ? `0 0 32px rgba(${glowRgb}, 0.5), inset 0 0 20px rgba(${glowRgb}, 0.25)`
            : `0 0 20px rgba(${baseRgb}, 0.15), inset 0 0 15px rgba(${baseRgb}, 0.08)`,
      };
    }
  }, [isPositive, isGold, isSilver, isCopper, isPurple, isOrange, stock.changePercent, stock.isPinned, priceFlashState]);

  // Volatility calculation for the 7D variance badge
  const volatilityOverlay = useMemo(() => {
    const stockVol = getStockVolatility(stock);
    const cat = stock.category;
    const sectorAvgVol = SECTOR_VOLATILITY_AVERAGES[cat] || 5;
    const relVol = stockVol / (sectorAvgVol || 1);
    
    let text = "1.0x (Avg)";
    let textColor = "text-cyan-400/80";

    if (relVol > 1.3) {
      text = `${relVol.toFixed(1)}x (High)`;
      textColor = "text-rose-400";
    } else if (relVol > 1.05) {
      text = `${relVol.toFixed(1)}x (Elevated)`;
      textColor = "text-amber-400";
    } else if (relVol < 0.75) {
      text = `${relVol.toFixed(1)}x (Stable)`;
      textColor = "text-emerald-400";
    } else {
      text = `${relVol.toFixed(1)}x (Normal)`;
      textColor = "text-cyan-400/80";
    }

    return {
      relVolText: text,
      relVolColor: textColor,
      relVolValue: relVol,
    };
  }, [stock]);

  // Trigger subtle green/red background flash animation and haptic/shake on live price updates during sync
  useEffect(() => {
    if (prevPriceRef.current !== stock.price) {
      const isUp = stock.price > prevPriceRef.current;
      const priceDiffPercent =
        Math.abs((stock.price - prevPriceRef.current) / (prevPriceRef.current || 1)) *
        100;

      setPriceFlashState(isUp ? "up" : "down");
      const flashTimer = setTimeout(() => {
        setPriceFlashState(null);
      }, 1200);

      if (priceDiffPercent >= 3 || isHighVolatility) {
        setIsShaking(true);
        triggerHaptic("warning");
        const shakeTimer = setTimeout(() => setIsShaking(false), 800);
        prevPriceRef.current = stock.price;
        return () => {
          clearTimeout(shakeTimer);
          clearTimeout(flashTimer);
        };
      }

      prevPriceRef.current = stock.price;
      return () => clearTimeout(flashTimer);
    }
  }, [stock.price, stock.changePercent, isHighVolatility]);

  // SVG Mini Candlestick or Line Chart for 24-hour price trend
  const renderSparkline = () => {
    // Prefer 24h intraday history ('1D'), or fallback to stock.sparkline
    const dayHistoryPrices = stock.history?.["1D"]?.map((p) => p.price);
    const rawData =
      dayHistoryPrices && dayHistoryPrices.length >= 2
        ? dayHistoryPrices
        : stock.sparkline && stock.sparkline.length >= 2
          ? stock.sparkline
          : [];

    if (!rawData || rawData.length < 2) return null;

    const chartWidth = 100;
    const chartHeight = 32;
    const padY = 3.0;
    const padX = 4;

    const trendIsPositive = stock.changePercent >= 0;
    const minVal = Math.min(...rawData);
    const maxVal = Math.max(...rawData);
    const range = maxVal - minVal || 1;
    const lineColor = isOrange
      ? "#f7931a"
      : isGold
        ? "#fbbf24"
        : isSilver
          ? "#e2e8f0"
          : isCopper
            ? "#fb923c"
            : isPurple
              ? "#d946ef"
              : trendIsPositive
                ? "#00ff88"
                : "#ff3b3b";

    // HEIKIN-ASHI JAPANESE CANDLESTICK MODE (Selectable Option)
    if (watchlistChartStyle === "candlestick") {
      const candles = generateHeikinAshiCandlesticks(stock, 14);
      const minCandle = Math.min(...candles.map((c) => c.low));
      const maxCandle = Math.max(...candles.map((c) => c.high));
      const candleRange = maxCandle - minCandle || 1;
      const candlePadY = 2.5;
      const slotWidth = (chartWidth - 2 * padX) / Math.max(1, candles.length);
      const barWidth = 4.2;

      return (
        <div
          className="relative w-[100px] h-[32px] flex items-center justify-center overflow-visible shrink-0 group/sparkline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("selection");
            onSelect(stock);
          }}
          title={`24H Heikin-Ashi (平均足) Candlesticks • ${candles.length} Bars (H: $${maxCandle.toFixed(2)} L: $${minCandle.toFixed(2)}) • Tap to view chart`}
        >
          {/* Dotted 24h Price Baseline */}
          <div className="absolute w-full border-t border-dashed border-cyan-900/40 top-1/2 pointer-events-none z-0" />

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible z-10"
          >
            <defs>
              <linearGradient id={`ha-up-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e676" stopOpacity="1" />
                <stop offset="100%" stopColor="#00b862" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id={`ha-dn-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4d4d" stopOpacity="1" />
                <stop offset="100%" stopColor="#d32f2f" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {candles.map((c, idx) => {
              const xCenter = padX + idx * slotWidth + slotWidth / 2;
              const yHigh =
                chartHeight - candlePadY - ((c.high - minCandle) / candleRange) * (chartHeight - 2 * candlePadY);
              const yLow =
                chartHeight - candlePadY - ((c.low - minCandle) / candleRange) * (chartHeight - 2 * candlePadY);
              const yOpen =
                chartHeight - candlePadY - ((c.open - minCandle) / candleRange) * (chartHeight - 2 * candlePadY);
              const yClose =
                chartHeight - candlePadY - ((c.close - minCandle) / candleRange) * (chartHeight - 2 * candlePadY);

              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2.2, Math.abs(yClose - yOpen));
              const candleFill = c.isUp ? `url(#ha-up-${stock.symbol})` : `url(#ha-dn-${stock.symbol})`;
              const wickColor = c.isUp ? "#00e676" : "#ff4d4d";

              return (
                <g key={`ha-${idx}`} className="transition-opacity hover:opacity-100 opacity-95">
                  {/* High/Low Japanese Candlestick Center Wick */}
                  <line
                    x1={xCenter}
                    y1={yHigh}
                    x2={xCenter}
                    y2={yLow}
                    stroke={wickColor}
                    strokeWidth="1.0"
                    strokeLinecap="round"
                    strokeOpacity="0.85"
                  />
                  {/* Crisp Uniform Candlestick Body */}
                  <rect
                    x={xCenter - barWidth / 2}
                    y={bodyTop}
                    width={barWidth}
                    height={bodyHeight}
                    fill={candleFill}
                    stroke={wickColor}
                    strokeWidth="0.4"
                    strokeOpacity="0.9"
                    rx="0.5"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    // LINE MODE (Default: Clean, Crisp, High-Contrast Glow Chart)
    const linePoints = rawData.map((val, idx) => {
      const x =
        padX + (idx / Math.max(1, rawData.length - 1)) * (chartWidth - 2 * padX);
      const y =
        chartHeight - padY - ((val - minVal) / range) * (chartHeight - 2 * padY);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const lineD = `M ${linePoints.join(" L ")}`;
    const areaD = `${lineD} L ${chartWidth - padX} ${chartHeight - padY} L ${padX} ${chartHeight - padY} Z`;
    const lastX = padX + (chartWidth - 2 * padX);
    const lastY =
      chartHeight -
      padY -
      ((rawData[rawData.length - 1] - minVal) / range) *
        (chartHeight - 2 * padY);

    return (
      <div
        className="relative w-[100px] h-[32px] flex items-center justify-center overflow-visible shrink-0 group/sparkline cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic("selection");
          onSelect(stock);
        }}
        title="24H Price Trend • Tap to open full chart"
      >
        {/* Dotted 24h Price Baseline */}
        <div className="absolute w-full border-t border-dashed border-cyan-900/50 top-1/2 pointer-events-none z-0" />

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible z-10"
        >
          <defs>
            <linearGradient
              id={`sparkGrad-${stock.symbol}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.38" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id={`glow-${stock.symbol}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor={lineColor} floodOpacity="0.6" />
            </filter>
          </defs>
          <path d={areaD} fill={`url(#sparkGrad-${stock.symbol})`} />
          <path
            d={lineD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.0"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${stock.symbol})`}
          />
          {/* Live Price End-Point Marker */}
          <circle
            cx={lastX}
            cy={lastY}
            r="2.5"
            fill={lineColor}
            className="animate-pulse"
          />
          <circle
            cx={lastX}
            cy={lastY}
            r="4.5"
            fill="none"
            stroke={lineColor}
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
        </svg>
      </div>
    );
  };

  // 7-Day Market Variance & Volatility Range Bar Indicator
  const render7DVariance = () => {
    const weekPrices = stock.history?.["1W"]?.map((p) => p.price);
    const prices =
      weekPrices && weekPrices.length >= 2
        ? weekPrices
        : stock.sparkline && stock.sparkline.length >= 2
          ? stock.sparkline
          : [stock.price * 0.98, stock.price * 1.02];

    const min7d = Math.min(...prices, stock.price);
    const max7d = Math.max(...prices, stock.price);
    const range = max7d - min7d || 1;

    // Position of current price within 7D range (0% to 100%)
    const currentPosPct = Math.min(
      100,
      Math.max(0, ((stock.price - min7d) / range) * 100),
    );

    // 7-day variance spread %
    const variancePct = ((max7d - min7d) / min7d) * 100;

    // Color gradient based on volatility severity
    let barGradient = "from-emerald-500 via-teal-400 to-cyan-400";
    let badgeColor = "text-emerald-300 border-emerald-500/40 bg-emerald-950/70";

    if (variancePct >= 8) {
      barGradient = "from-amber-500 via-rose-500 to-red-500";
      badgeColor = "text-rose-300 border-rose-500/50 bg-rose-950/80";
    } else if (variancePct >= 4) {
      barGradient = "from-emerald-400 via-amber-400 to-amber-500";
      badgeColor = "text-amber-300 border-amber-500/50 bg-amber-950/70";
    }

    return (
      <div
        className="hidden sm:flex flex-col items-center justify-center shrink-0 group/var"
        title={`7-Day Volatility Range: $${min7d.toFixed(2)} $${max7d.toFixed(2)} (±${variancePct.toFixed(1)}% variance spread)`}
      >
        <div className="flex items-center justify-between w-[80px] text-[8px] font-mono font-bold leading-none mb-0.5">
          <span className="text-cyan-400/80 tracking-tighter">7D VAR</span>
          <span
            className={`px-2 py-0.5 border alien-block-cut-sm font-black text-[8px] ${badgeColor}`}
          >
            ±{variancePct.toFixed(1)}%
          </span>
        </div>

        {/* Color-coded 7-Day Variance Range Bar */}
        <div className="relative w-[80px] h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-visible my-0.5">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${barGradient} opacity-85`}
          />

          {/* Position Indicator Pin for current price */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white border border-neutral-900 shadow-md shadow-black transition-all duration-300 z-10"
            style={{ left: `${currentPosPct}%` }}
          />
        </div>

        <div className="flex justify-between w-[80px] text-[7.5px] font-mono text-cyan-500/70 leading-none">
          <span>${min7d < 100 ? min7d.toFixed(1) : Math.round(min7d)}</span>
          <span>${max7d < 100 ? max7d.toFixed(1) : Math.round(max7d)}</span>
        </div>
        <div
          className={`mt-1 text-[7px] font-mono font-bold leading-none tracking-tighter ${volatilityOverlay.relVolColor}`}
          title="Stock volatility multiplier relative to its sector average"
        >
          RelVol: {volatilityOverlay.relVolText}
        </div>
      </div>
    );
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -160 && onRemove) {
      if (stock.isPinned) {
        setIsShaking(true);
        triggerHaptic("warning");
        setTimeout(() => setIsShaking(false), 500);
        setDragOffset(0);
        return;
      }
      // Full swipe-to-delete threshold reached
      triggerHaptic("warning");
      onRemove(stock.symbol);
    } else if (info.offset.x < -40) {
      // Reveal action buttons including red Remove button
      setDragOffset(onRemove ? -210 : -130);
      triggerHaptic("medium");
    } else if (info.offset.x > 50) {
      triggerHaptic("selection");
      onTogglePin(stock.symbol);
      setDragOffset(0);
    } else {
      setDragOffset(0);
    }
  };

  // Determine performance category for dynamic holographic border glow (gold, silver, copper, purple, orange/bitcoin, surge, bullish, bearish)
  const getPerformanceHoloClass = (changePct: number, category?: string) => {
    if (isOrange) {
      return "holo-card-orange";
    }
    if (isGold) {
      return "holo-card-gold";
    }
    if (isSilver) {
      return "holo-card-silver";
    }
    if (isCopper) {
      return "holo-card-copper";
    }
    if (isPurple) {
      return "holo-card-purple";
    }
    if (changePct >= 3.0 || category === "tsunami") {
      return "holo-card-surge";
    }
    if (changePct >= 0) {
      return "holo-card-bullish";
    }
    return "holo-card-bearish";
  };

  const holoGlowClass = getPerformanceHoloClass(
    stock.changePercent,
    stock.category,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: -10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96, x: -20, filter: "blur(4px)" }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.035, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="StockCard relative w-full overflow-hidden my-0.5 select-none group/card-wrapper"
    >
      {/* Sleek Data Stream Edge Accent Beam */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[2px] transition-opacity duration-300 pointer-events-none z-20 ${
          isOrange
            ? "bg-gradient-to-b from-orange-400 via-amber-400 to-orange-600/0 opacity-95 group-hover/card-wrapper:opacity-100"
            : isGold
              ? "bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600/0 opacity-90 group-hover/card-wrapper:opacity-100"
              : isSilver
                ? "bg-gradient-to-b from-slate-200 via-white to-slate-400/0 opacity-90 group-hover/card-wrapper:opacity-100"
                : isCopper
                  ? "bg-gradient-to-b from-orange-400 via-amber-500 to-orange-700/0 opacity-90 group-hover/card-wrapper:opacity-100"
                  : isPurple
                    ? "bg-gradient-to-b from-purple-400 via-fuchsia-400 to-purple-600/0 opacity-80 group-hover/card-wrapper:opacity-100"
                    : isPositive
                      ? "bg-gradient-to-b from-emerald-400 via-teal-300 to-emerald-600/0 opacity-60 group-hover/card-wrapper:opacity-100"
                      : "bg-gradient-to-b from-rose-500 via-red-400 to-rose-600/0 opacity-60 group-hover/card-wrapper:opacity-100"
        }`}
      />

      {/* Hidden Swipe Actions Background */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2 z-0">
        <button
          onClick={handleQuickSaveToPortfolio}
          className="w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 flex items-center justify-center hover:bg-emerald-900 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          title="Save 1 Share to Portfolio Tracker"
        >
          <Briefcase className="w-4 h-4 text-emerald-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("selection");
            onShare(stock);
            setDragOffset(0);
          }}
          className="w-9 h-9 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center hover:bg-neutral-700 active:scale-95 transition-all"
          title="Share Card"
        >
          <Share2 className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("selection");
            onTogglePin(stock.symbol);
            setDragOffset(0);
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
            stock.isPinned
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-neutral-800 text-neutral-300"
          }`}
          title="Pin Stock"
        >
          <Pin className="w-4 h-4" />
        </button>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (stock.isPinned) {
                setIsShaking(true);
                triggerHaptic("warning");
                setTimeout(() => setIsShaking(false), 500);
                return;
              }
              triggerHaptic("warning");
              onRemove(stock.symbol);
              setDragOffset(0);
            }}
            className="h-9 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs border border-rose-400/40 flex items-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
            title="Remove from Watchlist"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Main Draggable iOS Glass Stock Card Row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: onRemove ? -220 : -130, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileHover={{
          scale: 1.01,
          y: -1,
          transition: { type: "spring", stiffness: 500, damping: 18 },
        }}
        whileTap={{
          scale: 0.98,
          transition: { type: "spring", stiffness: 600, damping: 14 },
        }}
        animate={{ x: dragOffset }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        onClick={() => {
          triggerHaptic("light");
          if (stock.isPinned) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
          }
          if (dragOffset !== 0) {
            setDragOffset(0);
          } else {
            onSelect(stock);
          }
        }}
        className={`relative z-10 w-full px-4 py-3 alien-block-cut alien-card my-1 transition-all duration-200 cursor-pointer ${holoGlowClass} ${
          stock.isPinned ? "alien-card-active" : ""
        } ${
          isShaking ? "ring-2 ring-amber-400 bg-amber-950/20 animate-shake-card" : ""
        } ${
          priceFlashState === "up"
            ? "price-flash-up"
            : priceFlashState === "down"
              ? "price-flash-down"
              : ""
        } ${isSyncing ? "glitch-border-refresh terminal-refresh-flash" : ""}`}
        style={{
          background: cardTheme.background,
          borderColor: cardTheme.borderColor,
          boxShadow: cardTheme.boxShadow,
        }}
      >
        {/* Subtle Live Price Update Background Flash Animation Overlay */}
        <AnimatePresence>
          {priceFlashState && (
            <motion.div
              key={`price-flash-bg-${priceFlashState}-${stock.price}`}
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-0 pointer-events-none z-0 rounded-[inherit] ${
                isOrange
                  ? "bg-gradient-to-r from-orange-500/45 via-amber-400/35 to-orange-600/45"
                  : isGold
                    ? "bg-gradient-to-r from-amber-500/40 via-yellow-400/30 to-amber-600/40"
                    : isSilver
                      ? "bg-gradient-to-r from-slate-300/40 via-white/30 to-slate-400/40"
                      : isCopper
                        ? "bg-gradient-to-r from-orange-500/40 via-amber-400/30 to-orange-600/40"
                        : isPurple
                          ? "bg-gradient-to-r from-purple-500/40 via-fuchsia-400/30 to-purple-600/40"
                          : priceFlashState === "up"
                            ? "bg-gradient-to-r from-emerald-500/35 via-emerald-400/25 to-teal-500/35 price-flash-bg-green"
                            : "bg-gradient-to-r from-rose-500/35 via-red-400/25 to-rose-600/35 price-flash-bg-red"
              }`}
            />
          )}
        </AnimatePresence>

        {/* Corner HUD Ticks */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {saveSuccessToast && (
          <div className="absolute inset-x-0 top-0 z-30 bg-emerald-950/95 border-b border-emerald-400 text-emerald-200 text-xs font-mono font-bold py-1 px-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>{saveSuccessToast}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase">[ MY BLOC ]</span>
          </div>
        )}

        <div
          className="flex items-center justify-between w-full"
        >
          {/* Left Ticker & Subtitle/Shares & News Sentiment */}
          <div className="flex flex-col min-w-[120px] max-w-[160px] pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic("selection");
                  toggleStarredTicker(stock.symbol);
                }}
                className={`flex items-center justify-center transition-all ${isStarred ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "text-neutral-600 hover:text-cyan-400"}`}
                title={isStarred ? "Remove from My Bloc" : "Add to My Bloc"}
              >
                <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`} />
              </button>
              <span
                className={`font-zen text-sm sm:text-base tracking-wider ${
                  isSyncing
                    ? "glitch-text-refresh text-cyan-300"
                    : isOrange
                      ? "text-orange-100 drop-shadow-[0_0_8px_rgba(247,147,26,0.5)]"
                      : isGold
                        ? "text-amber-100"
                        : isSilver
                          ? "text-slate-100"
                          : isCopper
                            ? "text-orange-100"
                            : isPurple
                              ? "text-fuchsia-100"
                              : "text-cyan-100"
                }`}
              >
                ${stock.symbol}
              </span>
              {(() => {
                const signal = computeDeterministicSignal(stock);
                const sbStyle = getSBScoreColor(signal.score);
                return (
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 border alien-block-cut-sm transition-all ${sbStyle.badgeClass}`}
                    title={`SB Score: ${signal.score}/100 (${sbStyle.tier} - ${sbStyle.tierDescription}) • 1D: ${signal.momentum.detail} • 52W: ${signal.relativeStrength.detail}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sbStyle.dotClass}`} />
                    <span className={`text-[10px] font-martian font-black tracking-tight ${sbStyle.textClass}`}>
                      SB {signal.score}
                    </span>
                  </div>
                );
              })()}
              {stock.symbol.toUpperCase() === "SPCX" && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-alien-hud alien-block-cut-sm flex items-center gap-1 shadow-md shadow-amber-500/10">
                  <Star className="w-3 h-3 fill-amber-300" />
                  TOP CONVICTION
                </span>
              )}
              {stock.isPinned && stock.symbol.toUpperCase() !== "SPCX" && (
                <span className="w-1.5 h-1.5 bg-cyan-400 animate-ping" />
              )}
              {isHighVolatility && (
                <span
                  title="High Volatility (>3% movement)"
                  className="text-[9px] text-amber-200 font-black bg-amber-950/80 px-2 py-1 border border-amber-400 alien-block-cut-sm glow-amber flex items-center justify-center min-w-[20px]"
                >
                  <Zap className="w-3 h-3 text-amber-300 fill-current" />
                </span>
              )}
            </div>
            <span className={`text-[11px] font-medium font-sans truncate ${
              isOrange
                ? "text-orange-300/90"
                : isGold
                  ? "text-amber-300/90"
                  : isSilver
                    ? "text-slate-300/90"
                    : isCopper
                      ? "text-orange-300/90"
                      : isPurple
                        ? "text-purple-300/90"
                        : "text-cyan-400/80"
            }`}>
              {stock.name}
            </span>
          </div>

          {/* Center Sparkline Chart & 7-Day Variance Bar */}
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-1">
            {renderSparkline()}
            {render7DVariance()}
          </div>

          {/* Right Price, % Pill & Tap-to-Expand Indicator */}
          <div className="flex flex-col items-end justify-center pl-2 min-w-[95px]">
            <span
              className={`font-martian font-black text-sm tracking-tight ${isSyncing ? "glitch-text-refresh text-cyan-200" : "text-white"}`}
            >
              $
              {stock.price >= 1000
                ? stock.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : stock.price.toFixed(2)}
            </span>
            <div
              className={`min-w-[76px] text-center px-2 py-0.5 mt-1 alien-block-cut-sm font-martian font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1 ${
                isOrange
                  ? "bg-orange-950/90 text-orange-200 border-2 border-orange-400 glow-orange shadow-[0_0_14px_rgba(247,147,26,0.5)]"
                  : isGold
                    ? "bg-amber-950/90 text-amber-200 border-2 border-amber-400 glow-gold shadow-[0_0_12px_rgba(245,158,11,0.45)]"
                    : isSilver
                      ? "bg-slate-900/90 text-slate-100 border-2 border-slate-300 glow-silver shadow-[0_0_12px_rgba(226,232,240,0.45)]"
                      : isCopper
                        ? "bg-orange-950/90 text-orange-200 border-2 border-orange-400 glow-copper shadow-[0_0_12px_rgba(234,88,12,0.45)]"
                        : isPurple
                          ? "bg-purple-950/90 text-purple-200 border-2 border-purple-400 glow-purple shadow-[0_0_12px_rgba(192,38,211,0.45)]"
                          : isPositive
                            ? "bg-emerald-950/90 text-emerald-300 border-2 border-emerald-400 glow-emerald"
                            : "bg-rose-950/90 text-rose-300 border-2 border-rose-500 glow-rose"
              } ${isSyncing ? "glitch-text-refresh" : ""}`}
            >
              <span className="text-[9px] font-bold text-current/80 mr-0.5">1D</span>
              <span>
                {isPositive ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
