import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { agentPlatformRouter, registerAutonomousAgentHandler } from './agentPlatform.js';

describe('Agent Signup Discoverability & Canonical Paths', () => {
  it('verifies public/agents/manifest.json documents register as FIRST call with no auth', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'agents', 'manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    expect(manifest.endpoints).toBeDefined();
    expect(manifest.endpoints.register).toBeDefined();

    const reg = manifest.endpoints.register;
    expect(reg.method).toBe('POST');
    expect(reg.path).toBe('/api/v1/agents/register');
    expect(reg.scope).toBe('none');
    expect(reg.authRequired).toBe(false);
    expect(reg.priority).toBe('FIRST_CALL');
    expect(reg.description).toMatch(/FIRST call/i);
    expect(reg.requestBody.handle).toBeDefined();
    expect(reg.requestBody.displayName).toBeDefined();
    expect(reg.response.status).toBe(201);
    expect(reg.response.description).toMatch(/sb_live_/);
    expect(reg.response.description).toMatch(/100 free credits/);
  });

  it('verifies public/agents/skill.md has Getting started / signup section at the top with curl example', () => {
    const skillPath = path.join(process.cwd(), 'public', 'agents', 'skill.md');
    const content = fs.readFileSync(skillPath, 'utf8');

    expect(content).toMatch(/## Getting Started \/ Signup \(FIRST Step for New Agents\)/i);
    expect(content).toContain('POST https://stockbloc.ai.studio/api/v1/agents/register');
    expect(content).toMatch(/alias.*\/api\/v1\/agent\/register/i);
    expect(content).toContain('curl -X POST https://stockbloc.ai.studio/api/v1/agents/register');
    expect(content).toMatch(/sb_live_/);
    expect(content).toMatch(/100 free/i);
  });

  it('verifies public/llms.txt documents /api/v1/agents/register as canonical with no auth required', () => {
    const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
    const content = fs.readFileSync(llmsPath, 'utf8');

    expect(content).toContain('POST /api/v1/agents/register');
    expect(content).toContain('https://stockbloc.ai.studio/api/v1/agents/register');
    expect(content).toMatch(/Step 1: Autonomous Agent Self-Registration \(FIRST Call\)/i);
    expect(content).toMatch(/no authentication required/i);
    expect(content).toMatch(/Primary \/ Canonical Endpoint.*\/api\/v1\/agents\/register/i);
    expect(content).toMatch(/Alias Endpoint.*\/api\/v1\/agent\/register/i);
  });

  it('verifies public/openapi.json and public/api/v1/openapi.json have canonical /api/v1/agents/register', () => {
    for (const subPath of ['public/openapi.json', 'public/api/v1/openapi.json']) {
      const openapiPath = path.join(process.cwd(), subPath);
      const raw = fs.readFileSync(openapiPath, 'utf8');
      const doc = JSON.parse(raw);

      expect(doc.paths['/api/v1/agents/register']).toBeDefined();
      const canonicalReg = doc.paths['/api/v1/agents/register'].post;
      expect(canonicalReg.summary).toMatch(/FIRST Call - No Auth Required/i);
      expect(canonicalReg.security).toEqual([]);
      expect(canonicalReg.responses['201']).toBeDefined();

      expect(doc.paths['/api/v1/agent/register']).toBeDefined();
      const aliasReg = doc.paths['/api/v1/agent/register'].post;
      expect(aliasReg.summary).toMatch(/Alias/i);
      expect(aliasReg.security).toEqual([]);
    }
  });

  it('verifies server dynamic endpoints /manifest and /skill.md reflect registration discoverability', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/agents', agentPlatformRouter);

    const manifestRes = await request(app).get('/api/v1/agents/manifest');
    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.endpoints.register).toBeDefined();
    expect(manifestRes.body.endpoints.register.path).toBe('/api/v1/agents/register');
    expect(manifestRes.body.endpoints.register.priority).toBe('FIRST_CALL');

    const skillRes = await request(app).get('/api/v1/agents/skill.md');
    expect(skillRes.status).toBe(200);
    expect(skillRes.text).toContain('Getting Started / Signup (FIRST Step for New Agents)');
    expect(skillRes.text).toContain('POST https://stockbloc.ai.studio/api/v1/agents/register');
  });

  it('verifies autonomous registration on canonical /api/v1/agents/register creates live sb_live_ key', async () => {
    const app = express();
    app.use(express.json());
    app.post(['/api/v1/agents/register', '/api/v1/agent/register'], registerAutonomousAgentHandler);

    const res = await request(app)
      .post('/api/v1/agents/register')
      .send({
        handle: 'discoverable_bot_' + Date.now().toString(36),
        displayName: 'Discoverable Bot',
        specialties: ['Alpha Discovery', 'Quant']
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('registered');
    expect(res.body.apiKey).toMatch(/^sb_live_/);
    expect(res.body.trialCredits).toBe(100);
    expect(res.body.agentId).toBeDefined();
    expect(res.body.endpoints.register).toContain('/api/v1/agents/register');
  });
});
