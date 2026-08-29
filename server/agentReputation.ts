/**
 * Stock Bloc Composite Agent Reputation Engine
 * 
 * Computes an objective, multi-factor algorithmic reputation score:
 * - 35% Verified Task Performance (Deliveries & Bounties)
 * - 25% Forecast Accuracy (Brier Score & Market Win Rate)
 * - 15% Forecast Calibration (Confidence alignment)
 * - 10% Customer / Community Ratings (Feedback & Endorsements)
 * - 10% Reliability & Latency SLA (Uptime & turnaround)
 * - 5% Dispute & Refund Penalty (Deductions for unresolved/lost disputes)
 */

export interface AgentReputationMetrics {
  agentId: string;
  handle: string;
  displayName: string;
  totalJobsAssigned: number;
  totalJobsCompleted: number;
  totalJobsVerified: number;
  totalBountiesCompleted: number;
  brierScore: number; // 0 (perfect) to 1 (worst)
  forecastWinRate: number; // 0 to 100
  totalForecasts: number;
  resolvedForecasts: number;
  calibrationScore: number; // 0 to 100
  customerRatingAverage: number; // 1 to 5
  totalRatingsCount: number;
  averageLatencySeconds: number;
  slaUptimePercent: number; // 0 to 100
  disputesInitiated: number;
  disputesLost: number;
  refundCount: number;
}

export interface CompositeReputationResult {
  agentId: string;
  handle: string;
  compositeScore: number; // 0 to 100
  tier: 'DIAMOND_QUANT' | 'PLATINUM_ANALYST' | 'GOLD_RESEARCHER' | 'SILVER_PROBATION' | 'UNVERIFIED';
  breakdown: {
    taskPerformanceScore: number; // Max 35
    forecastAccuracyScore: number; // Max 25
    calibrationScore: number; // Max 15
    customerRatingScore: number; // Max 10
    reliabilityScore: number; // Max 10
    disputePenalty: number; // Negative or 0 (Max deduction 20)
  };
  sampleSizeProtection: boolean;
  calculatedAt: string;
}

export function computeCompositeReputation(metrics: AgentReputationMetrics): CompositeReputationResult {
  // 1. Task Performance (35 points max)
  const totalCompleted = (metrics.totalJobsVerified || 0) + (metrics.totalBountiesCompleted || 0);
  const totalAssigned = Math.max(totalCompleted, metrics.totalJobsAssigned || 0);
  const taskSuccessRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) : 0.8;
  const taskVolumeFactor = Math.min(1.0, totalCompleted / 5); // Needs 5 tasks for full volume factor
  const taskPerformanceScore = Math.round(taskSuccessRate * taskVolumeFactor * 35 * 10) / 10;

  // 2. Forecast Accuracy (25 points max)
  // Brier score: 0 is perfect, 0.25 is random 50/50 baseline
  const brierAccuracy = metrics.resolvedForecasts > 0
    ? Math.max(0, 1 - metrics.brierScore)
    : 0.75;
  const winRateNormalized = (metrics.forecastWinRate || 65) / 100;
  const forecastAccuracyScore = Math.round(((brierAccuracy * 0.5) + (winRateNormalized * 0.5)) * 25 * 10) / 10;

  // 3. Calibration Score (15 points max)
  const rawCalibration = typeof metrics.calibrationScore === 'number' ? metrics.calibrationScore : 80;
  const calibrationScore = Math.round((Math.min(100, Math.max(0, rawCalibration)) / 100) * 15 * 10) / 10;

  // 4. Customer Rating Score (10 points max)
  const ratingAvg = metrics.customerRatingAverage || 4.5;
  const ratingNormalized = Math.min(1.0, Math.max(0, (ratingAvg - 1) / 4));
  const customerRatingScore = Math.round(ratingNormalized * 10 * 10) / 10;

  // 5. Reliability & Latency SLA (10 points max)
  const uptimeFactor = (metrics.slaUptimePercent || 99) / 100;
  const latencyPenalty = metrics.averageLatencySeconds > 120 ? 0.8 : 1.0;
  const reliabilityScore = Math.round(uptimeFactor * latencyPenalty * 10 * 10) / 10;

  // 6. Dispute & Refund Penalty (Up to -20 points)
  const disputesLost = metrics.disputesLost || 0;
  const refunds = metrics.refundCount || 0;
  const disputePenalty = Math.min(20, (disputesLost * 10) + (refunds * 5));

  // Compute total
  const rawTotal = taskPerformanceScore + forecastAccuracyScore + calibrationScore + customerRatingScore + reliabilityScore - disputePenalty;
  const sampleSizeProtection = (metrics.resolvedForecasts < 3 && totalCompleted < 2);
  
  // Baseline floor for new uncalibrated agents is 50, cap 100
  const compositeScore = Math.min(100, Math.max(10, Math.round(rawTotal)));

  let tier: CompositeReputationResult['tier'] = 'SILVER_PROBATION';
  if (compositeScore >= 85) {
    tier = 'DIAMOND_QUANT';
  } else if (compositeScore >= 75) {
    tier = 'PLATINUM_ANALYST';
  } else if (compositeScore >= 60) {
    tier = 'GOLD_RESEARCHER';
  } else if (totalCompleted === 0 && metrics.totalForecasts === 0) {
    tier = 'UNVERIFIED';
  }

  return {
    agentId: metrics.agentId,
    handle: metrics.handle,
    compositeScore,
    tier,
    breakdown: {
      taskPerformanceScore,
      forecastAccuracyScore,
      calibrationScore,
      customerRatingScore,
      reliabilityScore,
      disputePenalty
    },
    sampleSizeProtection,
    calculatedAt: new Date().toISOString()
  };
}
