import crypto from 'crypto';
import { db, dbStoreInstance } from './firebaseAdmin.js';
import { normalizeYahooSymbol } from './marketQuoteService.js';

// ============================================================================
// METHODOLOGY VERSIONS
// ============================================================================

export const SB_SCORE_METHODOLOGY_VERSION = "SB_SCORE_V1";
export const SB_OUTCOME_METHODOLOGY_VERSION = "SB_OUTCOME_V1";
export const QUANT_METHODOLOGY_VERSION = "QUANT_V1";

// ============================================================================
// DATA INTERFACES
// ============================================================================

export interface SBScoreComponents {
  momentum: number;
  trend: number;
  relativeStrength: number;
  volume: number;
  volatility: number;
}

export interface SBScoreIndicators {
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  volumeRatio: number | null;
  volatility: number | null;
  week52percentile: number | null;
}

export interface HistoricalSBScoreRecord {
  scoreId: string;
  ticker: string;
  timestamp: string;
  priceAtScore: number;
  sbScore: number;
  signalLabel: string;
  components: SBScoreComponents;
  indicators: SBScoreIndicators;
  dataSource: string | null;
  dataFreshnessSeconds: number | null;
  methodologyVersion: typeof SB_SCORE_METHODOLOGY_VERSION;
  createdAt: string;
}

export interface SBScoreOutcomeRecord {
  scoreId: string;
  ticker: string;
  price30d: number | null;
  return30d: number | null;
  price60d: number | null;
  return60d: number | null;
  price90d: number | null;
  return90d: number | null;
  observationTimestamps?: {
    d30?: string | null;
    d60?: string | null;
    d90?: string | null;
  };
  calculatedAt: string;
  outcomeVersion: typeof SB_OUTCOME_METHODOLOGY_VERSION;
}

export interface HistoricalQuantRunRecord {
  runId: string;
  strategyName: string;
  parameters: Record<string, unknown>;
  inputPortfolio: Record<string, unknown>;
  lookbackDays: number;
  assumptions: Record<string, unknown>;
  benchmark: string;
  results: {
    return: number;
    sharpe: number;
    drawdown: number;
    volatility: number;
    winRate: number;
  };
  timestamp: string;
  methodologyVersion: typeof QUANT_METHODOLOGY_VERSION;
  createdAt: string;
}

export interface PersistSBScoreParams {
  ticker: string;
  priceAtScore: number;
  sbScore: number;
  signalLabel: string;
  components: SBScoreComponents;
  indicators: SBScoreIndicators;
  dataSource?: string | null;
  dataFreshnessSeconds?: number | null;
  customTimestamp?: string;
  scoreId?: string;
}

export interface PersistQuantRunParams {
  strategyName: string;
  parameters: Record<string, unknown>;
  inputPortfolio: Record<string, unknown>;
  lookbackDays: number;
  assumptions: Record<string, unknown>;
  benchmark: string;
  results: {
    return: number;
    sharpe: number;
    drawdown: number;
    volatility: number;
    winRate: number;
  };
  customTimestamp?: string;
  runId?: string;
}

export interface GetSBScoreHistoryParams {
  ticker: string;
  limit?: number;
  cursor?: string;
  methodologyVersion?: string;
}

export interface HistoryItemResponse {
  scoreId: string;
  timestamp: string;
  priceAtScore: number;
  sbScore: number;
  signalLabel: string;
  components: SBScoreComponents;
  indicators: SBScoreIndicators;
  outcomes: {
    price30d: number | null;
    return30d: number | null;
    price60d: number | null;
    return60d: number | null;
    price90d: number | null;
    return90d: number | null;
  };
}

export interface SBScoreHistoryResponse {
  status: 'success';
  ticker: string;
  methodologyVersion: string;
  items: HistoryItemResponse[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    totalReturned: number;
  };
}

// ============================================================================
// HISTORICAL PRICE RETRIEVAL & PROVIDER EXTENSIBILITY
// ============================================================================

