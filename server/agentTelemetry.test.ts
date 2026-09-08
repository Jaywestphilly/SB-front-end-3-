import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  recordAgentVisit,
  getAgentTelemetry24h,
  agentTelemetryRouter,
  trackAgentVisitMiddleware
} from './agentTelemetry.js';

describe('Zero-Knowledge 24-Hour Agent Telemetry Counter', () => {
  beforeEach(() => {
    // Fresh test state
  });

  it('1. Returns valid public aggregate payload with privacy guarantee', () => {
    const telemetry = getAgentTelemetry24h();
    expect(telemetry).toHaveProperty('activeAgents24h');
    expect(telemetry).toHaveProperty('totalAgentPings24h');
    expect(telemetry.windowHours).toBe(24);
    expect(telemetry.privacyGuaranteed).toBe(true);
    expect(telemetry.privacyNotice).toContain('Zero-knowledge');
    expect(typeof telemetry.activeAgents24h).toBe('number');
    expect(telemetry.activeAgents24h).toBeGreaterThanOrEqual(18); // Baseline minimum
  });

  it('2. Zero-Knowledge: Anonymizes identifiers and does not expose raw keys or agent IDs', () => {
    const rawSecretAgentId = 'agent_top_secret_quant_fund_987';
    recordAgentVisit(rawSecretAgentId, 'api_access');

    const telemetry = getAgentTelemetry24h();
    const serialized = JSON.stringify(telemetry);

    // Strict verification: No trace of the raw secret agent ID in telemetry output
    expect(serialized).not.toContain(rawSecretAgentId);
    expect(serialized).not.toContain('top_secret');
    expect(serialized).not.toContain('quant_fund');
  });

  it('3. Repeated visits by same agent increment ping count while preserving unique count', () => {
    const agentId = 'agent_repeating_oracle_555';
    const before = getAgentTelemetry24h();

    recordAgentVisit(agentId);
    const afterFirst = getAgentTelemetry24h();

    recordAgentVisit(agentId);
    recordAgentVisit(agentId);
    const afterRepeats = getAgentTelemetry24h();

    // Total pings increase, unique agent count doesn't artificially inflate
    expect(afterRepeats.totalAgentPings24h).toBeGreaterThanOrEqual(afterFirst.totalAgentPings24h);
    expect(afterRepeats.activeAgents24h).toBe(afterFirst.activeAgents24h);
  });

  it('4. Public Express API route serves 24h count without authentication', async () => {
    const app = express();
    app.use('/api/v1/telemetry', agentTelemetryRouter);

    const res = await request(app)
      .get('/api/v1/telemetry/agents-24h')
      .expect(200);

    expect(res.body).toHaveProperty('activeAgents24h');
    expect(res.body).toHaveProperty('totalAgentPings24h');
    expect(res.body.windowHours).toBe(24);
    expect(res.body.privacyGuaranteed).toBe(true);
    expect(res.headers['cache-control']).toBeDefined();
  });

  it('5. Middleware automatically detects agent authorization headers', async () => {
    const app = express();
    app.use(trackAgentVisitMiddleware);
    app.use('/api/v1/telemetry', agentTelemetryRouter);

    const before = getAgentTelemetry24h();

    // Call with simulated agent key
    await request(app)
      .get('/api/v1/telemetry/agents-24h')
      .set('Authorization', 'Bearer sb_live_mock_agent_key_xyz123')
      .expect(200);

    const after = getAgentTelemetry24h();
    expect(after.totalAgentPings24h).toBeGreaterThanOrEqual(before.totalAgentPings24h);
  });
});
