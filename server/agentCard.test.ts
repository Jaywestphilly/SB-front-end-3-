import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';

describe('/.well-known/agent-card.json A2A discovery endpoint', () => {
  it('serves agent-card.json as raw JSON with Content-Type application/json', async () => {
    const app = express();
    const filePath = path.join(process.cwd(), 'public', '.well-known', 'agent-card.json');

    app.get('/.well-known/agent-card.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      return res.status(404).json({ error: 'not found' });
    });

    const res = await request(app).get('/.well-known/agent-card.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('name', 'Stock Bloc');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('protocolVersion', '0.3.0');
    expect(res.body.payment).toEqual({
      protocol: 'x402',
      version: 'v2',
      network: 'eip155:8453',
      asset: 'USDC',
      payTo: '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708',
      priceRangeUsd: '0.01-0.35',
    });
    expect(res.body.skills).toHaveLength(8);
  });
});
