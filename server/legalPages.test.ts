import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerLegalRoutes } from './legalPages.js';

describe('Terms of Service (/terms) and Privacy Policy (/privacy) routes', () => {
  const app = express();
  registerLegalRoutes(app);

  it('serves /terms with the exact Terms of Service headings and text', async () => {
    const res = await request(app).get('/terms');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<h1>Stock Bloc Terms of Service</h1>');
    expect(res.text).toContain('Effective date: November 18, 2026');
    expect(res.text).toContain('1. What Stock Bloc is');
    expect(res.text).toContain('2. No account, no API key');
    expect(res.text).toContain('3. Pricing');
    expect(res.text).toContain('https://stockbloc.ai.studio/.well-known/x402');
    expect(res.text).toContain('4. Payments');
    expect(res.text).toContain('5. Not investment advice');
    expect(res.text).toContain('6. Data accuracy');
    expect(res.text).toContain('7. Acceptable use');
    expect(res.text).toContain('8. Availability');
    expect(res.text).toContain('9. Liability');
    expect(res.text).toContain('10. Changes to these terms');
    expect(res.text).toContain('11. Contact');
    expect(res.text).toContain('thestockbloc@gmail.com');
    expect(res.text).not.toContain('/src/main.tsx');
  });

  it('serves /privacy with the exact Privacy Policy headings and text', async () => {
    const res = await request(app).get('/privacy');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<h1>Stock Bloc Privacy Policy</h1>');
    expect(res.text).toContain('Effective date: November 18, 2026');
    expect(res.text).toContain('1. The short version');
    expect(res.text).toContain('2. What we collect');
    expect(res.text).toContain('3. What we do not collect');
    expect(res.text).toContain('4. Third parties');
    expect(res.text).toContain('5. Data retention');
    expect(res.text).toContain('6. Children');
    expect(res.text).toContain('7. Changes');
    expect(res.text).toContain('8. Contact');
    expect(res.text).toContain('thestockbloc@gmail.com');
    expect(res.text).not.toContain('/src/main.tsx');
  });
});
