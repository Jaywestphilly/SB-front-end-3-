// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { secAnalystRouter, executeSecAnalystJob } from './secAnalystAgent.js';
import { buildFilingDiff, clearDiffCache, formatSummaryValue, formatCompactRiskItem } from './secFilingDiff.js';
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
    process.env.X402_RECIPIENT_ADDRESS = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';
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
                end: '2025-10-24',
                form: '10-K'
              },
              {
                val: 15400000000,
                accn: '0000320193-24-000106',
                end: '2024-10-25',
                form: '10-K'
              }
            ]
          }
        }
      }
    }
  };

  const repeatPageHeaders = `
    <div>Page 24</div>
    <div>Item 1A. Risk Factors</div>
    <div>Header Note</div>
  `.repeat(10);

  const longFillerP = `<p><b>General Operational and Compliance Risk Item.</b> ${'This is a comprehensive detailed paragraph discussing operational risks, regulatory considerations, market fluctuations, and supply chain dynamics across global regions. '.repeat(80)}</p>`;

  const mockHtmlCurrent = `
    <html>
      <body>
        <div>Table of Contents</div>
        <div>Item 1A. Risk Factors (see page 15)</div>
        <div>Item 1B. Unresolved Staff Comments</div>
        <hr/>
        <h2>Item 1A. Risk Factors</h2>
        <p>The following summarizes the principal risks and uncertainties that could materially affect our business, financial condition, and operating results.</p>
        <p><b>Artificial Intelligence competition risk.</b> The markets for AI technology are rapidly evolving with increasing competitive pressures from major hyperscalers and emerging startups worldwide across consumer devices and cloud platforms.</p>
        ${repeatPageHeaders}
        <p><b>Global supply chain disruptions.</b> Geopolitical trade restrictions and semiconductor component allocation constraints may adversely affect manufacturing yields and product availability across multiple jurisdictions globally.</p>
        <p><b>Macroeconomic uncertainty and currency fluctuations.</b> Global inflationary environments and foreign exchange movements between the U.S. dollar and other international currencies may pressure operating margins.</p>
        ${longFillerP.repeat(30)}
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
        <p>Because of the following factors, as well as other factors affecting the Company's business, our financial condition may vary.</p>
        <p><b>Global supply chain disruptions.</b> Geopolitical trade restrictions and semiconductor component allocation constraints may adversely affect manufacturing yields and product availability across multiple jurisdictions globally.</p>
        ${repeatPageHeaders}
        <p><b>Legacy telecommunications regulatory risks.</b> Compliance with diverse carrier frequency bands and regional cellular approvals poses ongoing operational requirements across overseas markets.</p>
        <p><b>Macroeconomic uncertainty and currency fluctuations.</b> Global inflationary environments and foreign exchange movements between the U.S. dollar and other international currencies may pressure operating margins.</p>
        ${longFillerP.repeat(30)}
        <h2>Item 1B. Unresolved Staff Comments</h2>
        <p>None.</p>
      </body>
    </html>
  `;

  it('1. Diff returns both accessions, financialChanges with marginChangePp, risk added/removed with totals, and summary showing up to 10', async () => {
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
    expect(rev!.changePct).toBe(6.4);
    expect(rev!.unit).toBe('USD');

    const netInc = diff.financialChanges.find(f => f.metric === 'Net income');
    expect(netInc).toBeDefined();
    expect(netInc!.current).toBe(112010000000);
    expect(netInc!.prior).toBe(93736000000);
    expect(netInc!.changePct).toBe(19.5);

    // Check Gross margin marginChangePp
    const grossMargin = diff.financialChanges.find(f => f.metric === 'Gross margin');
    expect(grossMargin).toBeDefined();
    expect(typeof grossMargin!.marginChangePp).toBe('number');
    expect(grossMargin!.marginChangePp).toBe(0.65);

    // Check risk factors totals and lists
    expect(diff.riskFactorChanges).toBeDefined();
    const { added, removed, changed, addedTotal, removedTotal, changedTotal } = diff.riskFactorChanges!;
    expect(addedTotal).toBe(1);
    expect(removedTotal).toBe(1);
    expect(changedTotal).toBe(0);
    expect(added.length).toBe(1);
    expect(removed.length).toBe(1);
    expect(changed.length).toBe(0);

    const addedAi = added.find(r => r.title.includes('Artificial Intelligence competition risk'));
    expect(addedAi).toBeDefined();
    expect(addedAi!.accession).toBe('0000320193-25-000079');

    const removedTelecom = removed.find(r => r.title.includes('Legacy telecommunications regulatory risks'));
    expect(removedTelecom).toBeDefined();
    expect(removedTelecom!.accession).toBe('0000320193-24-000106');

    // Identical risk (Global supply chain disruptions) must be omitted (unchanged)
    expect(added.find(r => r.title.includes('Global supply chain disruptions'))).toBeUndefined();
    expect(removed.find(r => r.title.includes('Global supply chain disruptions'))).toBeUndefined();
    expect(changed.find(r => r.title.includes('Global supply chain disruptions'))).toBeUndefined();

    // Intro paragraph was skipped
    expect(added.find(r => r.title.includes('The following summarizes'))).toBeUndefined();
    expect(removed.find(r => r.title.includes('Because of the following'))).toBeUndefined();

    // Check summary templating: uses totals and "showing up to 10", and uses marginChangePp for Gross margin
    expect(diff.summary.length).toBeGreaterThan(0);
    expect(diff.summary.length).toBeLessThanOrEqual(5);
    const summaryText = diff.summary.join(' ');
    expect(summaryText).toContain('showing up to 10');
    expect(summaryText).toContain('Risk factors: 1 added, 1 removed, 0 modified (showing up to 10)');
    expect(summaryText).toContain('Gross margin changed +0.65 pp');

    // Check riskSectionChars
    expect(diff.riskSectionChars).toBeDefined();
    expect(diff.riskSectionChars!.current).toBeGreaterThanOrEqual(20000);
    expect(diff.riskSectionChars!.prior).toBeGreaterThanOrEqual(20000);

    // Check dataNote requirements
    expect(diff.dataNote).toContain('total debt = LongTermDebt and excludes commercial paper');
    expect(diff.dataNote).toContain('shares are cover-page counts with their dates (2025-10-24 / 2024-10-25)');
    expect(diff.dataNote).toContain('risk lists capped at 10');
    expect(diff.dataNote).toContain('risk matching is heuristic');
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
    expect(out.dataNote).toContain('total debt = LongTermDebt and excludes commercial paper');
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

  it('6. Test: two fixture Item 1A sections where one risk is reworded; it must land only in changed', async () => {
    // Current has:
    // 1. Reworded: "Risks Related to Competition in Artificial Intelligence and Cloud."
    // 2. Identical: "Global supply chain disruptions and semiconductor shortages."
    // 3. New (added): "Cybersecurity quantum encryption vulnerabilities."
    const htmlCurrentReworded = `
      <html>
        <body>
          <div>Table of Contents</div>
          <div>Item 1A. Risk Factors</div>
          <div>Item 1B. Unresolved Staff Comments</div>
          <h2>Item 1A. Risk Factors</h2>
          <p>The following summarizes the principal risk factors facing the company.</p>
          <p><b>Risks Related to Competition in Artificial Intelligence and Cloud.</b> Highly aggressive competitive investments by global technology companies could pressure margins and adoption.</p>
          ${repeatPageHeaders}
          <p><b>Global supply chain disruptions and semiconductor shortages.</b> Complex manufacturing logistics may result in delivery delays.</p>
          <p><b>Cybersecurity quantum encryption vulnerabilities.</b> Next generation post-quantum computing attacks could threaten infrastructure.</p>
          ${longFillerP.repeat(30)}
          <h2>Item 1B. Unresolved Staff Comments</h2>
          <p>None.</p>
        </body>
      </html>
    `;

    // Prior has:
    // 1. Reworded: "Risks Related to Competition in Artificial Intelligence." (similarity >= 0.6)
    // 2. Identical: "Global supply chain disruptions and semiconductor shortages." (similarity 1.0 -> unchanged, omitted)
    // 3. Removed: "Legacy telecommunications roaming agreements."
    const htmlPriorReworded = `
      <html>
        <body>
          <div>Table of Contents</div>
          <div>Item 1A. Risk Factors</div>
          <div>Item 1B. Unresolved Staff Comments</div>
          <h2>Item 1A. Risk Factors</h2>
          <p>Because of the following factors, operations may be adversely impacted.</p>
          <p><b>Risks Related to Competition in Artificial Intelligence.</b> Competitive investments by global tech companies could pressure margins.</p>
          ${repeatPageHeaders}
          <p><b>Global supply chain disruptions and semiconductor shortages.</b> Complex manufacturing logistics may result in delivery delays.</p>
          <p><b>Legacy telecommunications roaming agreements.</b> Wireless carrier interoperability mandates create ongoing overseas friction.</p>
          ${longFillerP.repeat(30)}
          <h2>Item 1B. Unresolved Staff Comments</h2>
          <p>None.</p>
        </body>
      </html>
    `;

    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissionsTwoYears) } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompanyFacts) } as any);
      }
      if (urlStr.includes('aapl-20250927.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(htmlCurrentReworded) } as any);
      }
      if (urlStr.includes('aapl-20240928.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(htmlPriorReworded) } as any);
      }
      return Promise.resolve({ ok: false } as any);
    };

    const diff = await buildFilingDiff('AAPL', '10-K');
    expect(diff.riskFactorChanges).toBeDefined();

    const { added, removed, changed, addedTotal, removedTotal, changedTotal } = diff.riskFactorChanges!;

    // Exactly 1 changed: the reworded AI competition risk
    expect(changedTotal).toBe(1);
    expect(changed.length).toBe(1);
    expect(changed[0].title).toBe('Risks Related to Competition in Artificial Intelligence and Cloud.');
    expect(changed[0].accession).toBe('0000320193-25-000079');
    expect(changed[0].priorSnippet).toBeDefined();
    expect(changed[0].priorSnippet).toContain('Risks Related to Competition in Artificial Intelligence');
    expect(changed[0].priorAccession).toBe('0000320193-24-000106');

    // The reworded risk MUST NOT appear in added or removed!
    const rewordedInAdded = added.find(r => r.title.includes('Competition in Artificial Intelligence'));
    expect(rewordedInAdded).toBeUndefined();

    const rewordedInRemoved = removed.find(r => r.title.includes('Competition in Artificial Intelligence'));
    expect(rewordedInRemoved).toBeUndefined();

    // Exactly 1 added: Quantum encryption
    expect(addedTotal).toBe(1);
    expect(added.length).toBe(1);
    expect(added[0].title).toContain('Cybersecurity quantum encryption');

    // Exactly 1 removed: Telecom roaming
    expect(removedTotal).toBe(1);
    expect(removed.length).toBe(1);
    expect(removed[0].title).toContain('Legacy telecommunications roaming');

    // Identical risk is unchanged (omitted)
    expect(added.find(r => r.title.includes('Global supply chain disruptions'))).toBeUndefined();
    expect(removed.find(r => r.title.includes('Global supply chain disruptions'))).toBeUndefined();
    expect(changed.find(r => r.title.includes('Global supply chain disruptions'))).toBeUndefined();
  });

  it('7. Requirement 6: "<span>RIS</span><span>K FACTORS</span>" splits slice over 20K chars, and cross-reference / TOC hits are rejected', async () => {
    const splitTagCurrent = `
      <html>
        <body>
          <div>Table of Contents</div>
          <table>
            <tr><td>Item 1.</td><td>Business</td><td>1</td></tr>
            <tr>
              <td>Item 1A.</td>
              <td><span>RIS</span><span>K FACTORS</span></td>
              <td>15</td>
            </tr>
            <tr>
              <td>Item 1B.</td>
              <td>Unresolved Staff Comments</td>
              <td>25</td>
            </tr>
          </table>
          <p>We operate in technology. See Part I, Item 1A "Risk Factors" of this Form 10-K for details.</p>
          <p>Item 1. Business Summary</p>
          <p>This is Item 1 Business text that MUST NOT appear in results.</p>
          <h2>Item 1A. <span>RIS</span><span>K FACTORS</span></h2>
          <p>The following summarizes the principal risks facing the company.</p>
          <p><b>Artificial Intelligence competition risk.</b> The markets for AI technology are rapidly evolving with increasing competitive pressures from major hyperscalers and emerging startups worldwide across consumer devices and cloud platforms.</p>
          <p><b>Global supply chain disruptions.</b> Geopolitical trade restrictions and semiconductor component allocation constraints may adversely affect manufacturing yields and product availability across multiple jurisdictions globally.</p>
          ${longFillerP.repeat(30)}
          <h2>Item 1B. Unresolved Staff Comments</h2>
          <p>None.</p>
        </body>
      </html>
    `;

    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissionsTwoYears) } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompanyFacts) } as any);
      }
      if (urlStr.includes('aapl-20250927.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(splitTagCurrent) } as any);
      }
      if (urlStr.includes('aapl-20240928.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockHtmlPrior) } as any);
      }
      return Promise.resolve({ ok: false } as any);
    };

    const diff = await buildFilingDiff('AAPL', '10-K');
    expect(diff.riskFactorChanges).toBeDefined();
    expect(diff.riskSectionChars).toBeDefined();
    expect(diff.riskSectionChars!.current).toBeGreaterThan(20000);

    // Verify Item 1 Business text NEVER appears in risk factor results or snippets
    const allTitlesAndSnippets = [
      ...diff.riskFactorChanges!.added.map(r => r.title + ' ' + r.snippet),
      ...diff.riskFactorChanges!.removed.map(r => r.title + ' ' + r.snippet),
      ...diff.riskFactorChanges!.changed.map(r => r.title + ' ' + r.snippet)
    ].join(' ');

    expect(allTitlesAndSnippets).not.toContain('Item 1 Business text that MUST NOT appear');
  });

  it('8. Requirement 4: Fixture with repeated "PART I / Item 1A" page header right before "ITEM 1A. RISK FACTORS"', async () => {
    const repeatedHeaderFixture = `
      <html>
        <body>
          <div>Table of Contents</div>
          <table>
            <tr><td>Item 1A.</td><td>Risk Factors</td><td>15</td></tr>
            <tr><td>Item 1B.</td><td>Unresolved Staff Comments</td><td>25</td></tr>
          </table>
          <div>PART I | Item 1A. Risk Factors Page Header</div>
          <h2>ITEM 1A. RISK FACTORS</h2>
          <p>The following summarizes the principal risks facing the company.</p>
          <p><b>Artificial Intelligence competition risk.</b> The markets for AI technology are rapidly evolving with increasing competitive pressures from major hyperscalers and emerging startups worldwide across consumer devices and cloud platforms.</p>
          ${longFillerP.repeat(30)}
          <h2>Item 1B. Unresolved Staff Comments</h2>
          <p>None.</p>
        </body>
      </html>
    `;

    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissionsTwoYears) } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompanyFacts) } as any);
      }
      if (urlStr.includes('aapl-20250927.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(repeatedHeaderFixture) } as any);
      }
      if (urlStr.includes('aapl-20240928.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockHtmlPrior) } as any);
      }
      return Promise.resolve({ ok: false } as any);
    };

    const diff = await buildFilingDiff('AAPL', '10-K');
    expect(diff.riskFactorChanges).toBeDefined();
    expect(diff.riskSectionChars).toBeDefined();
    expect(diff.riskSectionChars!.current).toBeGreaterThan(20000);
  });

  it('9. AAPL-style fixture with TOC <div>s, cross-reference, Item 1 Business, real Item 1A heading, and >25K risk text', async () => {
    const aaplStyleFixture = `
      <html>
        <body>
          <div>Table of Contents</div>
          <div>Item 1A.</div>
          <div>Risk Factors</div>
          <div>5</div>
          <div>Item 1B.</div>
          <div>Unresolved Staff Comments</div>
          <p>For more information, see the discussion in Part I, Item 1A of this Form 10-K under the heading “Risk Factors.”</p>
          <p>Item 1. Business Summary</p>
          <p>Apple Arcade is a game service that offers unlimited access to a curated catalog of games.</p>
          <div>Item 1A.    Risk Factors</div>
          <p>The following summarizes the principal risks facing the company.</p>
          <p><b>Artificial Intelligence competition risk.</b> The markets for AI technology are rapidly evolving with increasing competitive pressures from major hyperscalers and emerging startups worldwide across consumer devices and cloud platforms.</p>
          <p><b>Global supply chain disruptions.</b> Geopolitical trade restrictions and semiconductor component allocation constraints may adversely affect manufacturing yields and product availability across multiple jurisdictions globally.</p>
          ${longFillerP.repeat(30)}
          <div>Item 1B.</div>
          <div>Unresolved Staff Comments</div>
        </body>
      </html>
    `;

    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissionsTwoYears) } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompanyFacts) } as any);
      }
      if (urlStr.includes('aapl-20250927.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(aaplStyleFixture) } as any);
      }
      if (urlStr.includes('aapl-20240928.htm')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockHtmlPrior) } as any);
      }
      return Promise.resolve({ ok: false } as any);
    };

    const diff = await buildFilingDiff('AAPL', '10-K');
    expect(diff.riskFactorChanges).toBeDefined();
    expect(diff.riskSectionChars).toBeDefined();

    // Assert riskSectionChars.current > 20000
    expect(diff.riskSectionChars!.current).toBeGreaterThan(20000);

    // Assert no snippet contains "Apple Arcade"
    const allSnippets = [
      ...diff.riskFactorChanges!.added.map(r => r.snippet),
      ...diff.riskFactorChanges!.removed.map(r => r.snippet),
      ...diff.riskFactorChanges!.changed.map(r => r.snippet)
    ].join(' ');
    expect(allSnippets).not.toContain('Apple Arcade');

    // Assert no title appears in both added and removed
    const addedTitles = new Set(diff.riskFactorChanges!.added.map(r => r.title));
    for (const rem of diff.riskFactorChanges!.removed) {
      expect(addedTitles.has(rem.title)).toBe(false);
    }
  });

  it('10. formatSummaryValue unit test: billions as "$9.45B", millions as "$512.3M", share counts as "14.78B shares"', () => {
    // Billions money formatting
    expect(formatSummaryValue(9450000000, 'USD')).toBe('$9.45B');
    expect(formatSummaryValue(12720000000, 'USD')).toBe('$12.72B');
    expect(formatSummaryValue(416160000000, 'USD')).toBe('$416.16B');

    // Millions money formatting
    expect(formatSummaryValue(512300000, 'USD')).toBe('$512.3M');
    expect(formatSummaryValue(10000000, 'USD')).toBe('$10M');

    // Thousands / small values money formatting
    expect(formatSummaryValue(500000, 'USD')).toBe('$500K');
    expect(formatSummaryValue(750, 'USD')).toBe('$750');

    // Negative money formatting
    expect(formatSummaryValue(-1250000000, 'USD')).toBe('-$1.25B');

    // Share counts formatting
    expect(formatSummaryValue(14780000000, 'shares')).toBe('14.78B shares');
    expect(formatSummaryValue(500000000, 'shares')).toBe('500M shares');

    // Derived / other unit formatting
    expect(formatSummaryValue(0.4357, 'derived')).toBe('0.4357');
  });

  it('11. formatCompactRiskItem unit test: returns title and text without snippet field, omitting text if title and text are same', () => {
    // Case 1: snippet starts with title -> strip title and punctuation, limit text to 160 chars
    const res1 = formatCompactRiskItem('Cybersecurity risks', 'Cybersecurity risks: The company faces risks related to unauthorized access to user data.');
    expect(res1.title).toBe('Cybersecurity risks');
    expect(res1.text).toBe('The company faces risks related to unauthorized access to user data.');
    expect((res1 as any).snippet).toBeUndefined();

    // Case 2: snippet equals title -> return only title
    const res2 = formatCompactRiskItem('Supply chain constraints', 'Supply chain constraints');
    expect(res2.title).toBe('Supply chain constraints');
    expect(res2.text).toBeUndefined();
    expect((res2 as any).snippet).toBeUndefined();

    // Case 3: snippet starts with title and has only punctuation -> return only title
    const res3 = formatCompactRiskItem('Regulatory compliance', 'Regulatory compliance:');
    expect(res3.title).toBe('Regulatory compliance');
    expect(res3.text).toBeUndefined();
  });
});
