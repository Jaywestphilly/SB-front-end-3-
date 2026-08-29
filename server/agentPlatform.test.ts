import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { agentPlatformRouter } from './agentPlatform.js';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use('/api/v1/agents', agentPlatformRouter);
// // app.use('/api/v1/community', communityStreamRouter);

// Mock firebase-admin/firestore
vi.mock('firebase-admin/firestore', () => {
  return {
    FieldValue: {
      serverTimestamp: () => 'mock_timestamp'
    }
  };
});

// Mock Firebase Admin
vi.mock('./firebaseAdmin.js', () => {
  const dbStore: any = {
    users: new Map(),
    api_keys: new Map(),
    chats: new Map(),
    discussions: new Map()
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

  const setDoc = vi.fn((collection: string, id: string, data: any) => {
    if (!dbStore[collection]) dbStore[collection] = new Map();
    dbStore[collection].set(id, data);
    return Promise.resolve();
  });

  const updateDoc = vi.fn((collection: string, id: string, data: any) => {
    if (!dbStore[collection]) dbStore[collection] = new Map();
    if(dbStore[collection].has(id)) {
      dbStore[collection].set(id, { ...dbStore[collection].get(id), ...data });
    }
    return Promise.resolve();
  });

  return {
    auth: {
      verifyIdToken: vi.fn(async (token) => {
        if (token === 'valid_human_token') return { uid: 'human_uid_123' };
        throw new Error('Invalid token');
      })
    },
    db: {
      collection: (name: string) => ({
        doc: (id?: string) => {
          const docId = id || 'mock_auto_id_' + Math.random();
          return {
            id: docId,
            get: () => getDoc(name, docId),
            set: (data: any) => setDoc(name, docId, data),
            update: (data: any) => updateDoc(name, docId, data)
          };
        },
        where: function mockWhere() {
          const self = {
            where: mockWhere,
            limit: () => ({
              get: () => Promise.resolve({ empty: true, docs: [], size: 0 })
            }),
            get: () => Promise.resolve({ empty: true, docs: [], size: 0 })
          };
          return self;
        },
        orderBy: () => ({
          limit: () => ({
            onSnapshot: () => () => {} // Mock unsubscribe
          })
        })
      })
    },
    dbStore // Expose for testing
  };
});

import * as firebaseAdminModule from './firebaseAdmin.js';
const { dbStore } = firebaseAdminModule as any;

describe('Agent Platform API', () => {
  beforeAll(() => {
    dbStore.users.clear();
    dbStore.api_keys.clear();
  });

  let validAgentId: string;
  let rawKey: string;
  let publicId: string;

  it('1. Agent registration', async () => {
    const res = await request(app)
      .post('/api/v1/agents/register')
      .set('Authorization', 'Bearer valid_human_token')
      .send({
        handle: 'test_agent',
        displayName: 'Test Agent',
      });
    expect(res.status).toBe(201);
    expect(res.body.handle).toBe('test_agent');
    expect(res.body.authorType).toBe('agent');
    expect(res.body.ownerUid).toBe('human_uid_123');
    validAgentId = res.body.agentId;
  });

  it('2 & 3. API key generation and raw secret not persisted', async () => {
    // Generate key
    const res = await request(app)
      .post('/api/v1/agents/keys')
      .set('Authorization', 'Bearer valid_human_token')
      .send({
        agentId: validAgentId,
        scopes: ['community:read', 'community:write']
      });
    expect(res.status).toBe(201);
    expect(res.body.key).toContain('sb_live_');
    
    rawKey = res.body.key;
    publicId = res.body.keyId;

    // Verify secret is not persisted in dbStore
    const keyRecord = dbStore.api_keys.get(publicId);
    expect(keyRecord).toBeDefined();
    expect(keyRecord.keyHash).toBeDefined();
    
    const parts = rawKey.split('_');
    const secret = parts[3];
    expect(keyRecord.keyHash).toBe(crypto.createHash('sha256').update(secret).digest('hex'));
    expect(keyRecord.keyPrefix).toBe(secret.substring(0, 4) + '...');
    expect(JSON.stringify(keyRecord)).not.toContain(secret);
  });

  it('4. API authentication success', async () => {
    const res = await request(app)
      .get('/api/v1/agents/me')
      .set('Authorization', `Bearer ${rawKey}`);
    expect(res.status).toBe(200);
    expect(res.body.agentId).toBe(validAgentId);
  });

  it('5. Revoked key rejected', async () => {
    // Revoke key
    await request(app)
      .post(`/api/v1/agents/keys/${publicId}/revoke`)
      .set('Authorization', 'Bearer valid_human_token');
    
    // Attempt use
    const res = await request(app)
      .get('/api/v1/agents/me')
      .set('Authorization', `Bearer ${rawKey}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('revoked');
  });

  it('6. Invalid key rejected', async () => {
    const res = await request(app)
      .get('/api/v1/agents/me')
      .set('Authorization', `Bearer sb_live_invalid_secret`);
    expect(res.status).toBe(401);
  });

  it('7 & 8. Scope enforcement and no spoofing', async () => {
    // Register agent
    const reg = await request(app)
      .post('/api/v1/agents/register')
      .set('Authorization', 'Bearer valid_human_token')
      .send({ handle: 'scope_agent', displayName: 'Scope Agent' });
    
    // Generate key with only read scope
    const keys = await request(app)
      .post('/api/v1/agents/keys')
      .set('Authorization', 'Bearer valid_human_token')
      .send({ agentId: reg.body.agentId, scopes: ['community:read'] });
    
    const readKey = keys.body.key;

    // Test read scope on dummy route
    const fakeRouteApp = express();
    fakeRouteApp.use(express.json());
    // Add fake routes for testing scope
    const { authenticateAgent, requireScope } = await import('./agentPlatform.js');
    fakeRouteApp.post('/api/v1/agents/test_write', authenticateAgent, requireScope('community:write'), (req, res) => res.json({ success: true }));
    fakeRouteApp.get('/api/v1/agents/test_read', authenticateAgent, requireScope('community:read'), (req, res) => res.json({ success: true }));

    const readRes = await request(fakeRouteApp)
      .get('/api/v1/agents/test_read')
      .set('Authorization', `Bearer ${readKey}`);
    expect(readRes.status).toBe(200);

    const writeRes = await request(fakeRouteApp)
      .post('/api/v1/agents/test_write')
      .set('Authorization', `Bearer ${readKey}`);
    expect(writeRes.status).toBe(403);
    expect(writeRes.body.error).toContain('Missing required scope');
  });

  it('9. Rate limiting exists', async () => {
    // We expect express-rate-limit to be initialized
    const { chatRateLimiter, globalApiLimiter } = await import('./agentPlatform.js');
    expect(chatRateLimiter).toBeDefined();
    expect(globalApiLimiter).toBeDefined();
  });

  it('11. SSE Authentication middleware works', async () => {
     // Register agent
     const reg = await request(app)
       .post('/api/v1/agents/register')
       .set('Authorization', 'Bearer valid_human_token')
       .send({ handle: 'sse_agent', displayName: 'SSE Agent' });
     
     // Generate key
     const keys = await request(app)
       .post('/api/v1/agents/keys')
       .set('Authorization', 'Bearer valid_human_token')
       .send({ agentId: reg.body.agentId, scopes: ['community:read'] });
     
     const sseKey = keys.body.key;
 
     const fakeRouteApp = express();
     fakeRouteApp.use(express.json());
     const { authenticateAgent, requireScope } = await import('./agentPlatform.js');
     fakeRouteApp.get('/api/v1/community/stream', authenticateAgent, requireScope('community:read'), (req, res) => res.json({ success: true }));

     // Unauthenticated
     const res1 = await request(fakeRouteApp)
       .get('/api/v1/community/stream');
     expect(res1.status).toBe(401);
 
     // Authenticated
     const res2 = await request(fakeRouteApp)
       .get('/api/v1/community/stream')
       .set('Authorization', `Bearer ${sseKey}`);
     expect(res2.status).toBe(200);
  });

  it('12. Autonomous Agent self-registration grants full marketplace and arena scopes', async () => {
    const { registerAutonomousAgentHandler, authenticateAgent, requireScope } = await import('./agentPlatform.js');
    const autoApp = express();
    autoApp.use(express.json());
    autoApp.post('/api/v1/agent/register', registerAutonomousAgentHandler);
    
    // Add dummy marketplace endpoints to verify scope access
    autoApp.post('/api/v1/exchange/services', authenticateAgent, requireScope('services:write'), (req, res) => res.status(201).json({ success: true, action: 'service_published' }));
    autoApp.post('/api/v1/exchange/requests', authenticateAgent, requireScope('requests:write'), (req, res) => res.status(201).json({ success: true, action: 'request_created' }));
    autoApp.post('/api/v1/exchange/jobs', authenticateAgent, requireScope('jobs:execute'), (req, res) => res.status(201).json({ success: true, action: 'job_executed' }));

    const regRes = await request(autoApp)
      .post('/api/v1/agent/register')
      .send({
        handle: 'tsunami_auto_quant',
        displayName: 'Tsunami Auto Quant Agent',
        specialties: ['Super Sonic Tsunami', 'Marketplace Services']
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.status).toBe('registered');
    expect(regRes.body.apiKey).toContain('sb_live_');
    expect(regRes.body.trialCredits).toBe(100);
    expect(regRes.body.scopes).toContain('services:write');
    expect(regRes.body.scopes).toContain('requests:write');
    expect(regRes.body.scopes).toContain('jobs:execute');
    expect(regRes.body.scopes).toContain('payments:transact');
    expect(regRes.body.scopes).toContain('community:read');
    expect(regRes.body.marketplace).toBeDefined();
    expect(regRes.body.marketplace.enabled).toBe(true);

    const apiKey = regRes.body.apiKey;

    // Verify services:write access
    const srvRes = await request(autoApp)
      .post('/api/v1/exchange/services')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ name: '13F Whale Tracking Service' });
    expect(srvRes.status).toBe(201);
    expect(srvRes.body.action).toBe('service_published');

    // Verify requests:write access
    const reqRes = await request(autoApp)
      .post('/api/v1/exchange/requests')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ title: 'Quantum Compute Deep Dive' });
    expect(reqRes.status).toBe(201);
    expect(reqRes.body.action).toBe('request_created');

    // Verify jobs:execute access
    const jobRes = await request(autoApp)
      .post('/api/v1/exchange/jobs')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ taskId: 'task_001' });
    expect(jobRes.status).toBe(201);
    expect(jobRes.body.action).toBe('job_executed');
  });
});
