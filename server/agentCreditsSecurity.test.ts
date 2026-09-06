import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import {
  agentPlatformRouter,
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry,
  addCreditsToAgentWallet,
  authenticateAgent,
  requireScope
} from './agentPlatform.js';
import type { AgentApiKeyRecord, AgentIdentity } from '../src/types.js';

describe('P0 SECURITY FIX: POST /api/v1/agent/credits/refill Authentication & Scope Guard', () => {
  let app: express.Express;

  const targetAgentId = 'agent_secure_test_target';
  const initialCredits = 250;

  // Agent with NO payments scope
  const noPaymentsKeyId = 'key_no_payments_01';
  const noPaymentsRawKey = `sb_live_${noPaymentsKeyId}_secretnopayments12345`;
  const noPaymentsAgentId = 'agent_reader_only';

  // Agent WITH payments:transact scope
  const withPaymentsKeyId = 'key_with_payments_02';
  const withPaymentsRawKey = `sb_live_${withPaymentsKeyId}_secretwithpayments12345`;
  const withPaymentsAgentId = 'agent_treasury_authorized';

  // Internal Admin Secret Key
  const adminSecretKey = 'test_internal_admin_secret_key_2026';

  beforeEach(async () => {
    // Set admin secret in environment for test
    process.env.AGENT_API_SECRET_KEY = adminSecretKey;

    app = express();
    app.use(express.json());

    // Mount agent router at both routes
    app.use(['/api/v1/agents', '/api/v1/agent'], agentPlatformRouter);

    // Also mount direct route matching server.ts root app handlers
    app.post(
      ['/api/v1/agent/credits/refill', '/api/v1/agents/credits/refill', '/api/agents/credits/refill'],
      authenticateAgent,
      requireScope('payments:transact'),
      async (req, res) => {
        try {
          const { agentId, apiKey, credits = 1000 } = req.body || {};
          const authAgent = (req as any).agent;
          const target = agentId || apiKey || authAgent?.agentId;
          if (!target) {
            return res.status(400).json({ error: 'Missing agentId or apiKey parameter' });
          }
          const creditsToAdd = Math.max(1, Number(credits) || 1000);
          const result = await addCreditsToAgentWallet(target, creditsToAdd);
          return res.json({
            status: 'ok',
            message: `Successfully credited ${creditsToAdd} platform credits to agent wallet.`,
            agentId: result.agentId,
            creditsBalance: result.creditsBalance
          });
        } catch (err: any) {
          return res.status(500).json({ error: 'Failed to refill agent credits', details: err.message });
        }
      }
    );

    // Reset registries
    inMemoryWalletRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();

    // Seed target agent wallet with known balance
    inMemoryWalletRegistry.set(targetAgentId, {
      agentId: targetAgentId,
      creditsBalance: initialCredits,
      updatedAt: new Date().toISOString()
    });

    // Seed reader-only agent identity & key (NO payments:transact)
    const readerAgent: AgentIdentity = {
      agentId: noPaymentsAgentId,
      handle: 'reader_agent',
      displayName: 'Read Only Agent',
      description: 'Test agent without payment permissions',
      avatar: '',
      ownerUid: 'owner_reader',
      status: 'active',
      authorType: 'agent',
      verificationStatus: 'verified',
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryAgentRegistry.set(noPaymentsAgentId, readerAgent);
    inMemoryAgentRegistry.set('reader_agent', readerAgent);

    const noPaymentsKeyRecord: AgentApiKeyRecord = {
      keyId: noPaymentsKeyId,
      agentId: noPaymentsAgentId,
      ownerUid: 'owner_reader',
      scopes: ['services:read', 'community:read'],
      createdAt: new Date(),
      status: 'active'
    };
    inMemoryKeyRegistry.set(noPaymentsRawKey, noPaymentsKeyRecord);
    inMemoryKeyRegistry.set(noPaymentsKeyId, noPaymentsKeyRecord);

    // Seed payments-authorized agent identity & key (WITH payments:transact)
    const paymentAgent: AgentIdentity = {
      agentId: withPaymentsAgentId,
      handle: 'payment_agent',
      displayName: 'Payments Authorized Agent',
      description: 'Test agent with payment permissions',
      avatar: '',
      ownerUid: 'owner_payment',
      status: 'active',
      authorType: 'agent',
      verificationStatus: 'verified',
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryAgentRegistry.set(withPaymentsAgentId, paymentAgent);
    inMemoryAgentRegistry.set('payment_agent', paymentAgent);

    const withPaymentsKeyRecord: AgentApiKeyRecord = {
      keyId: withPaymentsKeyId,
      agentId: withPaymentsAgentId,
      ownerUid: 'owner_payment',
      scopes: ['services:read', 'payments:transact'],
      createdAt: new Date(),
      status: 'active'
    };
    inMemoryKeyRegistry.set(withPaymentsRawKey, withPaymentsKeyRecord);
    inMemoryKeyRegistry.set(withPaymentsKeyId, withPaymentsKeyRecord);
  });

  it('1. Rejects unauthenticated POST /api/v1/agent/credits/refill with 401 and leaves creditsBalance unchanged', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .send({ agentId: targetAgentId, credits: 500 });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/unauthorized|missing/i);

    // Balance must be strictly unchanged
    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  it('2. Rejects unauthenticated POST /api/v1/agents/credits/refill with 401 and leaves creditsBalance unchanged', async () => {
    const response = await request(app)
      .post('/api/v1/agents/credits/refill')
      .send({ agentId: targetAgentId, credits: 1000 });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/unauthorized|missing/i);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  it('3. Rejects invalid / fake API token with 401 and leaves creditsBalance unchanged', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', 'Bearer sb_live_fake_invalid_token_9999')
      .send({ agentId: targetAgentId, credits: 500 });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/unauthorized|invalid|unknown/i);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  it('4. Rejects authenticated agent WITHOUT payments scope with 403 Forbidden (cannot mint)', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${noPaymentsRawKey}`)
      .send({ agentId: targetAgentId, credits: 500 });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Missing required scope: payments:transact');

    // Balance must be strictly unchanged!
    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  it('5. Allows authenticated agent WITH payments scope to mint/refill credits', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${withPaymentsRawKey}`)
      .send({ agentId: targetAgentId, credits: 500 });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.creditsBalance).toBe(initialCredits + 500);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits + 500);
  });

  it('6. Allows internal platform admin with secret key to mint/refill credits', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${adminSecretKey}`)
      .send({ agentId: targetAgentId, credits: 1000 });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.creditsBalance).toBe(initialCredits + 1000);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits + 1000);
  });
});
