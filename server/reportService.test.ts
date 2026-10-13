// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from './firebaseAdmin.js';
import { registerReportRoutes } from './reportService.js';
import * as secFilingDiffModule from './secFilingDiff.js';
import { setRecordedStripeSessionAsync } from './stripePaymentProvider.js';

describe('Human Card-Paid SEC Report Flow Suite (/report)', () => {
  let app: express.Express;
  const originalFetch = global.fetch;
  const originalStripeKey = process.env.STRIPE_SECRET_KEY;
  const originalPaymentLink = process.env.STRIPE_PAYMENT_LINK_URL;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerReportRoutes(app);

    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key_12345';
    process.env.STRIPE_PAYMENT_LINK_URL = 'https://buy.stripe.com/test_123';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalStripeKey !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalStripeKey;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    if (originalPaymentLink !== undefined) {
      process.env.STRIPE_PAYMENT_LINK_URL = originalPaymentLink;
    } else {
      delete process.env.STRIPE_PAYMENT_LINK_URL;
    }
    vi.restoreAllMocks();
  });

  // ==========================================
  // REQUIREMENT 1: GET /report
  // ==========================================
  it('1. GET /report returns 200 HTML with all required elements', async () => {
    const res = await request(app).get('/report');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    // Title
    expect(res.text).toContain("What changed in this company's latest 10-K or 10-Q");

    // Ticker input
    expect(res.text).toContain('id="ticker"');

    // 10-K / 10-Q choice
    expect(res.text).toContain('10-K');
    expect(res.text).toContain('10-Q');

    // $9 price note
    expect(res.text).toContain('$9');

    // "not investment advice" line
    expect(res.text.toLowerCase()).toContain('not investment advice');

    // Link to free sample
    expect(res.text).toContain('/api/v1/sec/job/sample');

    // Submit button
    expect(res.text).toContain('id="submitBtn"');
  });

  it('1b. /report/checkout validates ticker (1-6 letters) and redirects to STRIPE_PAYMENT_LINK_URL with client_reference_id=<TICKER>-<FORM>', async () => {
    // Valid ticker and 10-K
    const resAapl = await request(app)
      .get('/report/checkout?ticker=AAPL&form=10-K')
      .expect(302);
    expect(resAapl.headers.location).toBe('https://buy.stripe.com/test_123?client_reference_id=AAPL-10-K');

    // Valid ticker and 10-Q
    const resNvda = await request(app)
      .get('/report/checkout?ticker=nvda&form=10-Q')
      .expect(302);
    expect(resNvda.headers.location).toBe('https://buy.stripe.com/test_123?client_reference_id=NVDA-10-Q');

    // Rejects invalid ticker (numbers)
    const resNum = await request(app)
      .get('/report/checkout?ticker=123&form=10-K')
      .expect(400);
    expect(resNum.text).toContain('Invalid Ticker');

    // Rejects invalid ticker (>6 letters)
    const resLong = await request(app)
      .get('/report/checkout?ticker=TOOLONGTICKER&form=10-K')
      .expect(400);
    expect(resLong.text).toContain('Invalid Ticker');

    // Rejects empty ticker
    const resEmpty = await request(app)
      .get('/report/checkout?ticker=&form=10-K')
      .expect(400);
    expect(resEmpty.text).toContain('Invalid Ticker');
  });

  // ==========================================
  // REQUIREMENT 2: GET /report/success?session_id=...
  // ==========================================
  it('2. GET /report/success rejects unpaid session with 402', async () => {
    const sessionId = `cs_test_unpaid_${Date.now()}`;
    await setRecordedStripeSessionAsync(sessionId, {
      id: sessionId,
      payment_status: 'unpaid',
      client_reference_id: 'AAPL-10-K'
    });

    const res = await request(app).get(`/report/success?session_id=${sessionId}`);
    expect(res.status).toBe(402);
    expect(res.text).toContain('Payment Incomplete');
  });

  it('2b. GET /report/success fulfills paid session, generates diff, saves to Firestore, and renders HTML report', async () => {
    const sessionId = `cs_test_paid_success_${Date.now()}`;
    await setRecordedStripeSessionAsync(sessionId, {
      id: sessionId,
      payment_status: 'paid',
      client_reference_id: 'AAPL-10-K'
    });

    const mockDiffResult: secFilingDiffModule.FilingDiffResult = {
      mode: 'diff',
      ticker: 'AAPL',
      filingType: '10-K',
      comparisonBasis: 'annual',
      currentFiling: {
        accession: '0000320193-25-000079',
        periodEnd: '2025-09-27',
        form: '10-K',
        filedDate: '2025-10-31',
        url: 'https://www.sec.gov/ix?doc=/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm'
      },
      priorFiling: {
        accession: '0000320193-24-000106',
        periodEnd: '2024-09-28',
        form: '10-K',
        filedDate: '2024-10-31',
        url: 'https://www.sec.gov/ix?doc=/Archives/edgar/data/320193/000032019324000106/aapl-20240928.htm'
      },
      financialChanges: [
        {
          metric: 'Revenue',
          prior: 383285000000,
          current: 391035000000,
          changePct: 2.0,
          unit: 'USD',
          xbrlTag: 'RevenueFromContractWithCustomerExcludingAssessedTax',
          priorAccession: '0000320193-24-000106',
          currentAccession: '0000320193-25-000079'
        }
      ],
      riskFactorChanges: {
        added: [
          {
            title: 'Global supply chain disruptions in AI accelerator hardware',
            snippet: 'The Company faces risks associated with procurement delays in advanced silicon packaging and cryogenic testing infrastructure.',
            accession: '0000320193-25-000079'
          }
        ],
        removed: [
          {
            title: 'Legacy cellular licensing litigation',
            snippet: 'Risks concerning historic cellular standard-essential patent disputes across regional trade jurisdictions.',
            accession: '0000320193-24-000106'
          }
        ],
        changed: [
          {
            title: 'Third-party developer commission structure',
            snippet: 'Changes to statutory commission thresholds in global application marketplaces may impact high-margin services revenue.',
            accession: '0000320193-25-000079',
            priorSnippet: 'The Company distributes third-party software and retains fees.',
            priorAccession: '0000320193-24-000106'
          }
        ],
        addedTotal: 1,
        removedTotal: 1,
        changedTotal: 1
      },
      summary: [
        'Revenue changed +2% (from $383.29B to $391.04B)',
        'Risk factors: 1 added, 1 removed, 1 modified'
      ],
      sources: [
        'https://data.sec.gov/submissions/CIK0000320193.json'
      ],
      dataNote: 'Financials from SEC XBRL companyfacts.'
    };

    const diffSpy = vi.spyOn(secFilingDiffModule, 'buildFilingDiff').mockResolvedValue(mockDiffResult);

    const res = await request(app).get(`/report/success?session_id=${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    // Called direct internal function, not HTTP
    expect(diffSpy).toHaveBeenCalledWith('AAPL', '10-K');

    // HTML includes summary
    expect(res.text).toContain('Revenue changed +2%');
    expect(res.text).toContain('Risk factors: 1 added, 1 removed, 1 modified');

    // HTML includes totals
    expect(res.text).toContain('Added Risks');
    expect(res.text).toContain('Removed Risks');
    expect(res.text).toContain('Modified Risks');

    // HTML includes added, removed, changed quotes
    expect(res.text).toContain('Global supply chain disruptions in AI accelerator hardware');
    expect(res.text).toContain('The Company faces risks associated with procurement delays');
    expect(res.text).toContain('Legacy cellular licensing litigation');
    expect(res.text).toContain('Third-party developer commission structure');
    expect(res.text).toContain('Changes to statutory commission thresholds');

    // Filing dates & EDGAR links
    expect(res.text).toContain('2025-09-27');
    expect(res.text).toContain('2024-09-28');
    expect(res.text).toContain('0000320193-25-000079');
    expect(res.text).toContain('https://www.sec.gov/ix?doc=/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm');

    // Verified saved in Firestore under reports/{session_id}
    const savedDoc = await db.collection('reports').doc(sessionId).get();
    expect(savedDoc.exists).toBe(true);
    expect(savedDoc.data().ticker).toBe('AAPL');
    expect(savedDoc.data().paymentStatus).toBe('paid');

    // 2c. Idempotency test: second call NEVER regenerates or double-runs
    diffSpy.mockClear();
    const resSecond = await request(app).get(`/report/success?session_id=${sessionId}`);
    expect(resSecond.status).toBe(200);
    expect(diffSpy).not.toHaveBeenCalled();
    expect(resSecond.text).toContain('Revenue changed +2%');
  });

  it('2d. GET /report/success falls back to custom_fields Ticker when client_reference_id is missing', async () => {
    const sessionId = `cs_test_custom_field_${Date.now()}`;
    await setRecordedStripeSessionAsync(sessionId, {
      id: sessionId,
      payment_status: 'paid',
      custom_fields: [
        {
          key: 'ticker',
          label: { custom: 'Ticker' },
          text: { value: 'MSFT' }
        }
      ]
    });

    const mockDiffResult: secFilingDiffModule.FilingDiffResult = {
      mode: 'diff',
      ticker: 'MSFT',
      filingType: '10-K',
      comparisonBasis: 'annual',
      currentFiling: {
        accession: '0000789019-25-000050',
        periodEnd: '2025-06-30',
        form: '10-K',
        filedDate: '2025-07-30',
        url: 'https://sec.gov/msft'
      },
      priorFiling: {
        accession: '0000789019-24-000040',
        periodEnd: '2024-06-30',
        form: '10-K',
        filedDate: '2024-07-31',
        url: 'https://sec.gov/msft-prior'
      },
      financialChanges: [],
      summary: ['Form 10-K cross-filing comparison computed for MSFT.'],
      sources: ['https://sec.gov'],
      dataNote: 'SEC XBRL facts.'
    };

    const diffSpy = vi.spyOn(secFilingDiffModule, 'buildFilingDiff').mockResolvedValue(mockDiffResult);

    const res = await request(app).get(`/report/success?session_id=${sessionId}`);
    expect(res.status).toBe(200);
    expect(diffSpy).toHaveBeenCalledWith('MSFT', '10-K');
    expect(res.text).toContain('MSFT');
  });

  // ==========================================
  // REQUIREMENT 3: DIFF FAILURE HANDLING & REFUNDS
  // ==========================================
  it('3. If the diff fails (bad ticker, SEC down, or no prior filing), shows clear error message and instructions to reply to Stripe receipt or email thestockbloc@gmail.com for a refund', async () => {
    const sessionId = `cs_test_diff_failure_${Date.now()}`;
    await setRecordedStripeSessionAsync(sessionId, {
      id: sessionId,
      payment_status: 'paid',
      client_reference_id: 'BADTICKER-10-K'
    });

    vi.spyOn(secFilingDiffModule, 'buildFilingDiff').mockRejectedValue(
      new Error('Ticker "BADTICKER" not found in SEC EDGAR directory')
    );

    const res = await request(app).get(`/report/success?session_id=${sessionId}`);
    expect(res.status).toBe(502);

    // Clear error message that report could not be generated
    expect(res.text).toContain('Report Could Not Be Generated');

    // Refund instructions explicitly mentioning Stripe receipt and thestockbloc@gmail.com
    expect(res.text).toContain('reply to your Stripe payment receipt');
    expect(res.text).toContain('thestockbloc@gmail.com');

    // Never save incomplete or failed report as complete in Firestore
    const savedDoc = await db.collection('reports').doc(sessionId).get();
    expect(savedDoc.exists).toBe(false);
  });

  it('3b. If no prior filing exists to compare against, shows refund message and never presents incomplete report', async () => {
    const sessionId = `cs_test_no_prior_${Date.now()}`;
    await setRecordedStripeSessionAsync(sessionId, {
      id: sessionId,
      payment_status: 'paid',
      client_reference_id: 'IPOCO-10-K'
    });

    // When priorFiling is null
    vi.spyOn(secFilingDiffModule, 'buildFilingDiff').mockResolvedValue({
      mode: 'diff',
      ticker: 'IPOCO',
      filingType: '10-K',
      comparisonBasis: 'annual',
      currentFiling: {
        accession: '0000999999-25-000001',
        periodEnd: '2025-12-31',
        form: '10-K',
        filedDate: '2026-03-01',
        url: 'https://sec.gov'
      },
      priorFiling: null, // No prior filing
      financialChanges: [],
      summary: ['Latest Form 10-K retrieved. No prior filing found.'],
      sources: [],
      dataNote: 'No prior filing'
    });

    const res = await request(app).get(`/report/success?session_id=${sessionId}`);
    expect(res.status).toBe(502);
    expect(res.text).toContain('No prior Form 10-K filing was found');
    expect(res.text).toContain('thestockbloc@gmail.com');

    // Verify it is NOT saved in Firestore as complete
    const savedDoc = await db.collection('reports').doc(sessionId).get();
    expect(savedDoc.exists).toBe(false);
  });

  // ==========================================
  // REQUIREMENT 4: GET /report/view/:session_id
  // ==========================================
  it('4. GET /report/view/:session_id re-shows a saved report from Firestore', async () => {
    const sessionId = `cs_test_saved_view_${Date.now()}`;
    const reportData = {
      sessionId,
      ticker: 'TSLA',
      filingType: '10-Q',
      comparisonBasis: 'same_quarter_prior_year',
      currentFiling: {
        accession: '0001318605-25-000030',
        periodEnd: '2025-06-30',
        form: '10-Q',
        filedDate: '2025-07-25',
        url: 'https://sec.gov/tsla-current'
      },
      priorFiling: {
        accession: '0001318605-24-000025',
        periodEnd: '2024-06-30',
        form: '10-Q',
        filedDate: '2024-07-24',
        url: 'https://sec.gov/tsla-prior'
      },
      financialChanges: [
        {
          metric: 'Gross margin',
          prior: 0.179,
          current: 0.192,
          changePct: 7.2,
          marginChangePp: 1.3,
          unit: 'derived',
          xbrlTag: 'GrossProfit/Revenue',
          priorAccession: '0001318605-24-000025',
          currentAccession: '0001318605-25-000030'
        }
      ],
      riskFactorChanges: {
        added: [
          {
            title: 'Regulatory approval timelines for autonomous ride-hailing networks',
            snippet: 'Commercial deployment of driverless cybercab services remains subject to state and federal motor vehicle safety administration certification.',
            accession: '0001318605-25-000030'
          }
        ],
        removed: [],
        changed: [],
        addedTotal: 1,
        removedTotal: 0,
        changedTotal: 0
      },
      summary: [
        'Gross margin changed +1.3 pp (from 17.9% to 19.2%)',
        'Risk factors: 1 added, 0 removed, 0 modified'
      ],
      sources: ['https://sec.gov'],
      dataNote: 'Financials from SEC XBRL companyfacts.',
      createdAt: new Date().toISOString(),
      paymentStatus: 'paid'
    };

    await db.collection('reports').doc(sessionId).set(reportData);

    const res = await request(app).get(`/report/view/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain("What changed in TSLA's latest 10-Q");
    expect(res.text).toContain('Gross margin changed +1.3 pp');
    expect(res.text).toContain('Regulatory approval timelines for autonomous ride-hailing networks');
    expect(res.text).toContain('Commercial deployment of driverless cybercab services');
  });

  it('4b. GET /report/view/:session_id returns 404 for non-existent report', async () => {
    const res = await request(app).get('/report/view/non_existent_session_9999');
    expect(res.status).toBe(404);
    expect(res.text).toContain('Report Not Found');
  });

  // ==========================================
  // REQUIREMENT 5: STRIPE KEY PROTECTION
  // ==========================================
  it('5. Never exposes STRIPE_SECRET_KEY in HTML, errors, or responses', async () => {
    const secretKey = 'sk_live_super_secret_key_never_leak_this';
    process.env.STRIPE_SECRET_KEY = secretKey;

    const resLanding = await request(app).get('/report');
    expect(resLanding.text).not.toContain(secretKey);

    const resView = await request(app).get('/report/view/any_session');
    expect(resView.text).not.toContain(secretKey);

    const resFail = await request(app).get('/report/success?session_id=bad_id');
    expect(resFail.text).not.toContain(secretKey);
  });

  // ==========================================
  // INTEGRATION TEST: MOUNTED ON MAIN SERVER APP
  // ==========================================
  it('6. Mounted on main server.impl app before SPA catch-all', async () => {
    const { app: mainApp } = await import('../server.impl.js');
    const res = await request(mainApp).get('/report');
    expect(res.status).toBe(200);
    expect(res.text).toContain("What changed in this company's latest 10-K or 10-Q");
  });
});
