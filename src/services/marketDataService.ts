import fs from 'fs';
import path from 'path';

// --- Interfaces ---

export interface QuantMetrics {
  rsi14: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  priceVsSma20Pct: number | null;
  priceVsSma50Pct: number | null;
  priceVsSma200Pct: number | null;
  volumeVsAvg20Ratio: number | null;
  percentile52Week: number | null;
  volatility: number | null;
}

export interface SignalCategoryScore {
  name: string;
  score: number; // 0 - 100
  weight: number;
  detail: string;
}

export interface StockBlocSignal {
  signalScore: number; // 0 - 100
  signalLabel: "Strong Bullish" | "Bullish" | "Neutral" | "Caution" | "Bearish";
  components: SignalCategoryScore[];
  summary: string;
}

export interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  previousClose?: number;
  change: number;
  percent_change: number;
  volume?: number;
  avgVolume?: number;
  market_cap?: string;
  high52?: number;
  low52?: number;
  sector?: string;
  analysis_summary?: string;
  sparkline?: number[];
  theme?: string;
  cardColor?: string;
  color?: string;
  pinned?: boolean;
  target_price?: number;
  rating?: string;
  inst_holders?: string;
  headlines?: string[];
  news?: Array<{ title: string; source: string; time?: string; sentiment?: string; url?: string; }>;
  quant?: QuantMetrics;
  signal?: StockBlocSignal;
  last_updated?: string;
  source?: string;
}

export type FeedStatusLabel = "fresh" | "delayed" | "stale" | "very_stale";

export interface MarketFeedData {
  status: "success" | "stale" | "error";
  updated_at: string;
  last_successful_update: string;
  source: string;
  data_age_seconds: number;
  status_label: FeedStatusLabel;
  market_status: "open" | "closed" | "extended-hours";
  watchlist: WatchlistStock[];
  error?: string;
}

// --- Validation Functions ---

