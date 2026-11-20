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
                : "text-red-400 font-extrabold"
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
              <strong className="text-red-300">${data.low.toFixed(2)}</strong>
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

// Generate OHLC Candlestick data points for inline chart (24 equal buckets)
const generateCandlestickData = (
  stock: StockTicker,
  timeframe: "1D" | "1W" = "1D",
) => {
  const points = stock.history?.[timeframe] || [];
  let rawPrices: number[] = [];

  if (points && points.length > 0) {
    rawPrices = points.map((p) => p.price);
  } else if (stock.sparkline && stock.sparkline.length > 0) {
    rawPrices = stock.sparkline;
  } else {
    const base = stock.price || 100;
    rawPrices = Array.from({ length: 48 }, (_, i) => base * (1 + Math.sin(i * 0.2) * 0.015));
  }

  // Ensure we have at least 24 points via linear interpolation if raw dataset is shorter
  if (rawPrices.length < 24) {
    const interpolated: number[] = [];
    const len = rawPrices.length;
    for (let i = 0; i < 24; i++) {
      const pos = (i / 23) * (len - 1);
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const p1 = rawPrices[idx];
      const p2 = rawPrices[Math.min(len - 1, idx + 1)];
      interpolated.push(p1 + (p2 - p1) * frac);
    }
    rawPrices = interpolated;
  }

  // Aggregate intraday data into 24 equal buckets: open of first, max high, min low, close of last
  const totalPoints = rawPrices.length;
  const candles: {
    time: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    isUp: boolean;
  }[] = [];

  for (let i = 0; i < 24; i++) {
    const startIdx = Math.floor((i * totalPoints) / 24);
    const endIdx = Math.floor(((i + 1) * totalPoints) / 24);
    const chunk = rawPrices.slice(startIdx, Math.max(startIdx + 1, endIdx));

    const open = chunk[0];
    const close = chunk[chunk.length - 1];
    let high = Math.max(...chunk);
    let low = Math.min(...chunk);

    if (high === low) {
      const spread = Math.max(0.01, open * 0.001);
      high = open + spread;
      low = open - spread;
    }

    candles.push({
      time: `T-${24 - i}`,
      open,
      close,
      high,
      low,
      volume: 1000,
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
  const { marketDataUpdatedAt, marketDataIsStale, watchlistChartStyle, watchlistDataDensity } = useMarketStore();
  const [dragOffset, setDragOffset] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [hoveredCandleIdx, setHoveredCandleIdx] = useState<number | null>(null);
  const [priceFlashState, setPriceFlashState] = useState<"up" | "down" | null>(
    null,
  );
  const prevPriceRef = useRef<number>(stock?.price || 0);
  const { starredTickers, toggleStarredTicker } = useUserStore();
  const isStarred = starredTickers.includes(stock.symbol);

  // Detect live-only pending quote (never fabricate price or sparkline data)
  const isQuotePending = Boolean(stock.quotePending) || !stock.price || stock.price <= 0;

  // Glanceable metrics calculations (strictly null/zero-safe for pending quotes)
  const oneDayPrices = !isQuotePending
    ? (stock.history?.["1D"]?.map((p) => p.price).filter((p) => p > 0) || [])
    : [];
  const cardDayLow = isQuotePending
    ? 0
    : oneDayPrices.length > 0
      ? Math.min(...oneDayPrices, stock.price)
      : stock.price * 0.99;
  const cardDayHigh = isQuotePending
    ? 0
    : oneDayPrices.length > 0
      ? Math.max(...oneDayPrices, stock.price)
      : stock.price * 1.01;
  const cardDayRangeSpan = Math.max(0.01, cardDayHigh - cardDayLow);
  const cardDayPosPct = isQuotePending
    ? 0
    : Math.min(100, Math.max(0, ((stock.price - cardDayLow) / cardDayRangeSpan) * 100));
  const cardLow52 = isQuotePending ? 0 : (stock.low52 || stock.price * 0.72);
  const cardHigh52 = isQuotePending ? 0 : (stock.high52 || stock.price * 1.28);
  const cardRsi = isQuotePending ? null : (stock.rsi ?? 54);

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

  // Determine vibrant, high-contrast Metallic / Purple / Orange (Bitcoin) / Green / Red card styling with Dark Matter Translucency
  const cardTheme = useMemo(() => {
    const isLiveUpFlash = priceFlashState === "up";
    const isLiveDownFlash = priceFlashState === "down";

    if (isOrange) {
      // CUSTOM BITCOIN ORANGE CARD THEME (e.g. Bitcoin BTC-USD) - Dark Matter Gravitational Lens
      const baseRgb = "247, 147, 26"; // iconic bitcoin orange (#f7931a)
      const glowRgb = "255, 170, 51"; // amber-orange (#ffaa33)
      const deepRgb = "154, 52, 18"; // orange-900 (#9a3412)
      const darkOrangeRgb = "194, 65, 12"; // orange-700 (#c2410c)

      return {
        isPositive: isPositive,
        isCustom: true,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(14, 6, 2, 0.74) 0%, rgba(3, 1, 1, 0.82) 100%), radial-gradient(120% 120% at 30% -10%, rgba(${baseRgb}, 0.16) 0%, rgba(${deepRgb}, 0.05) 45%, rgba(0, 0, 0, 0.5) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(255, 170, 51, 0.95)"
          : stock.isPinned
            ? "rgba(255, 170, 51, 0.75)"
            : "rgba(247, 147, 26, 0.35)",
        boxShadow: stock.isPinned
          ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 1.5px 0 rgba(255, 170, 51, 0.35), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.95), inset 0 0 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(${glowRgb}, 0.25)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 2px 0 rgba(255, 170, 51, 0.5), inset 0 0 24px rgba(0, 0, 0, 0.85), 0 0 28px rgba(${glowRgb}, 0.45)`
            : `0 10px 30px -4px rgba(0, 0, 0, 0.75), inset 0 1px 1px 0 rgba(255, 170, 51, 0.18), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.9), inset 0 0 24px rgba(0, 0, 0, 0.8), 0 0 14px rgba(${baseRgb}, 0.08)`,
        cornerColor: "rgba(255, 170, 51, 0.85)",
      };
    }

    if (isGold) {
      // CUSTOM GOLD / GOLDEN CARD THEME (e.g. SPDR Gold Shares GLD) - Dark Matter Gravitational Lens
      const baseRgb = "245, 158, 11"; // amber-500 (#f59e0b)
      const glowRgb = "251, 191, 36"; // amber-400 (#fbbf24)
      const deepRgb = "120, 53, 15"; // amber-900 (#78350f)
      const darkGoldRgb = "180, 83, 9"; // amber-700

      return {
        isPositive: isPositive,
        isCustom: true,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(14, 10, 2, 0.74) 0%, rgba(3, 2, 1, 0.82) 100%), radial-gradient(120% 120% at 30% -10%, rgba(${baseRgb}, 0.16) 0%, rgba(${deepRgb}, 0.05) 45%, rgba(0, 0, 0, 0.5) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(252, 211, 77, 0.95)"
          : stock.isPinned
            ? "rgba(251, 191, 36, 0.75)"
            : "rgba(245, 158, 11, 0.35)",
        boxShadow: stock.isPinned
          ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 1.5px 0 rgba(251, 191, 36, 0.35), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.95), inset 0 0 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(${glowRgb}, 0.25)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 2px 0 rgba(251, 191, 36, 0.5), inset 0 0 24px rgba(0, 0, 0, 0.85), 0 0 28px rgba(${glowRgb}, 0.45)`
            : `0 10px 30px -4px rgba(0, 0, 0, 0.75), inset 0 1px 1px 0 rgba(251, 191, 36, 0.18), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.9), inset 0 0 24px rgba(0, 0, 0, 0.8), 0 0 14px rgba(${baseRgb}, 0.08)`,
        cornerColor: "rgba(251, 191, 36, 0.85)",
      };
    }

    if (isSilver) {
      // CUSTOM SILVER / PLATINUM CARD THEME (e.g. iShares Silver Trust SLV) - Dark Matter Gravitational Lens
      const baseRgb = "203, 213, 225"; // slate-300 (#cbd5e1)
      const glowRgb = "248, 250, 252"; // slate-50 (#f8fafc)
      const deepRgb = "51, 65, 85"; // slate-700 (#334155)
      const darkSilverRgb = "100, 116, 139"; // slate-500

      return {
        isPositive: isPositive,
        isCustom: true,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(8, 12, 22, 0.74) 0%, rgba(2, 4, 10, 0.82) 100%), radial-gradient(120% 120% at 30% -10%, rgba(${baseRgb}, 0.14) 0%, rgba(${deepRgb}, 0.05) 45%, rgba(0, 0, 0, 0.5) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(255, 255, 255, 0.95)"
          : stock.isPinned
            ? "rgba(248, 250, 252, 0.75)"
            : "rgba(203, 213, 225, 0.32)",
        boxShadow: stock.isPinned
          ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 1.5px 0 rgba(248, 250, 252, 0.32), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.95), inset 0 0 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(${glowRgb}, 0.22)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 0 24px rgba(0, 0, 0, 0.85), 0 0 28px rgba(255, 255, 255, 0.45)`
            : `0 10px 30px -4px rgba(0, 0, 0, 0.75), inset 0 1px 1px 0 rgba(248, 250, 252, 0.16), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.9), inset 0 0 24px rgba(0, 0, 0, 0.8), 0 0 14px rgba(${baseRgb}, 0.08)`,
        cornerColor: "rgba(226, 232, 240, 0.85)",
      };
    }

    if (isCopper) {
      // CUSTOM COPPER / BRONZE CARD THEME (e.g. United States Copper Fund CPER) - Dark Matter Gravitational Lens
      const baseRgb = "234, 88, 12"; // orange-600 (#ea580c)
      const glowRgb = "251, 146, 60"; // orange-400 (#fb923c)
      const deepRgb = "124, 45, 18"; // orange-900 (#7c2d12)
      const darkCopperRgb = "194, 65, 12"; // orange-700

      return {
        isPositive: isPositive,
        isCustom: true,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(16, 7, 2, 0.74) 0%, rgba(3, 1, 1, 0.82) 100%), radial-gradient(120% 120% at 30% -10%, rgba(${baseRgb}, 0.16) 0%, rgba(${deepRgb}, 0.05) 45%, rgba(0, 0, 0, 0.5) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(253, 186, 116, 0.95)"
          : stock.isPinned
            ? "rgba(251, 146, 60, 0.75)"
            : "rgba(234, 88, 12, 0.35)",
        boxShadow: stock.isPinned
          ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 1.5px 0 rgba(251, 146, 60, 0.35), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.95), inset 0 0 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(${glowRgb}, 0.25)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 2px 0 rgba(251, 146, 60, 0.5), inset 0 0 24px rgba(0, 0, 0, 0.85), 0 0 28px rgba(${glowRgb}, 0.45)`
            : `0 10px 30px -4px rgba(0, 0, 0, 0.75), inset 0 1px 1px 0 rgba(251, 146, 60, 0.18), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.9), inset 0 0 24px rgba(0, 0, 0, 0.8), 0 0 14px rgba(${baseRgb}, 0.08)`,
        cornerColor: "rgba(251, 146, 60, 0.85)",
      };
    }

    if (isPurple) {
      // CUSTOM PURPLE CARD THEME (e.g. Polkadot DOT) - Dark Matter Gravitational Lens
      const baseRgb = "168, 85, 247"; // purple-500 (#a855f7)
      const glowRgb = "217, 70, 239"; // fuchsia-500 (#d946ef)
      const deepRgb = "88, 28, 135"; // purple-900 (#581c87)
      const darkVioletRgb = "147, 51, 234"; // purple-600 (#9333ea)

      return {
        isPositive: isPositive,
        isCustom: true,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(12, 4, 22, 0.74) 0%, rgba(3, 1, 8, 0.82) 100%), radial-gradient(120% 120% at 30% -10%, rgba(${baseRgb}, 0.16) 0%, rgba(${deepRgb}, 0.05) 45%, rgba(0, 0, 0, 0.5) 100%)`,
        borderColor: isLiveUpFlash || isLiveDownFlash
          ? "rgba(232, 121, 249, 0.95)"
          : stock.isPinned
            ? "rgba(217, 70, 239, 0.75)"
            : "rgba(168, 85, 247, 0.35)",
        boxShadow: stock.isPinned
          ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 1.5px 0 rgba(217, 70, 239, 0.35), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.95), inset 0 0 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(${glowRgb}, 0.25)`
          : isLiveUpFlash || isLiveDownFlash
            ? `0 16px 44px -4px rgba(0, 0, 0, 0.85), inset 0 1px 2px 0 rgba(217, 70, 239, 0.5), inset 0 0 24px rgba(0, 0, 0, 0.85), 0 0 28px rgba(${glowRgb}, 0.45)`
            : `0 10px 30px -4px rgba(0, 0, 0, 0.75), inset 0 1px 1px 0 rgba(217, 70, 239, 0.18), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.9), inset 0 0 24px rgba(0, 0, 0, 0.8), 0 0 14px rgba(${baseRgb}, 0.08)`,
        cornerColor: "rgba(217, 70, 239, 0.85)",
      };
    }

    if (isQuotePending) {
      // PENDING LIVE QUOTE POD - Obsidian #020608 + Dark Teal Liquid Glass + Amber/Cyan Telemetry
      const baseRgb = "245, 158, 11"; // amber-500 (#f59e0b)
      const glowRgb = "0, 245, 212"; // cyan (#00f5d4)
      return {
        isPositive: true,
        isCustom: true,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(4, 24, 34, 0.88) 0%, rgba(2, 6, 8, 0.96) 100%), radial-gradient(120% 110% at 18% -15%, rgba(245, 158, 11, 0.14) 0%, rgba(0, 245, 212, 0.06) 45%, rgba(2, 6, 8, 0.75) 100%)`,
        borderColor: "rgba(245, 158, 11, 0.42)",
        boxShadow: `0 12px 32px -8px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(0, 245, 212, 0.22), inset 0 -1px 0 rgba(0, 0, 0, 0.9), 0 0 20px -6px rgba(245, 158, 11, 0.2)`,
        cornerColor: "#f59e0b",
      };
    }

    if (isPositive) {
      // POSITIVE GAINER - Alien Obsidian #020608 + Dark Teal Liquid Glass + Cyan/Mint Bioluminescence
      const baseRgb = "0, 245, 212"; // bioluminescent cyan (#00f5d4)
      const glowRgb = "0, 255, 157"; // plasma mint (#00ff9d)
      const deepRgb = "6, 78, 89"; // dark teal depth

      return {
        isPositive: true,
        isCustom: false,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(4, 26, 36, 0.86) 0%, rgba(2, 6, 8, 0.95) 100%), radial-gradient(120% 120% at 24% -12%, rgba(${baseRgb}, 0.16) 0%, rgba(${deepRgb}, 0.14) 46%, rgba(2, 6, 8, 0.7) 100%)`,
        borderColor: isLiveUpFlash
          ? "rgba(0, 255, 157, 0.95)"
          : stock.isPinned
            ? "rgba(0, 245, 212, 0.78)"
            : "rgba(0, 245, 212, 0.28)",
        boxShadow: stock.isPinned
          ? `0 16px 44px -6px rgba(0, 0, 0, 0.9), inset 0 1px 1.5px 0 rgba(0, 245, 212, 0.36), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.95), 0 0 24px -4px rgba(${glowRgb}, 0.28)`
          : isLiveUpFlash
            ? `0 16px 44px -6px rgba(0, 0, 0, 0.9), inset 0 1px 2px 0 rgba(0, 255, 157, 0.52), 0 0 30px -2px rgba(${glowRgb}, 0.45)`
            : `0 12px 32px -6px rgba(0, 0, 0, 0.86), inset 0 1px 0 rgba(0, 245, 212, 0.22), inset 0 -1px 0 rgba(0, 0, 0, 0.92), 0 0 18px -6px rgba(${baseRgb}, 0.14)`,
        cornerColor: stock.isPinned ? "#00ff9d" : "#00f5d4",
      };
    } else {
      // NEGATIVE LOSER - Alien Obsidian #020608 + Dark Teal/Violet Glass + Crimson/Violet Bioluminescence
      const baseRgb = "244, 63, 94"; // rose-500 (#f43f5e)
      const glowRgb = "168, 85, 247"; // violet accent (#a855f7)
      const deepRgb = "88, 28, 135"; // deep violet

      return {
        isPositive: false,
        isCustom: false,
        baseRgb,
        glowRgb,
        background: `linear-gradient(145deg, rgba(16, 12, 24, 0.88) 0%, rgba(2, 6, 8, 0.96) 100%), radial-gradient(120% 120% at 24% -12%, rgba(${baseRgb}, 0.14) 0%, rgba(${deepRgb}, 0.1) 48%, rgba(2, 6, 8, 0.72) 100%)`,
        borderColor: isLiveDownFlash
          ? "rgba(251, 113, 133, 0.95)"
          : stock.isPinned
            ? "rgba(244, 63, 94, 0.78)"
            : "rgba(244, 63, 94, 0.32)",
        boxShadow: stock.isPinned
          ? `0 16px 44px -6px rgba(0, 0, 0, 0.9), inset 0 1px 1.5px 0 rgba(251, 113, 133, 0.36), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.95), 0 0 24px -4px rgba(${baseRgb}, 0.28)`
          : isLiveDownFlash
            ? `0 16px 44px -6px rgba(0, 0, 0, 0.9), inset 0 1px 2px 0 rgba(251, 113, 133, 0.5), 0 0 30px -2px rgba(${baseRgb}, 0.42)`
            : `0 12px 32px -6px rgba(0, 0, 0, 0.86), inset 0 1px 0 rgba(168, 85, 247, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.92), 0 0 18px -6px rgba(${baseRgb}, 0.12)`,
        cornerColor: stock.isPinned ? "#fb7185" : "#a855f7",
      };
    }
  }, [isPositive, isQuotePending, isGold, isSilver, isCopper, isPurple, isOrange, stock.changePercent, stock.isPinned, priceFlashState]);

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
      textColor = "text-blue-400";
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

  // Alien Plasma-Glow Sparkline (strictly live data; renders honest carrier telemetry when quote/history pending)
  const renderSparkline = () => {
    const dayHistoryPrices = !isQuotePending
      ? stock.history?.["1D"]?.map((p) => p.price).filter((p) => typeof p === "number" && p > 0)
      : [];
    const liveSpark = !isQuotePending
      ? (stock.sparkline || []).filter((p) => typeof p === "number" && p > 0)
      : [];
    const rawData =
      dayHistoryPrices && dayHistoryPrices.length >= 2
        ? dayHistoryPrices
        : liveSpark.length >= 2
          ? liveSpark
          : [];

    if (isQuotePending || rawData.length < 2) {
      return (
        <div
          className="relative w-full max-w-[175px] sm:max-w-[240px] md:max-w-[300px] h-[36px] flex flex-col items-center justify-center px-2"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("selection");
            onSelect(stock);
          }}
          title={
            isQuotePending
              ? "Live market quote pending — awaiting exchange feed"
              : "Live sparkline awaiting additional ticks"
          }
        >
          <div className="w-full flex items-center gap-1.5">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-400/50 to-[#00f5d4]/50" />
            <span className="text-[9px] font-mono font-bold tracking-[0.14em] uppercase text-amber-300/90 whitespace-nowrap">
              {isQuotePending ? "LIVE FEED SYNC" : "1-TICK LIVE"}
            </span>
            <span className="h-[1px] flex-1 bg-gradient-to-r from-[#00f5d4]/50 via-amber-400/50 to-transparent" />
          </div>
          <svg viewBox="0 0 220 12" className="w-full h-3 mt-0.5 overflow-visible" aria-hidden="true">
            <line
              x1="4"
              y1="6"
              x2="216"
              y2="6"
              stroke={isQuotePending ? "rgba(245, 158, 11, 0.35)" : "rgba(0, 245, 212, 0.35)"}
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <circle
              cx="110"
              cy="6"
              r="2.4"
              fill={isQuotePending ? "#f59e0b" : "#00f5d4"}
              className="animate-pulse"
            />
          </svg>
        </div>
      );
    }

    const chartWidth = 220;
    const chartHeight = 38;
    const padY = 5;
    const padX = 4;

    const trendIsPositive = stock.changePercent >= 0;
    const minVal = Math.min(...rawData);
    const maxVal = Math.max(...rawData);
    const range = maxVal - minVal || 1;

    const points = rawData.map((val, idx) => ({
      x: padX + (idx / Math.max(1, rawData.length - 1)) * (chartWidth - 2 * padX - 4),
      y: chartHeight - padY - ((val - minVal) / range) * (chartHeight - 2 * padY),
    }));

    const n = points.length;
    let lineD = "";
    if (n === 2) {
      lineD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    } else if (n > 2) {
      const deltas = new Array(n - 1);
      const dxs = new Array(n - 1);
      for (let i = 0; i < n - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        dxs[i] = dx;
        deltas[i] = dx !== 0 ? dy / dx : 0;
      }
      const m = new Array(n);
      m[0] = deltas[0];
      m[n - 1] = deltas[n - 2];
      for (let i = 1; i < n - 1; i++) {
        if (deltas[i - 1] * deltas[i] <= 0) {
          m[i] = 0;
        } else {
          m[i] = (deltas[i - 1] + deltas[i]) / 2;
        }
      }
      for (let i = 0; i < n - 1; i++) {
        if (deltas[i] === 0) {
          m[i] = 0;
          m[i + 1] = 0;
        } else {
          const alpha = m[i] / deltas[i];
          const beta = m[i + 1] / deltas[i];
          const sumSq = alpha * alpha + beta * beta;
          if (sumSq > 9) {
            const tau = 3 / Math.sqrt(sumSq);
            m[i] = tau * alpha * deltas[i];
            m[i + 1] = tau * beta * deltas[i];
          }
        }
      }
      lineD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 0; i < n - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dx = dxs[i] / 3;
        const cp1x = (p0.x + dx).toFixed(1);
        const cp1y = (p0.y + m[i] * dx).toFixed(1);
        const cp2x = (p1.x - dx).toFixed(1);
        const cp2y = (p1.y - m[i + 1] * dx).toFixed(1);
        lineD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
    }

    const lastPt = points[points.length - 1];
    const areaD = `${lineD} L ${lastPt.x.toFixed(1)} ${(chartHeight - padY + 2).toFixed(1)} L ${padX.toFixed(1)} ${(chartHeight - padY + 2).toFixed(1)} Z`;
    const safeSym = stock.symbol.replace(/[^a-zA-Z0-9_-]/g, "");
    const areaGradId = `sparkArea-${safeSym}`;
    const strokeGradId = `sparkBeam-${safeSym}`;
    const auraFilterId = `sparkAura-${safeSym}`;
    const startColor = trendIsPositive ? "#00e5ff" : "#a855f7";
    const endColor = trendIsPositive ? "#00ff9d" : "#fb7185";
    const coreColor = trendIsPositive ? "#d8fff4" : "#ffe4ea";

    return (
      <div
        className="relative w-full max-w-[175px] sm:max-w-[240px] md:max-w-[300px] h-[38px] flex items-center justify-center overflow-visible"
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic("selection");
          onSelect(stock);
        }}
        title={`Plasma Telemetry Trend • Tap to open holographic chart`}
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible z-10"
        >
          <defs>
            <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="55%" stopColor={trendIsPositive ? "#00f5d4" : "#f43f5e"} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
            <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={endColor} stopOpacity="0.34" />
              <stop offset="55%" stopColor={startColor} stopOpacity="0.1" />
              <stop offset="100%" stopColor={startColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id={auraFilterId} x="-15%" y="-45%" width="130%" height="190%">
              <feGaussianBlur stdDeviation="2.6" result="plasmaBlur" />
              <feMerge>
                <feMergeNode in="plasmaBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Subtle holographic baseline rail */}
          <line
            x1={padX}
            y1={chartHeight - padY + 1}
            x2={chartWidth - padX}
            y2={chartHeight - padY + 1}
            stroke="rgba(0, 245, 212, 0.14)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
          />
          {/* Holographic vertical plasma energy veil */}
          <path d={areaD} fill={`url(#${areaGradId})`} />
          {/* Layer 1: Wide outer plasma aura */}
          <path
            d={lineD}
            fill="none"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="4.2"
            strokeOpacity="0.36"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${auraFilterId})`}
          />
          {/* Layer 2: Crisp high-luminance plasma core beam */}
          <path
            d={lineD}
            fill="none"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={lineD}
            fill="none"
            stroke={coreColor}
            strokeWidth="0.65"
            strokeOpacity="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Glowing live plasma endpoint orb */}
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="4.2"
            fill={endColor}
            fillOpacity="0.28"
          />
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="2.1"
            fill={coreColor}
            stroke={endColor}
            strokeWidth="1"
          />
        </svg>
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
      className="StockCard relative w-full overflow-hidden my-1 select-none group/card-wrapper"
    >
      {/* Left-Edge Bioluminescent Conduit Spine */}
      <div
        className={`absolute left-0 top-2.5 bottom-2.5 w-[2.5px] transition-all duration-300 pointer-events-none z-20 ${
          isQuotePending
            ? "bg-gradient-to-b from-amber-300 via-amber-400 to-[#00f5d4]/50 shadow-[0_0_10px_rgba(245,158,11,0.75)]"
            : isOrange
              ? "bg-gradient-to-b from-orange-400 via-amber-400 to-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.7)]"
              : isGold
                ? "bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.65)]"
                : isSilver
                  ? "bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400/40 shadow-[0_0_10px_rgba(226,232,240,0.55)]"
                  : isCopper
                    ? "bg-gradient-to-b from-orange-400 via-amber-500 to-orange-600/40 shadow-[0_0_10px_rgba(234,88,12,0.6)]"
                    : isPurple
                      ? "bg-gradient-to-b from-[#a855f7] via-fuchsia-400 to-purple-600/40 shadow-[0_0_10px_rgba(168,85,247,0.7)]"
                      : isPositive
                        ? "bg-gradient-to-b from-[#00f5d4] via-[#00ff9d] to-[#00e5ff]/35 shadow-[0_0_12px_rgba(0,245,212,0.75)]"
                        : "bg-gradient-to-b from-rose-400 via-rose-500 to-[#a855f7]/45 shadow-[0_0_10px_rgba(244,63,94,0.65)]"
        }`}
      />

      {/* Hidden Swipe Actions Background - Only visible during swipe to prevent bleed-through */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2 z-0 transition-opacity duration-150"
        style={{
          opacity: Math.max(0, Math.min(1, (Math.abs(dragOffset) - 15) / 35)),
          pointerEvents: Math.abs(dragOffset) > 20 ? "auto" : "none",
        }}
      >
        <button
          onClick={handleQuickSaveToPortfolio}
          className="w-9 h-9 bg-[#04141d] border border-[#00ff9d]/45 text-[#00ff9d] flex items-center justify-center hover:bg-emerald-950 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          title="Save 1 Share to Portfolio Tracker"
        >
          <Briefcase className="w-4 h-4 text-[#00ff9d]" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("selection");
            onShare(stock);
            setDragOffset(0);
          }}
          className="w-9 h-9 bg-[#04141d] border border-[#00f5d4]/35 text-cyan-200 flex items-center justify-center hover:bg-cyan-950/60 active:scale-95 transition-all"
          title="Share Card"
        >
          <Share2 className="w-4 h-4 text-[#00f5d4]" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic("selection");
            onTogglePin(stock.symbol);
            setDragOffset(0);
          }}
          className={`w-9 h-9 border flex items-center justify-center active:scale-95 transition-all ${
            stock.isPinned
              ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
              : "bg-[#04141d] text-slate-300 border-[#00f5d4]/25"
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
            className="h-9 px-3 bg-gradient-to-r from-rose-600 to-purple-700 hover:from-rose-500 hover:to-purple-600 text-white font-extrabold text-xs border border-rose-400/45 flex items-center gap-1.5 active:scale-95 transition-all shadow-lg cursor-pointer"
            title="Remove from Watchlist"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Main Draggable Alien Refractive Liquid-Glass Pod */}
      <motion.div
        drag="x"
        dragConstraints={{ left: onRemove ? -220 : -130, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileHover={{
          scale: 1.005,
          y: -1.5,
          transition: { type: "spring", stiffness: 460, damping: 24 },
        }}
        whileTap={{
          scale: 0.99,
          transition: { type: "spring", stiffness: 550, damping: 18 },
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
        className={`xeno-watchlist-pod relative z-10 w-full px-4 py-3.5 StockCard-pad transition-all duration-200 cursor-pointer overflow-hidden ${holoGlowClass} ${
          stock.isPinned ? "ring-1 ring-[#00f5d4]/55" : ""
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
        {/* Micro-Beveled Alien HUD Corner Brackets (All 4 Corners) */}
        <svg
          className="pointer-events-none absolute top-1 left-1 w-3 h-3 z-20 opacity-85 group-hover/card-wrapper:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 11V4.2L4.2 1H11" stroke={cardTheme.cornerColor} strokeWidth="1.25" strokeLinecap="square" />
        </svg>
        <svg
          className="pointer-events-none absolute top-1 right-1 w-3 h-3 z-20 opacity-85 group-hover/card-wrapper:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 1H7.8L11 4.2V11" stroke={cardTheme.cornerColor} strokeWidth="1.25" strokeLinecap="square" />
        </svg>
        <svg
          className="pointer-events-none absolute bottom-1 left-1 w-3 h-3 z-20 opacity-60 group-hover/card-wrapper:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 1V7.8L4.2 11H11" stroke={cardTheme.cornerColor} strokeWidth="1.25" strokeLinecap="square" />
        </svg>
        <svg
          className="pointer-events-none absolute bottom-1 right-1 w-3 h-3 z-20 opacity-60 group-hover/card-wrapper:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 11H7.8L11 7.8V1" stroke={cardTheme.cornerColor} strokeWidth="1.25" strokeLinecap="square" />
        </svg>

        {/* Refractive Liquid-Glass Specular Top Edge */}
        <div
          className="pointer-events-none absolute inset-x-4 top-0 h-[1px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(${cardTheme.glowRgb}, 0.5) 50%, transparent 100%)`,
          }}
        />

        {/* Gravitational Singularity Lens Flare */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 overflow-hidden transition-opacity"
          style={{
            background: stock.isPinned
              ? `radial-gradient(90% 90% at 50% 0%, rgba(${cardTheme.glowRgb}, 0.28) 0%, transparent 78%)`
              : `radial-gradient(90% 90% at 50% 100%, rgba(${cardTheme.glowRgb}, 0.14) 0%, transparent 68%)`,
          }}
        />

        {/* Subtle Live Price Update Background Flash Animation Overlay */}
        <AnimatePresence>
          {priceFlashState && !isQuotePending && (
            <motion.div
              key={`price-flash-bg-${priceFlashState}-${stock.price}`}
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-0 pointer-events-none z-0 rounded-[inherit] ${
                priceFlashState === "up"
                  ? "bg-gradient-to-r from-[#00f5d4]/30 via-[#00ff9d]/20 to-cyan-500/30 price-flash-bg-green"
                  : "bg-gradient-to-r from-rose-500/30 via-purple-500/20 to-rose-600/30 price-flash-bg-red"
              }`}
            />
          )}
        </AnimatePresence>

        {saveSuccessToast && (
          <div className="absolute inset-x-0 top-0 z-30 bg-[#041b24]/95 border-b border-[#00ff9d] text-[#00ff9d] text-xs font-mono font-bold py-1 px-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#00ff9d] animate-bounce" />
              <span>{saveSuccessToast}</span>
            </div>
            <span className="text-[10px] text-[#00f5d4] font-bold uppercase">[ MY BLOC ]</span>
          </div>
        )}

        <div className="relative z-10 flex items-center justify-between w-full gap-2">
          {/* Left Ticker, Pulsing Live-Node Beacon, SB Score Badge & Company Subtitle */}
          <div className="flex flex-col flex-shrink-0 min-w-0 max-w-[140px] min-[380px]:max-w-[190px] sm:max-w-[235px] pr-1.5 sm:pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic("selection");
                  toggleStarredTicker(stock.symbol);
                }}
                className={`flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                  isStarred
                    ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]"
                    : "text-slate-500 hover:text-[#00f5d4]"
                }`}
                title={isStarred ? "Remove from My Bloc" : "Add to My Bloc"}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
              </button>

              {/* Pulsing Live-Node Telemetry Beacon */}
              <span
                className="relative flex h-2 w-2 shrink-0"
                title={
                  isQuotePending
                    ? "Quote Pending — Awaiting Live Exchange Feed"
                    : "Live Quote Telemetry Node Connected"
                }
              >
                <span
                  className={`xeno-beacon-ring absolute inline-flex h-full w-full rounded-full ${
                    isQuotePending
                      ? "bg-amber-400"
                      : isPositive
                        ? "bg-[#00f5d4]"
                        : "bg-rose-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isQuotePending
                      ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                      : isPositive
                        ? "bg-[#00ff9d] shadow-[0_0_8px_#00f5d4]"
                        : "bg-rose-400 shadow-[0_0_8px_#fb7185]"
                  }`}
                />
              </span>

              <span
                className={`font-display font-extrabold text-[17px] tracking-wide leading-none ${
                  isSyncing
                    ? "glitch-text-refresh text-[#00f5d4]"
                    : isQuotePending
                      ? "text-amber-200 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
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
                                : "text-[#e8fbff] drop-shadow-[0_0_8px_rgba(0,245,212,0.28)]"
                }`}
              >
                ${stock.symbol}
              </span>

              {!isQuotePending ? (
                (() => {
                  const signal = computeDeterministicSignal(stock);
                  const sbStyle = getSBScoreColor(signal.score);
                  return (
                    <div
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border alien-block-cut-sm transition-all tabular-telemetry ${sbStyle.badgeClass}`}
                      title={`SB Score: ${signal.score}/100 (${sbStyle.tier} - ${sbStyle.tierDescription}) • 1D: ${signal.momentum.detail} • 52W: ${signal.relativeStrength.detail}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sbStyle.dotClass}`} />
                      <span className={`text-[9.5px] font-martian font-black tracking-tight ${sbStyle.textClass}`}>
                        SB {signal.score}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-amber-400/45 bg-amber-500/12 text-amber-300 text-[9px] font-mono font-bold tracking-wider uppercase alien-block-cut-sm">
                  IPO LIVE
                </span>
              )}

              {stock.symbol.toUpperCase() === "SPCX" && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/45 text-[9px] font-alien-hud flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-300" />
                  TOP CONVICTION
                </span>
              )}
              {isHighVolatility && !isQuotePending && (
                <span
                  title="High Volatility (>3% movement)"
                  className="text-[9px] text-amber-200 font-black bg-amber-950/80 px-1 py-0.5 border border-amber-400/60 flex items-center justify-center"
                >
                  <Zap className="w-2.5 h-2.5 text-amber-300 fill-current" />
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-normal font-sans truncate mt-1 ${
                isQuotePending
                  ? "text-cyan-200/80"
                  : isOrange
                    ? "text-orange-200/85"
                    : isGold
                      ? "text-amber-200/85"
                      : isSilver
                        ? "text-slate-300/90"
                        : isCopper
                          ? "text-orange-200/85"
                          : isPurple
                            ? "text-purple-200/85"
                            : "text-cyan-200/70"
              }`}
            >
              {stock.name}
              {isQuotePending && stock.symbol.toUpperCase() === "ANT"
                ? " · Nasdaq"
                : ""}
            </span>
          </div>

          {/* Center Expanded Plasma-Glow Sparkline */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-1 sm:px-2 overflow-visible">
            {renderSparkline()}
          </div>

          {/* Right Live Price & 1D Telemetry Readout (or Quote Pending) */}
          <div className="flex flex-col items-end justify-center shrink-0 pl-1.5 sm:pl-2 tabular-nums-strict">
            {isQuotePending ? (
              <>
                <span className="font-mono font-extrabold text-[12px] min-[380px]:text-[13px] tracking-wider text-amber-300 uppercase leading-tight drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]">
                  QUOTE PENDING
                </span>
                <div className="shrink-0 px-2 py-0.5 mt-1 font-mono font-bold text-[10px] tracking-wider bg-[#04141d]/90 text-[#00f5d4] border border-[#00f5d4]/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>LIVE FEED</span>
                </div>
              </>
            ) : (
              <>
                <span
                  className={`font-mono tabular-nums-strict font-bold text-[16px] min-[380px]:text-[18px] tracking-tight leading-tight ${
                    isSyncing ? "glitch-text-refresh text-[#00f5d4]" : "text-[#f2fbff]"
                  }`}
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
                  className={`shrink-0 px-2 min-[380px]:px-2.5 py-0.5 mt-1 alien-block-cut-sm font-mono tabular-nums-strict font-bold text-[11px] min-[380px]:text-xs tracking-tight transition-all flex items-center justify-center gap-1 ${
                    isOrange
                      ? "bg-orange-950/90 text-orange-200 border border-orange-400/70"
                      : isGold
                        ? "bg-amber-950/90 text-amber-200 border border-amber-400/70"
                        : isSilver
                          ? "bg-slate-900/90 text-slate-100 border border-slate-300/70"
                          : isCopper
                            ? "bg-orange-950/90 text-orange-200 border border-orange-400/70"
                            : isPurple
                              ? "bg-purple-950/90 text-purple-200 border border-purple-400/70"
                              : isPositive
                                ? "bg-[#042422]/90 text-[#00ff9d] border border-[#00ff9d]/50 shadow-[0_0_12px_rgba(0,255,157,0.22)]"
                                : "bg-rose-950/85 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                  } ${isSyncing ? "glitch-text-refresh" : ""}`}
                >
                  <span className="text-[9px] font-bold text-current/75 mr-0.5">1D</span>
                  <span>
                    {isPositive ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Glanceable Bottom Telemetry Strip */}
        {watchlistDataDensity === "detailed" && (
          <div className="relative z-10 mt-2.5 pt-2 border-t border-[#00f5d4]/15 flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 overflow-x-auto no-scrollbar select-none tabular-telemetry">
            {isQuotePending ? (
              <>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[8.5px] text-cyan-400/70 uppercase font-bold tracking-wider">
                    STATUS
                  </span>
                  <span className="text-amber-300 font-bold">
                    Awaiting Live Quote Tick
                  </span>
                </div>
                {stock.symbol.toUpperCase() === "ANT" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[8.5px] text-cyan-400/70 uppercase font-bold tracking-wider">
                      DEBUT
                    </span>
                    <span className="text-cyan-100 font-bold">
                      IPO $83 · Nov 19 Close $97.17 (+17%)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8.5px] text-cyan-400/70 uppercase font-bold tracking-wider">
                    VOL
                  </span>
                  <span className="text-slate-300 font-bold">Pending</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <span className="text-[8.5px] text-cyan-400/70 uppercase font-bold tracking-wider">
                    RSI
                  </span>
                  <span className="text-slate-400 font-bold">—</span>
                </div>
              </>
            ) : (
              <>
                {/* 24H Range with Mini Progress Track */}
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  title={`Today's Range: Low $${cardDayLow.toFixed(2)} - High $${cardDayHigh.toFixed(2)}`}
                >
                  <span className="text-[8.5px] text-cyan-400/65 font-sans uppercase font-bold tracking-wider">
                    24H
                  </span>
                  <span className="text-slate-200 font-bold">${cardDayLow.toFixed(1)}</span>
                  <div className="w-12 h-1.5 bg-[#020608] overflow-hidden relative mx-0.5 border border-[#00f5d4]/25">
                    <div
                      className="h-full bg-gradient-to-r from-[#00e5ff] via-[#00f5d4] to-[#00ff9d]"
                      style={{ width: `${cardDayPosPct}%` }}
                    />
                  </div>
                  <span className="text-slate-200 font-bold">${cardDayHigh.toFixed(1)}</span>
                </div>

                {/* Volume & Relative Volume Multiplier */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  title={`Volume: ${stock.volume || "—"} (RelVol: ${volatilityOverlay.relVolText})`}
                >
                  <span className="text-[8.5px] text-cyan-400/65 font-sans uppercase font-bold tracking-wider">
                    VOL
                  </span>
                  <span className="text-[#00f5d4] font-bold">{stock.volume || "—"}</span>
                  <span className="text-cyan-400/75 text-[9px] font-bold">
                    ({volatilityOverlay.relVolText})
                  </span>
                </div>

                {/* Market Cap */}
                <div
                  className="hidden min-[380px]:flex items-center gap-1 shrink-0"
                  title={`Market Cap: ${stock.marketCap || "—"}`}
                >
                  <span className="text-[8.5px] text-cyan-400/65 font-sans uppercase font-bold tracking-wider">
                    CAP
                  </span>
                  <span className="text-slate-200 font-bold">{stock.marketCap || "—"}</span>
                </div>

                {/* P/E Ratio */}
                {stock.peRatio && stock.peRatio !== "N/A" && (
                  <div
                    className="hidden sm:flex items-center gap-1 shrink-0"
                    title={`P/E Ratio: ${stock.peRatio}`}
                  >
                    <span className="text-[8.5px] text-cyan-400/65 font-sans uppercase font-bold tracking-wider">
                      P/E
                    </span>
                    <span className="text-amber-300 font-bold">{stock.peRatio}</span>
                  </div>
                )}

                {/* 52W Range */}
                <div
                  className="hidden md:flex items-center gap-1 shrink-0"
                  title={`52-Week Range: $${cardLow52.toFixed(1)} - $${cardHigh52.toFixed(1)}`}
                >
                  <span className="text-[8.5px] text-cyan-400/65 font-sans uppercase font-bold tracking-wider">
                    52W
                  </span>
                  <span className="text-slate-300">
                    ${cardLow52.toFixed(0)} - ${cardHigh52.toFixed(0)}
                  </span>
                </div>

                {/* Technical RSI */}
                {cardRsi !== null && (
                  <div
                    className="flex items-center gap-1 shrink-0"
                    title={`RSI (14): ${cardRsi}`}
                  >
                    <span className="text-[8.5px] text-cyan-400/65 font-sans uppercase font-bold tracking-wider">
                      RSI
                    </span>
                    <span
                      className={`font-black ${
                        cardRsi >= 70
                          ? "text-rose-400"
                          : cardRsi <= 30
                            ? "text-[#00ff9d]"
                            : "text-amber-300"
                      }`}
                    >
                      {cardRsi}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
