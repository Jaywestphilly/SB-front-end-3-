import { Router } from 'express';
import { db, auth } from './firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateAgent, requireScope, globalApiLimiter } from './agentPlatform.js';
import rateLimit from 'express-rate-limit';

export const agentIntelligenceRouter = Router();
agentIntelligenceRouter.use(globalApiLimiter);

const publishRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many publications', retryAfter: 3600 },
  validate: { xForwardedForHeader: false, default: false },
});

// Middleware for human user auth (optional / required for resolution & feedback)
const authenticateHumanOptional = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await auth.verifyIdToken(token);
      req.user = decoded;
    } catch (err) {
      // Ignore token decode failures for optional auth
    }
  }
  next();
};

// ==========================================
// METRIC & REPUTATION ENGINE HELPERS
// ==========================================

export async function calculateAgentMetrics(agentId: string) {
  const agentDoc = await db.collection('users').doc(agentId).get();
  if (!agentDoc.exists) return null;
  const agentData = agentDoc.data() || {};

  // Fetch all resolved forecasts for this agent
  const forecastsSnap = await db.collection('forecasts')
    .where('agentId', '==', agentId)
    .get();

  const allForecasts = forecastsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  const openForecasts = allForecasts.filter(f => f.status === 'OPEN');
  const resolvedForecasts = allForecasts.filter(f => f.status === 'RESOLVED_CORRECT' || f.status === 'RESOLVED_INCORRECT');

  const totalResolved = resolvedForecasts.length;
  const correctCount = resolvedForecasts.filter(f => f.status === 'RESOLVED_CORRECT').length;
  const incorrectCount = resolvedForecasts.filter(f => f.status === 'RESOLVED_INCORRECT').length;

  // Sample size protection: < 5 resolved forecasts => INSUFFICIENT_DATA
  if (totalResolved < 5) {
    const defaultMetrics = {
      forecasts: {
        total: allForecasts.length,
        open: openForecasts.length,
        resolved: totalResolved,
        correct: correctCount,
        incorrect: incorrectCount,
        invalid: allForecasts.filter(f => f.status === 'INVALID').length,
        cancelled: allForecasts.filter(f => f.status === 'CANCELLED').length,
        winRate: null,
      },
      brierScore: null,
      calibrationError: null,
      reputationStatus: 'INSUFFICIENT_DATA',
      reputationScore: 0,
      sampleSizeSufficient: false,
      sampleSizeRequirement: 5,
      horizonStats: {},
      specialtyStats: {},
      recent30d: { resolved: 0, winRate: null, brierScore: null },
      lifetime: { resolved: totalResolved, winRate: null, brierScore: null },
      researchCount: agentData.metrics?.researchCount || 0,
      thesesCount: agentData.metrics?.thesesCount || 0,
      communityInteractions: agentData.metrics?.communityInteractions || 0,
      updatedAt: new Date().toISOString()
    };

    // Update agent's cached metrics
    await db.collection('users').doc(agentId).update({
      metrics: defaultMetrics,
      reputationStatus: 'INSUFFICIENT_DATA'
    }).catch(console.error);

    return defaultMetrics;
  }

  // Calculate Win Rate
  const winRate = Number(((correctCount / totalResolved) * 100).toFixed(1));

  // Calculate Brier Score: Mean squared error of probabilities
  // Brier = 1/N * sum((p - o)^2), where p in [0, 1] and o in {0, 1}
  let sumBrier = 0;
  resolvedForecasts.forEach(f => {
    const prob = (f.probability || 50) / 100;
    const outcome = f.status === 'RESOLVED_CORRECT' ? 1 : 0;
    sumBrier += Math.pow(prob - outcome, 2);
  });
  const brierScore = Number((sumBrier / totalResolved).toFixed(4));

  // Calculate Calibration Error (across 5 probability buckets)
  const buckets = [
    { min: 0, max: 20, count: 0, sumProb: 0, correct: 0 },
    { min: 21, max: 40, count: 0, sumProb: 0, correct: 0 },
    { min: 41, max: 60, count: 0, sumProb: 0, correct: 0 },
    { min: 61, max: 80, count: 0, sumProb: 0, correct: 0 },
    { min: 81, max: 100, count: 0, sumProb: 0, correct: 0 },
  ];

  resolvedForecasts.forEach(f => {
    const prob = f.probability || 50;
    const isCorrect = f.status === 'RESOLVED_CORRECT';
    const bucket = buckets.find(b => prob >= b.min && prob <= b.max) || buckets[2];
    bucket.count++;
    bucket.sumProb += prob / 100;
    if (isCorrect) bucket.correct++;
  });

  let totalCalibDev = 0;
  let activeBuckets = 0;
  buckets.forEach(b => {
    if (b.count > 0) {
      const avgProb = b.sumProb / b.count;
      const actualFreq = b.correct / b.count;
      totalCalibDev += Math.abs(avgProb - actualFreq);
      activeBuckets++;
    }
  });
  const calibrationError = activeBuckets > 0 ? Number((totalCalibDev / activeBuckets).toFixed(4)) : 0;

  // Horizon Segmentation (1D, 7D, 30D, 90D, 1Y)
  const horizonStats: Record<string, { total: number; correct: number; winRate: number; brierScore: number }> = {};
  const horizonGroups: Record<string, any[]> = {};

  resolvedForecasts.forEach(f => {
    const h = f.timeHorizon || '30D';
    if (!horizonGroups[h]) horizonGroups[h] = [];
    horizonGroups[h].push(f);
  });

  Object.entries(horizonGroups).forEach(([horizon, items]) => {
    if (items.length >= 2) {
      const hCorrect = items.filter(f => f.status === 'RESOLVED_CORRECT').length;
      let hBrierSum = 0;
      items.forEach(f => {
        const prob = (f.probability || 50) / 100;
        const outcome = f.status === 'RESOLVED_CORRECT' ? 1 : 0;
        hBrierSum += Math.pow(prob - outcome, 2);
      });
      horizonStats[horizon] = {
        total: items.length,
        correct: hCorrect,
        winRate: Number(((hCorrect / items.length) * 100).toFixed(1)),
        brierScore: Number((hBrierSum / items.length).toFixed(4))
      };
    }
  });

  // Specialty-Specific Performance
  const specialtyStats: Record<string, { total: number; correct: number; winRate: number; brierScore: number }> = {};
  const specialtyGroups: Record<string, any[]> = {};

  resolvedForecasts.forEach(f => {
    const asset = (f.asset || 'GENERAL').toUpperCase();
    let category = 'MACRO';
    if (['NVDA', 'AMD', 'MSFT', 'GOOGL', 'AAPL', 'TSLA', 'AMZN', 'META', 'PLTR'].includes(asset)) category = 'TECH_AI';
    else if (['BTC', 'ETH', 'SOL', 'CRYPTO'].includes(asset)) category = 'CRYPTO';
    else if (['XOM', 'CVX', 'ENERGY'].includes(asset)) category = 'ENERGY';

    if (!specialtyGroups[category]) specialtyGroups[category] = [];
    specialtyGroups[category].push(f);
  });

  Object.entries(specialtyGroups).forEach(([spec, items]) => {
    // Only compute specialty metrics if sample size >= 3
    if (items.length >= 3) {
      const sCorrect = items.filter(f => f.status === 'RESOLVED_CORRECT').length;
      let sBrierSum = 0;
      items.forEach(f => {
        const prob = (f.probability || 50) / 100;
        const outcome = f.status === 'RESOLVED_CORRECT' ? 1 : 0;
        sBrierSum += Math.pow(prob - outcome, 2);
      });
      specialtyStats[spec] = {
        total: items.length,
        correct: sCorrect,
        winRate: Number(((sCorrect / items.length) * 100).toFixed(1)),
        brierScore: Number((sBrierSum / items.length).toFixed(4))
      };
    }
  });

  // Recent 30-Day Performance vs Lifetime
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentResolved = resolvedForecasts.filter(f => {
    const date = f.resolvedAt?.toDate ? f.resolvedAt.toDate() : new Date(f.resolvedAt || f.createdAt);
    return date >= thirtyDaysAgo;
  });

  let recent30d = { resolved: recentResolved.length, winRate: null as number | null, brierScore: null as number | null };
  if (recentResolved.length >= 3) {
    const rCorrect = recentResolved.filter(f => f.status === 'RESOLVED_CORRECT').length;
    let rBrier = 0;
    recentResolved.forEach(f => {
      const prob = (f.probability || 50) / 100;
      const outcome = f.status === 'RESOLVED_CORRECT' ? 1 : 0;
      rBrier += Math.pow(prob - outcome, 2);
    });
    recent30d = {
      resolved: recentResolved.length,
      winRate: Number(((rCorrect / recentResolved.length) * 100).toFixed(1)),
      brierScore: Number((rBrier / recentResolved.length).toFixed(4))
    };
  }

  // Reputation Status & Score Formula
  // reputationScore = 100 * (1 - Brier) * min(1.0, sqrt(totalResolved / 30))
  const confidenceFactor = Math.min(1.0, Math.sqrt(totalResolved / 30));
  const reputationScore = Math.round(100 * (1 - brierScore) * confidenceFactor);

  let reputationStatus = 'EMERGING';
  if (totalResolved >= 30) reputationStatus = 'HIGH_CONFIDENCE';
  else if (totalResolved >= 15) reputationStatus = 'ESTABLISHED';

  const fullMetrics = {
    forecasts: {
      total: allForecasts.length,
      open: openForecasts.length,
      resolved: totalResolved,
      correct: correctCount,
      incorrect: incorrectCount,
      invalid: allForecasts.filter(f => f.status === 'INVALID').length,
      cancelled: allForecasts.filter(f => f.status === 'CANCELLED').length,
      winRate,
    },
    brierScore,
    calibrationError,
    reputationStatus,
    reputationScore,
    sampleSizeSufficient: true,
    sampleSizeRequirement: 5,
    horizonStats,
    specialtyStats,
    recent30d,
    lifetime: { resolved: totalResolved, winRate, brierScore },
    researchCount: agentData.metrics?.researchCount || 0,
    thesesCount: agentData.metrics?.thesesCount || 0,
    communityInteractions: agentData.metrics?.communityInteractions || 0,
    scoreMethodology: "Reputation = 100 * (1 - BrierScore) * min(1.0, sqrt(ResolvedForecasts / 30)). Requires >= 5 resolved forecasts.",
    updatedAt: new Date().toISOString()
  };

  // Cache on agent user document
  await db.collection('users').doc(agentId).update({
    metrics: fullMetrics,
    reputationStatus
  }).catch(console.error);

  return fullMetrics;
}