export function validateWatchlistStock(stock: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!stock || typeof stock !== 'object') {
    return { valid: false, errors: ['Stock record is null or not an object'] };
  }

  if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.trim() === '') {
    errors.push('Missing or empty symbol');
  }

  if (stock.price === undefined || (typeof stock.price !== 'number' && stock.price !== null) || (typeof stock.price === 'number' && isNaN(stock.price)) || (typeof stock.price === 'number' && stock.price < 0)) {
    errors.push(`Invalid price for ${stock?.symbol || 'UNKNOWN'}: ${stock?.price}`);
  }

  if (stock.change === undefined || (typeof stock.change !== 'number' && stock.change !== null) || (typeof stock.change === 'number' && isNaN(stock.change))) {
    errors.push(`Invalid change for ${stock?.symbol || 'UNKNOWN'}: ${stock?.change}`);
  }

  if (stock.percent_change === undefined || (typeof stock.percent_change !== 'number' && stock.percent_change !== null) || (typeof stock.percent_change === 'number' && isNaN(stock.percent_change))) {
    errors.push(`Invalid percent_change for ${stock?.symbol || 'UNKNOWN'}: ${stock?.percent_change}`);
  }

  if (stock.volume !== undefined && stock.volume !== null && typeof stock.volume === 'number' && (isNaN(stock.volume) || stock.volume < 0)) {
    errors.push(`Invalid volume for ${stock?.symbol || 'UNKNOWN'}: ${stock?.volume}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateMarketDataset(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Dataset is not an object'] };
  }

  if (!data.updated_at || typeof data.updated_at !== 'string' || isNaN(new Date(data.updated_at).getTime())) {
    errors.push('Missing or invalid updated_at timestamp');
  }

  if (!Array.isArray(data.watchlist) || data.watchlist.length === 0) {
    errors.push('Watchlist is missing, not an array, or empty');
  } else {
    data.watchlist.forEach((stock: any, idx: number) => {
      const res = validateWatchlistStock(stock);
      if (!res.valid) {
        errors.push(`Stock [${idx}] (${stock?.symbol || 'UNKNOWN'}): ${res.errors.join(', ')}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// --- Quantitative Calculation Helpers ---

export function calculateRSI(prices: number[], period = 14): number | null {
  if (!prices || prices.length < 2) return null;
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const sample = changes.slice(-period);
  if (sample.length === 0) return null;

  let gains = 0;
  let losses = 0;
  sample.forEach((c) => {
    if (c > 0) gains += c;
    else losses += Math.abs(c);
  });

  const avgGain = gains / sample.length;
  const avgLoss = losses / sample.length;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

export function calculateSMA(prices: number[], period: number): number | null {
  if (!prices || prices.length === 0) return null;
  const slice = prices.slice(-period);
  if (slice.length === 0) return null;
  const sum = slice.reduce((a, b) => a + b, 0);
  return Number((sum / slice.length).toFixed(2));
}

export function calculateVolatility(prices: number[]): number | null {
  if (!prices || prices.length < 3) return null;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  // Annualized volatility estimate (assuming ~252 trading sessions)
  const annualized = stdDev * Math.sqrt(252) * 100;
  return Number(annualized.toFixed(2));
}

export function computeQuantMetrics(stock: Partial<WatchlistStock>): QuantMetrics {
  const sparkline = stock.sparkline || [];
  const currentPrice = stock.price || 0;
  const volume = stock.volume || 0;
  const avgVolume = stock.avgVolume || volume;

  const rsi14 = calculateRSI(sparkline, 14);
  const sma20 = calculateSMA(sparkline, 20);
  const sma50 = calculateSMA(sparkline, 50);
  const sma200 = calculateSMA(sparkline, 200);

  const priceVsSma20Pct = sma20 && currentPrice ? Number((((currentPrice - sma20) / sma20) * 100).toFixed(2)) : null;
  const priceVsSma50Pct = sma50 && currentPrice ? Number((((currentPrice - sma50) / sma50) * 100).toFixed(2)) : null;
  const priceVsSma200Pct = sma200 && currentPrice ? Number((((currentPrice - sma200) / sma200) * 100).toFixed(2)) : null;

  const volumeVsAvg20Ratio = avgVolume && avgVolume > 0 && volume ? Number((volume / avgVolume).toFixed(2)) : 1.0;

  let percentile52Week: number | null = null;
  if (stock.high52 && stock.low52 && stock.high52 > stock.low52 && currentPrice) {
    percentile52Week = Number((((currentPrice - stock.low52) / (stock.high52 - stock.low52)) * 100).toFixed(2));
  }

  const volatility = calculateVolatility(sparkline);

  return {
    rsi14,
    sma20,
    sma50,
    sma200,
    priceVsSma20Pct,
    priceVsSma50Pct,
    priceVsSma200Pct,
    volumeVsAvg20Ratio,
    percentile52Week,
    volatility
  };
}

// --- Stock Bloc Signal Scoring Engine ---

export function calculateStockBlocSignal(stock: WatchlistStock, quant: QuantMetrics): StockBlocSignal {
  const components: SignalCategoryScore[] = [];

  // 1. Momentum Category (25%)
  let momentumScore = 50;
  const rsi = quant.rsi14 !== null ? quant.rsi14 : 50;
  if (rsi >= 50 && rsi <= 70) {
    momentumScore = 70 + ((rsi - 50) / 20) * 30; // 70 to 100
  } else if (rsi > 70) {
    momentumScore = 80 - ((rsi - 70) / 30) * 40; // overbought penalty
  } else if (rsi < 30) {
    momentumScore = 30; // oversold
  } else {
    momentumScore = 40 + ((rsi - 30) / 20) * 20;
  }
  if (stock.percent_change > 0) momentumScore = Math.min(100, momentumScore + Math.min(15, stock.percent_change * 2));
  if (stock.percent_change < 0) momentumScore = Math.max(0, momentumScore - Math.min(15, Math.abs(stock.percent_change) * 2));

  components.push({
    name: "Momentum",
    score: Math.round(momentumScore),
    weight: 0.25,
    detail: `RSI 14 at ${rsi} with 1-day change of ${stock.percent_change >= 0 ? '+' : ''}${stock.percent_change}%`
  });

  // 2. Trend Category (25%)
  let trendScore = 50;
  if (quant.priceVsSma20Pct !== null && quant.priceVsSma50Pct !== null) {
    if (quant.priceVsSma20Pct > 0 && quant.priceVsSma50Pct > 0) {
      trendScore = 85 + Math.min(15, quant.priceVsSma20Pct);
    } else if (quant.priceVsSma20Pct > 0) {
      trendScore = 65;
    } else if (quant.priceVsSma20Pct < 0 && quant.priceVsSma50Pct < 0) {
      trendScore = 25;
    } else {
      trendScore = 45;
    }
  }
  components.push({
    name: "Trend",
    score: Math.round(Math.min(100, Math.max(0, trendScore))),
    weight: 0.25,
    detail: quant.priceVsSma20Pct !== null ? `Trading ${quant.priceVsSma20Pct >= 0 ? '+' : ''}${quant.priceVsSma20Pct}% vs 20-day SMA` : "Baseline trend alignment"
  });

  // 3. Volume Category (15%)
  let volumeScore = 50;
  const volRatio = quant.volumeVsAvg20Ratio || 1.0;
  if (volRatio > 1.2 && stock.percent_change > 0) {
    volumeScore = 85 + Math.min(15, (volRatio - 1.2) * 20);
  } else if (volRatio > 1.0) {
    volumeScore = 65;
  } else if (volRatio < 0.7) {
    volumeScore = 35;
  }
  components.push({
    name: "Volume",
    score: Math.round(Math.min(100, Math.max(0, volumeScore))),
    weight: 0.15,
    detail: `Volume ratio relative to 20-day avg: ${volRatio}x`
  });

  // 4. Relative Strength / 52W Range (20%)
  let rangeScore = 50;
  const pct52 = quant.percentile52Week !== null ? quant.percentile52Week : 50;
  if (pct52 >= 70 && pct52 <= 95) {
    rangeScore = 85 + ((pct52 - 70) / 25) * 15;
  } else if (pct52 > 95) {
    rangeScore = 80;
  } else if (pct52 < 30) {
    rangeScore = 30;
  } else {
    rangeScore = 40 + ((pct52 - 30) / 40) * 30;
  }
  components.push({
    name: "52W Range Positioning",
    score: Math.round(Math.min(100, Math.max(0, rangeScore))),
    weight: 0.20,
    detail: `Positioned at ${pct52}% of 52-week price corridor`
  });

  // 5. Volatility & Risk (15%)
  let volScore = 60;
  const vol = quant.volatility;
  if (vol !== null) {
    if (vol < 20) volScore = 80;
    else if (vol < 40) volScore = 65;
    else if (vol < 60) volScore = 50;
    else volScore = 35;
  }
  components.push({
    name: "Volatility Risk",
    score: Math.round(volScore),
    weight: 0.15,
    detail: vol !== null ? `Annualized historical volatility: ${vol}%` : "Standard volatility band"
  });

  // Weighted Composite
  const totalScore = Math.round(
    components.reduce((sum, item) => sum + item.score * item.weight, 0)
  );
  const boundedScore = Math.min(100, Math.max(0, totalScore));

  let signalLabel: StockBlocSignal["signalLabel"] = "Neutral";
  if (boundedScore >= 80) signalLabel = "Strong Bullish";
  else if (boundedScore >= 60) signalLabel = "Bullish";
  else if (boundedScore >= 40) signalLabel = "Neutral";
  else if (boundedScore >= 20) signalLabel = "Caution";
  else signalLabel = "Bearish";

  return {
    signalScore: boundedScore,
    signalLabel,
    components,
    summary: `Quant Composite Score ${boundedScore}/100 [${signalLabel}]: Momentum (${components[0].score}/100), Trend (${components[1].score}/100), Volume (${components[2].score}/100)`
  };
}

// --- Centralized Market Data Service ---

export class MarketDataService {
  private static WATCHLIST_SYMBOLS = [
    "SPCX", "NVDA", "AEHR", "AAPL", "TSLA", "PLTR", "MSFT", "VST", "ASTS",
    "POET", "AAOI", "QUBT", "XSD", "HBM", "LITE", "CRWV", "BE", "SNDK",
    "AMD", "GOOGL", "MU", "CORZ", "BTC-USD", "DOT-USD", "META", "TSM", "^NYA",
    "SPY", "^GSPC", "AMZN", "NVT", "AIPO", "QQQ", "APLD", "^IXIC",
    "MOD", "INTC", "HAWK", "SMH", "SOXX", "POWL", "ASML",
    "GLD", "SLV", "CPER", "MP", "ALAB"
  ];

  private static COMPANY_METADATA: Record<string, { name: string; sector: string; summary: string }> = {
    MP: {
      name: "MP Materials Corp.",
      sector: "Critical Minerals & Rare Earth Elements",
      summary: "Rare Earth Magnetics & Refining: Sole Western producer of NdPr critical minerals at Mountain Pass mine, securing domestic supply chains for EV powertrains, wind energy, robotics, and defense."
    },
    ALAB: {
      name: "Astera Labs, Inc.",
      sector: "AI Infrastructure & Connectivity",
      summary: "AI Connectivity & Retimers: Purpose-built intelligent connectivity platform offering PCIe Gen 5/6 & CXL retimers (Aries), fabric switches (Scorpio), and smart cable modules (Taurus) eliminating AI datacenter bandwidth bottlenecks."
    },
    "DOT-USD": {
      name: "Polkadot Multi-Chain Protocol",
      sector: "Major Indexes & Crypto",
      summary: "Heterogeneous Multi-Chain Protocol: Scalable multi-chain architecture, Polkadot 2.0 Agile Coretime, Elastic Scaling, and Gavin Wood JAM (Join-Accumulate Machine) protocol."
    },
    GLD: {
      name: "SPDR Gold Shares (Gold Benchmark)",
      sector: "Major Indexes & Crypto",
      summary: "Physical Gold Bullion: Premier sovereign safe-haven store of value, monetary liquidity hedge, and central bank reserve accumulator."
    },
    SLV: {
      name: "iShares Silver Trust (Silver Benchmark)",
      sector: "Major Indexes & Crypto",
      summary: "Physical Silver Bullion: Critical dual-use industrial precious metal driving solar PV cells, high-density AI electronics, and EV battery grids."
    },
    CPER: {
      name: "United States Copper Fund (Copper Benchmark)",
      sector: "Major Indexes & Crypto",
      summary: "Physical Copper Benchmark: The cornerstone conductor of AI datacenter electrical grid infrastructure, global electrification, and clean power transition."
    },
    AAOI: {
      name: "Applied Optoelectronics, Inc.",
      sector: "AI Optical Interconnects",
      summary: "AI Datacenter Optical Transceivers: Vertically integrated design and manufacturing of 400G, 800G, and 1.6T high-speed optical transceivers, laser diodes, and active optical cables for hyperscale AI clusters."
    },
    AEHR: {
      name: "Aehr Test Systems",
      sector: "Silicon Carbide & Photonics",
      summary: "Wafer Test & Silicon Carbide Burn-In: Critical FOX-XP wafer-level test systems for SiC power semiconductors, AI silicon photonics transceivers, and high-reliability datacenter power."
    },
    SPCX: {
      name: "Space Exploration Technologies (SPCX Proxy)",
      sector: "Orbital Space & AI",
      summary: "Frontier Space & AI: Liquid exposure vehicle to SpaceX orbital launches, Starlink expansion, and pre-IPO AI compute giants."
    }
  };

  private static targetFiles = [
    path.join(process.cwd(), "market_watchlist_data.json"),
    path.join(process.cwd(), "public", "market_watchlist_data.json")
  ];

  public static getProviderName(): string {
    const configuredProvider = process.env.MARKET_DATA_PROVIDER || 'auto';
    if (configuredProvider !== 'auto') return configuredProvider;

    if (process.env.MARKET_DATA_API_KEY || process.env.ALPHA_VANTAGE_API_KEY) return 'Alpha Vantage API';
    if (process.env.FINNHUB_API_KEY) return 'Finnhub API';
    if (process.env.POLYGON_API_KEY) return 'Polygon.io API';
    return 'Yahoo Finance Quant Feed';
  }

  public static getStalenessThresholds() {
    return {
      fresh: parseInt(process.env.FRESH_THRESHOLD_SECONDS || "300", 10), // 5 min
      delayed: parseInt(process.env.DELAYED_THRESHOLD_SECONDS || "900", 10), // 15 min
      stale: parseInt(process.env.STALE_THRESHOLD_SECONDS || "3600", 10) // 60 min
    };
  }

  public static getMarketStatus(): "open" | "closed" | "extended-hours" {
    const now = new Date();
    const utcDay = now.getUTCDay();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const timeNum = utcHour * 100 + utcMin;

    // Weekend check
    if (utcDay === 0 || utcDay === 6) return "closed";

    // US Market Hours in UTC (14:30 UTC to 21:00 UTC during standard time approx)
    if (timeNum >= 1430 && timeNum < 2100) return "open";
    if ((timeNum >= 800 && timeNum < 1430) || (timeNum >= 2100 && timeNum < 2400)) return "extended-hours";
    return "closed";
  }

  /**
   * Load existing verified dataset from file system
   */
  public static loadPersistedData(): MarketFeedData | null {
    for (const filePath of MarketDataService.targetFiles) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const json = JSON.parse(content);
          if (json && Array.isArray(json.watchlist)) {
            const updatedAt = json.updated_at || new Date().toISOString();
            const lastSuccess = json.last_successful_update || updatedAt;
            const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000));
            const thresholds = MarketDataService.getStalenessThresholds();

            let statusLabel: FeedStatusLabel = "fresh";
            if (ageSeconds > thresholds.stale) statusLabel = "very_stale";
            else if (ageSeconds > thresholds.delayed) statusLabel = "stale";
            else if (ageSeconds > thresholds.fresh) statusLabel = "delayed";

            return {
              status: statusLabel === "very_stale" || statusLabel === "stale" ? "stale" : "success",
              updated_at: updatedAt,
              last_successful_update: lastSuccess,
              source: json.source || MarketDataService.getProviderName(),
              data_age_seconds: ageSeconds,
              status_label: statusLabel,
              market_status: MarketDataService.getMarketStatus(),
              watchlist: json.watchlist
            };
          }
        } catch (e) {
          console.error(`Failed to load persisted market data from ${filePath}:`, e);
        }
      }
    }
    return null;
  }

  /**
   * Fetch live quote for a single symbol from Yahoo Finance or configured provider
   */
  private static async fetchYahooQuoteForSymbol(symbol: string): Promise<Partial<WatchlistStock> | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      const result = data.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta || {};
      const timestamps = result.timestamp || [];
      const closes: number[] = result.indicators?.quote?.[0]?.close || [];
      const validCloses = closes.filter((c: any) => typeof c === 'number' && !isNaN(c) && c > 0);

      const currentPrice = meta.regularMarketPrice || (validCloses.length > 0 ? validCloses[validCloses.length - 1] : null);
      if (!currentPrice || typeof currentPrice !== 'number' || currentPrice <= 0) return null;

      const prevClose = meta.regularMarketPreviousClose || meta.previousClose || (validCloses.length > 1 ? validCloses[validCloses.length - 2] : currentPrice);
      const change = parseFloat((currentPrice - prevClose).toFixed(2));
      const percentChange = parseFloat((((currentPrice - prevClose) / prevClose) * 100).toFixed(2));

      const sparkline = validCloses.slice(-7).map((p: number) => Number(p.toFixed(2)));
      const high52 = meta.fiftyTwoWeekHigh || Math.max(...validCloses, currentPrice);
      const low52 = meta.fiftyTwoWeekLow || Math.min(...validCloses, currentPrice);
      const volume = meta.regularMarketVolume || meta.volume || 1000000;

      return {
        symbol: symbol.toUpperCase(),
        name: meta.shortName || meta.longName || symbol.toUpperCase(),
        price: Number(currentPrice.toFixed(2)),
        previousClose: Number(prevClose.toFixed(2)),
        change,
        percent_change: percentChange,
        volume,
        avgVolume: volume,
        high52: Number(high52.toFixed(2)),
        low52: Number(low52.toFixed(2)),
        sparkline: sparkline.length > 0 ? sparkline : [currentPrice]
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch live quote for a single symbol from Alpha Vantage API
   */
  private static async fetchAlphaVantageQuoteForSymbol(symbol: string, apiKey: string): Promise<Partial<WatchlistStock> | null> {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();

      const quoteObj = data?.['Global Quote'];
      if (!quoteObj || typeof quoteObj !== 'object') {
        return null;
      }

      const rawPrice = quoteObj['05. price'];
      const price = parseFloat(rawPrice);
      if (isNaN(price) || price <= 0) return null;

      const rawPrevClose = quoteObj['08. previous close'];
      const prevClose = parseFloat(rawPrevClose) || price;

      const rawChange = quoteObj['09. change'];
      const change = parseFloat(rawChange) ?? parseFloat((price - prevClose).toFixed(2));

      const rawChangePct = quoteObj['10. change percent'];
      let percentChange = 0;
      if (rawChangePct) {
        percentChange = parseFloat(rawChangePct.replace('%', '')) || 0;
      } else if (prevClose > 0) {
        percentChange = parseFloat((((price - prevClose) / prevClose) * 100).toFixed(2));
      }

      const rawVolume = quoteObj['06. volume'];
      const volume = parseInt(rawVolume, 10) || 1000000;

      const high = parseFloat(quoteObj['03. high']) || price;
      const low = parseFloat(quoteObj['04. low']) || price;

      return {
        symbol: symbol.toUpperCase(),
        price: Number(price.toFixed(2)),
        previousClose: Number(prevClose.toFixed(2)),
        change: Number(change.toFixed(2)),
        percent_change: Number(percentChange.toFixed(2)),
        volume,
        avgVolume: volume,
        high52: Number(high.toFixed(2)),
        low52: Number(low.toFixed(2)),
        sparkline: [price]
      };
    } catch (e) {
      return null;
    }
  }

  private static async fetchFinnhubNewsForSymbol(symbol: string, apiKey: string): Promise<Array<{ title: string; source: string; time?: string; url?: string; }> | null> {
    try {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 7);
      const toDate = today.toISOString().split('T')[0];
      const fromDate = past.toISOString().split('T')[0];

      const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fromDate}&to=${toDate}&token=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      
      if (!Array.isArray(data)) return null;
      
      return data.slice(0, 3).map(item => ({
        title: item.headline,
        source: item.source,
        time: item.datetime ? new Date(item.datetime * 1000).toISOString() : undefined,
        url: item.url
      }));

    } catch (e) {
      return null;
    }
  }

  /**
   * Refreshes market data across all target watchlist tickers.
   * If live provider succeeds for records, updates them with full quant indicators & signals.
   * If live provider fails or yields invalid output, preserves the last verified dataset and marks feed as stale.
   */
  public static async refreshMarketData(): Promise<MarketFeedData> {
    const persisted = MarketDataService.loadPersistedData();
    const baseWatchlist = persisted?.watchlist || [];

    const apiKey = process.env.MARKET_DATA_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
    const updatedWatchlist: WatchlistStock[] = [];
    let successCount = 0;
    const nowIso = new Date().toISOString();

    // Fetch stock quotes in parallel batches of 8 for high throughput and sub-5s execution
    const BATCH_SIZE = 8;
    for (let i = 0; i < MarketDataService.WATCHLIST_SYMBOLS.length; i += BATCH_SIZE) {
      const batchSymbols = MarketDataService.WATCHLIST_SYMBOLS.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batchSymbols.map(async (symbol) => {
          const meta = MarketDataService.COMPANY_METADATA[symbol];
          const existingBase = baseWatchlist.find((s) => s.symbol === symbol);
          const baseStock: WatchlistStock = existingBase ? {
            ...existingBase,
            name: (existingBase.name && existingBase.name !== symbol) ? existingBase.name : (meta?.name || existingBase.name || symbol),
            sector: (existingBase.sector && existingBase.sector !== "Market") ? existingBase.sector : (meta?.sector || existingBase.sector || "Market"),
            analysis_summary: (existingBase.analysis_summary && existingBase.analysis_summary !== "Live quantitative tracking initiated.") ? existingBase.analysis_summary : (meta?.summary || existingBase.analysis_summary || "Live quantitative tracking initiated.")
          } : ({
            symbol,
            price: 0,
            change: 0,
            percent_change: 0,
            sector: meta?.sector || "Market",
            analysis_summary: meta?.summary || "Live quantitative tracking initiated.",
            sparkline: [],
            pinned: false,
            name: meta?.name || symbol,
            previousClose: 0,
            volume: 0,
            avgVolume: 0,
            high52: 0,
            low52: 0,
          } as WatchlistStock);

          let fetched: Partial<WatchlistStock> | null = null;

          // 1. Try Alpha Vantage if API Key is configured
          if (apiKey) {
            const querySymbol = symbol === 'SPCX' ? 'SPCX' : symbol;
            fetched = await MarketDataService.fetchAlphaVantageQuoteForSymbol(querySymbol, apiKey);
          }

          // 2. Fallback to Yahoo Finance if Alpha Vantage key absent or rate-limited/failed
          if (!fetched) {
            if (symbol === 'SPCX') {
              fetched = await MarketDataService.fetchYahooQuoteForSymbol('SPCX'); // Destiny Tech100 proxy
            } else {
              fetched = await MarketDataService.fetchYahooQuoteForSymbol(symbol);
            }
          }

          let mergedStock: WatchlistStock;

          if (fetched && fetched.price && fetched.price > 0 && !isNaN(fetched.price)) {
            successCount++;
            mergedStock = {
              ...baseStock,
              ...fetched,
              symbol: baseStock.symbol,
              name: baseStock.name || fetched.name || baseStock.symbol,
              price: fetched.price,
              change: fetched.change ?? baseStock.change,
              percent_change: fetched.percent_change ?? baseStock.percent_change,
              sparkline: (fetched.sparkline && fetched.sparkline.length > 0) ? fetched.sparkline : baseStock.sparkline,
              high52: fetched.high52 ?? baseStock.high52,
              low52: fetched.low52 ?? baseStock.low52,
              volume: fetched.volume ?? baseStock.volume,
              last_updated: nowIso,
              source: MarketDataService.getProviderName()
            };
          } else {
            // Provider failed for this stock -> preserve last verified record
            mergedStock = {
              ...baseStock,
              last_updated: baseStock.last_updated || persisted?.updated_at || nowIso,
              source: baseStock.source || persisted?.source || "Preserved Verified Cache"
            };
          }

          if (process.env.FINNHUB_API_KEY) {
            let querySymbol = symbol;
            if (symbol === '^IXIC') querySymbol = 'QQQ';
            else if (symbol === '^GSPC' || symbol === '^NYA') querySymbol = 'SPY';

            let news = await MarketDataService.fetchFinnhubNewsForSymbol(querySymbol, process.env.FINNHUB_API_KEY);
            if ((!news || news.length === 0) && symbol !== querySymbol) {
              news = await MarketDataService.fetchFinnhubNewsForSymbol(symbol, process.env.FINNHUB_API_KEY);
            }
            
            if (news && news.length > 0) {
              mergedStock.news = news;
            } else if (baseStock.news) {
              mergedStock.news = baseStock.news;
            }
          }

          // Calculate Quant metrics & Stock Bloc Signal deterministically
          const quant = computeQuantMetrics(mergedStock);
          const signal = calculateStockBlocSignal(mergedStock, quant);

          mergedStock.quant = quant;
          mergedStock.signal = signal;

          return mergedStock;
        })
      );

      updatedWatchlist.push(...batchResults);
    }

    // Validate entire dataset
    const isLiveUpdateSuccess = successCount > 0;
    const newUpdatedAt = isLiveUpdateSuccess ? nowIso : (persisted?.updated_at || nowIso);
    const lastSuccessfulUpdate = isLiveUpdateSuccess ? nowIso : (persisted?.last_successful_update || newUpdatedAt);

    const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(lastSuccessfulUpdate).getTime()) / 1000));
    const thresholds = MarketDataService.getStalenessThresholds();

    let statusLabel: FeedStatusLabel = "fresh";
    if (ageSeconds > thresholds.stale) statusLabel = "very_stale";
    else if (ageSeconds > thresholds.delayed) statusLabel = "stale";
    else if (ageSeconds > thresholds.fresh) statusLabel = "delayed";

    const dataset: MarketFeedData = {
      status: isLiveUpdateSuccess ? "success" : "stale",
      updated_at: newUpdatedAt,
      last_successful_update: lastSuccessfulUpdate,
      source: isLiveUpdateSuccess ? MarketDataService.getProviderName() : (persisted?.source || "Preserved Verified Cache"),
      data_age_seconds: ageSeconds,
      status_label: statusLabel,
      market_status: MarketDataService.getMarketStatus(),
      watchlist: updatedWatchlist
    };

    const datasetValidation = validateMarketDataset(dataset);
    if (!datasetValidation.valid) {
      throw new Error(`CRITICAL: Market dataset validation failed: ${datasetValidation.errors.join("; ")}`);
    }

    // Persist to files
    const filePayload = {
      updated_at: dataset.updated_at,
      last_successful_update: dataset.last_successful_update,
      source: dataset.source,
      status_label: dataset.status_label,
      data_age_seconds: dataset.data_age_seconds,
      watchlist: dataset.watchlist
    };

    for (const filePath of MarketDataService.targetFiles) {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(filePayload, null, 2), 'utf-8');
      } catch (e) {
        console.error(`Failed to write dataset to ${filePath}:`, e);
      }
    }

    return dataset;
  }
}
