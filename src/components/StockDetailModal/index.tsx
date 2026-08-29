import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { StockTicker, TimeFrame, PaperTrade, CandleDataPoint, StockDetailSubProps } from "../../types";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getTickerSentiment } from "../../utils/sentiment";
import { formatChartTimestamp, calculateCleanYAxisTicks } from "../../utils/chartFormatters";
import {
  X,
  Share2,
  Pin,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Zap,
  Briefcase,
  Calculator,
  Plus,
  Trash2,
  Check,
  DollarSign,
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Terminal,
  Activity,
  Building2,
  Landmark,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  BarChart3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Calendar,
  Clock,
  Bell,
  BellRing,
  Target,
  ThumbsUp,
  Award,
  RotateCw,
  AlertTriangle,
  Loader2,
  Newspaper,
  PenTool,
  LineChart,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { getInstitutionalDataForStock } from "../../utils/institutionalHelper";
import { StockHeader } from "./StockHeader";
import { TradeSimulator } from "./TradeSimulator";
import { PriceChart } from "./PriceChart";
import { FinancialMetrics } from "./FinancialMetrics";
import { NewsPanel } from "./NewsPanel";
import { InstitutionalData } from "./InstitutionalData";
import { OptionsPanel } from "./OptionsPanel";
import { TradeScreenerPanel } from "./TradeScreenerPanel";


const PIE_COLORS = [
  "#10b981",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
  "#f43f5e",
  "#a855f7",
  "#84cc16",
];

// Relative Strength Index (RSI 14) Calculation Helper
const calculateRSI = (
  priceList: number[],
  period = 14,
): { rsi: number; status: "Oversold" | "Neutral" | "Overbought" } => {
  if (!priceList || priceList.length < 2) {
    return { rsi: 50, status: "Neutral" };
  }

  const effectivePeriod = Math.min(period, priceList.length - 1);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= effectivePeriod; i++) {
    const diff = priceList[i] - priceList[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / effectivePeriod;
  let avgLoss = losses / effectivePeriod;

  for (let i = effectivePeriod + 1; i < priceList.length; i++) {
    const diff = priceList[i] - priceList[i - 1];
    const currentGain = diff >= 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (effectivePeriod - 1) + currentGain) / effectivePeriod;
    avgLoss = (avgLoss * (effectivePeriod - 1) + currentLoss) / effectivePeriod;
  }

  let currentRSI = 50;
  if (avgGain === 0 && avgLoss === 0) {
    currentRSI = 50;
  } else if (avgLoss === 0) {
    currentRSI = 100;
  } else {
    const rs = avgGain / avgLoss;
    currentRSI = 100 - 100 / (1 + rs);
  }

  const finalRSI = Math.min(100, Math.max(0, Math.round(currentRSI * 10) / 10));
  let status: "Oversold" | "Neutral" | "Overbought" = "Neutral";
  if (finalRSI >= 70) status = "Overbought";
  else if (finalRSI <= 30) status = "Oversold";

  return { rsi: finalRSI, status };
};

interface StockDetailModalProps {
  stock: StockTicker | null;
  onClose: () => void;
  onTogglePin: (symbol: string) => void;
  onShare: (stock: StockTicker) => void;
  onOpenBloombergTerminal?: (stock: StockTicker) => void;
  onOpenBrokerages?: (stock: StockTicker) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  onClose,
  onTogglePin,
  onShare,
  onOpenBloombergTerminal,
  onOpenBrokerages,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>("1D");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Preserve stock during exit animation
  const [displayStock, setDisplayStock] = useState<StockTicker | null>(stock);

  useEffect(() => {
    if (stock) {
      setDisplayStock(stock);
    }
  }, [stock]);

  const activeStock = stock || displayStock;

  // Candlestick Pinch-to-Zoom & Pan & Engine State
  const [chartMode, setChartMode] = useState<"candle" | "line">("candle"); // 'candle' (TradingView) vs 'line' (Robinhood)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 1.0x to 5.0x
  const [panOffset, setPanOffset] = useState<number>(0.0); // 0.0 (left) to 1.0 (right)
  const [showSMA, setShowSMA] = useState<boolean>(true); // 50-Day SMA Line Overlay toggle
  const [showVWAP, setShowVWAP] = useState<boolean>(true); // Volume-Weighted Average Price (VWAP) Overlay toggle
  const [showRSI, setShowRSI] = useState<boolean>(true); // Relative Strength Index (RSI 14) toggle
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);
  const isDraggingPanRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartPanRef = useRef<number>(0);

  // Interactive Trendline Drawing State
  const [isTrendlineActive, setIsTrendlineActive] = useState<boolean>(false);
  const [isDrawingTrendline, setIsDrawingTrendline] = useState<boolean>(false);
  const [trendline, setTrendline] = useState<{
    x1: number;
    y1: number;
    price1: number;
    time1: string;
    index1: number;
    x2: number;
    y2: number;
    price2: number;
    time2: string;
    index2: number;
  } | null>(null);

  // Reset zoom, pan, and trendline when stock or timeframe changes
  useEffect(() => {
    setZoomLevel(1.0);
    setPanOffset(0.0);
    setTrendline(null);
  }, [stock, timeframe]);

  // Paper Trading & Portfolio Tracker State
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [showPaperForm, setShowPaperForm] = useState(true);
  const [sharesInput, setSharesInput] = useState<number>(10);
  const [entryPriceInput, setEntryPriceInput] = useState<number>(
    stock?.price || 0,
  );
  const [tradeType, setTradeType] = useState<"BUY" | "SHORT">("BUY");
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState<string | null>(null);

  // Institutional Ownership & Smart Money State
  const [showAllInstitutionalHolders, setShowAllInstitutionalHolders] =
    useState(false);

  // Institutional Data Calculation
  const institutionalData = useMemo(() => {
    return stock ? getInstitutionalDataForStock(stock) : null;
  }, [stock]);

  // Earnings Countdown & Calendar Alert State
  const [earningsReminder, setEarningsReminder] = useState<boolean>(false);
  const [showEarningsHistory, setShowEarningsHistory] =
    useState<boolean>(false);
  const [showAnalystFirms, setShowAnalystFirms] = useState<boolean>(false);

  useEffect(() => {
    if (!stock) return;
    try {
      const saved = localStorage.getItem("stockbloc_earnings_reminders");
      if (saved) {
        const list = JSON.parse(saved);
        setEarningsReminder(Array.isArray(list) && list.includes(stock.symbol));
      }
    } catch (e) {
      console.error("Failed to load earnings reminders:", e);
    }
  }, [stock]);

  const handleToggleEarningsReminder = () => {
    if (!stock) return;
    triggerHaptic("success");
    const nextState = !earningsReminder;
    setEarningsReminder(nextState);
    try {
      const saved = localStorage.getItem("stockbloc_earnings_reminders");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (nextState) {
        if (!list.includes(stock.symbol)) list.push(stock.symbol);
      } else {
        list = list.filter((s) => s !== stock.symbol);
      }
      localStorage.setItem(
        "stockbloc_earnings_reminders",
        JSON.stringify(list),
      );
    } catch (e) {
      console.error("Failed to save earnings reminder:", e);
    }
  };

  // Determine if stock is a Private/Pre-IPO Vehicle (e.g., SpaceX / SPCX is treated as public)
  const isPrivateCompany = useMemo(() => {
    if (!stock) return false;
    const sym = stock.symbol.toUpperCase();
    if (sym === "SPCX") return false;
    const desc = (stock.description || "").toLowerCase();
    const name = (stock.name || "").toLowerCase();
    return (
      desc.includes("private") ||
      desc.includes("pre-ipo") ||
      name.includes("openai") ||
      name.includes("anthropic") ||
      name.includes("stripe") ||
      name.includes("databricks") ||
      name.includes("bytedance")
    );
  }, [stock]);

  // Retrieve news headlines using getTickerSentiment or stock payload
  const tickerHeadlines = useMemo(() => {
    if (!stock) return [];
    const sym = stock.symbol.toUpperCase();
    const isPrivate =
      sym === "OPENAI" ||
      sym === "STRIPE" ||
      sym === "ANTHROPIC" ||
      sym === "DATABRICKS" ||
      sym === "BYTEDANCE";

    const defaultUrl = isPrivate
      ? `https://techcrunch.com/tag/${sym.toLowerCase()}/`
      : `https://finance.yahoo.com/quote/${sym}`;

    if (stock.headlines && stock.headlines.length > 0) {
      return stock.headlines.map((h, i) => ({
        id: `h-${i}`,
        title: h.title,
        source: h.source || "Market Wire",
        timeAgo: h.time || "Recent",
        sentiment: h.sentiment || "Bullish",
        url: h.url || defaultUrl,
      }));
    }
    if (stock.news && stock.news.length > 0) {
      return stock.news.map((n, i) => ({
        id: `n-${i}`,
        title: n.title,
        source: n.source || "Market Wire",
        timeAgo: n.time || "Recent",
        sentiment: n.sentiment || "Bullish",
        url: n.url || defaultUrl,
      }));
    }
    const sentimentObj = getTickerSentiment(stock.symbol, stock);
    return (sentimentObj.headlines || []).map((hl) => ({
      ...hl,
      url: hl.url || defaultUrl,
    }));
  }, [stock]);



  // Calculate Analyst Consensus Rating distribution & Price Targets
  const analystConsensusData = useMemo(() => {
    if (!stock) return null;
    const symbol = stock.symbol;
    let charSum = 0;
    for (let i = 0; i < symbol.length; i++) {
      charSum += symbol.charCodeAt(i);
    }

    const currentPrice = stock.price || 100;
    const totalAnalysts = 18 + (charSum % 22); // e.g. 18 to 39 analysts

    // Bias rating based on changePercent or charSum
    const isBullish = (stock.changePercent || 0) >= -1;
    let strongBuyRatio = isBullish
      ? 0.38 + (charSum % 12) * 0.01
      : 0.22 + (charSum % 10) * 0.01;
    let buyRatio = isBullish
      ? 0.38 + (charSum % 10) * 0.01
      : 0.3 + (charSum % 12) * 0.01;
    let holdRatio = 0.16 + (charSum % 8) * 0.01;
    let sellRatio = 0.04 + (charSum % 4) * 0.01;
    let strongSellRatio = Math.max(
      0,
      1 - (strongBuyRatio + buyRatio + holdRatio + sellRatio),
    );

    // Normalize ratios
    const sumRatio =
      strongBuyRatio + buyRatio + holdRatio + sellRatio + strongSellRatio;
    strongBuyRatio /= sumRatio;
    buyRatio /= sumRatio;
    holdRatio /= sumRatio;
    sellRatio /= sumRatio;
    strongSellRatio /= sumRatio;

    const strongBuyCount = Math.round(totalAnalysts * strongBuyRatio);
    const buyCount = Math.round(totalAnalysts * buyRatio);
    const holdCount = Math.round(totalAnalysts * holdRatio);
    const sellCount = Math.round(totalAnalysts * sellRatio);
    const strongSellCount = Math.max(
      0,
      totalAnalysts - (strongBuyCount + buyCount + holdCount + sellCount),
    );

    // Score on 1.0 5.0 scale
    const scoreSum =
      strongBuyCount * 5 +
      buyCount * 4 +
      holdCount * 3 +
      sellCount * 2 +
      strongSellCount * 1;
    const consensusScore = scoreSum / totalAnalysts;

    let consensusLabel: string = stock.rating || "N/A";
    let labelBadgeColor =
      "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";

    const normalizedLabel = consensusLabel.toLowerCase();
    if (normalizedLabel.includes("strong buy")) {
      labelBadgeColor =
        "text-emerald-300 bg-emerald-500/20 border-emerald-400/80 shadow-md shadow-emerald-500/20 font-black";
    } else if (normalizedLabel.includes("buy") || normalizedLabel.includes("outperform")) {
      labelBadgeColor =
        "text-emerald-300 bg-emerald-500/20 border-emerald-500/30 font-extrabold";
    } else if (normalizedLabel.includes("hold") || normalizedLabel.includes("neutral")) {
      labelBadgeColor =
        "text-amber-300 bg-amber-500/20 border-amber-500/30 font-extrabold";
    } else if (normalizedLabel.includes("moderate sell")) {
      labelBadgeColor =
        "text-orange-300 bg-orange-500/20 border-orange-500/30 font-extrabold";
    } else if (normalizedLabel.includes("sell")) {
      labelBadgeColor =
        "text-rose-300 bg-rose-500/20 border-rose-500/30 font-extrabold";
    } else {
      labelBadgeColor = "text-neutral-300 bg-neutral-500/20 border-neutral-500/30";
    }

    // Target Prices
    const avgPriceTarget = stock.targetPrice || currentPrice;
    const highPriceTarget = stock.targetPrice ? Math.round(stock.targetPrice * 1.15 * 100) / 100 : currentPrice;
    const lowPriceTarget = stock.targetPrice ? Math.round(stock.targetPrice * 0.85 * 100) / 100 : currentPrice;
    const upsidePercent = (
      ((avgPriceTarget - currentPrice) / currentPrice) *
      100
    ).toFixed(1);

    const strongBuyPct = Math.round((strongBuyCount / totalAnalysts) * 100);
    const buyPct = Math.round((buyCount / totalAnalysts) * 100);
    const holdPct = Math.round((holdCount / totalAnalysts) * 100);
    const sellPct = Math.round((sellCount / totalAnalysts) * 100);
    const strongSellPct = Math.round((strongSellCount / totalAnalysts) * 100);

    const firms = [
      {
        name: "Goldman Sachs",
        analyst: "Mark Delaney",
        rating: "Buy",
        target: (avgPriceTarget * 1.05).toFixed(2),
        action: "Maintains",
        date: "2d ago",
      },
      {
        name: "Morgan Stanley",
        analyst: "Adam Jonas",
        rating: "Overweight",
        target: (highPriceTarget * 0.98).toFixed(2),
        action: "Raises Target",
        date: "4d ago",
      },
      {
        name: "J.P. Morgan",
        analyst: "Doug Anmuth",
        rating: "Buy",
        target: (avgPriceTarget * 1.02).toFixed(2),
        action: "Reaffirms",
        date: "1w ago",
      },
      {
        name: "Bank of America",
        analyst: "Vivien Zhao",
        rating: "Neutral",
        target: (avgPriceTarget * 0.93).toFixed(2),
        action: "Maintains",
        date: "2w ago",
      },
      {
        name: "Evercore ISI",
        analyst: "Mark Mahaney",
        rating: "Outperform",
        target: highPriceTarget.toFixed(2),
        action: "Raises Target",
        date: "3w ago",
      },
    ];

    return {
      totalAnalysts,
      consensusLabel,
      consensusScore: consensusScore.toFixed(2),
      labelBadgeColor,
      strongBuyCount,
      buyCount,
      holdCount,
      sellCount,
      strongSellCount,
      strongBuyPct,
      buyPct,
      holdPct,
      sellPct,
      strongSellPct,
      avgPriceTarget,
      highPriceTarget,
      lowPriceTarget,
      upsidePercent,
      currentPrice,
      firms,
    };
  }, [stock]);

  // Load paper trades from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stockbloc_paper_trades");
      if (stored) {
        setPaperTrades(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load paper trades:", e);
    }
  }, []);

  // Update entry price input when stock price changes or modal opens
  useEffect(() => {
    if (stock) {
      setEntryPriceInput(stock.price);
    }
  }, [stock]);

  const symbolPaperTrades = stock
    ? paperTrades.filter((pt) => pt.symbol === stock.symbol)
    : [];

  // Calculate portfolio aggregates across all paper trades
  const portfolioAggregates = useMemo(() => {
    if (!paperTrades || paperTrades.length === 0) {
      return {
        totalEquity: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        totalPositions: 0,
        distribution: [],
      };
    }

    const symbolMap: Record<
      string,
      {
        symbol: string;
        name: string;
        shares: number;
        cost: number;
        currentValue: number;
      }
    > = {};

    paperTrades.forEach((pt) => {
      const curPrice =
        stock && pt.symbol === stock.symbol ? stock.price : pt.entryPrice;
      const cost = pt.shares * pt.entryPrice;
      const val = pt.shares * curPrice;

      if (!symbolMap[pt.symbol]) {
        symbolMap[pt.symbol] = {
          symbol: pt.symbol,
          name: pt.name || pt.symbol,
          shares: 0,
          cost: 0,
          currentValue: 0,
        };
      }

      symbolMap[pt.symbol].shares += pt.shares;
      symbolMap[pt.symbol].cost += cost;
      symbolMap[pt.symbol].currentValue += val;
    });

    const symbolList = Object.values(symbolMap);
    const totalEquity = symbolList.reduce(
      (acc, item) => acc + item.currentValue,
      0,
    );
    const totalCost = symbolList.reduce((acc, item) => acc + item.cost, 0);
    const totalGainLoss = totalEquity - totalCost;
    const totalGainLossPercent =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const distribution = symbolList.map((item, idx) => {
      const allocationPercent =
        totalEquity > 0 ? (item.currentValue / totalEquity) * 100 : 0;
      const gainLoss = item.currentValue - item.cost;
      return {
        name: item.symbol,
        fullName: item.name,
        value: item.currentValue,
        shares: item.shares,
        cost: item.cost,
        gainLoss,
        allocationPercent,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      };
    });

    return {
      totalEquity,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      totalPositions: paperTrades.length,
      distribution,
    };
  }, [paperTrades, stock]);

  const handleExecutePaperTrade = async () => {
    if (!stock || sharesInput <= 0 || entryPriceInput <= 0) {
      triggerHaptic("error");
      return;
    }

    const newTrade: PaperTrade = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      symbol: stock.symbol,
      name: stock.name,
      shares: Number(sharesInput),
      entryPrice: Number(entryPriceInput),
      entryDate: new Date().toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      type: tradeType,
    };

    const updatedTrades = [newTrade, ...paperTrades];
    setPaperTrades(updatedTrades);

    try {
      localStorage.setItem("stockbloc_paper_trades", JSON.stringify(updatedTrades));

      // Sync into My Bloc Profile portfolio positions (stockbloc_portfolio_positions)
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
        const existingPos = currentPositions[existingIdx];
        if (tradeType === "BUY") {
          const totalShares = existingPos.shares + Number(sharesInput);
          const totalCost = (existingPos.shares * existingPos.avgCost) + (Number(sharesInput) * Number(entryPriceInput));
          currentPositions[existingIdx] = {
            ...existingPos,
            shares: totalShares,
            avgCost: totalShares > 0 ? totalCost / totalShares : Number(entryPriceInput),
            notes: `Added from Watchlist (${new Date().toLocaleDateString()})`,
          };
        } else {
          // SELL / REDUCE
          const newShares = Math.max(0, existingPos.shares - Number(sharesInput));
          if (newShares === 0) {
            currentPositions = currentPositions.filter((_, idx) => idx !== existingIdx);
          } else {
            currentPositions[existingIdx] = {
              ...existingPos,
              shares: newShares,
            };
          }
        }
      } else {
        currentPositions.push({
          id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          symbol: targetSym,
          shares: Number(sharesInput),
          avgCost: Number(entryPriceInput),
          targetPrice: Math.round(Number(entryPriceInput) * 1.25 * 100) / 100,
          notes: `Added from Watchlist (${new Date().toLocaleDateString()})`,
        });
      }

      localStorage.setItem("stockbloc_portfolio_positions", JSON.stringify(currentPositions));
      window.dispatchEvent(new Event("stockbloc_portfolio_updated"));

      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, { portfolioPositions: currentPositions }, { merge: true });
      }
    } catch (e) {
      console.error("Failed to save paper trade / sync portfolio positions:", e);
    }

    triggerHaptic("success");
    setTradeSuccessMsg(
      `Saved to My Bloc Profile! (${sharesInput} shares of ${stock.symbol} @ $${entryPriceInput})`,
    );
    setTimeout(() => {
      setTradeSuccessMsg(null);
      setShowPaperForm(false);
    }, 2500);
  };

  const handleClosePosition = async (tradeId: string) => {
    triggerHaptic("heavy");
    const closedTrade = paperTrades.find((t) => t.id === tradeId);
    const updated = paperTrades.filter((t) => t.id !== tradeId);
    setPaperTrades(updated);

    try {
      localStorage.setItem("stockbloc_paper_trades", JSON.stringify(updated));

      if (closedTrade) {
        const rawPositions = localStorage.getItem("stockbloc_portfolio_positions");
        if (rawPositions) {
          let currentPositions: Array<any> = JSON.parse(rawPositions);
          currentPositions = currentPositions.filter(
            (p) => p.symbol.toUpperCase() !== closedTrade.symbol.toUpperCase()
          );
          localStorage.setItem("stockbloc_portfolio_positions", JSON.stringify(currentPositions));
          window.dispatchEvent(new Event("stockbloc_portfolio_updated"));

          if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, { portfolioPositions: currentPositions }, { merge: true });
          }
        }
      }
    } catch (e) {
      console.error("Failed to update paper trades:", e);
    }
  };

  // Real Market Historical Chart State
  const [realHistory, setRealHistory] = useState<
    { time: string; price: number }[] | null
  >(null);

  useEffect(() => {
    if (!stock) return;
    let isMounted = true;
    fetch(`/api/stock-chart/${stock.symbol}?range=${timeframe}`)
      .then((res) => res.json())
      .then((data) => {
        if (
          isMounted &&
          data &&
          Array.isArray(data.points) &&
          data.points.length > 0
        ) {
          setRealHistory(data.points);
        }
      })
      .catch((err) => console.warn("Real chart fetch error:", err));

    return () => {
      isMounted = false;
    };
  }, [stock, timeframe]);

  // Historical Benchmark Comparison Overlay State
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [benchmarkSymbol, setBenchmarkSymbol] = useState<"SPY" | "QQQ" | "DIA">(
    "SPY",
  );
  const [benchmarkHistory, setBenchmarkHistory] = useState<
    { time: string; price: number }[] | null
  >(null);

  useEffect(() => {
    if (!showOverlay || !stock) return;
    let isMounted = true;

    fetch(`/api/stock-chart/${benchmarkSymbol}?range=${timeframe}`)
      .then((res) => res.json())
      .then((data) => {
        if (
          isMounted &&
          data &&
          Array.isArray(data.points) &&
          data.points.length > 0
        ) {
          setBenchmarkHistory(data.points);
        } else if (isMounted) {
          const base =
            benchmarkSymbol === "SPY"
              ? 595
              : benchmarkSymbol === "QQQ"
                ? 518
                : 440;
          const hist: any[] = stock.history?.[timeframe] || [];
          const fallbackPts = hist.map((pt, i) => ({
            time: pt.time,
            price:
              base *
              (1 +
                (i / Math.max(1, hist.length - 1)) * 0.012 +
                Math.sin(i / 1.5) * 0.002),
          }));
          setBenchmarkHistory(fallbackPts);
        }
      })
      .catch((err) => {
        console.warn("Benchmark chart fetch error:", err);
        if (isMounted && stock) {
          const base =
            benchmarkSymbol === "SPY"
              ? 595
              : benchmarkSymbol === "QQQ"
                ? 518
                : 440;
          const hist: any[] = stock.history?.[timeframe] || [];
          const fallbackPts = hist.map((pt, i) => ({
            time: pt.time,
            price:
              base *
              (1 +
                (i / Math.max(1, hist.length - 1)) * 0.012 +
                Math.sin(i / 1.5) * 0.002),
          }));
          setBenchmarkHistory(fallbackPts);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showOverlay, benchmarkSymbol, timeframe, stock]);

  // Calculate Relative Strength Index (RSI 14)
  const rsiData = useMemo(() => {
    if (!stock) return { rsi: 50, status: "Neutral" as const };
    const hist: any[] =
      realHistory && realHistory.length > 0
        ? realHistory
        : stock.history?.[timeframe] || [];
    let priceList = hist.map((p) => p.price);
    if (!priceList || priceList.length < 2) {
      if (stock.sparkline && stock.sparkline.length > 1) {
        priceList = stock.sparkline;
      } else {
        const base = stock.price;
        const delta = stock.change;
        priceList = [
          base - delta * 1.2,
          base - delta * 0.8,
          base - delta * 0.4,
          base,
        ];
      }
    }
    return calculateRSI(priceList, 14);
  }, [
    realHistory,
    stock?.history,
    stock?.price,
    stock?.change,
    stock?.sparkline,
    timeframe,
  ]);

  // Generate Full Candlestick OHLC Data from history points (Heikin Ashi)
  const fullCandleOHLCData = useMemo(() => {
    if (!stock) return [];
    const hist: any[] =
      realHistory && realHistory.length > 0
        ? realHistory
        : stock.history?.[timeframe] || [];
    if (!hist || hist.length === 0) return [];

    let standardCandles: CandleDataPoint[] = [];

    // Check if hist items already contain full OHLC properties
    const hasFullOHLC = hist.every(
      (p: any) =>
        p.open !== undefined && p.high !== undefined && p.low !== undefined,
    );

    if (hasFullOHLC) {
      standardCandles = hist.map((p: any, i: number) => {
        const open = Number(p.open ?? p.price);
        const close = Number(p.close ?? p.price);
        const high = Math.max(Number(p.high ?? p.price), open, close);
        const low = Math.min(Number(p.low ?? p.price), open, close);
        return {
          open,
          high,
          low,
          close,
          volume: p.volume || 10000,
          time: p.time ? formatChartTimestamp(p.time) : `T-${i}`,
          isUp: close >= open,
          changePercent: open > 0 ? ((close - open) / open) * 100 : 0,
        };
      });
    } else {
      const targetCandles = 32;
      const chunkSize = Math.max(1, Math.floor(hist.length / targetCandles));

      for (let i = 0; i < hist.length; i += chunkSize) {
        const chunk = hist.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;

        let open = chunk[0].price;
        let close = chunk[chunk.length - 1].price;
        const chunkPrices = chunk.map((p) => p.price);
        const maxP = Math.max(...chunkPrices, open, close);
        const minP = Math.min(...chunkPrices, open, close);

        if (Math.abs(close - open) < open * 0.0015) {
          const prevClose =
            standardCandles.length > 0
              ? standardCandles[standardCandles.length - 1].close
              : open * 0.998;
          open = prevClose;
          const delta =
            open * 0.003 * ((i % 2 === 0 ? 1 : -1) + Math.sin(i * 1.5) * 0.4);
          close = open + delta;
        }

        const bodyMax = Math.max(open, close);
        const bodyMin = Math.min(open, close);
        const bodyHeight = bodyMax - bodyMin;
        const wickPadding = Math.max(open * 0.001, bodyHeight * 0.25);

        const high = Math.max(
          maxP,
          bodyMax + wickPadding * (0.8 + Math.abs(Math.sin(i * 1.7)) * 0.4),
        );
        const low = Math.min(
          minP,
          bodyMin - wickPadding * (0.8 + Math.abs(Math.cos(i * 1.9)) * 0.4),
        );
        const time = formatChartTimestamp(chunk[chunk.length - 1].time) || `T-${i}`;
        const volume = chunk.reduce((sum, p) => sum + (p.volume || 10000), 0);

        standardCandles.push({
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume,
          time,
          isUp: close >= open,
          changePercent: open > 0 ? ((close - open) / open) * 100 : 0,
        });
      }
    }

    // Convert to Heikin Ashi
    let prevHAOpen = standardCandles[0]?.open ?? 0;
    let prevHAClose = standardCandles[0]?.close ?? 0;

    return standardCandles.map((c, idx) => {
      const haClose = (c.open + c.high + c.low + c.close) / 4;

      let haOpen;
      if (idx === 0) {
        haOpen = (c.open + c.close) / 2;
      } else {
        haOpen = (prevHAOpen + prevHAClose) / 2;
      }

      const haHigh = Math.max(c.high, haOpen, haClose);
      const haLow = Math.min(c.low, haOpen, haClose);

      prevHAOpen = haOpen;
      prevHAClose = haClose;

      return {
        ...c,
        open: Number(haOpen.toFixed(2)),
        high: Number(haHigh.toFixed(2)),
        low: Number(haLow.toFixed(2)),
        close: Number(haClose.toFixed(2)),
        isUp: haClose >= haOpen,
        changePercent: haOpen > 0 ? ((haClose - haOpen) / haOpen) * 100 : 0,
      };
    });
  }, [realHistory, stock, timeframe]);

  // Compute visible zoomed subset of candles based on zoomLevel and panOffset
  const candleOHLCData = useMemo(() => {
    if (fullCandleOHLCData.length === 0) return [];
    if (zoomLevel <= 1.01) return fullCandleOHLCData;

    const visibleCount = Math.max(
      5,
      Math.round(fullCandleOHLCData.length / zoomLevel),
    );
    const maxStartIndex = fullCandleOHLCData.length - visibleCount;
    const startIndex = Math.min(
      maxStartIndex,
      Math.max(0, Math.round(panOffset * maxStartIndex)),
    );

    return fullCandleOHLCData.slice(startIndex, startIndex + visibleCount);
  }, [fullCandleOHLCData, zoomLevel, panOffset]);

  // Calculate 50-period Simple Moving Average (SMA) on full Candle OHLC series
  const fullSmaValues = useMemo(() => {
    if (fullCandleOHLCData.length === 0) return [];
    const smaPeriod = 50;
    return fullCandleOHLCData.map((_, idx) => {
      const windowSize = Math.min(idx + 1, smaPeriod);
      const slice = fullCandleOHLCData.slice(
        Math.max(0, idx - windowSize + 1),
        idx + 1,
      );
      const sum = slice.reduce((acc, c) => acc + c.close, 0);
      return sum / slice.length;
    });
  }, [fullCandleOHLCData]);

  // Compute visible zoomed subset of 50 SMA values
  const visibleSmaValues = useMemo(() => {
    if (fullCandleOHLCData.length === 0 || fullSmaValues.length === 0)
      return [];
    if (zoomLevel <= 1.01) return fullSmaValues;

    const visibleCount = Math.max(
      5,
      Math.round(fullCandleOHLCData.length / zoomLevel),
    );
    const maxStartIndex = fullCandleOHLCData.length - visibleCount;
    const startIndex = Math.min(
      maxStartIndex,
      Math.max(0, Math.round(panOffset * maxStartIndex)),
    );

    return fullSmaValues.slice(startIndex, startIndex + visibleCount);
  }, [fullCandleOHLCData, fullSmaValues, zoomLevel, panOffset]);

  // Calculate Volume-Weighted Average Price (VWAP) on full Candle OHLC series
  const fullVwapValues = useMemo(() => {
    if (fullCandleOHLCData.length === 0) return [];
    let cumTPV = 0;
    let cumVol = 0;
    return fullCandleOHLCData.map((c) => {
      const tp = (c.high + c.low + c.close) / 3;
      const vol =
        c.volume ||
        Math.max(
          1000,
          Math.round(((c.high - c.low) / (c.open || 1) + 0.001) * 1000000),
        );
      cumTPV += tp * vol;
      cumVol += vol;
      return cumTPV / (cumVol || 1);
    });
  }, [fullCandleOHLCData]);

  // Compute visible zoomed subset of VWAP values
  const visibleVwapValues = useMemo(() => {
    if (fullCandleOHLCData.length === 0 || fullVwapValues.length === 0)
      return [];
    if (zoomLevel <= 1.01) return fullVwapValues;

    const visibleCount = Math.max(
      5,
      Math.round(fullCandleOHLCData.length / zoomLevel),
    );
    const maxStartIndex = fullCandleOHLCData.length - visibleCount;
    const startIndex = Math.min(
      maxStartIndex,
      Math.max(0, Math.round(panOffset * maxStartIndex)),
    );

    return fullVwapValues.slice(startIndex, startIndex + visibleCount);
  }, [fullCandleOHLCData, fullVwapValues, zoomLevel, panOffset]);

  // Calculate MACD (12, 26, 9) on fullCandleOHLCData
  const fullMacdData = useMemo(() => {
    if (fullCandleOHLCData.length === 0) return [];
    const closes = fullCandleOHLCData.map((c) => c.close);

    const calcEMA = (data: number[], period: number) => {
      const k = 2 / (period + 1);
      const emaArr: number[] = [];
      let prevEma = data[0] || 0;
      emaArr.push(prevEma);
      for (let i = 1; i < data.length; i++) {
        const curEma = data[i] * k + prevEma * (1 - k);
        emaArr.push(curEma);
        prevEma = curEma;
      }
      return emaArr;
    };

    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);

    const macdLine = closes.map((_, i) => ema12[i] - ema26[i]);
    const signalLine = calcEMA(macdLine, 9);
    const histogram = macdLine.map((m, i) => m - signalLine[i]);

    return fullCandleOHLCData.map((c, i) => ({
      macd: macdLine[i],
      signal: signalLine[i],
      histogram: histogram[i],
      time: c.time,
    }));
  }, [fullCandleOHLCData]);

  // Compute visible zoomed subset of MACD values
  const macdData = useMemo(() => {
    if (fullCandleOHLCData.length === 0 || fullMacdData.length === 0) return [];
    if (zoomLevel <= 1.01) return fullMacdData;

    const visibleCount = Math.max(
      5,
      Math.round(fullCandleOHLCData.length / zoomLevel),
    );
    const maxStartIndex = fullCandleOHLCData.length - visibleCount;
    const startIndex = Math.min(
      maxStartIndex,
      Math.max(0, Math.round(panOffset * maxStartIndex)),
    );

    return fullMacdData.slice(startIndex, startIndex + visibleCount);
  }, [fullCandleOHLCData, fullMacdData, zoomLevel, panOffset]);

  // Calculate Relative Strength Index (RSI 14) series on fullCandleOHLCData
  const fullRsiValues = useMemo(() => {
    if (fullCandleOHLCData.length === 0) return [];
    const period = 14;
    const closes = fullCandleOHLCData.map((c) => c.close);
    if (closes.length < 2) return closes.map(() => 50);

    const rsiValues: number[] = new Array(closes.length).fill(50);

    let gainSum = 0;
    let lossSum = 0;

    const initialWindow = Math.min(period, closes.length - 1);
    for (let i = 1; i <= initialWindow; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gainSum += diff;
      else lossSum += Math.abs(diff);
    }

    let avgGain = gainSum / Math.max(1, initialWindow);
    let avgLoss = lossSum / Math.max(1, initialWindow);

    if (avgLoss === 0) {
      rsiValues[initialWindow] = avgGain === 0 ? 50 : 100;
    } else {
      const rs = avgGain / avgLoss;
      rsiValues[initialWindow] = Math.round((100 - 100 / (1 + rs)) * 10) / 10;
    }

    for (let i = initialWindow + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      if (avgLoss === 0) {
        rsiValues[i] = avgGain === 0 ? 50 : 100;
      } else {
        const rs = avgGain / avgLoss;
        rsiValues[i] = Math.round((100 - 100 / (1 + rs)) * 10) / 10;
      }
    }

    // Backfill early points smoothly
    for (let i = 0; i < initialWindow; i++) {
      rsiValues[i] = rsiValues[initialWindow];
    }

    return rsiValues;
  }, [fullCandleOHLCData]);

  // Compute visible zoomed subset of RSI values
  const visibleRsiValues = useMemo(() => {
    if (fullCandleOHLCData.length === 0 || fullRsiValues.length === 0)
      return [];
    if (zoomLevel <= 1.01) return fullRsiValues;

    const visibleCount = Math.max(
      5,
      Math.round(fullCandleOHLCData.length / zoomLevel),
    );
    const maxStartIndex = fullCandleOHLCData.length - visibleCount;
    const startIndex = Math.min(
      maxStartIndex,
      Math.max(0, Math.round(panOffset * maxStartIndex)),
    );

    return fullRsiValues.slice(startIndex, startIndex + visibleCount);
  }, [fullCandleOHLCData, fullRsiValues, zoomLevel, panOffset]);

  // Helper to map pointer events to SVG stage & candle data for trendline drawing
  const getChartCoords = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    stageElem: HTMLDivElement,
  ) => {
    const rect = stageElem.getBoundingClientRect();
    const clientX =
      "touches" in e
        ? (e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0)
        : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e
        ? (e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0)
        : (e as React.MouseEvent).clientY;

    const rawX = Math.max(
      0,
      Math.min(
        plotWidth,
        ((clientX - rect.left) / Math.max(1, rect.width)) * svgWidth,
      ),
    );
    const rawY = Math.max(
      0,
      Math.min(
        svgHeight,
        ((clientY - rect.top) / Math.max(1, rect.height)) * svgHeight,
      ),
    );

    const totalCandles = candleOHLCData.length;
    const idx =
      totalCandles > 0
        ? Math.min(
            totalCandles - 1,
            Math.max(0, Math.round((rawX / plotWidth) * (totalCandles - 1))),
          )
        : 0;
    const candle = candleOHLCData[idx];

    const calcPrice =
      minVal + ((plotBottom - rawY) / Math.max(1, plotHeight)) * valRange;
    const price = candle ? candle.close : calcPrice;
    const time = candle ? candle.time : `Bar ${idx + 1}`;

    const snappedX =
      totalCandles > 1 ? (idx / (totalCandles - 1)) * plotWidth : rawX;
    const snappedY =
      plotBottom - ((price - minVal) / Math.max(0.001, valRange)) * plotHeight;

    return { x: snappedX, y: snappedY, price, time, index: idx };
  };

  const startTrendline = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    stageElem: HTMLDivElement,
  ) => {
    const coords = getChartCoords(e, stageElem);
    setIsDrawingTrendline(true);
    setTrendline({
      x1: coords.x,
      y1: coords.y,
      price1: coords.price,
      time1: coords.time,
      index1: coords.index,
      x2: coords.x,
      y2: coords.y,
      price2: coords.price,
      time2: coords.time,
      index2: coords.index,
    });
    triggerHaptic("medium");
  };

  const updateTrendline = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    stageElem: HTMLDivElement,
  ) => {
    if (!isDrawingTrendline) return;
    const coords = getChartCoords(e, stageElem);
    setTrendline((prev) =>
      prev
        ? {
            ...prev,
            x2: coords.x,
            y2: coords.y,
            price2: coords.price,
            time2: coords.time,
            index2: coords.index,
          }
        : null,
    );
  };

  const finishTrendline = () => {
    if (isDrawingTrendline) {
      setIsDrawingTrendline(false);
      triggerHaptic("selection");
    }
  };

  // Trendline Slope & Metrics Calculation
  const trendlineMetrics = useMemo(() => {
    if (!trendline) return null;
    const priceDiff = trendline.price2 - trendline.price1;
    const percentChange =
      trendline.price1 !== 0
        ? (priceDiff / Math.abs(trendline.price1)) * 100
        : 0;
    const barDiff = trendline.index2 - trendline.index1;
    const absBars = Math.abs(barDiff);

    const priceSlopePerBar = barDiff !== 0 ? priceDiff / barDiff : priceDiff;
    const percentSlopePerBar =
      barDiff !== 0 ? percentChange / barDiff : percentChange;

    const dx = trendline.x2 - trendline.x1;
    const dy = trendline.y2 - trendline.y1;
    const angleRad = Math.atan2(-dy, dx);
    const angleDeg = angleRad * (180 / Math.PI);

    const isBullish = priceDiff >= 0;

    return {
      priceDiff,
      percentChange,
      barDiff,
      absBars,
      priceSlopePerBar,
      percentSlopePerBar,
      angleDeg,
      isBullish,
    };
  }, [trendline]);

  // Touch Pinch-to-Zoom & Pan & Trendline Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isTrendlineActive && e.touches.length === 1) {
      startTrendline(e, e.currentTarget);
      return;
    }
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1 && zoomLevel > 1.05) {
      isDraggingPanRef.current = true;
      dragStartXRef.current = e.touches[0].clientX;
      dragStartPanRef.current = panOffset;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isTrendlineActive && isDrawingTrendline && e.touches.length === 1) {
      updateTrendline(e, e.currentTarget);
      return;
    }
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY,
      );
      if (touchStartDistRef.current > 0) {
        const scale = currentDist / touchStartDistRef.current;
        const rawZoom = touchStartZoomRef.current * scale;
        const newZoom = Math.min(
          5.0,
          Math.max(1.0, Number(rawZoom.toFixed(2))),
        );
        setZoomLevel(newZoom);
      }
    } else if (
      e.touches.length === 1 &&
      isDraggingPanRef.current &&
      zoomLevel > 1.05
    ) {
      const dx = e.touches[0].clientX - dragStartXRef.current;
      const panDelta = -dx / 250;
      const newPan = Math.min(
        1.0,
        Math.max(0.0, dragStartPanRef.current + panDelta),
      );
      setPanOffset(Number(newPan.toFixed(3)));
    }
  };

  const handleTouchEnd = () => {
    if (isTrendlineActive && isDrawingTrendline) {
      finishTrendline();
    }
    touchStartDistRef.current = null;
    isDraggingPanRef.current = false;
  };

  // Wheel / Scroll Zoom Handler
  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > 5) {
      const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
      const newZoom = Math.min(
        5.0,
        Math.max(1.0, Number((zoomLevel + zoomDelta).toFixed(2))),
      );
      setZoomLevel(newZoom);
      if (newZoom === 1.0) {
        setPanOffset(0.0);
      }
    }
  };

  // Mouse Drag to Pan or Draw Trendline
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTrendlineActive) {
      startTrendline(e, e.currentTarget);
      return;
    }
    if (zoomLevel > 1.05) {
      isDraggingPanRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartPanRef.current = panOffset;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTrendlineActive && isDrawingTrendline) {
      updateTrendline(e, e.currentTarget);
      return;
    }
    if (isDraggingPanRef.current && zoomLevel > 1.05) {
      const dx = e.clientX - dragStartXRef.current;
      const panDelta = -dx / 300;
      const newPan = Math.min(
        1.0,
        Math.max(0.0, dragStartPanRef.current + panDelta),
      );
      setPanOffset(Number(newPan.toFixed(3)));
    }
  };

  const handleMouseUp = () => {
    if (isTrendlineActive && isDrawingTrendline) {
      finishTrendline();
    }
    isDraggingPanRef.current = false;
  };

  useEffect(() => {
    setAiAnalysis(null);
  }, [stock]);

  const history =
    realHistory && realHistory.length > 0
      ? realHistory
      : stock?.history?.[timeframe] || [];
  const isPositive = (stock?.changePercent || 0) >= 0;

  // Calculate high & low in selected timeframe
  const prices = history.map((p) => p.price);
  const minPrice =
    prices.length > 0 ? Math.min(...prices) : (stock?.price || 100) * 0.98;
  const maxPrice =
    prices.length > 0 ? Math.max(...prices) : (stock?.price || 100) * 1.02;
  const priceRange = maxPrice - minPrice || 1;

  // Benchmark details map
  const BENCHMARK_CONFIGS = {
    SPY: {
      name: "S&P 500 Index ETF",
      color: "#38bdf8",
      badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    },
    QQQ: {
      name: "Nasdaq-100 Tech ETF",
      color: "#c084fc",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    },
    DIA: {
      name: "Dow Jones Industrial ETF",
      color: "#f59e0b",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    },
  };

  const activeBenchmark = BENCHMARK_CONFIGS[benchmarkSymbol];

  // Percentage returns for overlay mode
  const stockBasePrice = history[0]?.price || stock?.price || 100;
  const stockReturns = history.map(
    (pt) => ((pt.price - stockBasePrice) / (stockBasePrice || 1)) * 100,
  );

  const benchHistoryPoints =
    benchmarkHistory && benchmarkHistory.length > 0
      ? benchmarkHistory
      : history;
  const benchBasePrice = benchHistoryPoints[0]?.price || 1;
  const benchReturns = benchHistoryPoints.map(
    (pt) => ((pt.price - benchBasePrice) / (benchBasePrice || 1)) * 100,
  );

  // Generate SVG Stage Dimensions for TradingView & Robinhood Engine
  const svgWidth = 600;
  const svgHeight = 280;
  const rightMargin = 65;
  const plotWidth = svgWidth - rightMargin; // 535px active price plot width
  const plotTop = 15;
  const plotBottom = 215;
  const plotHeight = plotBottom - plotTop; // 200px price height

  // Bounds & SVG Scaling
  let minVal = minPrice;
  let maxVal = maxPrice;
  let valRange = priceRange;

  let zeroY = plotBottom;
  let benchmarkPathD = "";

  if (showOverlay) {
    const combinedReturns = [...stockReturns, ...benchReturns];
    minVal = Math.min(...combinedReturns) - 0.5;
    maxVal = Math.max(...combinedReturns) + 0.5;
    valRange = maxVal - minVal || 1;

    // Zero % baseline
    zeroY = plotBottom - ((0 - minVal) / valRange) * plotHeight;

    // Benchmark Path
    benchmarkPathD = benchReturns
      .map((ret, idx) => {
        const x = (idx / Math.max(1, benchReturns.length - 1)) * plotWidth;
        const y = plotBottom - ((ret - minVal) / valRange) * plotHeight;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }

  // Recalculate price bounds for Candlesticks if not in overlay mode
  const candleAllPrices = candleOHLCData.flatMap((c) => [
    c.open,
    c.close,
    c.high,
    c.low,
  ]);
  if (candleAllPrices.length > 0 && !showOverlay) {
    let minP = Math.min(...candleAllPrices);
    let maxP = Math.max(...candleAllPrices);
    if (showSMA && visibleSmaValues.length > 0) {
      minP = Math.min(minP, ...visibleSmaValues);
      maxP = Math.max(maxP, ...visibleSmaValues);
    }
    if (showVWAP && visibleVwapValues.length > 0) {
      minP = Math.min(minP, ...visibleVwapValues);
      maxP = Math.max(maxP, ...visibleVwapValues);
    }
    const padding = (maxP - minP) * 0.05 || minP * 0.01;
    minVal = minP - padding;
    maxVal = maxP + padding;
    valRange = maxVal - minVal || 1;
  }

  const activeCandle =
    hoverIndex !== null && candleOHLCData[hoverIndex]
      ? candleOHLCData[hoverIndex]
      : candleOHLCData[candleOHLCData.length - 1] || {
          open: stock?.price || 0,
          high: stock?.price || 0,
          low: stock?.price || 0,
          close: stock?.price || 0,
          time: "Now",
          isUp: (stock?.changePercent || 0) >= 0,
          changePercent: stock?.changePercent || 0,
          volume: 10000,
        };

  const activeSma =
    hoverIndex !== null && visibleSmaValues[hoverIndex] !== undefined
      ? visibleSmaValues[hoverIndex]
      : visibleSmaValues[visibleSmaValues.length - 1] || activeCandle.close;

  const activeVwap =
    hoverIndex !== null && visibleVwapValues[hoverIndex] !== undefined
      ? visibleVwapValues[hoverIndex]
      : visibleVwapValues[visibleVwapValues.length - 1] || activeCandle.close;

  const activeMacd =
    hoverIndex !== null && macdData[hoverIndex] !== undefined
      ? macdData[hoverIndex]
      : macdData[macdData.length - 1] || {
          macd: 0,
          signal: 0,
          histogram: 0,
          time: "Now",
        };

  const activeRsi =
    hoverIndex !== null && visibleRsiValues[hoverIndex] !== undefined
      ? visibleRsiValues[hoverIndex]
      : (visibleRsiValues[visibleRsiValues.length - 1] ?? rsiData.rsi ?? 50);

  const activeRsiStatus = useMemo(() => {
    if (activeRsi >= 70)
      return {
        label: "Overbought",
        color: "text-amber-300 bg-amber-500/20 border-amber-500/40",
      };
    if (activeRsi <= 30)
      return {
        label: "Oversold",
        color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/40",
      };
    return {
      label: "Neutral",
      color: "text-cyan-300 bg-cyan-500/20 border-cyan-500/30",
    };
  }, [activeRsi]);

  const macdStatus = useMemo(() => {
    if (!activeMacd)
      return {
        label: "Neutral",
        status: "Neutral",
        color: "text-cyan-300 bg-cyan-500/20 border-cyan-500/30",
      };
    const { macd, signal, histogram } = activeMacd;
    if (histogram > 0 && macd > signal) {
      return {
        label: "Bullish Momentum",
        status: "Bullish",
        color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/40",
      };
    } else if (histogram < 0 && macd < signal) {
      return {
        label: "Bearish Momentum",
        status: "Bearish",
        color: "text-rose-300 bg-rose-500/20 border-rose-500/40",
      };
    } else if (histogram >= 0) {
      return {
        label: "Bullish Crossover",
        status: "Bullish",
        color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
      };
    } else {
      return {
        label: "Bearish Crossover",
        status: "Bearish",
        color: "text-amber-300 bg-amber-500/20 border-amber-500/30",
      };
    }
  }, [activeMacd]);

  const hoveredPoint = {
    price: activeCandle.close,
    time: activeCandle.time,
  };

  // Maximum Volume for volume histogram
  const maxVolume = useMemo(() => {
    if (candleOHLCData.length === 0) return 10000;
    return Math.max(...candleOHLCData.map((c) => c.volume || 1000), 1000);
  }, [candleOHLCData]);

  // Y-Axis Price Ticks with strict step-rounding and clean intervals
  const yAxisTicks = useMemo(() => {
    return calculateCleanYAxisTicks({
      minVal,
      maxVal,
      plotBottom,
      plotHeight,
      targetCount: 5,
      isPercent: showOverlay,
    });
  }, [minVal, maxVal, plotBottom, plotHeight, showOverlay]);

  // Smooth Robinhood Line Path & Area Path
  const linePathD = useMemo(() => {
    if (candleOHLCData.length === 0) return "";
    return candleOHLCData
      .map((c, idx) => {
        const x = (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth;
        const y = plotBottom - ((c.close - minVal) / valRange) * plotHeight;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [candleOHLCData, minVal, valRange, plotWidth, plotBottom, plotHeight]);

  const areaPathD = useMemo(() => {
    if (candleOHLCData.length === 0) return "";
    return `${linePathD} L ${plotWidth.toFixed(2)} ${plotBottom} L 0 ${plotBottom} Z`;
  }, [linePathD, plotWidth, plotBottom]);

  // 50-Day SMA Overlay SVG Path
  const smaPathD =
    showSMA && visibleSmaValues.length > 0
      ? visibleSmaValues
          .map((sma, idx) => {
            const x =
              (idx / Math.max(1, visibleSmaValues.length - 1)) * plotWidth;
            const y = plotBottom - ((sma - minVal) / valRange) * plotHeight;
            return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ")
      : "";

  // Volume-Weighted Average Price (VWAP) Overlay SVG Path
  const vwapPathD =
    showVWAP && visibleVwapValues.length > 0
      ? visibleVwapValues
          .map((vwap, idx) => {
            const x =
              (idx / Math.max(1, visibleVwapValues.length - 1)) * plotWidth;
            const y = plotBottom - ((vwap - minVal) / valRange) * plotHeight;
            return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ")
      : "";

  // MACD Chart dimensions & path generation
  const macdSvgHeight = 110;
  const macdMaxAbs = useMemo(() => {
    if (macdData.length === 0) return 0.01;
    let maxVal = 0.01;
    macdData.forEach((d) => {
      maxVal = Math.max(
        maxVal,
        Math.abs(d.macd),
        Math.abs(d.signal),
        Math.abs(d.histogram),
      );
    });
    return maxVal * 1.15;
  }, [macdData]);

  const macdY0 = macdSvgHeight / 2;
  const getMacdY = (val: number) => macdY0 - (val / macdMaxAbs) * (macdY0 - 14);

  const macdLinePath = useMemo(() => {
    if (macdData.length === 0) return "";
    return macdData
      .map((d, i) => {
        const x = (i / Math.max(1, macdData.length - 1)) * plotWidth;
        const y = getMacdY(d.macd);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [macdData, macdMaxAbs, plotWidth, macdY0, getMacdY]);

  const macdSignalPath = useMemo(() => {
    if (macdData.length === 0) return "";
    return macdData
      .map((d, i) => {
        const x = (i / Math.max(1, macdData.length - 1)) * plotWidth;
        const y = getMacdY(d.signal);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [macdData, macdMaxAbs, plotWidth, macdY0, getMacdY]);

  // X-Axis Time Ticks for main price stage (Exactly 4 evenly-spaced ticks)
  const timeTicks = useMemo(() => {
    if (candleOHLCData.length === 0) return [];
    const count = Math.min(4, candleOHLCData.length);
    const ticks = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(
        (i / Math.max(1, count - 1)) * (candleOHLCData.length - 1),
      );
      const item = candleOHLCData[idx];
      if (item) {
        const x = (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth;
        ticks.push({ x, label: formatChartTimestamp(item.time), idx });
      }
    }
    return ticks;
  }, [candleOHLCData, plotWidth]);

  // Synchronized Hover scrubber for subcharts
  const handleSubchartHover = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    elem: HTMLDivElement,
  ) => {
    const rect = elem.getBoundingClientRect();
    const clientX =
      "touches" in e && e.touches.length > 0
        ? e.touches[0].clientX
        : (e as React.MouseEvent).clientX;
    const rawX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const normalizedX = (rawX / Math.max(1, rect.width)) * svgWidth;
    const totalCandles = candleOHLCData.length;
    if (totalCandles > 0) {
      const idx = Math.min(
        totalCandles - 1,
        Math.max(0, Math.round((normalizedX / plotWidth) * (totalCandles - 1))),
      );
      setHoverIndex(idx);
    }
  };

  // RSI Chart dimensions & path generation
  const rsiSvgHeight = 110;
  const getRsiY = (val: number) =>
    rsiSvgHeight -
    12 -
    (Math.min(100, Math.max(0, val)) / 100) * (rsiSvgHeight - 24);

  const rsiLinePath =
    visibleRsiValues.length > 0
      ? visibleRsiValues
          .map((val, idx) => {
            const x =
              (idx / Math.max(1, visibleRsiValues.length - 1)) * plotWidth;
            const y = getRsiY(val);
            return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ")
      : "";

  const pathD = history
    .map((pt, idx) => {
      const x = (idx / Math.max(1, history.length - 1)) * svgWidth;
      const value = showOverlay ? stockReturns[idx] : pt.price;
      const y =
        svgHeight - ((value - minVal) / valRange) * (svgHeight - 40) - 20;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD = `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  // Active hover overlay calculations
  const activeHoverIdx = hoverIndex !== null ? hoverIndex : history.length - 1;
  const hoveredStockReturn = stockReturns[activeHoverIdx] || 0;
  const hoveredBenchReturn =
    benchReturns[Math.min(activeHoverIdx, benchReturns.length - 1)] || 0;
  const hoveredAlpha = hoveredStockReturn - hoveredBenchReturn;

  // Fetch Analysis from server
  const fetchAiAnalysis = async () => {
    if (!stock) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/stock-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          changePercent: stock.changePercent,
          category: stock.category,
          description: stock.description,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP status ${res.status}`);
      }

      const data = await res.json();
      if (data && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        throw new Error("No analysis text returned from server.");
      }
    } catch (err: unknown) {
      console.error("Stock Analysis Error:", err);
      setAiError(
        (err as Error)?.message ||
          "Unable to fetch live Stock Bloc breakdown. Please check network connection.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, [stock]);

  
  const propsToPass: StockDetailSubProps = { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis };
  
  return (
    <AnimatePresence>
      {stock && activeStock && (
        <motion.div
          key="stock-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="stock-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            style={{
              boxShadow: `0 0 100px -20px ${isPositive ? "rgba(0,255,136,0.15)" : "rgba(255,59,59,0.15)"}`,
            }}
          >
            <StockHeader {...propsToPass} />
            <div className="p-6 space-y-6 overflow-y-auto">
                <NewsPanel {...propsToPass} />
                <TradeScreenerPanel stock={stock} />
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-6">
                    <TradeSimulator {...propsToPass} />
                    <PriceChart {...propsToPass} />
                    <FinancialMetrics {...propsToPass} />
                  </div>
                  <div className="w-full lg:w-[400px] space-y-6 shrink-0">
                    <InstitutionalData {...propsToPass} />
                    <OptionsPanel {...propsToPass} />
                  </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
