import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { agentPlatformRouter } from './agentPlatform.js';
import { communityApiRouter } from './communityApi.js';

const app = express();
app.use(express.json());
app.use('/api/v1/agent', agentPlatformRouter);
app.use('/api/v1/community', communityApiRouter);

// Mock Firebase Admin
vi.mock('firebase-admin/firestore', () => {
  return {
    FieldValue: {
      serverTimestamp: () => 'mock_timestamp',
      increment: (n: number) => ({ _increment: n })
    }
  };
});

vi.mock('./firebaseAdmin.js', () => {
  const dbStore: any = {
    users: new Map(),
    api_keys: new Map(),
    discussions: new Map(),
    agent_wallets: new Map()
  };

  const getDoc = vi.fn((collection: string, id: string) => {
    if (!dbStore[collection]) dbStore[collection] = new Map();
    const data = dbStore[collection].get(id);
    return Promise.resolve({
      exists: !!data,
      data: () => data,
      id
    });
  });

  const setDoc = vi.fn((collection: string, id: string, data: any, options?: any) => {
    if (!dbStore[collection]) dbStore[collection] = new Map();
    if (options?.merge && dbStore[collection].has(id)) {
      dbStore[collection].set(id, { ...dbStore[collection].get(id), ...data });
    } else {
      dbStore[collection].set(id, data);
    }
    return Promise.resolve();
  });

  const updateDoc = vi.fn((collection: string, id: string, data: any) => {
    if (!dbStore[collection]) dbStore[collection] = new Map();
    if (dbStore[collection].has(id)) {
      dbStore[collection].set(id, { ...dbStore[collection].get(id), ...data });
    }
    return Promise.resolve();
  });

  const addDoc = vi.fn((collection: string, data: any) => {
    if (!dbStore[collection]) dbStore[collection] = new Map();
    const id = `mock_doc_${Date.now()}_${Math.random()}`;
    dbStore[collection].set(id, { ...data, id });
    return Promise.resolve({ id });
  });

  return {
    auth: {
      verifyIdToken: vi.fn()
    },
    db: {
      collection: vi.fn((name: string) => ({
        doc: vi.fn((id: string) => ({
          get: () => getDoc(name, id),
          set: (data: any, opt?: any) => setDoc(name, id, data, opt),
          update: (data: any) => updateDoc(name, id, data),
          collection: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                get: () => Promise.resolve({ docs: [] })
              }))
            }))
          }))
        })),
        add: (data: any) => addDoc(name, data),
        where: vi.fn(() => ({
          get: () => Promise.resolve({ empty: true, docs: [] }),
          where: vi.fn(() => ({
            get: () => Promise.resolve({ empty: true, docs: [] })
          })),
          limit: vi.fn(() => ({
            get: () => Promise.resolve({ empty: true, docs: [] })
          }))
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: () => Promise.resolve({
              docs: Array.from(dbStore[name]?.entries() || []).map(([id, data]) => ({
                id,
                data: () => data
              }))
            })
          }))
        }))
      }))
    }
  };
});

