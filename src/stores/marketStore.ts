import { create } from 'zustand';
import { StockTicker, SortField, SectorCategory } from "../types";
import { INITIAL_STOCKS } from "../data/stocks";


interface MarketState {
  stocks: StockTicker[];
  setStocks: (stocks: StockTicker[]) => void;
  selectedCategory: SectorCategory | "all";
  setSelectedCategory: (cat: SectorCategory | "all") => void;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortDirection: "desc" | "asc";
  setSortDirection: (dir: "desc" | "asc") => void;
  isSyncingLiveQuotes: boolean;
  setIsSyncingLiveQuotes: (is: boolean) => void;
  lastSyncTime: string | null;
  setLastSyncTime: (time: string | null) => void;
  marketDataUpdatedAt: string | null;
  setMarketDataUpdatedAt: (time: string | null) => void;
  marketDataIsStale: boolean;
  setMarketDataIsStale: (stale: boolean) => void;
  marketDataSource: string;
  setMarketDataSource: (src: string) => void;
  selectedStock: StockTicker | null;
  setSelectedStock: (stock: StockTicker | null) => void;
  watchlistChartStyle: "candlestick" | "line";
  setWatchlistChartStyle: (style: "candlestick" | "line") => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  stocks: INITIAL_STOCKS,
  setStocks: (stocks) => set({ stocks }),
  selectedCategory: "tsunami",
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  sortField: "changePercent",
  setSortField: (sortField) => set({ sortField }),
  sortDirection: "desc",
  setSortDirection: (sortDirection) => set({ sortDirection }),
  isSyncingLiveQuotes: false,
  setIsSyncingLiveQuotes: (isSyncingLiveQuotes) => set({ isSyncingLiveQuotes }),
  lastSyncTime: null,
  setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
  marketDataUpdatedAt: new Date().toISOString(),
  setMarketDataUpdatedAt: (marketDataUpdatedAt) => set({ marketDataUpdatedAt }),
  marketDataIsStale: false,
  setMarketDataIsStale: (marketDataIsStale) => set({ marketDataIsStale }),
  marketDataSource: "GitHub JSON / Live API",
  setMarketDataSource: (marketDataSource) => set({ marketDataSource }),
  selectedStock: null,
  setSelectedStock: (selectedStock) => set({ selectedStock }),
  watchlistChartStyle: (typeof window !== "undefined" && (localStorage.getItem("stockbloc_watchlist_chart_style") as "candlestick" | "line")) || "line",
  setWatchlistChartStyle: (watchlistChartStyle) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("stockbloc_watchlist_chart_style", watchlistChartStyle);
    }
    set({ watchlistChartStyle });
  },
}));
