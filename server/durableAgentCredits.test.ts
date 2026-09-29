import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { db, dbStoreInstance } from './firebaseAdmin.js';
import {
  debitAgentCredits,
  verifyAndDebitAgentCredit,
  inMemoryKeyRegistry,
  inMemoryAgentRegistry,
  inMemoryWalletRegistry,
  registerAutonomousAgentHandler
} from './agentPlatform.js';
import { generateApiKeyPair, hashSecret } from './agentSecurity.js';
import { requireX402Payment, PRICED_ENDPOINTS } from './x402PaymentService.js';

describe('Durable Firestore Agent Credit Accounting', () => {
  beforeEach(() => {
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryWalletRegistry.clear();
  });

  // (a) Debit reduces the Firestore balance and writes a ledger entry
  it('(a) debit reduces Firestore balance and writes a durable ledger entry', async () => {
    const agentId = 'agent_durable_a_' + crypto.randomBytes(4).toString('hex');
    const initialBalance = 100;
    const debitCost = 25;

    // Seed wallet in Firestore
    await db.collection('agent_wallets').doc(agentId).set({
      agentId,
      creditsBalance: initialBalance,
      availableBalance: initialBalance,
      paidCreditsBalance: 0,
      lifetimeSpent: 0,
      status: 'active',
      updatedAt: new Date().toISOString()
    });

    const result = await debitAgentCredits(agentId, debitCost, {
      endpoint: '/api/v1/intelligence/research',
      method: 'POST',
      tag: 'RESEARCH_MEMO'
    });

    expect(result.success).toBe(true);
    expect(result.creditsBalance).toBe(75);
    expect(result.availableBalance).toBe(75);
    expect(result.cost).toBe(25);
    expect(result.entryId).toBeDefined();

    // Verify Firestore wallet balance
    const walletSnap = await db.collection('agent_wallets').doc(agentId).get();
    expect(walletSnap.exists).toBe(true);
    const walletData = walletSnap.data();
    expect(walletData.creditsBalance).toBe(75);
    expect(walletData.availableBalance).toBe(75);
    expect(walletData.lifetimeSpent).toBe(25);

    // Verify matching ledger entry in Firestore
    const ledgerSnap = await db.collection('ledger_entries').doc(result.entryId).get();
    expect(ledgerSnap.exists).toBe(true);
    const ledgerData = ledgerSnap.data();
    expect(ledgerData.entryType).toBe('DEBIT');
    expect(ledgerData.amount).toBe(25);
    expect(ledgerData.balanceBefore).toBe(100);
    expect(ledgerData.balanceAfter).toBe(75);
    expect(ledgerData.accountId).toBe(agentId);
    expect(ledgerData.currency).toBe('CREDITS');

    // In-memory cache should reflect transacted values
    const cachedWallet = inMemoryWalletRegistry.get(agentId);
    expect(cachedWallet).toBeDefined();
    expect(cachedWallet.creditsBalance).toBe(75);
  });

  // (b) Insufficient balance fails and writes nothing
  it('(b) insufficient balance fails closed and writes nothing to ledger or wallet', async () => {
    const agentId = 'agent_durable_b_' + crypto.randomBytes(4).toString('hex');
    const initialBalance = 10;
    const debitCost = 25;

    await db.collection('agent_wallets').doc(agentId).set({
      agentId,
      creditsBalance: initialBalance,
      availableBalance: initialBalance,
      paidCreditsBalance: 0,
      lifetimeSpent: 5,
      status: 'active',
      updatedAt: new Date().toISOString()
    });

    const ledgerBeforeCount = dbStoreInstance.getCollection('ledger_entries').size;

    // Must throw on insufficient balance
    await expect(debitAgentCredits(agentId, debitCost)).rejects.toThrow(/exhausted|Insufficient balance/i);

    // Balance in Firestore remains unchanged
    const walletSnap = await db.collection('agent_wallets').doc(agentId).get();
    expect(walletSnap.data().creditsBalance).toBe(10);
    expect(walletSnap.data().availableBalance).toBe(10);
    expect(walletSnap.data().lifetimeSpent).toBe(5);

    // Ledger entries count remains unchanged
    const ledgerAfterCount = dbStoreInstance.getCollection('ledger_entries').size;
    expect(ledgerAfterCount).toBe(ledgerBeforeCount);
  });

  // (c) Simulated restart (clear all in-memory Maps) -> the same key still validates via Firestore hydration and balance reflects prior debits
  it('(c) simulated restart recovers key and wallet from Firestore with prior debits intact', async () => {
    const agentId = 'agent_restart_c_' + crypto.randomBytes(4).toString('hex');
    const handle = 'quant_restart_agent';
    const initialBalance = 100;

    // 1. Generate key and persist agent, key, and wallet to Firestore
    const { rawKey, keyRecord, keyId } = generateApiKeyPair(agentId, handle);
    
    await db.collection('users').doc(agentId).set({
      agentId,
      handle,
      displayName: 'Restart Test Agent',
      status: 'active'
    });

    await db.collection('api_keys').doc(keyId).set({
      ...keyRecord,
      secretHash: keyRecord.keyHash,
      status: 'active'
    });

    await db.collection('agent_wallets').doc(agentId).set({
      agentId,
      creditsBalance: initialBalance,
      availableBalance: initialBalance,
      paidCreditsBalance: 0,
      lifetimeSpent: 0,
      status: 'active',
      updatedAt: new Date().toISOString()
    });

    // Warm in-memory cache initially
    inMemoryKeyRegistry.set(keyId, keyRecord);
    inMemoryAgentRegistry.set(agentId, { agentId, handle, status: 'active' });
    inMemoryWalletRegistry.set(agentId, { creditsBalance: initialBalance });

    // Debit 30 credits
    const firstDebit = await verifyAndDebitAgentCredit(`Bearer ${rawKey}`, 30);
    expect(firstDebit.valid).toBe(true);
    expect(firstDebit.creditsRemaining).toBe(70);

    // Verify Firestore balance is 70
    const snapBeforeRestart = await db.collection('agent_wallets').doc(agentId).get();
    expect(snapBeforeRestart.data().creditsBalance).toBe(70);

    // 2. SIMULATE PROCESS RESTART: wipe all in-memory registries completely
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryWalletRegistry.clear();

    expect(inMemoryKeyRegistry.size).toBe(0);
    expect(inMemoryAgentRegistry.size).toBe(0);
    expect(inMemoryWalletRegistry.size).toBe(0);

    // 3. Make another request with the SAME rawKey after restart
    const secondDebit = await verifyAndDebitAgentCredit(`Bearer ${rawKey}`, 25);

    // Must succeed via Firestore cache-miss hydration without 401
    expect(secondDebit.valid).toBe(true);
    expect(secondDebit.agentId).toBe(agentId);
    // Balance must reflect prior debit (70 - 25 = 45)
    expect(secondDebit.creditsRemaining).toBe(45);

    // Verify Firestore reflects total spent (30 + 25 = 55) and balance 45
    const snapAfterRestart = await db.collection('agent_wallets').doc(agentId).get();
    expect(snapAfterRestart.data().creditsBalance).toBe(45);
    expect(snapAfterRestart.data().lifetimeSpent).toBe(55);

    // Verify in-memory registries are now properly warmed
    expect(inMemoryKeyRegistry.has(keyId)).toBe(true);
    expect(inMemoryAgentRegistry.has(agentId)).toBe(true);
    expect(inMemoryWalletRegistry.get(agentId).creditsBalance).toBe(45);
  });

  // (d) Concurrency: N parallel debits of cost C against balance B succeed exactly floor(B/C) times
  it('(d) concurrency: N parallel debits of cost C against balance B succeed exactly floor(B/C) times', async () => {
    const agentId = 'agent_concurrent_d_' + crypto.randomBytes(4).toString('hex');
    const balanceB = 100;
    const costC = 30;
    const expectedSuccessCount = Math.floor(balanceB / costC); // floor(100 / 30) = 3
    const totalRequestsN = 10;

    await db.collection('agent_wallets').doc(agentId).set({
      agentId,
      creditsBalance: balanceB,
      availableBalance: balanceB,
      paidCreditsBalance: 0,
      lifetimeSpent: 0,
      status: 'active',
      updatedAt: new Date().toISOString()
    });

    // Execute 10 parallel debits of 30 credits concurrently
    const debitPromises = Array.from({ length: totalRequestsN }, (_, i) =>
      debitAgentCredits(agentId, costC, { description: `Concurrent debit ${i}` })
    );

    const outcomes = await Promise.allSettled(debitPromises);

    const successes = outcomes.filter(o => o.status === 'fulfilled');
    const failures = outcomes.filter(o => o.status === 'rejected');

    expect(successes.length).toBe(expectedSuccessCount); // Exactly 3
    expect(failures.length).toBe(totalRequestsN - expectedSuccessCount); // Exactly 7

    // Verify remaining Firestore balance is exactly 100 - (3 * 30) = 10
    const walletSnap = await db.collection('agent_wallets').doc(agentId).get();
    expect(walletSnap.data().creditsBalance).toBe(10);
    expect(walletSnap.data().availableBalance).toBe(10);
    expect(walletSnap.data().lifetimeSpent).toBe(90);

    // All failure errors must be insufficient balance
    for (const f of failures) {
      if (f.status === 'rejected') {
        expect(f.reason.message).toMatch(/exhausted|Insufficient balance/i);
      }
    }
  });

  // (e) Registration durability: registration awaits Firestore writes before returning 201
  it('(e) registration persists durable agent credentials to Firestore before 201', async () => {
    const app = express();
    app.use(express.json());
    app.post('/api/v1/agents/register', registerAutonomousAgentHandler);

    const handle = 'durable_bot_' + crypto.randomBytes(3).toString('hex');
    const res = await request(app)
      .post('/api/v1/agents/register')
      .send({
        handle,
        displayName: 'Durable Test Bot'
      });

    expect(res.status).toBe(201);
    expect(res.body.apiKey).toBeDefined();
    expect(res.body.agentId).toBeDefined();

    const agentId = res.body.agentId;
    const apiKey = res.body.apiKey;
    const publicId = apiKey.split('_')[2];

    // Verify durable storage in Firestore
    const userSnap = await db.collection('users').doc(agentId).get();
    expect(userSnap.exists).toBe(true);

    const keySnap = await db.collection('api_keys').doc(publicId).get();
    expect(keySnap.exists).toBe(true);

    const walletSnap = await db.collection('agent_wallets').doc(agentId).get();
    expect(walletSnap.exists).toBe(true);
    expect(walletSnap.data().creditsBalance).toBe(100);

    // Now clear memory and verify key works
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryWalletRegistry.clear();

    const debit = await verifyAndDebitAgentCredit(`Bearer ${apiKey}`, 10);
    expect(debit.valid).toBe(true);
    expect(debit.creditsRemaining).toBe(90);
  });

  // (f) x402 payment middleware uses durable transactional debit
  it('(f) x402 payment middleware awaits durable credit transaction before serving paid data', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/api/v1/intelligence/research',
      requireX402Payment(PRICED_ENDPOINTS.research),
      (req, res) => {
        res.json({
          status: 'ok',
          data: 'institutional_research_memo_secret_data',
          creditsRemaining: (req as any).creditsRemaining
        });
      }
    );

    const agentId = 'agent_x402_test_' + crypto.randomBytes(4).toString('hex');
    const { rawKey, keyRecord, keyId } = generateApiKeyPair(agentId, 'x402_agent');

    // Seed agent with 15 credits (research costs 10 credits = $0.10)
    await db.collection('users').doc(agentId).set({ agentId, handle: 'x402_agent', status: 'active' });
    await db.collection('api_keys').doc(keyId).set({ ...keyRecord, secretHash: keyRecord.keyHash, status: 'active' });
    await db.collection('agent_wallets').doc(agentId).set({
      agentId,
      creditsBalance: 15,
      availableBalance: 15,
      lifetimeSpent: 0,
      status: 'active'
    });

    // Clear in-memory caches to test cold start
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryWalletRegistry.clear();

    // Call 1: Costs 10 credits, balance becomes 5
    const res1 = await request(app)
      .post('/api/v1/intelligence/research')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ ticker: 'NVDA' });

    expect(res1.status).toBe(200);
    expect(res1.body.data).toBe('institutional_research_memo_secret_data');
    expect(res1.body.creditsRemaining).toBe(5);

    // Call 2: Costs 10 credits, balance only 5 -> fails closed with 402 PAYMENT_REQUIRED
    const res2 = await request(app)
      .post('/api/v1/intelligence/research')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ ticker: 'NVDA' });

    expect(res2.status).toBe(402);
    expect(res2.body.code).toBe('PAYMENT_REQUIRED');
    expect(res2.body.data).toBeUndefined(); // Never served paid data!

    // Verify Firestore wallet balance is exactly 5
    const finalWallet = await db.collection('agent_wallets').doc(agentId).get();
    expect(finalWallet.data().creditsBalance).toBe(5);
  });
});