export type HistoricalPriceProvider = (
  ticker: string,
  targetDate: Date
) => Promise<{ price: number; observationTimestamp: string } | null>;

let customPriceProvider: HistoricalPriceProvider | null = null;

export function setHistoricalPriceProvider(provider: HistoricalPriceProvider | null) {
  customPriceProvider = provider;
}

export function resetHistoricalPriceProvider() {
  customPriceProvider = null;
}

/**
 * Retrieves the closest legitimate historical market price for a given ticker and date.
 * Uses custom provider if injected, or queries the Yahoo Finance chart API historical bars.
 * Returns null if data is unavailable (never fabricates prices).
 */
export async function getHistoricalMarketPrice(
  ticker: string,
  targetDate: Date
): Promise<{ price: number; observationTimestamp: string } | null> {
  if (customPriceProvider) {
    return await customPriceProvider(ticker, targetDate);
  }

  const normalizedTicker = String(ticker).toUpperCase().trim();
  const yahooSym = normalizeYahooSymbol(normalizedTicker);
  const targetEpochSec = Math.floor(targetDate.getTime() / 1000);

  // Search window: 5 days before to 5 days after target timestamp
  const period1 = targetEpochSec - 5 * 86400;
  const period2 = targetEpochSec + 5 * 86400;

  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?period1=${period1}&period2=${period2}&interval=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?period1=${period1}&period2=${period2}&interval=1d`
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const timestamps: number[] = data.chart?.result?.[0]?.timestamp || [];
        const quotes: number[] = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];

        if (timestamps.length > 0 && quotes.length > 0) {
          let closestIdx = -1;
          let minDiff = Infinity;

          for (let i = 0; i < timestamps.length; i++) {
            const price = quotes[i];
            if (typeof price === 'number' && !isNaN(price) && price > 0) {
              const diff = Math.abs(timestamps[i] - targetEpochSec);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
              }
            }
          }

          if (closestIdx !== -1) {
            const price = quotes[closestIdx];
            const observationTimestamp = new Date(timestamps[closestIdx] * 1000).toISOString();
            return {
              price: Number(price.toFixed(4)),
              observationTimestamp
            };
          }
        }
      }
    } catch {
      // Continue to next URL or return null
    }
  }

  return null;
}

// ============================================================================
// 1. SB SCORE PERSISTENCE
// ============================================================================

/**
 * Persists an immutable historical snapshot of an SB Score calculation.
 * Never mutates or overwrites existing records.
 */
export async function persistSBScore(params: PersistSBScoreParams): Promise<HistoricalSBScoreRecord> {
  const normalizedTicker = String(params.ticker).toUpperCase().trim();
  const scoreId = params.scoreId || crypto.randomUUID();
  const timestamp = params.customTimestamp || new Date().toISOString();
  const createdAt = new Date().toISOString();

  // Validate millisecond precision on ISO timestamp
  const tsDate = new Date(timestamp);
  const validatedTimestamp = !isNaN(tsDate.getTime()) ? tsDate.toISOString() : new Date().toISOString();

  const record: HistoricalSBScoreRecord = {
    scoreId,
    ticker: normalizedTicker,
    timestamp: validatedTimestamp,
    priceAtScore: Number(params.priceAtScore),
    sbScore: Math.round(Number(params.sbScore)),
    signalLabel: String(params.signalLabel || 'Neutral'),
    components: {
      momentum: Number(params.components?.momentum ?? 0),
      trend: Number(params.components?.trend ?? 0),
      relativeStrength: Number(params.components?.relativeStrength ?? 0),
      volume: Number(params.components?.volume ?? 0),
      volatility: Number(params.components?.volatility ?? 0)
    },
    indicators: {
      rsi: params.indicators?.rsi !== undefined && params.indicators?.rsi !== null ? Number(params.indicators.rsi) : null,
      sma20: params.indicators?.sma20 !== undefined && params.indicators?.sma20 !== null ? Number(params.indicators.sma20) : null,
      sma50: params.indicators?.sma50 !== undefined && params.indicators?.sma50 !== null ? Number(params.indicators.sma50) : null,
      sma200: params.indicators?.sma200 !== undefined && params.indicators?.sma200 !== null ? Number(params.indicators.sma200) : null,
      volumeRatio: params.indicators?.volumeRatio !== undefined && params.indicators?.volumeRatio !== null ? Number(params.indicators.volumeRatio) : null,
      volatility: params.indicators?.volatility !== undefined && params.indicators?.volatility !== null ? Number(params.indicators.volatility) : null,
      week52percentile: params.indicators?.week52percentile !== undefined && params.indicators?.week52percentile !== null ? Number(params.indicators.week52percentile) : null
    },
    dataSource: params.dataSource ?? 'Yahoo Finance chart API',
    dataFreshnessSeconds: params.dataFreshnessSeconds ?? 0,
    methodologyVersion: SB_SCORE_METHODOLOGY_VERSION,
    createdAt
  };

  const docRef = db.collection('sb_scores').doc(scoreId);
  const existing = await docRef.get();

  // Immutability: If record already exists, return existing without mutation
  if (existing && existing.exists) {
    return existing.data() as HistoricalSBScoreRecord;
  }

  await docRef.set(record);
  return record;
}

/**
 * Explicit immutability protection: blocks updating existing SB Score documents.
 */
export function preventSBScoreMutation(): never {
  throw new Error("IMMUTABILITY_VIOLATION: Historical SB Scores are append-only and cannot be modified or deleted.");
}

// ============================================================================
// 2. OUTCOME PERSISTENCE & TIMING
// ============================================================================

const MS_IN_DAY = 86400 * 1000;
const HORIZON_30D_MS = 30 * MS_IN_DAY;
const HORIZON_60D_MS = 60 * MS_IN_DAY;
const HORIZON_90D_MS = 90 * MS_IN_DAY;

/**
 * Calculates outcomes for an SB Score snapshot across newly eligible horizons (30d, 60d, 90d).
 * Idempotent: Never recalculates or modifies already populated outcomes.
 * Never touches the original sb_scores document.
 */
export async function calculateOutcomeForScore(
  scoreRecord: HistoricalSBScoreRecord,
  now: Date = new Date()
): Promise<SBScoreOutcomeRecord | null> {
  const scoreDate = new Date(scoreRecord.timestamp);
  const scoreTimestampMs = scoreDate.getTime();
  if (isNaN(scoreTimestampMs)) return null;

  const msElapsed = now.getTime() - scoreTimestampMs;

  // Horizon eligibility: must be at least 30, 60, or 90 days old
  const eligible30d = msElapsed >= HORIZON_30D_MS;
  const eligible60d = msElapsed >= HORIZON_60D_MS;
  const eligible90d = msElapsed >= HORIZON_90D_MS;

  if (!eligible30d) {
    // None of the horizons are eligible yet
    return null;
  }

  const outcomeRef = db.collection('sb_score_outcomes').doc(scoreRecord.scoreId);
  const outcomeSnap = await outcomeRef.get();
  const existingOutcome: Partial<SBScoreOutcomeRecord> = (outcomeSnap && outcomeSnap.exists)
    ? (outcomeSnap.data() as SBScoreOutcomeRecord)
    : {};

  let updated = false;
  let price30d = existingOutcome.price30d ?? null;
  let return30d = existingOutcome.return30d ?? null;
  let price60d = existingOutcome.price60d ?? null;
  let return60d = existingOutcome.return60d ?? null;
  let price90d = existingOutcome.price90d ?? null;
  let return90d = existingOutcome.return90d ?? null;

  const observationTimestamps: Record<string, string | null> = {
    d30: existingOutcome.observationTimestamps?.d30 ?? null,
    d60: existingOutcome.observationTimestamps?.d60 ?? null,
    d90: existingOutcome.observationTimestamps?.d90 ?? null,
  };

  // 1. 30-Day Horizon
  if (eligible30d && (price30d === null || price30d === undefined)) {
    const targetDate30d = new Date(scoreTimestampMs + HORIZON_30D_MS);
    const hist = await getHistoricalMarketPrice(scoreRecord.ticker, targetDate30d);
    if (hist && typeof hist.price === 'number' && hist.price > 0 && scoreRecord.priceAtScore > 0) {
      price30d = hist.price;
      return30d = Number((((hist.price - scoreRecord.priceAtScore) / scoreRecord.priceAtScore) * 100).toFixed(2));
      observationTimestamps.d30 = hist.observationTimestamp;
      updated = true;
    }
  }

  // 2. 60-Day Horizon
  if (eligible60d && (price60d === null || price60d === undefined)) {
    const targetDate60d = new Date(scoreTimestampMs + HORIZON_60D_MS);
    const hist = await getHistoricalMarketPrice(scoreRecord.ticker, targetDate60d);
    if (hist && typeof hist.price === 'number' && hist.price > 0 && scoreRecord.priceAtScore > 0) {
      price60d = hist.price;
      return60d = Number((((hist.price - scoreRecord.priceAtScore) / scoreRecord.priceAtScore) * 100).toFixed(2));
      observationTimestamps.d60 = hist.observationTimestamp;
      updated = true;
    }
  }

  // 3. 90-Day Horizon
  if (eligible90d && (price90d === null || price90d === undefined)) {
    const targetDate90d = new Date(scoreTimestampMs + HORIZON_90D_MS);
    const hist = await getHistoricalMarketPrice(scoreRecord.ticker, targetDate90d);
    if (hist && typeof hist.price === 'number' && hist.price > 0 && scoreRecord.priceAtScore > 0) {
      price90d = hist.price;
      return90d = Number((((hist.price - scoreRecord.priceAtScore) / scoreRecord.priceAtScore) * 100).toFixed(2));
      observationTimestamps.d90 = hist.observationTimestamp;
      updated = true;
    }
  }

  const outcomeRecord: SBScoreOutcomeRecord = {
    scoreId: scoreRecord.scoreId,
    ticker: scoreRecord.ticker,
    price30d,
    return30d,
    price60d,
    return60d,
    price90d,
    return90d,
    observationTimestamps,
    calculatedAt: updated ? now.toISOString() : (existingOutcome.calculatedAt || now.toISOString()),
    outcomeVersion: SB_OUTCOME_METHODOLOGY_VERSION
  };

  if (updated || !outcomeSnap?.exists) {
    await outcomeRef.set(outcomeRecord);
  }

  return outcomeRecord;
}

/**
 * Daily scheduled background job to find SB Scores with missing eligible outcomes
 * and calculate returns idempotently.
 */
export async function runDailyOutcomeCalculationJob(
  now: Date = new Date(),
  batchSize = 100
): Promise<{ processed: number; updated: number; skipped: number; errors: string[] }> {
  const result = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[]
  };

  try {
    // Only scores at least 30 days old are eligible for any outcome
    const cutoffIso = new Date(now.getTime() - HORIZON_30D_MS).toISOString();

    const snapshot = await db.collection('sb_scores')
      .where('timestamp', '<=', cutoffIso)
      .limit(batchSize)
      .get();

    if (!snapshot || snapshot.empty) {
      return result;
    }

    for (const doc of snapshot.docs) {
      try {
        result.processed++;
        const scoreData = doc.data() as HistoricalSBScoreRecord;
        if (!scoreData || !scoreData.scoreId || !scoreData.ticker) {
          result.skipped++;
          continue;
        }

        const outcome = await calculateOutcomeForScore(scoreData, now);
        if (outcome) {
          result.updated++;
        } else {
          result.skipped++;
        }
      } catch (itemErr: any) {
        result.errors.push(`Error processing ${doc.id}: ${itemErr?.message || itemErr}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Job execution error: ${err?.message || err}`);
  }

  return result;
}

// ============================================================================
// 3. SB SCORE HISTORY QUERY ENDPOINT SERVICE
// ============================================================================

export async function getSBScoreHistory(params: GetSBScoreHistoryParams): Promise<SBScoreHistoryResponse> {
  const rawTicker = String(params.ticker || '').toUpperCase().trim();
  if (!rawTicker) {
    throw new Error('Validation error: "ticker" is required.');
  }

  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const methodologyVersion = params.methodologyVersion?.trim();

  // Query up to limit + 1 to determine hasMore
  let query = db.collection('sb_scores')
    .where('ticker', '==', rawTicker);

  if (methodologyVersion) {
    query = query.where('methodologyVersion', '==', methodologyVersion);
  }

  query = query.orderBy('timestamp', 'desc');

  if (params.cursor) {
    query = query.startAfter(params.cursor);
  }

  query = query.limit(limit + 1);

  const snapshot = await query.get();
  const docs = snapshot ? snapshot.docs : [];

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  // Retrieve outcomes in parallel for each scoreId
  const items: HistoryItemResponse[] = await Promise.all(
    pageDocs.map(async (doc: any) => {
      const data = doc.data() as HistoricalSBScoreRecord;
      const scoreId = data.scoreId || doc.id;

      let outcome: SBScoreOutcomeRecord | null = null;
      try {
        const outcomeSnap = await db.collection('sb_score_outcomes').doc(scoreId).get();
        if (outcomeSnap && outcomeSnap.exists) {
          outcome = outcomeSnap.data() as SBScoreOutcomeRecord;
        }
      } catch {
        // Outcome non-fatal
      }

      return {
        scoreId,
        timestamp: data.timestamp,
        priceAtScore: data.priceAtScore,
        sbScore: data.sbScore,
        signalLabel: data.signalLabel,
        components: data.components,
        indicators: data.indicators,
        outcomes: {
          price30d: outcome?.price30d ?? null,
          return30d: outcome?.return30d ?? null,
          price60d: outcome?.price60d ?? null,
          return60d: outcome?.return60d ?? null,
          price90d: outcome?.price90d ?? null,
          return90d: outcome?.return90d ?? null
        }
      };
    })
  );

  const nextCursor = hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1].id : null;

  return {
    status: 'success',
    ticker: rawTicker,
    methodologyVersion: methodologyVersion || SB_SCORE_METHODOLOGY_VERSION,
    items,
    pagination: {
      nextCursor,
      hasMore,
      totalReturned: items.length
    }
  };
}

// ============================================================================
// 4. QUANT SIMULATION PERSISTENCE
// ============================================================================

/**
 * Persists an immutable historical snapshot of every completed quant simulation.
 * Never mutates or overwrites existing records.
 */
export async function persistQuantRun(params: PersistQuantRunParams): Promise<HistoricalQuantRunRecord> {
  const runId = params.runId || crypto.randomUUID();
  const timestamp = params.customTimestamp || new Date().toISOString();
  const createdAt = new Date().toISOString();

  const record: HistoricalQuantRunRecord = {
    runId,
    strategyName: params.strategyName || 'Quantitative Portfolio Simulation',
    parameters: params.parameters || {},
    inputPortfolio: params.inputPortfolio || {},
    lookbackDays: Number(params.lookbackDays) || 90,
    assumptions: params.assumptions || {},
    benchmark: params.benchmark || 'super_sonic_tsunami',
    results: {
      return: Number(params.results?.return ?? 0),
      sharpe: Number(params.results?.sharpe ?? 0),
      drawdown: Number(params.results?.drawdown ?? 0),
      volatility: Number(params.results?.volatility ?? 0),
      winRate: Number(params.results?.winRate ?? 0)
    },
    timestamp,
    methodologyVersion: QUANT_METHODOLOGY_VERSION,
    createdAt
  };

  const docRef = db.collection('quant_runs').doc(runId);
  const existing = await docRef.get();

  // Immutability: If record already exists, return without mutation
  if (existing && existing.exists) {
    return existing.data() as HistoricalQuantRunRecord;
  }

  await docRef.set(record);
  return record;
}
