import React, { useState, useMemo } from "react";
import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";
import { StockTicker, StockNews } from "../types";
import { STOCK_NEWS_FEED } from "../data/stocks";
import { triggerHaptic } from "../utils/haptics";
import {
  Radio,
  Newspaper,
  Sparkles,
  ExternalLink,
  X,
  TrendingUp,
  TrendingDown,
  Pin,
  Pause,
  Play,
  Zap,
  Activity,
  ChevronRight,
  Share2,
  Check,
} from "lucide-react";

interface WatchlistNewsTickerProps {
  stocks: StockTicker[];
  onSelectStock: (stock: StockTicker) => void;
}

export interface ExtendedNewsItem extends StockNews {
  stockName: string;
  price: number;
  changePercent: number;
  isPinned: boolean;
  summary: string;
  marketImpact: string;
  catalystScore: string;
}

export const WatchlistNewsTicker: React.FC<WatchlistNewsTickerProps> = ({
  stocks,
  onSelectStock,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNews, setSelectedNews] = useState<ExtendedNewsItem | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  // Get pinned stocks (or fallback to top featured stocks if none pinned)
  const pinnedStocks = useMemo(() => {
    const pinned = stocks.filter((s) => s.isPinned);
    if (pinned.length > 0) return pinned;
    // Fallback if user has no pinned stocks: top 5 high-impact tickers
    return stocks
      .filter((s) =>
        ["NVDA", "SPCX", "TSLA", "BTC", "SPY", "ASML", "OKLO"].includes(
          s.symbol,
        ),
      )
      .slice(0, 5);
  }, [stocks]);

  // Generate enriched news list for pinned/featured stocks
  const tickerNewsItems = useMemo<ExtendedNewsItem[]>(() => {
    const pinnedSymbols = new Set(
      pinnedStocks.map((s) => s.symbol.toUpperCase()),
    );
    const items: ExtendedNewsItem[] = [];

    // First map existing matching news items from STOCK_NEWS_FEED
    STOCK_NEWS_FEED.forEach((news) => {
      const matchingStock = stocks.find(
        (s) => s.symbol.toUpperCase() === news.relatedSymbol.toUpperCase(),
      );
      if (
        matchingStock &&
        (pinnedSymbols.has(matchingStock.symbol.toUpperCase()) ||
          pinnedStocks.length <= 3)
      ) {
        items.push({
          ...news,
          stockName: matchingStock.name,
          price: matchingStock.price,
          changePercent: matchingStock.changePercent,
          isPinned: !!matchingStock.isPinned,
          summary: `${matchingStock.name} ($${matchingStock.symbol}) is experiencing notable momentum following this intelligence release. ${matchingStock.description}`,
          marketImpact:
            matchingStock.changePercent >= 0
              ? `Bullish price action of +${matchingStock.changePercent.toFixed(2)}% with elevated trading volumes signaling institutional accumulation.`
              : `Short term pullback of ${matchingStock.changePercent.toFixed(2)}% presents potential asymmetric re-entry opportunity for long term holders.`,
          catalystScore:
            (8.2 + Math.abs(matchingStock.changePercent) * 0.3).toFixed(1) +
            "/10",
        });
      }
    });

    // Ensure every pinned stock has at least 1 high-quality headline
    pinnedStocks.forEach((stock) => {
      const exists = items.some(
        (i) => i.relatedSymbol.toUpperCase() === stock.symbol.toUpperCase(),
      );
      if (!exists) {
        items.push({
          id: `pin-news-${stock.symbol}`,
          title: `$${stock.symbol} (${stock.name}): Institutional Volume Surge & Key Ecosystem Expansion`,
          source: "Stock Bloc Market Intelligence",
          timeAgo: "14m ago",
          url: "https://linktr.ee/StockBloc",
          relatedSymbol: stock.symbol,
          sentiment: stock.changePercent >= 0 ? "positive" : "negative",
          stockName: stock.name,
          price: stock.price,
          changePercent: stock.changePercent,
          isPinned: !!stock.isPinned,
          summary: `Direct monitoring of $${stock.symbol} reveals significant trading activity. ${stock.description}`,
          marketImpact: `Current market price is $${stock.price.toFixed(2)} (${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%). High 52-Week ceiling stands at $${stock.high52.toFixed(2)}.`,
          catalystScore: "9.0/10",
        });
      }
    });

    return items;
  }, [pinnedStocks, stocks]);

  const handleShareNews = (news: ExtendedNewsItem) => {
    const text = `🔥 Stock Bloc Intelligence Brief: $${news.relatedSymbol} ${news.title}\nSource: ${news.source}\nImpact: ${news.marketImpact}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      triggerHaptic("success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (tickerNewsItems.length === 0) return null;

  return (
    <div className="w-full px-4 my-3 sm:my-4">
      {/* Ticker Container Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#020912] border border-cyan-500/40 shadow-xl shadow-cyan-950/40 backdrop-blur-md">
        {/* Ticker Top Bar */}
        <div className="px-4 py-2.5 bg-[#031322] border-b border-cyan-500/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-black text-cyan-200 tracking-wider text-[11px] uppercase">
                PINNED WATCHLIST TICKER NEWS
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold">
              <Pin className="w-2.5 h-2.5" />
              {pinnedStocks.length} Pinned Tickers
            </span>
            <NotFinancialAdviceTag className="scale-75 origin-left hidden xs:inline-block" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400/80 font-mono hidden md:inline">
              Hover to Pause & Click Headline to Expand
            </span>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsPaused(!isPaused);
              }}
              className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
              title={isPaused ? "Play News Stream" : "Pause News Stream"}
            >
              {isPaused ? (
                <Play className="w-3 h-3 text-emerald-400" />
              ) : (
                <Pause className="w-3 h-3 text-cyan-400" />
              )}
              <span className="hidden xs:inline">
                {isPaused ? "RESUME" : "PAUSE"}
              </span>
            </button>
          </div>
        </div>

        {/* Scrolling Ticker Track */}
        <div
          className="relative py-4 sm:py-5 overflow-hidden flex items-center cursor-pointer group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`flex items-center gap-6 whitespace-nowrap transition-all ${
              isPaused
                ? "[animation-play-state:paused]"
                : "animate-ticker-scroll"
            }`}
            style={{
              animation: isPaused ? "none" : "tickerScroll 35s linear infinite",
            }}
          >
            {/* Repeat items twice to form seamless loop */}
            {[...tickerNewsItems, ...tickerNewsItems].map((item, idx) => {
              const isPositive =
                item.sentiment === "positive" || item.changePercent >= 0;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    triggerHaptic("medium");
                    setSelectedNews(item);
                  }}
                  className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#041628]/90 hover:bg-cyan-950/80 border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-md group/item hover:scale-[1.02] shrink-0"
                >
                  {/* Symbol Badge */}
                  <div
                    className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                      isPositive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                    }`}
                  >
                    <span>${item.relatedSymbol}</span>
                    <span className="text-[10px] font-mono">
                      {isPositive ? "+" : ""}
                      {item.changePercent.toFixed(1)}%
                    </span>
                  </div>

                  {/* Sentiment Badge */}
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {isPositive ? "⚡ BULLISH" : "🔻 BEARISH"}
                  </span>

                  {/* Headline Text */}
                  <span className="text-xs font-bold text-slate-100 max-w-[280px] sm:max-w-[380px] truncate group-hover/item:text-cyan-300 transition-colors">
                    {item.title}
                  </span>

                  {/* Timestamp & Expand indicator */}
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400/70 font-mono">
                    <span>• {item.timeAgo}</span>
                    <ChevronRight className="w-3 h-3 text-cyan-400 group-hover/item:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded News Summary Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#020b16] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden alien-block-cut">
            {/* Modal Header */}
            <div className="p-4 bg-[#031527] border-b border-cyan-500/30 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    selectedNews.sentiment === "positive"
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                      : "bg-rose-500/20 border-rose-400/50 text-rose-300"
                  }`}
                >
                  <Newspaper className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-cyan-200">
                      ${selectedNews.relatedSymbol}
                    </span>
                    <span className="text-xs text-cyan-400 font-mono">
                      {selectedNews.stockName}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                        selectedNews.changePercent >= 0
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      ${selectedNews.price.toFixed(2)} (
                      {selectedNews.changePercent >= 0 ? "+" : ""}
                      {selectedNews.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-400/80 font-mono uppercase mt-0.5">
                    Source: {selectedNews.source} • {selectedNews.timeAgo}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedNews(null);
                }}
                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-sm">
              {/* Full Title */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <h3 className="text-base font-black text-cyan-100 leading-snug animate-periodic-text-glitch">
                  {selectedNews.title}
                </h3>
              </div>

              {/* Sentiment & Catalyst Score Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#041322] border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-tech">
                    SENTIMENT:
                  </span>
                  <span
                    className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                      selectedNews.sentiment === "positive"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {selectedNews.sentiment === "positive"
                      ? "⚡ BULLISH"
                      : "🔻 BEARISH"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#041322] border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-tech">
                    CATALYST SCORE:
                  </span>
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {selectedNews.catalystScore}
                  </span>
                </div>
              </div>

              {/* Executive Intelligence Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300 uppercase font-tech">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span> Executive Summary & Thesis</span>
                </div>
                <div className="p-4 rounded-xl bg-[#030e1a] border border-cyan-500/20 text-slate-200 text-xs leading-relaxed">
                  {selectedNews.summary}
                </div>
              </div>

              {/* Market Impact Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase font-tech">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Market & Valuation Impact</span> <NotFinancialAdviceTag className="scale-75" />
                </div>
                <div className="p-4 rounded-xl bg-[#0e170c]/80 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed">
                  {selectedNews.marketImpact}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#031527] border-t border-cyan-500/30 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => handleShareNews(selectedNews)}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4 text-cyan-400" />
                )}
                <span>{copied ? "Copied Brief!" : "Share Brief"}</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={selectedNews.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Watch Video on YouTube</span>
                </a>

                <button
                  onClick={() => {
                    const foundStock = stocks.find(
                      (s) =>
                        s.symbol.toUpperCase() ===
                        selectedNews.relatedSymbol.toUpperCase(),
                    );
                    setSelectedNews(null);
                    if (foundStock) {
                      onSelectStock(foundStock);
                    }
                  }}
                  className="px-4 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-wider uppercase flex items-center gap-2 transition-all shadow-lg shadow-cyan-400/30 cursor-pointer"
                >
                  <span>Open ${selectedNews.relatedSymbol} Deep Dive</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Keyframes for Seamless Marquee */}
      <style>{`
  @keyframes tickerScroll {
   0% {
   transform: translateX(0%);
   }
   100% {
   transform: translateX(-50%);
   }
  }
  `}</style>
    </div>
  );
};
