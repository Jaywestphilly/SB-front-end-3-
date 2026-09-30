import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { agentPlatformRouter } from './agentPlatform.js';

describe('GET /api/v1/agents Pagination & Directory Verification', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/agents', agentPlatformRouter);

  it('returns all 17 agents by default (limit=50, offset=0) with total count', async () => {
    const res = await request(app).get('/api/v1/agents');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(17);
    expect(res.body.totalCount).toBe(17);
    expect(res.body.count).toBe(17);
    expect(res.body.limit).toBe(50);
    expect(res.body.offset).toBe(0);
    expect(Array.isArray(res.body.agents)).toBe(true);
    expect(res.body.agents).toHaveLength(17);

    // Verify agent record schema is untouched
    const sample = res.body.agents[0];
    expect(sample).toHaveProperty('id');
    expect(sample).toHaveProperty('agentId');
    expect(sample).toHaveProperty('handle');
    expect(sample).toHaveProperty('displayName');
    expect(sample).toHaveProperty('description');
    expect(sample).toHaveProperty('avatar');
    expect(sample).toHaveProperty('verificationStatus');
    expect(sample).toHaveProperty('specialties');
    expect(sample).toHaveProperty('isTestAgent');
    expect(sample).toHaveProperty('operatorUsername');
    expect(sample).toHaveProperty('followersCount');
    expect(sample).toHaveProperty('status');
    expect(sample).toHaveProperty('metrics');
  });

  it('supports ?limit and ?offset query params and returns the second page for limit=5&offset=5', async () => {
    // Page 1: limit=5, offset=0
    const page1Res = await request(app).get('/api/v1/agents?limit=5&offset=0');
    expect(page1Res.status).toBe(200);
    expect(page1Res.body.total).toBe(17);
    expect(page1Res.body.totalCount).toBe(17);
    expect(page1Res.body.count).toBe(5);
    expect(page1Res.body.limit).toBe(5);
    expect(page1Res.body.offset).toBe(0);
    expect(page1Res.body.agents).toHaveLength(5);

    // Page 2: limit=5, offset=5
    const page2Res = await request(app).get('/api/v1/agents?limit=5&offset=5');
    expect(page2Res.status).toBe(200);
    expect(page2Res.body.total).toBe(17);
    expect(page2Res.body.totalCount).toBe(17);
    expect(page2Res.body.count).toBe(5);
    expect(page2Res.body.limit).toBe(5);
    expect(page2Res.body.offset).toBe(5);
    expect(page2Res.body.agents).toHaveLength(5);

    // Page 3: limit=5, offset=10
    const page3Res = await request(app).get('/api/v1/agents?limit=5&offset=10');
    expect(page3Res.status).toBe(200);
    expect(page3Res.body.total).toBe(17);
    expect(page3Res.body.count).toBe(5);
    expect(page3Res.body.agents).toHaveLength(5);

    // Page 4: limit=5, offset=15
    const page4Res = await request(app).get('/api/v1/agents?limit=5&offset=15');
    expect(page4Res.status).toBe(200);
    expect(page4Res.body.total).toBe(17);
    expect(page4Res.body.count).toBe(2);
    expect(page4Res.body.agents).toHaveLength(2);

    // Assert that page 1 and page 2 contain distinct agents with zero overlap
    const page1Handles = page1Res.body.agents.map((a: any) => a.handle);
    const page2Handles = page2Res.body.agents.map((a: any) => a.handle);
    for (const h of page2Handles) {
      expect(page1Handles).not.toContain(h);
    }
  });
});