// ==========================================
// FORECAST ENDPOINTS
// ==========================================

// POST /api/v1/forecasts (Create Forecast)
agentIntelligenceRouter.post('/forecasts', authenticateAgent, requireScope('forecast:publish'), publishRateLimiter, async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { question, asset, direction, target, probability, timeHorizon, resolutionCriteria, sourceEvidence } = req.body;

    if (!question || !asset || !direction || probability === undefined || !timeHorizon || !resolutionCriteria) {
      return res.status(400).json({ error: 'Missing required forecast fields' });
    }

    if (probability < 0 || probability > 100) {
      return res.status(400).json({ error: 'Probability must be between 0 and 100' });
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const existingSnap = await db.collection('forecasts').where('idempotencyKey', '==', idempotencyKey).get();
      if (!existingSnap.empty) {
        return res.json({ id: existingSnap.docs[0].id, status: 'existing' });
      }
    }

    const forecastData = {
      agentId: agent.agentId,
      authorUsername: agent.handle,
      question,
      asset,
      direction,
      target: target || '',
      probability,
      timeHorizon,
      resolutionCriteria,
      sourceEvidence: sourceEvidence || '',
      status: 'OPEN',
      createdAt: FieldValue.serverTimestamp(),
      idempotencyKey: idempotencyKey || null
    };

    const docRef = await db.collection('forecasts').add(forecastData);

    // Update agent's open forecasts count
    await db.collection('users').doc(agent.agentId).update({
      'metrics.forecasts.open': FieldValue.increment(1),
      'metrics.forecasts.total': FieldValue.increment(1),
      lastSeenAt: FieldValue.serverTimestamp(),
    }).catch(console.error);

    return res.status(201).json({ id: docRef.id, status: 'created', immutable: true });
  } catch (err: any) {
    console.error('Error creating forecast:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// REJECT FORECAST EDITING (IMMUTABILITY REQUIREMENT A)
agentIntelligenceRouter.put('/forecasts/:forecastId', async (req, res) => {
  return res.status(400).json({
    error: 'Forecasts are strictly immutable once published. Modifications are rejected to maintain historical audit integrity.'
  });
});

agentIntelligenceRouter.patch('/forecasts/:forecastId', async (req, res) => {
  return res.status(400).json({
    error: 'Forecasts are strictly immutable once published. Modifications are rejected to maintain historical audit integrity.'
  });
});

// POST /api/v1/forecasts/:forecastId/resolve (Forecast Resolution Engine - Requirement B)
agentIntelligenceRouter.post('/forecasts/:forecastId/resolve', authenticateHumanOptional, async (req: any, res: any) => {
  try {
    const { forecastId } = req.params;
    const { outcome, resolutionNotes, resolutionPrice } = req.body;

    if (!['RESOLVED_CORRECT', 'RESOLVED_INCORRECT', 'INVALID', 'CANCELLED'].includes(outcome)) {
      return res.status(400).json({
        error: 'Invalid resolution outcome. Must be one of: RESOLVED_CORRECT, RESOLVED_INCORRECT, INVALID, CANCELLED'
      });
    }

    const forecastRef = db.collection('forecasts').doc(forecastId);
    const forecastSnap = await forecastRef.get();

    if (!forecastSnap.exists) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    const forecast = forecastSnap.data() as any;

    // Prevent agents from resolving their own forecasts
    if (req.agent && req.agent.agentId === forecast.agentId) {
      return res.status(403).json({
        error: 'Agents are strictly forbidden from resolving their own forecasts to prevent self-reporting bias.'
      });
    }

    if (forecast.status !== 'OPEN') {
      return res.status(400).json({
        error: `Forecast has already been finalized with status ${forecast.status}. Final states are immutable.`
      });
    }

    const outcomeValue = outcome === 'RESOLVED_CORRECT' ? 1 : outcome === 'RESOLVED_INCORRECT' ? 0 : null;

    const resolutionRecord = {
      status: outcome,
      resolvedAt: FieldValue.serverTimestamp(),
      resolutionNotes: resolutionNotes || 'Resolved by official resolution oracle.',
      resolutionPrice: resolutionPrice !== undefined ? Number(resolutionPrice) : null,
      outcomeValue,
      resolverUid: req.user?.uid || 'SYSTEM_RESOLUTION_ORACLE'
    };

    await forecastRef.update(resolutionRecord);

    // Recalculate agent reputation and objective metrics
    const updatedMetrics = await calculateAgentMetrics(forecast.agentId);

    return res.json({
      success: true,
      forecastId,
      status: outcome,
      metrics: updatedMetrics
    });
  } catch (err: any) {
    console.error('Error resolving forecast:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/forecasts
agentIntelligenceRouter.get('/forecasts', async (req, res) => {
  try {
    const { agentId, asset, status, limit = 50 } = req.query;
    let query: any = db.collection('forecasts');

    if (agentId) query = query.where('agentId', '==', agentId);
    if (asset) query = query.where('asset', '==', asset);
    if (status) query = query.where('status', '==', status);

    query = query.orderBy('createdAt', 'desc').limit(Number(limit));
    const snapshot = await query.get();

    const forecasts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(forecasts);
  } catch (err: any) {
    console.error('Error fetching forecasts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/forecasts/:forecastId
agentIntelligenceRouter.get('/forecasts/:forecastId', async (req, res) => {
  try {
    const doc = await db.collection('forecasts').doc(req.params.forecastId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// RESEARCH & VERSION HISTORY ENDPOINTS
// ==========================================

// POST /api/v1/research (Publish Research)
agentIntelligenceRouter.post('/research', authenticateAgent, requireScope('research:publish'), publishRateLimiter, async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { title, summary, thesis, bullCase, bearCase, catalysts, risks, evidence, timeHorizon, relatedAssets } = req.body;

    if (!title || !summary || !thesis) {
      return res.status(400).json({ error: 'Missing required research fields' });
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const existingSnap = await db.collection('research').where('idempotencyKey', '==', idempotencyKey).get();
      if (!existingSnap.empty) {
        return res.json({ id: existingSnap.docs[0].id, status: 'existing' });
      }
    }

    const researchData = {
      agentId: agent.agentId,
      authorUsername: agent.handle,
      title,
      summary,
      thesis,
      bullCase: bullCase || '',
      bearCase: bearCase || '',
      catalysts: Array.isArray(catalysts) ? catalysts : [],
      risks: Array.isArray(risks) ? risks : [],
      evidence: Array.isArray(evidence) ? evidence : [],
      timeHorizon: timeHorizon || '',
      relatedAssets: Array.isArray(relatedAssets) ? relatedAssets : [],
      version: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      idempotencyKey: idempotencyKey || null
    };

    const docRef = await db.collection('research').add(researchData);

    await db.collection('users').doc(agent.agentId).update({
      'metrics.researchCount': FieldValue.increment(1),
      lastSeenAt: FieldValue.serverTimestamp(),
    }).catch(console.error);

    return res.status(201).json({ id: docRef.id, status: 'created', version: 1 });
  } catch (err: any) {
    console.error('Error creating research:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/research/:researchId (Update Research with Immutable Version Record - Requirement G)
agentIntelligenceRouter.put('/research/:researchId', authenticateAgent, requireScope('research:publish'), async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { researchId } = req.params;
    const { title, summary, thesis, bullCase, bearCase, catalysts, risks, evidence, updateReason } = req.body;

    const researchRef = db.collection('research').doc(researchId);
    const researchSnap = await researchRef.get();

    if (!researchSnap.exists) {
      return res.status(404).json({ error: 'Research doc not found' });
    }

    const existingData = researchSnap.data() as any;
    if (existingData.agentId !== agent.agentId) {
      return res.status(403).json({ error: 'You do not own this research publication.' });
    }

    const currentVersion = existingData.version || 1;

    // Archive previous version in subcollection 'versions'
    await researchRef.collection('versions').doc(`v${currentVersion}`).set({
      versionNumber: currentVersion,
      title: existingData.title,
      summary: existingData.summary,
      thesis: existingData.thesis,
      bullCase: existingData.bullCase || '',
      bearCase: existingData.bearCase || '',
      catalysts: existingData.catalysts || [],
      risks: existingData.risks || [],
      evidence: existingData.evidence || [],
      archivedAt: FieldValue.serverTimestamp(),
      updateReason: updateReason || 'Updated research content.'
    });

    const newVersion = currentVersion + 1;
    const updatedFields = {
      title: title || existingData.title,
      summary: summary || existingData.summary,
      thesis: thesis || existingData.thesis,
      bullCase: bullCase !== undefined ? bullCase : existingData.bullCase,
      bearCase: bearCase !== undefined ? bearCase : existingData.bearCase,
      catalysts: Array.isArray(catalysts) ? catalysts : existingData.catalysts,
      risks: Array.isArray(risks) ? risks : existingData.risks,
      evidence: Array.isArray(evidence) ? evidence : existingData.evidence,
      version: newVersion,
      updatedAt: FieldValue.serverTimestamp()
    };

    await researchRef.update(updatedFields);

    return res.json({ id: researchId, version: newVersion, status: 'updated' });
  } catch (err: any) {
    console.error('Error updating research version:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/research/:researchId/versions (Get Version History)
agentIntelligenceRouter.get('/research/:researchId/versions', async (req, res) => {
  try {
    const versionsSnap = await db.collection('research')
      .doc(req.params.researchId)
      .collection('versions')
      .orderBy('versionNumber', 'desc')
      .get();

    const versions = versionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(versions);
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/research
agentIntelligenceRouter.get('/research', async (req, res) => {
  try {
    const { agentId, limit = 50 } = req.query;
    let query: any = db.collection('research');

    if (agentId) query = query.where('agentId', '==', agentId);

    query = query.orderBy('createdAt', 'desc').limit(Number(limit));
    const snapshot = await query.get();

    const research = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(research);
  } catch (err: any) {
    console.error('Error fetching research:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/research/:researchId
agentIntelligenceRouter.get('/research/:researchId', async (req, res) => {
  try {
    const doc = await db.collection('research').doc(req.params.researchId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// INVESTMENT THESES ENDPOINTS
// ==========================================

// POST /api/v1/theses
agentIntelligenceRouter.post('/theses', authenticateAgent, requireScope('research:publish'), publishRateLimiter, async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { asset, direction, timeHorizon, thesis, catalysts, risks, bullCase, baseCase, bearCase, keyMetrics, invalidationConditions, evidence } = req.body;

    if (!asset || !direction || !thesis) {
      return res.status(400).json({ error: 'Missing required thesis fields' });
    }

    const thesisData = {
      agentId: agent.agentId,
      authorUsername: agent.handle,
      asset,
      direction,
      timeHorizon: timeHorizon || '',
      thesis,
      catalysts: catalysts || [],
      risks: risks || [],
      bullCase: bullCase || '',
      baseCase: baseCase || '',
      bearCase: bearCase || '',
      keyMetrics: keyMetrics || [],
      invalidationConditions: invalidationConditions || [],
      evidence: evidence || [],
      version: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('theses').add(thesisData);

    await db.collection('users').doc(agent.agentId).update({
      'metrics.thesesCount': FieldValue.increment(1),
      lastSeenAt: FieldValue.serverTimestamp(),
    }).catch(console.error);

    return res.status(201).json({ id: docRef.id, status: 'created', version: 1 });
  } catch (err: any) {
    console.error('Error creating thesis:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/theses/:thesisId (Thesis Version History - Requirement H)
agentIntelligenceRouter.put('/theses/:thesisId', authenticateAgent, requireScope('research:publish'), async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { thesisId } = req.params;
    const thesisRef = db.collection('theses').doc(thesisId);
    const thesisSnap = await thesisRef.get();

    if (!thesisSnap.exists) {
      return res.status(404).json({ error: 'Thesis not found' });
    }

    const existing = thesisSnap.data() as any;
    if (existing.agentId !== agent.agentId) {
      return res.status(403).json({ error: 'You do not own this thesis.' });
    }

    const currentVersion = existing.version || 1;

    // Archive previous version in subcollection
    await thesisRef.collection('versions').doc(`v${currentVersion}`).set({
      versionNumber: currentVersion,
      thesis: existing.thesis,
      catalysts: existing.catalysts || [],
      risks: existing.risks || [],
      invalidationConditions: existing.invalidationConditions || [],
      archivedAt: FieldValue.serverTimestamp()
    });

    const newVersion = currentVersion + 1;
    await thesisRef.update({
      ...req.body,
      version: newVersion,
      updatedAt: FieldValue.serverTimestamp()
    });

    return res.json({ id: thesisId, version: newVersion, status: 'updated' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/theses
agentIntelligenceRouter.get('/theses', async (req, res) => {
  try {
    const { agentId, limit = 50 } = req.query;
    let query: any = db.collection('theses');

    if (agentId) query = query.where('agentId', '==', agentId);

    query = query.orderBy('createdAt', 'desc').limit(Number(limit));
    const snapshot = await query.get();

    const theses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(theses);
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// AGENT PERFORMANCE & CORRECTIONS
// ==========================================

// GET /api/v1/agents/:agentId/performance
agentIntelligenceRouter.get('/agents/:agentId/performance', async (req, res) => {
  try {
    const metrics = await calculateAgentMetrics(req.params.agentId);
    if (!metrics) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    return res.json(metrics);
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/corrections (Error / Correction Acknowledgement - Requirement 29)
agentIntelligenceRouter.post('/corrections', authenticateAgent, requireScope('research:publish'), async (req, res) => {
  try {
    const agent = (req as any).agent;
    const { targetType, targetId, reason, correctionDetails } = req.body;

    if (!targetType || !targetId || !correctionDetails) {
      return res.status(400).json({ error: 'targetType, targetId, and correctionDetails are required.' });
    }

    const correctionRef = await db.collection('corrections').add({
      agentId: agent.agentId,
      authorHandle: agent.handle,
      targetType,
      targetId,
      reason: reason || 'Error acknowledgement and data correction',
      correctionDetails,
      createdAt: FieldValue.serverTimestamp()
    });

    return res.status(201).json({ id: correctionRef.id, status: 'published' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// ANTI-GAMING FEEDBACK (Requirement K, 22, 23)
// ==========================================

// POST /api/v1/agents/:agentId/feedback
agentIntelligenceRouter.post('/agents/:agentId/feedback', authenticateHumanOptional, async (req: any, res: any) => {
  try {
    const { agentId } = req.params;
    const { rating, review, comment, feedbackType, category } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    const targetAgentSnap = await db.collection('users').doc(agentId).get();
    if (!targetAgentSnap.exists) {
      return res.status(404).json({ error: 'Target agent not found.' });
    }
    const targetAgent = targetAgentSnap.data() as any;

    const senderUid = req.user?.uid || (req.agent ? req.agent.agentId : null);
    if (!senderUid) {
      return res.status(401).json({ error: 'Authentication required to submit feedback.' });
    }

    // Anti-Gaming Control 1: Prevent self-voting
    if (senderUid === agentId || (req.agent && req.agent.agentId === agentId)) {
      return res.status(403).json({ error: 'Anti-Gaming Violation: Agents cannot submit feedback on themselves.' });
    }

    // Anti-Gaming Control 2: Prevent owner self-voting
    if (targetAgent.ownerUid && targetAgent.ownerUid === senderUid) {
      return res.status(403).json({ error: 'Anti-Gaming Violation: Agent owners cannot rate their own agents.' });
    }

    // Anti-Gaming Control 3: Prevent owner sibling cross-voting
    if (req.agent && targetAgent.ownerUid && req.agent.ownerUid === targetAgent.ownerUid) {
      return res.status(403).json({ error: 'Anti-Gaming Violation: Sibling agents belonging to the same owner cannot boost each other.' });
    }

    // Anti-Gaming Control 4: Duplicate feedback check
    const existingFeedback = await db.collection('agent_feedback')
      .where('targetAgentId', '==', agentId)
      .where('authorUid', '==', senderUid)
      .limit(1)
      .get();

    if (!existingFeedback.empty) {
      return res.status(409).json({ error: 'You have already submitted feedback for this agent.' });
    }

    const feedbackDoc = await db.collection('agent_feedback').add({
      targetAgentId: agentId,
      authorUid: senderUid,
      authorType: req.agent ? 'agent' : 'human',
      rating: Number(rating),
      review: review || comment || '',
      feedbackType: feedbackType || category || 'accuracy',
      createdAt: FieldValue.serverTimestamp()
    });

    return res.status(201).json({ id: feedbackDoc.id, status: 'feedback_recorded' });
  } catch (err: any) {
    console.error('Error recording feedback:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// DYNAMIC LEADERBOARDS & COMPARISON (J, L)
// ==========================================

// GET /api/v1/leaderboards
agentIntelligenceRouter.get('/leaderboards', async (req, res) => {
  try {
    const category = (req.query.category as string) || 'brier';
    const specialtyFilter = (req.query.specialty as string) || null;

    const agentsSnap = await db.collection('users')
      .where('authorType', '==', 'agent')
      .where('status', '==', 'active')
      .get();

    const leaderboardItems: any[] = [];

    for (const doc of agentsSnap.docs) {
      const agentData = doc.data();
      const metrics = await calculateAgentMetrics(doc.id);

      if (!metrics) continue;

      // Filter by category requirements & sample size protection
      if (category === 'brier' || category === 'winrate') {
        if (!metrics.sampleSizeSufficient) continue; // Requires >= 5 resolved
      }

      if (category === 'specialty' && specialtyFilter) {
        const spec = metrics.specialtyStats[specialtyFilter];
        if (!spec || spec.total < 3) continue; // Requires >= 3 resolved in specialty
      }

      leaderboardItems.push({
        id: doc.id,
        agentName: agentData.displayName,
        handle: agentData.handle,
        avatar: agentData.avatar,
        verificationStatus: agentData.verificationStatus,
        specialties: agentData.specialties || [],
        metrics,
        reputationStatus: metrics.reputationStatus,
        reputationScore: metrics.reputationScore,
        brierScore: metrics.brierScore,
        winRate: metrics.forecasts.winRate,
        resolvedCount: metrics.forecasts.resolved
      });
    }

    // Sort leaderboard items
    leaderboardItems.sort((a, b) => {
      if (category === 'brier') {
        return (a.brierScore ?? 1) - (b.brierScore ?? 1); // Lower Brier is better
      } else if (category === 'winrate') {
        return (b.winRate ?? 0) - (a.winRate ?? 0);
      } else if (category === 'recent') {
        return (b.metrics.recent30d.winRate ?? 0) - (a.metrics.recent30d.winRate ?? 0);
      } else if (category === 'specialty' && specialtyFilter) {
        const brierA = a.metrics.specialtyStats[specialtyFilter]?.brierScore ?? 1;
        const brierB = b.metrics.specialtyStats[specialtyFilter]?.brierScore ?? 1;
        return brierA - brierB;
      }
      return b.reputationScore - a.reputationScore;
    });

    return res.json({
      category,
      specialtyFilter,
      methodology: "Rankings enforce strict sample-size protection (min 5 resolved for global, min 3 for specialty). Brier score is primary metric (lower is better).",
      agents: leaderboardItems.map((item, idx) => ({ rank: idx + 1, ...item }))
    });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents/compare (Requirement L)
agentIntelligenceRouter.get('/agents/compare', async (req, res) => {
  try {
    const agentIdsParam = req.query.agentIds as string;
    if (!agentIdsParam) {
      return res.status(400).json({ error: 'agentIds parameter is required (comma-separated, max 3)' });
    }

    const agentIds = agentIdsParam.split(',').slice(0, 3);
    const comparisonResults: any[] = [];

    for (const agentId of agentIds) {
      const agentSnap = await db.collection('users').doc(agentId.trim()).get();
      if (agentSnap.exists) {
        const data = agentSnap.data() as any;
        const metrics = await calculateAgentMetrics(agentSnap.id);
        comparisonResults.push({
          agentId: agentSnap.id,
          handle: data.handle,
          displayName: data.displayName,
          avatar: data.avatar,
          verificationStatus: data.verificationStatus,
          specialties: data.specialties || [],
          metrics
        });
      }
    }

    const matrix = comparisonResults.map(ag => {
      const m = ag.metrics || {};
      return {
        id: ag.agentId,
        displayName: ag.displayName,
        handle: ag.handle,
        reputationStatus: m.reputationStatus || 'EMERGING',
        brierScore: m.brierScore !== undefined && m.brierScore !== null ? m.brierScore : null,
        calibrationError: m.calibrationError !== undefined && m.calibrationError !== null ? m.calibrationError : null,
        winRate: m.forecasts?.winRate !== undefined && m.forecasts?.winRate !== null ? m.forecasts.winRate : 0,
        sampleQualified: m.sampleSizeSufficient || false,
        specialties: ag.specialties || []
      };
    });

    let recommendation = "Select qualified agents with sufficient resolved forecast sample size (N >= 5) and low Brier scores (< 0.15) for high-reliability quant predictions.";
    if (matrix.length > 0) {
      const qualified = matrix.filter(m => m.sampleQualified);
      if (qualified.length > 0) {
        const sorted = [...qualified].sort((a, b) => (a.brierScore ?? 1) - (b.brierScore ?? 1));
        const best = sorted[0];
        const calibStr = best.calibrationError !== null ? ` (Calibration Error: ${(best.calibrationError * 100).toFixed(1)}%)` : '';
        recommendation = `Audit recommendation: @${best.handle} (${best.displayName}) is the top statistically verified agent among those compared, with a Brier score of ${best.brierScore}${calibStr} and a success win rate of ${best.winRate}%.`;
      } else {
        recommendation = "All compared agents are currently under sample-size protection (N < 5 resolved forecasts). Their track records are not yet statistically significant. Exercises caution when relying on their predictions.";
      }
    }

    return res.json({
      comparisonCount: comparisonResults.length,
      agents: comparisonResults,
      matrix,
      recommendation
    });
  } catch (err: any) {
    console.error('Error in agent comparison:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

