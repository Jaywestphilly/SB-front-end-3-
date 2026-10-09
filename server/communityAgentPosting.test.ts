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

  beforeAll(async () => {
    const { inMemoryKeyRegistry, inMemoryAgentRegistry } = await import('./agentPlatform.js');
    const crypto = await import('crypto');
    const publicId = 'solaris_key_001';
    const secret = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(secret).digest('hex');
    agentApiKey = `sb_live_${publicId}_${secret}`;
    agentId = 'agent_solaris_macro';
    agentHandle = 'solaris_macro_agent';

    const keyRecord: any = {
      keyId: publicId,
      agentId,
      ownerUid: 'dashboard_user',
      keyPrefix: secret.substring(0, 4) + '...',
      keyHash,
      secretHash: keyHash,
      scopes: [
        'services:read',
        'jobs:read',
        'jobs:execute',
        'payments:transact',
        'community:read',
        'community:write',
        'community:reply'
      ],
      createdAt: new Date(),
      status: 'active'
    };

    const agentRecord = {
      agentId,
      handle: agentHandle,
      handleLower: agentHandle.toLowerCase(),
      displayName: 'Solaris Macro Analyst',
      description: 'Autonomous quant agent analyzing energy transition and sovereign debt flows',
      status: 'active',
      authorType: 'agent',
      isAgent: true
    };

    inMemoryKeyRegistry.set(publicId, keyRecord);
    inMemoryKeyRegistry.set(agentApiKey, keyRecord);
    inMemoryAgentRegistry.set(agentId, agentRecord);
    inMemoryAgentRegistry.set(agentHandle.toLowerCase(), agentRecord);

    const keysCol = dbStoreInstance.getCollection('api_keys');
    if (keysCol) {
      keysCol.set(publicId, keyRecord);
      keysCol.set(agentApiKey, keyRecord);
    }
    const usersCol = dbStoreInstance.getCollection('users');
    if (usersCol) usersCol.set(agentId, agentRecord);
  });

  it('1) Fresh POST /api/v1/agent/register returns 410 and creates no key', async () => {
    const regRes = await request(app)
      .post('/api/v1/agent/register')
      .send({
        handle: 'solaris_macro_agent',
        displayName: 'Solaris Macro Analyst',
        description: 'Autonomous quant agent analyzing energy transition and sovereign debt flows',
        specialties: ['Energy', 'Macro', 'Commodities']
      });

    expect(regRes.status).toBe(410);
    expect(regRes.body).toEqual({
      status: "gone",
      message: "No registration needed. Call any priced endpoint, get HTTP 402, pay in USDC on Base via x402, retry with PAYMENT-SIGNATURE.",
      docs: "https://stockbloc.ai.studio/llms.txt"
    });
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
