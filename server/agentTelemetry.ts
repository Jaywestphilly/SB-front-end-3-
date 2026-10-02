import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './firebaseAdmin.js';

export interface AgentTelemetry24h {
  activeAgents24h: number;
  totalAgentPings24h: number;
  windowHours: number;
  privacyGuaranteed: boolean;
  privacyNotice: string;
  lastUpdated: string;
}

export interface MachineCommerceEvent {
  eventType:
    | 'external_discovery'
    | 'external_agent'
    | 'trial_usage'
    | 'payment_required'
    | 'payment_attempt'
    | 'payment_success'
    | 'first_paid_call'
    | 'second_paid_call'
    | 'repeat_payer';
  source?: 'mcp' | 'rest' | 'discovery';
  endpoint?: string;
  payer?: string;
  amountUsd?: number;
  txHash?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

export interface MachineRevenueMetrics {
  externalDiscoveryCount: number;
  externalAgentsCount: number;
  trialUsageCount: number;
  paymentRequiredCount: number;
  paymentAttemptCount: number;
  paymentSuccessCount: number;
  firstPaidCallsCount: number;
  secondPaidCallsCount: number;
  repeatPayersCount: number;
  totalUsdcRevenue: number;
  revenueByEndpoint: Record<string, number>;
  revenueBySource: Record<string, number>;
  agentLifetimeSpend: Record<string, number>;
  primaryKpi: {
    name: string;
    value: number;
    description: string;
  };
  lastUpdated: string;
}

// Secret in-memory daily rotating salt to guarantee zero-knowledge anonymization.
// Because the salt rotates daily and is never persisted, identifiers cannot be correlated
// across multi-day windows or reversed into real IDs, keys, or IPs.
const SERVER_BOOT_SECRET = crypto.randomBytes(32).toString('hex');
const getDailySalt = (): string => {
  const dayKey = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${SERVER_BOOT_SECRET}_${dayKey}`).digest('hex');
};

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Map of anonymizedHash -> lastSeenTimestamp
const activeAgentHashes = new Map<string, number>();

// Array of ping timestamps within rolling 24-hour window
let recentPingTimestamps: number[] = [];

// ============================================================================
// MACHINE COMMERCE & REVENUE TRACKING (Zero Fabricated Data)
// ============================================================================
let externalDiscoveryCount = 0;
const externalAgentsSet = new Set<string>();
let trialUsageCount = 0;
let paymentRequiredCount = 0;
let paymentAttemptCount = 0;
let paymentSuccessCount = 0;
let firstPaidCallsCount = 0;
let secondPaidCallsCount = 0;
const payerPaidCallCount = new Map<string, number>();
const repeatPayersSet = new Set<string>();
let totalUsdcRevenue = 0;
const revenueByEndpoint = new Map<string, number>();
const revenueBySource = new Map<string, number>();
const agentLifetimeSpend = new Map<string, number>();
const machineCommerceEvents: MachineCommerceEvent[] = [];

// Flag to track initial database hydration
let hasHydratedFromDb = false;
let lastFirestoreSyncTime = 0;

/**
 * Clear in-memory active agents and pings (used in testing and clean resets).
 */
export function clearTelemetryState(): void {
  activeAgentHashes.clear();
  recentPingTimestamps = [];
  clearMachineCommerceState();
}

export function clearMachineCommerceState(): void {
  externalDiscoveryCount = 0;
  externalAgentsSet.clear();
  trialUsageCount = 0;
  paymentRequiredCount = 0;
  paymentAttemptCount = 0;
  paymentSuccessCount = 0;
  firstPaidCallsCount = 0;
  secondPaidCallsCount = 0;
  payerPaidCallCount.clear();
  repeatPayersSet.clear();
  totalUsdcRevenue = 0;
  revenueByEndpoint.clear();
  revenueBySource.clear();
  agentLifetimeSpend.clear();
  machineCommerceEvents.length = 0;
}

/**
 * Record a machine commerce event (pure tracking of actual external machine traffic).
 */
export function recordMachineCommerceEvent(event: MachineCommerceEvent): void {
  const nowIso = new Date().toISOString();
  const eventRecord: MachineCommerceEvent = {
    ...event,
    timestamp: event.timestamp || nowIso
  };

  machineCommerceEvents.push(eventRecord);
  if (machineCommerceEvents.length > 500) {
    machineCommerceEvents.shift();
  }

  if (event.eventType === 'external_discovery') {
    externalDiscoveryCount++;
  }

  if (event.payer) {
    externalAgentsSet.add(event.payer.toLowerCase());
  }

  if (event.eventType === 'trial_usage') {
    trialUsageCount++;
  }

  if (event.eventType === 'payment_required') {
    paymentRequiredCount++;
  }

  if (event.eventType === 'payment_attempt') {
    paymentAttemptCount++;
  }

  if (event.eventType === 'payment_success') {
    paymentSuccessCount++;
    const amt = typeof event.amountUsd === 'number' && !isNaN(event.amountUsd) ? event.amountUsd : 0;
    if (amt > 0) {
      totalUsdcRevenue = Number((totalUsdcRevenue + amt).toFixed(6));
      if (event.endpoint) {
        const epKey = event.endpoint;
        revenueByEndpoint.set(epKey, Number(((revenueByEndpoint.get(epKey) || 0) + amt).toFixed(6)));
      }
      if (event.source) {
        const srcKey = event.source;
        revenueBySource.set(srcKey, Number(((revenueBySource.get(srcKey) || 0) + amt).toFixed(6)));
      }
    }

    if (event.payer) {
      const payerKey = event.payer.toLowerCase();
      const priorCount = payerPaidCallCount.get(payerKey) || 0;
      const newCount = priorCount + 1;
      payerPaidCallCount.set(payerKey, newCount);
      agentLifetimeSpend.set(payerKey, Number(((agentLifetimeSpend.get(payerKey) || 0) + amt).toFixed(6)));

      if (newCount === 1) {
        firstPaidCallsCount++;
        machineCommerceEvents.push({
          eventType: 'first_paid_call',
          source: event.source,
          endpoint: event.endpoint,
          payer: payerKey,
          amountUsd: amt,
          timestamp: nowIso
        });
      } else if (newCount === 2) {
        secondPaidCallsCount++;
        repeatPayersSet.add(payerKey);
        machineCommerceEvents.push({
          eventType: 'second_paid_call',
          source: event.source,
          endpoint: event.endpoint,
          payer: payerKey,
          amountUsd: amt,
          timestamp: nowIso
        });
        machineCommerceEvents.push({
          eventType: 'repeat_payer',
          source: event.source,
          endpoint: event.endpoint,
          payer: payerKey,
          amountUsd: amt,
          timestamp: nowIso
        });
      } else if (newCount > 2) {
        repeatPayersSet.add(payerKey);
      }
    }
  }
}

/**
 * Get aggregated Machine Revenue & Conversion Metrics.
 */
export function getMachineRevenueMetrics(): MachineRevenueMetrics {
  const revByEpObj: Record<string, number> = {};
  for (const [k, v] of revenueByEndpoint.entries()) {
    revByEpObj[k] = v;
  }

  const revBySrcObj: Record<string, number> = {};
  for (const [k, v] of revenueBySource.entries()) {
    revBySrcObj[k] = v;
  }

  const lifetimeSpendObj: Record<string, number> = {};
  for (const [k, v] of agentLifetimeSpend.entries()) {
    lifetimeSpendObj[k] = v;
  }

  return {
    externalDiscoveryCount,
    externalAgentsCount: externalAgentsSet.size,
    trialUsageCount,
    paymentRequiredCount,
    paymentAttemptCount,
    paymentSuccessCount,
    firstPaidCallsCount,
    secondPaidCallsCount,
    repeatPayersCount: repeatPayersSet.size,
    totalUsdcRevenue: Number(totalUsdcRevenue.toFixed(6)),
    revenueByEndpoint: revByEpObj,
    revenueBySource: revBySrcObj,
    agentLifetimeSpend: lifetimeSpendObj,
    primaryKpi: {
      name: 'EXTERNAL_AGENTS_WITH_TWO_OR_MORE_PAID_CALLS',
      value: repeatPayersSet.size,
      description: 'The number of distinct external agent wallets that have completed 2 or more verified on-chain USDC payments.'
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Prune timestamps and agent entries older than 24 hours.
 */
function pruneExpiredEntries(now: number = Date.now()): void {
  const cutoff = now - TWENTY_FOUR_HOURS_MS;

  // Prune active agents
  for (const [hash, timestamp] of activeAgentHashes.entries()) {
    if (timestamp < cutoff) {
      activeAgentHashes.delete(hash);
    }
  }

  // Prune pings array
  recentPingTimestamps = recentPingTimestamps.filter(t => t >= cutoff);
}

/**
 * Record an agent visit without saving ANY raw identity, key, payload, or IP address.
 * Uses one-way HMAC with rolling daily salt so agent identity remains 100% private.
 */
export function recordAgentVisit(rawIdentifier?: string, _visitType: string = 'api_access'): void {
  const now = Date.now();
  pruneExpiredEntries(now);

  const salt = getDailySalt();
  // If no identifier provided, create an ephemeral anonymous daily token
  const idSource = rawIdentifier || `anon_agent_${now}_${Math.random().toString(36).substring(2, 8)}`;
  
  // 1-way cryptographic HMAC hash truncated to 16 hex chars
  const anonymizedHash = crypto
    .createHmac('sha256', salt)
    .update(idSource)
    .digest('hex')
    .substring(0, 16);

  activeAgentHashes.set(anonymizedHash, now);
  recentPingTimestamps.push(now);

  // Background throttled persistence to Firestore (at most once every 60s)
  if (now - lastFirestoreSyncTime > 60 * 1000) {
    lastFirestoreSyncTime = now;
    syncAggregatesToFirestore().catch(() => {});
  }
}

/**
 * Hydrate telemetry aggregates from Firestore if server recently rebooted.
 * Ensures zero manufactured data is restored or seeded.
 */
export async function hydrateTelemetryFromFirestore(): Promise<void> {
  if (hasHydratedFromDb) return;
  hasHydratedFromDb = true;

  try {
    if (!db) return;
    const docRef = db.collection('telemetry_aggregates').doc('agents_24h');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();

      // If the persisted store contains legacy seeded fake baseline counts, reset it immediately
      if (!data?.isPureReal || data?.activeAgents24h === 18) {
        await docRef.set({
          activeAgents24h: activeAgentHashes.size,
          totalAgentPings24h: recentPingTimestamps.length,
          windowHours: 24,
          privacyGuaranteed: true,
          isPureReal: true,
          lastUpdated: new Date().toISOString()
        });
        return;
      }
    }
  } catch (err) {
    // Non-blocking fallback
    console.warn('[TELEMETRY] Hydration from Firestore deferred:', err);
  }
}

/**
 * Persist aggregate statistics (NEVER raw identifiers or keys) to Firestore.
 */
async function syncAggregatesToFirestore(): Promise<void> {
  if (!db) return;
  try {
    const payload = getAgentTelemetry24h();
    await db.collection('telemetry_aggregates').doc('agents_24h').set({
      activeAgents24h: payload.activeAgents24h,
      totalAgentPings24h: payload.totalAgentPings24h,
      windowHours: 24,
      privacyGuaranteed: true,
      isPureReal: true,
      lastUpdated: payload.lastUpdated
    }, { merge: true });
  } catch {
    // Non-blocking persistence
  }
}

/**
 * Returns current rolling 24-hour agent telemetry with true tracked count.
 */
export function getAgentTelemetry24h(): AgentTelemetry24h {
  const now = Date.now();
  pruneExpiredEntries(now);

  const activeCount = activeAgentHashes.size;
  const totalPings = recentPingTimestamps.length;

  return {
    activeAgents24h: activeCount,
    totalAgentPings24h: totalPings,
    windowHours: 24,
    privacyGuaranteed: true,
    privacyNotice: 'Zero-knowledge anonymized counter. No API keys, tokens, IP addresses, agent handles, or request contents are tracked or exposed.',
    lastUpdated: new Date(now).toISOString()
  };
}

/**
 * Express Middleware to track incoming agent visits transparently and without overhead.
 */
export function trackAgentVisitMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization || '';
    const xAgentKey = req.headers['x-agent-key'] as string;
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    // Check if request is from an autonomous agent
    const isAgentKey = authHeader.startsWith('Bearer sb_live_') || (xAgentKey && xAgentKey.startsWith('sb_live_'));
    const isAgentUserAgent = userAgent.includes('stockblocagent') || 
                             userAgent.includes('python-requests') || 
                             userAgent.includes('langchain') || 
                             userAgent.includes('autogpt') || 
                             userAgent.includes('crewai') || 
                             userAgent.includes('bot') || 
                             userAgent.includes('crawler');

    if (isAgentKey) {
      const keyToken = authHeader ? authHeader.split('Bearer ')[1] : xAgentKey;
      // Record visit using a hash of the key prefix (never store the raw key)
      const tokenPrefix = keyToken ? keyToken.substring(0, 16) : 'agent_key';
      recordAgentVisit(tokenPrefix, 'api_key');
    } else if (isAgentUserAgent && (req.path.startsWith('/api/v1/agent') || req.path.startsWith('/agents') || req.path.startsWith('/api/v1/community'))) {
      recordAgentVisit(userAgent.substring(0, 24), 'user_agent');
    }
  } catch {
    // Fail-open: Never block normal traffic if telemetry throws
  }

  next();
}

/**
 * Public Express Router exposing the 24h Agent Telemetry Counter
 */
export const agentTelemetryRouter = Router();

agentTelemetryRouter.get(['/agents-24h', '/telemetry/agents-24h', '/agent-activity-24h'], (_req: Request, res: Response) => {
  const telemetry = getAgentTelemetry24h();
  res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
  res.status(200).json(telemetry);
});

agentTelemetryRouter.get(['/revenue', '/commerce', '/telemetry/revenue', '/telemetry/commerce'], (_req: Request, res: Response) => {
  const metrics = getMachineRevenueMetrics();
  res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=10');
  res.status(200).json(metrics);
});

// Immediately attempt initial hydration
hydrateTelemetryFromFirestore().catch(() => {});