describe('Community Agent Proof-of-Alpha Incentive Engine', () => {
  let agentApiKey: string;
  let agentId: string;
  let firstPostId: string;

  beforeAll(async () => {
    const { inMemoryKeyRegistry, inMemoryAgentRegistry, inMemoryWalletRegistry } = await import('./agentPlatform.js');
    const crypto = await import('crypto');
    const publicId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(24).toString('hex');
    const keyHash = crypto.createHash('sha256').update(secret).digest('hex');
    agentApiKey = `sb_live_${publicId}_${secret}`;
    agentId = 'agent_deep_alpha_01';

    const keyRecord: any = {
      keyId: publicId,
      agentId,
      handle: 'deep_alpha_miner',
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
      handle: 'deep_alpha_miner',
      handleLower: 'deep_alpha_miner',
      displayName: 'Deep Alpha Miner 01',
      description: 'Autonomous quantitative thesis miner',
      status: 'active',
      authorType: 'agent',
      isAgent: true
    };

    const walletRecord = {
      agentId,
      creditsBalance: 0,
      availableBalance: 0,
      paidCreditsBalance: 0,
      promoCreditsBalance: 0,
      trialCreditsBalance: 0,
      trialCredits: 0,
      status: 'active'
    };

    inMemoryKeyRegistry.set(publicId, keyRecord);
    inMemoryKeyRegistry.set(agentApiKey, keyRecord);
    inMemoryAgentRegistry.set(agentId, agentRecord);
    inMemoryAgentRegistry.set('deep_alpha_miner', agentRecord);
    inMemoryWalletRegistry.set(agentId, walletRecord);

    const { db } = await import('./firebaseAdmin.js');
    await db.collection('api_keys').doc(publicId).set(keyRecord);
    await db.collection('users').doc(agentId).set(agentRecord);
    await db.collection('agent_wallets').doc(agentId).set(walletRecord);
  });

  it('1. POST /api/v1/agent/register returns 410 and creates no key', async () => {
    const regRes = await request(app)
      .post('/api/v1/agent/register')
      .send({
        handle: 'deep_alpha_miner',
        displayName: 'Deep Alpha Miner 01',
        description: 'Autonomous quantitative thesis miner',
        specialties: ['Semiconductors', 'Macro']
      });

    expect(regRes.status).toBe(410);
    expect(regRes.body).toEqual({
      status: "gone",
      message: "No registration needed. Call any priced endpoint, get HTTP 402, pay in USDC on Base via x402, retry with PAYMENT-SIGNATURE.",
      docs: "https://stockbloc.ai.studio/llms.txt"
    });
  });

  it('2. First Thesis Onboarding Bounty: Agent publishes 1st thesis and is automatically rewarded +50 Platform Credits', async () => {
    const postRes = await request(app)
      .post('/api/v1/community/discussions')
      .set('Authorization', `Bearer ${agentApiKey}`)
      .send({
        title: 'DeepSeek & Nvidia H200 Demand Sensitivity Analysis',
        content: 'Our quantitative backtests indicate hyperscaler CapEx for $NVDA remains elevated through Q4 2026.',
        tickers: ['NVDA'],
        category: 'AI & Tech',
        sentiment: 'bullish'
      });

    expect([200, 201]).toContain(postRes.status);
    expect(postRes.body.status).toBe('created');
    expect(postRes.body.bountyAwarded).toBe(50);
    expect(postRes.body.newCreditsBalance).toBe(50); // 0 initial + 50 bounty
    expect(postRes.body.message).toContain('+50 Platform Credits');

    firstPostId = postRes.body.id;
  });

  it('3. Subsequent thesis posts by the same agent do NOT re-award the first-time welcome bounty', async () => {
    const secondPostRes = await request(app)
      .post('/api/v1/community/discussions')
      .set('Authorization', `Bearer ${agentApiKey}`)
      .send({
        title: 'TSMC 2nm Node Yield Progress',
        content: 'Analyzing $TSM advanced packaging capacity expansion for next-gen silicon.',
        tickers: ['TSM'],
        category: 'AI & Tech'
      });

    expect([200, 201]).toContain(secondPostRes.status);
    expect(secondPostRes.body.bountyAwarded).toBeUndefined();
  });

  it('4. Upvote Mining: When an agent thesis is upvoted, the author agent is awarded +2 Platform Credits', async () => {
    const upvoteRes = await request(app)
      .post(`/api/v1/community/discussions/${firstPostId}/upvote`)
      .send({});

    expect(upvoteRes.status).toBe(200);
    expect(upvoteRes.body.success).toBe(true);
    expect(upvoteRes.body.authorRewarded).toBe(true);
    expect(upvoteRes.body.creditsAwarded).toBe(2);
    expect(upvoteRes.body.newAuthorBalance).toBe(52); // 50 + 2
  });
});
