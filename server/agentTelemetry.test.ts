import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  recordAgentVisit,
  getAgentTelemetry24h,
  agentTelemetryRouter,
  trackAgentVisitMiddleware,
  clearTelemetryState
} from './agentTelemetry.js';

describe('Zero-Knowledge 24-Hour Agent Telemetry Counter (Honest Metrics)', () => {
  beforeEach(() => {
    clearTelemetryState();
  });

  it('1. Returns valid public aggregate payload with true tracked count and privacy guarantee', () => {
    const telemetry = getAgentTelemetry24h();
    expect(telemetry).toHaveProperty('activeAgents24h');
    expect(telemetry).toHaveProperty('totalAgentPings24h');
    expect(telemetry.windowHours).toBe(24);
    expect(telemetry.privacyGuaranteed).toBe(true);
    expect(telemetry.privacyNotice).toContain('Zero-knowledge');
    expect(typeof telemetry.activeAgents24h).toBe('number');
    // Pure real metric: starts at exactly 0 when clean
    expect(telemetry.activeAgents24h).toBe(0);
    expect(telemetry.totalAgentPings24h).toBe(0);
  });

  it('2. Exactly tracks true active agent set size with zero manufactured baselines', () => {
    expect(getAgentTelemetry24h().activeAgents24h).toBe(0);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(0);

    // Track 1st real agent
    recordAgentVisit('agent_alpha_quant_01');
    expect(getAgentTelemetry24h().activeAgents24h).toBe(1);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(1);

    // Track 2nd real agent
    recordAgentVisit('agent_beta_quant_02');
    expect(getAgentTelemetry24h().activeAgents24h).toBe(2);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(2);

    // Track 3rd real agent
    recordAgentVisit('agent_gamma_quant_03');
    expect(getAgentTelemetry24h().activeAgents24h).toBe(3);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(3);
  });

  it('3. Zero-Knowledge: Anonymizes identifiers and does not expose raw keys or agent IDs', () => {
    const rawSecretAgentId = 'agent_top_secret_quant_fund_987';
    recordAgentVisit(rawSecretAgentId, 'api_access');

    const telemetry = getAgentTelemetry24h();
    const serialized = JSON.stringify(telemetry);

    // Strict verification: No trace of the raw secret agent ID in telemetry output
    expect(serialized).not.toContain(rawSecretAgentId);
    expect(serialized).not.toContain('top_secret');
    expect(serialized).not.toContain('quant_fund');
    expect(telemetry.activeAgents24h).toBe(1);
  });

  it('4. Repeated visits by same agent increment ping count while preserving unique count', () => {
    const agentId = 'agent_repeating_oracle_555';

    recordAgentVisit(agentId);
    const afterFirst = getAgentTelemetry24h();
    expect(afterFirst.activeAgents24h).toBe(1);
    expect(afterFirst.totalAgentPings24h).toBe(1);

    recordAgentVisit(agentId);
    recordAgentVisit(agentId);
    const afterRepeats = getAgentTelemetry24h();

    // Total pings increase to 3, unique agent count remains exactly 1
    expect(afterRepeats.totalAgentPings24h).toBe(3);
    expect(afterRepeats.activeAgents24h).toBe(1);
  });

  it('5. Public Express API route serves 24h count without authentication', async () => {
    recordAgentVisit('agent_live_query_001');

    const app = express();
    app.use('/api/v1/telemetry', agentTelemetryRouter);

    const res = await request(app)
      .get('/api/v1/telemetry/agents-24h')
      .expect(200);

    expect(res.body).toHaveProperty('activeAgents24h');
    expect(res.body).toHaveProperty('totalAgentPings24h');
    expect(res.body.activeAgents24h).toBe(1);
    expect(res.body.windowHours).toBe(24);
    expect(res.body.privacyGuaranteed).toBe(true);
    expect(res.headers['cache-control']).toBeDefined();
  });

  it('6. Middleware automatically detects agent authorization headers and tracks true pings', async () => {
    const app = express();
    app.use(trackAgentVisitMiddleware);
    app.use('/api/v1/telemetry', agentTelemetryRouter);

    expect(getAgentTelemetry24h().activeAgents24h).toBe(0);

    // Call with simulated agent key
    await request(app)
      .get('/api/v1/telemetry/agents-24h')
      .set('Authorization', 'Bearer sb_live_mock_agent_key_xyz123')
      .expect(200);

    const after = getAgentTelemetry24h();
    expect(after.activeAgents24h).toBe(1);
    expect(after.totalAgentPings24h).toBe(1);
  });
});
