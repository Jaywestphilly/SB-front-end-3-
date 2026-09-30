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

// Flag to track initial database hydration
let hasHydratedFromDb = false;
let lastFirestoreSyncTime = 0;

/**
 * Clear in-memory active agents and pings (used in testing and clean resets).
 */
export function clearTelemetryState(): void {
  activeAgentHashes.clear();
  recentPingTimestamps = [];
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

// Immediately attempt initial hydration
hydrateTelemetryFromFirestore().catch(() => {});
