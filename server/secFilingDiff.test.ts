// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { secAnalystRouter, executeSecAnalystJob } from './secAnalystAgent.js';
import { buildFilingDiff, clearDiffCache } from './secFilingDiff.js';
import {
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler
} from './testSetup/facilitatorMock.js';

const app = express();
app.use(express.json());
app.use('/api/v1/sec', secAnalystRouter);

describe('SEC Filing Diff Mode Suite — Financial & Item 1A Risk Factor Comparison', () => {
  const originalFetch = global.fetch;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-data-test-'));
    process.env.SB_DATA_DIR = tempDir;
    clearDiffCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  const mockSubmissionsTwoYears = {
    cik: '0000032019',
    name: 'Apple Inc.',
    filings: {
      recent: {
        form: ['10-K', '10-K'],
        accessionNumber: ['0000320193-25-000079', '0000320193-24-000106'],
        filingDate: ['2025-10-31', '2024-10-31'],
        reportDate: ['2025-09-27', '2024-09-28'],
        primaryDocument: ['aapl-20250927.htm', 'aapl-20240928.htm']
      }
    }
  };

  const mockCompanyFacts = {
    cik: 32019,
    entityName: 'Apple Inc.',
    facts: {
      'us-gaap': {
        Revenues: {
          units: {
            USD: [
              {
                val: 416160000000,
                accn: '0000320193-25-000079',
                start: '2024-09-29',
                end: '2025-09-27',
                form: '10-K',
                fy: 2025,
                fp: 'FY'
              },
              {
                val: 391035000000,
                accn: '0000320193-24-000106',
                start: '2023-10-01',
                end: '2024-09-28',
                form: '10-K',
                fy: 2024,
                fp: 'FY'
              }
            ]
          }
        },
        NetIncomeLoss: {
          units: {
            USD: [
              {
                val: 112010000000,
                accn: '0000320193-25-000079',
                start: '2024-09-29',
                end: '2025-09-27',
                form: '10-K',
                fy: 2025,
                fp: 'FY'
              },
              {
                val: 93736000000,
                accn: '0000320193-24-000106',
                start: '2023-10-01',
                end: '2024-09-28',
                form: '10-K',
                fy: 2024,
                fp: 'FY'
              }
            ]
          }
        },
        OperatingIncomeLoss: {
          units: {
            USD: [
              {
                val: 130000000000,
                accn: '0000320193-25-000079',
                start: '2024-09-29',
                end: '2025-09-27',
                form: '10-K'
              },
              {
                val: 123216000000,
                accn: '0000320193-24-000106',
                start: '2023-10-01',
                end: '2024-09-28',
                form: '10-K'
              }
            ]
          }
        },
        GrossProfit: {
          units: {
            USD: [
              {
                val: 195000000000,
                accn: '0000320193-25-000079',
                start: '2024-09-29',
                end: '2025-09-27',
                form: '10-K'
              },
              {
                val: 180683000000,
                accn: '0000320193-24-000106',
                start: '2023-10-01',
                end: '2024-09-28',
                form: '10-K'
              }
            ]
          }
        },
        LongTermDebt: {
          units: {
            USD: [
              {
                val: 100000000000,
                accn: '0000320193-25-000079',
                end: '2025-09-27',
                form: '10-K'
              },
              {
                val: 106629000000,
                accn: '0000320193-24-000106',
                end: '2024-09-28',
                form: '10-K'
              }
            ]
          }
        },
        CashAndCashEquivalentsAtCarryingValue: {
          units: {
            USD: [
              {
                val: 35000000000,
                accn: '0000320193-25-000079',
                end: '2025-09-27',
                form: '10-K'
              },
              {
                val: 29942000000,
                accn: '0000320193-24-000106',
                end: '2024-09-28',
                form: '10-K'
              }
            ]
          }
        },
        PaymentsToAcquirePropertyPlantAndEquipment: {
          units: {
            USD: [
              {
                val: 10000000000,
                accn: '0000320193-25-000079',
                start: '2024-09-29',
                end: '2025-09-27',
                form: '10-K'
              },
              {
                val: 9450000000,
                accn: '0000320193-24-000106',
                start: '2023-10-01',
                end: '2024-09-28',
                form: '10-K'
              }
            ]
          }
        }
      },
      dei: {
        EntityCommonStockSharesOutstanding: {
          units: {
            shares: [
              {
                val: 15200000000,
                accn: '0000320193-25-000079',
                form: '10-K'
              },
              {
                val: 15400000000,
                accn: '0000320193-24-000106',
                form: '10-K'
              }
            ]
          }
        }
      }
    }
  };

  const mockHtmlCurrent = `
    <html>
      <body>
        <div>Table of Contents</div>
        <div>Item 1A. Risk Factors (see page 15)</div>
        <div>Item 1B. Unresolved Staff Comments</div>
        <hr/>
        <h2>Item 1A. Risk Factors</h2>
        <p>Artificial Intelligence competition risk. The markets for AI technology are rapidly evolving with increasing competitive pressures from major hyperscalers and emerging startups worldwide across consumer devices and cloud platforms.</p>
        <p>Global supply chain disruptions. Geopolitical trade restrictions and semiconductor component allocation constraints may adversely affect manufacturing yields and product availability across multiple jurisdictions globally.</p>
        <p>Macroeconomic uncertainty and currency fluctuations. Global inflationary environments and foreign exchange movements between the U.S. dollar and other international currencies may pressure operating margins.</p>
        <h2>Item 1B. Unresolved Staff Comments</h2>
        <p>None.</p>
      </body>
    </html>
  `;

  const mockHtmlPrior = `
    <html>
      <body>
        <div>Table of Contents</div>
        <div>Item 1A. Risk Factors (see page 14)</div>
        <div>Item 1B. Unresolved Staff Comments</div>
        <hr/>
        <h2>Item 1A. Risk Factors</h2>
        <p>Global supply chain disruptions. Geopolitical trade restrictions and semiconductor component allocation constraints may adversely affect manufacturing yields and product availability across multiple jurisdictions globally.</p>
        <p>Legacy telecommunications regulatory risks. Compliance with diverse carrier frequency bands and regional cellular approvals poses ongoing operational requirements across overseas markets.</p>
        <p>Macroeconomic uncertainty and currency fluctuations. Global inflationary environments and foreign exchange movements between the U.S. dollar and other international currencies may pressure operating margins.</p>
        <h2>Item 1B. Unresolved Staff Comments</h2>
        <p>None.</p>
      </body>
    </html>
  `;

  it('1. Diff returns both accessions, financialChanges (revenue, net income) with correct changePct, and risk added/removed from fixture text', async () => {
    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissionsTwoYears) } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompanyFacts) } as any);
      }
      if (urlStr.includes('aapl-20250927.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockHtmlCurrent) } as any);
      }
      if (urlStr.includes('aapl-20240928.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockHtmlPrior) } as any);
      }
      return Promise.resolve({ ok: false, status: 404 } as any);
    };

    const diff = await buildFilingDiff('AAPL', '10-K');

    expect(diff.mode).toBe('diff');
    expect(diff.ticker).toBe('AAPL');
    expect(diff.filingType).toBe('10-K');
    expect(diff.comparisonBasis).toBe('annual');
    expect(diff.currentFiling.accession).toBe('0000320193-25-000079');
    expect(diff.priorFiling).toBeDefined();
    expect(diff.priorFiling!.accession).toBe('0000320193-24-000106');

    // Check financial changes
    const rev = diff.financialChanges.find(f => f.metric === 'Revenue');
    expect(rev).toBeDefined();
    expect(rev!.current).toBe(416160000000);
    expect(rev!.prior).toBe(391035000000);
    // (416160000000 - 391035000000) / 391035000000 * 100 = 6.425... -> 6.4%
    expect(rev!.changePct).toBe(6.4);
    expect(rev!.unit).toBe('USD');

    const netInc = diff.financialChanges.find(f => f.metric === 'Net income');
    expect(netInc).toBeDefined();
    expect(netInc!.current).toBe(112010000000);
    expect(netInc!.prior).toBe(93736000000);
    // (112010000000 - 93736000000) / 93736000000 * 100 = 19.495... -> 19.5%
    expect(netInc!.changePct).toBe(19.5);

    // Check risk factors
    expect(diff.riskFactorChanges).toBeDefined();
    const { added, removed } = diff.riskFactorChanges!;

    const addedAi = added.find(r => r.title.includes('Artificial Intelligence competition risk'));
    expect(addedAi).toBeDefined();
    expect(addedAi!.accession).toBe('0000320193-25-000079');
    expect(addedAi!.snippet).toContain('Artificial Intelligence competition risk');

    const removedTelecom = removed.find(r => r.title.includes('Legacy telecommunications regulatory risks'));
    expect(removedTelecom).toBeDefined();
    expect(removedTelecom!.accession).toBe('0000320193-24-000106');

    // Check summary templating
    expect(diff.summary.length).toBeGreaterThan(0);
    expect(diff.summary.length).toBeLessThanOrEqual(5);
    const summaryText = diff.summary.join(' ');
    expect(summaryText).toContain('Net income');
    expect(summaryText).toContain('Revenue');
    expect(summaryText).toContain('Risk factors');
  });

  it('2. Submissions fixture with only one 10-K returns 200 with priorFiling null, a dataNote, and no 500', async () => {
    const singleFilingSubmissions = {
      cik: '0000032019',
      name: 'Apple Inc.',
      filings: {
        recent: {
          form: ['10-K'],
          accessionNumber: ['0000320193-25-000079'],
          filingDate: ['2025-10-31'],
          reportDate: ['2025-09-27'],
          primaryDocument: ['aapl-20250927.htm']
        }
      }
    };

    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(singleFilingSubmissions) } as any);
      }
      return Promise.resolve({ ok: false, status: 404 } as any);
    };

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xDiffPayer1' }));
    setFacilitatorSettleHandler(async () => ({ success: true, payer: '0xDiffPayer1', txHash: '0x_diff_settle_01' }));

    const paymentHeader = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        authorization: { from: '0xDiffPayer1', to: '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708', value: '250000' }
      })
    ).toString('base64');

    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('PAYMENT-SIGNATURE', paymentHeader)
      .send({
        ticker: 'AAPL',
        filingType: '10-K',
        mode: 'diff'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const out = res.body.output;
    expect(out.mode).toBe('diff');
    expect(out.currentFiling.accession).toBe('0000320193-25-000079');
    expect(out.priorFiling).toBeNull();
    expect(out.financialChanges).toEqual([]);
    expect(out.dataNote).toContain('No prior Form 10-K');
  });

  it('3. Item 1A missing returns no riskFactorChanges and explains reason in dataNote', async () => {
    const mockHtmlWithout1A = '<html><body><div>No risk section here. Just general business description.</div></body></html>';

    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissionsTwoYears) } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompanyFacts) } as any);
      }
      if (urlStr.includes('.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockHtmlWithout1A) } as any);
      }
      return Promise.resolve({ ok: false } as any);
    };

    const diff = await buildFilingDiff('AAPL', '10-K');
    expect(diff.riskFactorChanges).toBeUndefined();
    expect(diff.dataNote).toContain('Risk factor changes omitted');
    expect(diff.financialChanges.length).toBeGreaterThan(0);
  });

  it('4. 8-K + diff, or mode "foo", returns 400 before any 402; unpaid diff with valid input returns 402 with amount 250000', async () => {
    // A. 8-K with mode diff returns 400
    const res8K = await request(app)
      .post('/api/v1/sec/job')
      .send({
        ticker: 'AAPL',
        filingType: '8-K',
        mode: 'diff'
      });
    expect(res8K.status).toBe(400);
    expect(res8K.headers['payment-required']).toBeUndefined();
    expect(res8K.body.error).toContain('supports 10-K and 10-Q only');

    // B. Mode "foo" returns 400
    const resFoo = await request(app)
      .post('/api/v1/sec/job')
      .send({
        ticker: 'AAPL',
        filingType: '10-K',
        mode: 'foo'
      });
    expect(resFoo.status).toBe(400);
    expect(resFoo.headers['payment-required']).toBeUndefined();
    expect(resFoo.body.error).toContain('"mode" must be one of: standard, diff');

    // C. Valid input with mode diff but NO payment returns 402 with amount 250000
    const resUnpaid = await request(app)
      .post('/api/v1/sec/job')
      .send({
        ticker: 'AAPL',
        filingType: '10-K',
        mode: 'diff'
      });
    expect(resUnpaid.status).toBe(402);
    expect(resUnpaid.headers['payment-required']).toBeDefined();

    // Verify 402 requirement details
    const accepts = resUnpaid.body.accepts?.[0];
    expect(accepts).toBeDefined();
    expect(accepts.amount).toBe('250000');
    expect(accepts.payTo).toBe('0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708');
  });

  it('5. Without mode, the job output is deep-equal to current standard behavior (forceFixture path)', async () => {
    const standardJob = await executeSecAnalystJob({
      jobId: 'job_test_standard_mode_01',
      input: {
        ticker: 'AAPL',
        filingType: '10-K',
        forceFixture: true
      },
      requesterAgentId: 'agent_test_standard_01',
      price: 25,
      creditsAlreadyDebited: true
    });

    expect(standardJob.success).toBe(true);
    expect(standardJob.output).toBeDefined();
    expect((standardJob.output as any).mode).toBeUndefined();
    expect(standardJob.output.ticker).toBe('AAPL');
    expect(standardJob.output.filingType).toBe('10-K');
    expect(standardJob.output.revenueHighlights).toBeDefined();
    expect(standardJob.output.earningsHighlights).toBeDefined();
  });
});
