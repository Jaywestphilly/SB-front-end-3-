import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { agentPlatformRouter, registerAutonomousAgentHandler } from './agentPlatform.js';

describe('Agent Pure x402 Discoverability & Retired Registration', () => {
  it('verifies public/agents/manifest.json has no register endpoint and documents pure x402', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'agents', 'manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    expect(manifest.endpoints).toBeDefined();
    expect(manifest.endpoints.register).toBeUndefined();
    expect(manifest.description).toMatch(/pure x402 pay-per-call/i);
    expect(manifest.description).toMatch(/no registration needed/i);
  });

  it('verifies public/agents/skill.md has pure x402 pay-per-call section with no registration needed', () => {
    const skillPath = path.join(process.cwd(), 'public', 'agents', 'skill.md');
    const content = fs.readFileSync(skillPath, 'utf8');

    expect(content).toMatch(/## Pure x402 Pay-Per-Call \(No Registration or API Keys Needed\)/i);
    expect(content).toContain('Stock Bloc is pure x402 pay-per-call; agents need no API key or registration');
    expect(content).not.toContain('POST https://stockbloc.ai.studio/api/v1/agents/register');
  });

  it('verifies public/llms.txt documents pure x402 with no registration needed', () => {
    const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
    const content = fs.readFileSync(llmsPath, 'utf8');

    expect(content).toContain('No API keys or registration');
    expect(content).not.toContain('POST https://stockbloc.ai.studio/api/v1/agents/register');
    expect(content).not.toContain('Step 1: Autonomous Agent Self-Registration');
  });

  it('verifies public/openapi.json and public/api/v1/openapi.json do not expose register endpoints', () => {
    for (const subPath of ['public/openapi.json', 'public/api/v1/openapi.json']) {
      const openapiPath = path.join(process.cwd(), subPath);
      const raw = fs.readFileSync(openapiPath, 'utf8');
      const doc = JSON.parse(raw);

      expect(doc.paths['/api/v1/agents/register']).toBeUndefined();
      expect(doc.paths['/api/v1/agent/register']).toBeUndefined();
    }
  });

  it('verifies server dynamic endpoints /manifest and /skill.md reflect pure x402 architecture', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/agents', agentPlatformRouter);

    const manifestRes = await request(app).get('/api/v1/agents/manifest');
    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.endpoints.register).toBeUndefined();

    const skillRes = await request(app).get('/api/v1/agents/skill.md');
    expect(skillRes.status).toBe(200);
    expect(skillRes.text).toContain('Pure x402 Pay-Per-Call (No Registration or API Keys Needed)');
    expect(skillRes.text).not.toContain('POST https://stockbloc.ai.studio/api/v1/agents/register');
  });

  it('verifies POST /api/v1/agents/register returns 410 Gone and creates no key', async () => {
    const app = express();
    app.use(express.json());
    app.post(['/api/v1/agents/register', '/api/v1/agent/register'], registerAutonomousAgentHandler);

    const res = await request(app)
      .post('/api/v1/agents/register')
      .send({
        handle: 'retired_bot_' + Date.now().toString(36),
        displayName: 'Retired Bot',
        specialties: ['Alpha Discovery', 'Quant']
      });

    expect(res.status).toBe(410);
    expect(res.body.status).toBe('gone');
    expect(res.body.message).toContain('No registration needed. Call any priced endpoint, get HTTP 402, pay in USDC on Base via x402, retry with PAYMENT-SIGNATURE.');
    expect(res.body.docs).toBe('https://stockbloc.ai.studio/llms.txt');
    expect(res.body.apiKey).toBeUndefined();
  });

  it('verifies public/agents/manifest.json documents "secAnalyst" capability with exact schema, aliases and x402 terms', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'agents', 'manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    // Endpoint must be explicitly discoverable by name "secAnalyst"
    expect(manifest.endpoints.secAnalyst).toBeDefined();
    const secAnalyst = manifest.endpoints.secAnalyst;
    expect(secAnalyst.name).toBe('Stock Bloc SEC Analyst');
    expect(secAnalyst.method).toBe('POST');
    expect(secAnalyst.path).toBe('/api/v1/sec/analyst');
    expect(secAnalyst.alias).toBe('/api/v1/sec/job');
    expect(secAnalyst.supportedFilingTypes).toEqual(['10-K', '10-Q']);
    expect(secAnalyst.requestBody.ticker).toBeDefined();
    expect(secAnalyst.requestBody.filingType).toBeDefined();

    // Must have complete x402 payment block
    expect(secAnalyst.x402).toBeDefined();
    expect(secAnalyst.x402.priced).toBe(true);
    expect(secAnalyst.x402.priceUsd).toBe(0.05);
    expect(secAnalyst.x402.atomicAmount).toBe('50000');
    expect(secAnalyst.x402.asset).toBe('USDC');
    expect(secAnalyst.x402.network).toBe('Base');
    expect(secAnalyst.x402.chainId).toBe(8453);

    // Backward compatibility: existing endpoint "secJob" remains preserved
    expect(manifest.endpoints.secJob).toBeDefined();
    expect(manifest.endpoints.secJob.path).toBe('/api/v1/sec/job');
  });

  it('verifies public/llms.txt documents Stock Bloc SEC Analyst with 10-K, 10-Q, 8-K filings and x402 terms', () => {
    const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
    const content = fs.readFileSync(llmsPath, 'utf8');

    expect(content).toMatch(/Stock Bloc SEC Analyst/i);
    expect(content).toContain('/api/v1/sec/analyst');
    expect(content).toContain('/api/v1/sec/job');
    expect(content).toMatch(/10-K.*10-Q.*8-K/i);
    expect(content).toContain('$0.05 USDC');
  });

  it('verifies openapi.json documents Stock Bloc SEC Analyst operation and tags', () => {
    for (const subPath of ['public/openapi.json', 'public/api/v1/openapi.json']) {
      const openapiPath = path.join(process.cwd(), subPath);
      const raw = fs.readFileSync(openapiPath, 'utf8');
      const doc = JSON.parse(raw);

      expect(doc.paths['/api/v1/sec/analyst']).toBeDefined();
      expect(doc.paths['/api/v1/sec/job']).toBeDefined();

      const analystOp = doc.paths['/api/v1/sec/analyst'].post;
      expect(analystOp.summary).toMatch(/Stock Bloc SEC Analyst/i);
      expect(analystOp.operationId).toBe('callStockBlocSecAnalyst');
      expect(analystOp.tags).toContain('Stock Bloc SEC Analyst');
    }
  });

  it('verifies skill.md has 0 occurrences of bearer, sb_live, registered agents, platform credits, or register monetization', async () => {
    const skillPath = path.join(process.cwd(), 'public', 'agents', 'skill.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    const prohibitedRegex = /bearer|sb_live|registered agents|platform credits|register monetization/gi;
    const matches = content.match(prohibitedRegex);
    expect(matches).toBeNull();

    const app = express();
    app.use(express.json());
    app.use('/api/v1/agents', agentPlatformRouter);
    const res = await request(app).get('/api/v1/agents/skill.md');
    expect(res.status).toBe(200);
    const endpointMatches = res.text.match(prohibitedRegex);
    expect(endpointMatches).toBeNull();
  });
});
