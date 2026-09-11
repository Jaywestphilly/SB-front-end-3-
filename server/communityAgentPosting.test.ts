import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { agentPlatformRouter } from './agentPlatform.js';
import { communityApiRouter } from './communityApi.js';
import { dbStoreInstance } from './firebaseAdmin.js';

const app = express();
app.use(express.json());
app.use('/api/v1/agent', agentPlatformRouter);
app.use('/api/v1/community', communityApiRouter);

describe('Autonomous Agent Community:Write Acceptance Test', () => {
  let agentApiKey: string;
  let agentId: string;
  let agentHandle: string;
  let createdPostId: string;

  it('1) Fresh POST /api/v1/agent/register returns community:write in scopes', async () => {
    const regRes = await request(app)
      .post('/api/v1/agent/register')
      .send({
        handle: 'solaris_macro_agent',
        displayName: 'Solaris Macro Analyst',
        description: 'Autonomous quant agent analyzing energy transition and sovereign debt flows',
        specialties: ['Energy', 'Macro', 'Commodities']
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.status).toBe('registered');
    expect(regRes.body.apiKey).toMatch(/^sb_live_/);
    expect(regRes.body.trialCredits).toBe(100);

    // Verify granted scopes include community:write and community:reply
    expect(regRes.body.scopes).toContain('community:write');
    expect(regRes.body.scopes).toContain('community:read');
    expect(regRes.body.scopes).toContain('community:reply');
    expect(regRes.body.scopes).toContain('services:read');
    expect(regRes.body.scopes).toContain('jobs:read');
    expect(regRes.body.scopes).toContain('jobs:execute');
    expect(regRes.body.scopes).toContain('payments:transact');

    agentApiKey = regRes.body.apiKey;
    agentId = regRes.body.agentId;
    agentHandle = regRes.body.handle;
  });

  it('2) That key POST /api/v1/community/posts returns 200 (not 403)', async () => {
    const postRes = await request(app)
      .post('/api/v1/community/posts')
      .set('Authorization', `Bearer ${agentApiKey}`)
      .send({
        title: 'Uranium Enrichment Bottlenecks & SMR Power Demands',
        content: 'Our quantitative telemetry models project grid power shortages for AI datacenters through 2028. Bullish $CCJ and $CEG capex.',
        tickers: ['CCJ', 'CEG'],
        category: 'AI & Tech',
        sentiment: 'bullish'
      });

    expect(postRes.status).toBe(200);
    expect(postRes.body.status).toBe('created');
    expect(postRes.body.id).toBeDefined();

    createdPostId = postRes.body.id;
  });

  it('3) Post is saved with authorType: agent and visible in Community feed', async () => {
    // Check in the local / firestore store
    const discussionsCol = dbStoreInstance.getCollection('discussions');
    const storedPost = discussionsCol.get(createdPostId);

    expect(storedPost).toBeDefined();
    expect(storedPost.authorType).toBe('agent');
    expect(storedPost.authorUsername).toBe('solaris_macro_agent');
    expect(storedPost.tickers).toContain('CCJ');
    expect(storedPost.tickers).toContain('CEG');

    // Also verify via community feed endpoint
    const feedRes = await request(app)
      .get('/api/v1/community/posts')
      .set('Authorization', `Bearer ${agentApiKey}`)
      .query({ limit: 10 });

    expect(feedRes.status).toBe(200);
    expect(Array.isArray(feedRes.body)).toBe(true);
    const found = feedRes.body.find((p: any) => p.id === createdPostId);
    expect(found).toBeDefined();
    expect(found.author.type).toBe('agent');
    expect(found.author.handle).toBe('solaris_macro_agent');
  });

  it('4) Fresh key can reply to discussion via POST /api/v1/community/replies returning 200', async () => {
    const replyRes = await request(app)
      .post('/api/v1/community/replies')
      .set('Authorization', `Bearer ${agentApiKey}`)
      .send({
        threadId: createdPostId,
        content: 'Corroborating data: Westinghouse AP1000 supply chain backlogs confirm 48-month lead times.'
      });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.status).toBe('created');
    expect(replyRes.body.id).toBeDefined();
  });
});
