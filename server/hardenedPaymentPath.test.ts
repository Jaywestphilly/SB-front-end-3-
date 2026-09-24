import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  agentExchangeRouter,
  PLATFORM_TREASURY_ACCOUNT_ID,
  inMemoryBounties
} from './agentExchangeApi.js';
import {
  agentPlatformRouter,
  registerAutonomousAgentHandler,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry,
  inMemoryAgentRegistry
} from './agentPlatform.js';
import crypto from 'crypto';

describe('HARDENED PAYMENT PATH & UNIFIED PRICING AUDIT', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // 19e. API Key Generator endpoint matching server.ts
    app.post('/api/v1/agent/keys/generate', (req, res) => {
      const publicId = crypto.randomBytes(8).toString('hex');
      const secret = crypto.randomBytes(32).toString('hex');
      const rawKey = `sb_live_${publicId}_${secret}`;
      const keyHash = crypto.createHash('sha256').update(secret).digest('hex');
      const agentId = `agent_quant_${crypto.randomBytes(5).toString('hex')}`;
      const handle = `quant_pro_${publicId.substring(0, 6)}`;
      const keyPrefix = secret.substring(0, 4) + '...';

      const keyRecord: any = {
        keyId: publicId,
        agentId,
        ownerUid: 'dashboard_user',
        keyPrefix,
        keyHash,
        secretHash: keyHash,
        scopes: [
          'services:read',
          'services:write',
          'jobs:read',
          'jobs:execute',
          'payments:transact',
          'community:read',
          'community:write',
          'community:reply'
        ],
        createdAt: new Date(),
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        status: 'active'
      };

      const agentRecord: any = {
        agentId,
        handle,
        handleLower: handle.toLowerCase(),
        displayName: 'Quant Suite Pro Agent',
        description: 'Autonomous quant agent with API key credentials.',
        ownerUid: 'dashboard_user',
        verificationStatus: 'verified',
        status: 'active',
        isAgent: true,
        isAutonomousAgent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      };

      const walletRecord: any = {
        agentId,
        creditsBalance: 3000,
        availableBalance: 3000,
        paidCreditsBalance: 3000,
        promoCreditsBalance: 0,
        trialCreditsBalance: 0,
        trialCredits: 0,
        lastCreditTag: 'PRO_SUBSCRIPTION',
        lifetimeSpent: 0,
        status: 'active'
      };

      inMemoryKeyRegistry.set(publicId, keyRecord);
      inMemoryKeyRegistry.set(rawKey, keyRecord);
      inMemoryAgentRegistry.set(agentId, agentRecord);
      inMemoryAgentRegistry.set(handle.toLowerCase(), agentRecord);
      inMemoryWalletRegistry.set(agentId, walletRecord);

      res.json({
        status: 'ok',
        key: rawKey,
        keyId: publicId,
        agentId,
        handle,
        createdAt: new Date().toISOString(),
        creditsRemaining: 3000,
        tier: 'Quant Suite Pro'
      });
    });

    app.post(['/api/v1/agents/register', '/api/v1/agent/register'], registerAutonomousAgentHandler);
    app.use('/api/v1', agentPlatformRouter);
    app.use('/api/v1', agentExchangeRouter);
  });

  it('1. POST /api/v1/agent/keys/generate produces an active, registered key that passes auth', async () => {
    const genRes = await request(app)
      .post('/api/v1/agent/keys/generate')
      .send({});

    expect(genRes.status).toBe(200);
    expect(genRes.body.status).toBe('ok');
    expect(genRes.body.key).toMatch(/^sb_live_[0-9a-f]{16}_[0-9a-f]{64}$/);

    const generatedKey = genRes.body.key;

    // Use this minted key to query authenticated endpoint
    const meRes = await request(app)
      .get('/api/v1/agents/me')
      .set('Authorization', `Bearer ${generatedKey}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.agent.agentId).toBe(genRes.body.agentId);
  });

  it('2. verify-and-pay rejects requests where passed is missing or not a boolean', async () => {
    // Register verifier and claimant agents
    const verifierRes = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'verifier_agent_1', displayName: 'Verifier Agent 1' });
    const verifierKey = verifierRes.body.apiKey;

    const claimantRes = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'claimant_agent_1', displayName: 'Claimant Agent 1' });
    const claimantAgentId = claimantRes.body.agentId;

    const bountyId = 'test_bounty_val_' + Date.now();
    inMemoryBounties.set(bountyId, {
      bountyId,
      title: 'Validation Bounty',
      description: 'Test deliverables',
      category: 'Research',
      rewardCredits: 100,
      rewardUsdc: 1.0,
      status: 'delivered',
      claimedBy: claimantAgentId,
      claimedByHandle: 'claimant_agent_1',
      claimedAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      submission: {
        summary: 'Deliverables submitted',
        outputPayload: { test: true },
        evidenceSources: ['https://sec.gov'],
        submittedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    // Call verify-and-pay WITHOUT passed field
    const resNoPassed = await request(app)
      .post(`/api/v1/bounties/${bountyId}/verify-and-pay`)
      .set('Authorization', `Bearer ${verifierKey}`)
      .send({ score: 95 });

    expect(resNoPassed.status).toBe(400);
    expect(resNoPassed.body.success).toBe(false);
    expect(resNoPassed.body.error).toContain("explicit boolean 'passed'");
  });

  it('3. verify-and-pay rejects self-verification with 403 Forbidden', async () => {
    const claimantRes = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'self_claimant_agent', displayName: 'Self Claimant' });
    const claimantKey = claimantRes.body.apiKey;
    const claimantId = claimantRes.body.agentId;

    const bountyId = 'test_bounty_self_' + Date.now();
    inMemoryBounties.set(bountyId, {
      bountyId,
      title: 'Self Verify Test Bounty',
      description: 'Test deliverables',
      category: 'Research',
      rewardCredits: 100,
      rewardUsdc: 1.0,
      status: 'delivered',
      claimedBy: claimantId,
      claimedByHandle: 'self_claimant_agent',
      claimedAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      submission: {
        summary: 'Deliverables submitted',
        outputPayload: { test: true },
        evidenceSources: ['https://sec.gov'],
        submittedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    // Claimant attempts to verify their own bounty
    const selfRes = await request(app)
      .post(`/api/v1/bounties/${bountyId}/verify-and-pay`)
      .set('Authorization', `Bearer ${claimantKey}`)
      .send({ passed: true, score: 100 });

    expect(selfRes.status).toBe(403);
    expect(selfRes.body.success).toBe(false);
    expect(selfRes.body.error).toContain('Self-verification is strictly prohibited');
  });

  it('4. Bounty payouts actually debit the treasury wallet balance', async () => {
    // Setup treasury with known funds
    const initialTreasuryCredits = 50000;
    const treasuryRecord = {
      agentId: PLATFORM_TREASURY_ACCOUNT_ID,
      creditsBalance: initialTreasuryCredits,
      availableBalance: initialTreasuryCredits,
      totalSettledVolume: 0,
      lifetimeSpent: 0
    };
    inMemoryWalletRegistry.set(PLATFORM_TREASURY_ACCOUNT_ID, treasuryRecord as any);
    try {
      const { db } = await import('./firebaseAdmin.js');
      await db.collection('agent_wallets').doc(PLATFORM_TREASURY_ACCOUNT_ID).set(treasuryRecord);
    } catch (_) {}

    const verifierRes = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'independent_verifier', displayName: 'Independent Verifier' });
    const verifierKey = verifierRes.body.apiKey;

    const claimantRes = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'hard_worker_agent', displayName: 'Hard Worker Agent' });
    const claimantId = claimantRes.body.agentId;
    const initialWorkerBalance = inMemoryWalletRegistry.get(claimantId)?.creditsBalance || 0;

    const rewardCredits = 250;
    const bountyId = 'test_bounty_payout_' + Date.now();
    inMemoryBounties.set(bountyId, {
      bountyId,
      title: 'Treasury Debit Test Bounty',
      description: 'Test deliverables',
      category: 'Research',
      rewardCredits,
      rewardUsdc: 2.5,
      status: 'delivered',
      claimedBy: claimantId,
      claimedByHandle: 'hard_worker_agent',
      claimedAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      submission: {
        summary: 'Verified research findings',
        outputPayload: { valid: true },
        evidenceSources: ['https://sec.gov'],
        submittedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    const payRes = await request(app)
      .post(`/api/v1/bounties/${bountyId}/verify-and-pay`)
      .set('Authorization', `Bearer ${verifierKey}`)
      .send({ passed: true, score: 98, notes: 'Approved by third-party audit' });

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.status).toBe('paid');
    expect(payRes.body.rewardCredits).toBe(rewardCredits);

    // Verify worker received credits
    const finalWorkerWallet = inMemoryWalletRegistry.get(claimantId);
    expect(finalWorkerWallet?.creditsBalance).toBe(initialWorkerBalance + rewardCredits);

    // Verify treasury was debited
    const finalTreasuryWallet = inMemoryWalletRegistry.get(PLATFORM_TREASURY_ACCOUNT_ID);
    expect(finalTreasuryWallet?.creditsBalance).toBe(initialTreasuryCredits - rewardCredits);
  });

  it('5. Bounty payouts strictly fail if treasury balance is insufficient (no minting from nothing)', async () => {
    // Deplete treasury to 0
    const emptyTreasury = {
      agentId: PLATFORM_TREASURY_ACCOUNT_ID,
      creditsBalance: 0,
      availableBalance: 0,
      totalSettledVolume: 0
    };
    inMemoryWalletRegistry.set(PLATFORM_TREASURY_ACCOUNT_ID, emptyTreasury as any);
    try {
      const { db } = await import('./firebaseAdmin.js');
      await db.collection('agent_wallets').doc(PLATFORM_TREASURY_ACCOUNT_ID).set(emptyTreasury);
    } catch (_) {}

    const verifierRes = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'verifier_audit_2', displayName: 'Verifier Audit 2' });
    const verifierKey = verifierRes.body.apiKey;

    const claimantRes = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'worker_bounty_2', displayName: 'Worker 2' });
    const claimantId = claimantRes.body.agentId;

    const bountyId = 'test_bounty_empty_treasury_' + Date.now();
    inMemoryBounties.set(bountyId, {
      bountyId,
      title: 'Unfunded Bounty',
      description: 'Test deliverables',
      category: 'Research',
      rewardCredits: 500,
      rewardUsdc: 5.0,
      status: 'delivered',
      claimedBy: claimantId,
      claimedByHandle: 'worker_bounty_2',
      claimedAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      submission: {
        summary: 'Work done',
        outputPayload: { valid: true },
        evidenceSources: ['https://sec.gov'],
        submittedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    const failRes = await request(app)
      .post(`/api/v1/bounties/${bountyId}/verify-and-pay`)
      .set('Authorization', `Bearer ${verifierKey}`)
      .send({ passed: true, score: 90 });

    expect(failRes.status).toBe(400);
    expect(failRes.body.success).toBe(false);
    expect(failRes.body.error).toContain('insufficient to fund bounty payout');
  });
});
