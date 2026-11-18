export const STATIC_SAMPLES: Record<string, any> = {
  sb_score: {
    sample: true,
    capturedAt: '2026-10-12T18:30:00Z',
    sampleNote: 'Static captured response for inspection (0 network calls). Call the live endpoint with x402 payment on Base for real-time scoring.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/intelligence/sb-score?ticker=NVDA',
      price: '$0.05 USDC (x402, Base)',
      atomicAmount: '50000',
    },
    output: {
      status: 'success',
      queryType: 'sb_score_quant_intelligence',
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      sbScore: 84,
      signalLabel: 'ACCUMULATE',
      confidence: 'HIGH',
      factorBreakdown: {
        momentum: 22,
        trend: 23,
        relativeStrength: 16,
        volume: 12,
        volatility: 11,
      },
    },
  },

  earnings_pack: {
    sample: true,
    capturedAt: '2026-10-12T18:30:00Z',
    sampleNote: 'Static captured bundle response for inspection. Combines 13F institutional holdings, latest 10-K/10-Q audit, and structured thesis memo.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/intelligence/earnings-pack?ticker=AAPL',
      price: '$0.35 USDC (x402, Base)',
      atomicAmount: '350000',
    },
    output: {
      ticker: 'AAPL',
      asOf: '2026-10-12T18:30:00Z',
      thirteenF: {
        quarterCycle: 'Q2 2026',
        institutionalHoldersCount: 11,
        consensus: {
          fundCount: 11,
          overallSentiment: 'STRONG ACCUMULATION',
        },
      },
      filingAudit: {
        filingType: '10-Q',
        managementTone: 'CONSTRUCTIVE',
        executiveSummary: 'Services expansion and gross margin resilience anchored quarterly cash generation.',
        isLiveSecData: true,
      },
      memo: {
        title: 'Earnings Prep & Institutional Positioning: AAPL',
        timeHorizon: '1-3 Months (Earnings Cycle)',
        relatedAssets: ['AAPL', 'USDC'],
      },
    },
  },

  market_quote: {
    sample: true,
    capturedAt: '2026-10-12T18:30:00Z',
    sampleNote: 'Static captured quote response for inspection. Unknown tickers on live route return a free HTTP 404.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/market/quote?ticker=AAPL',
      price: '$0.01 USDC (x402, Base)',
      atomicAmount: '10000',
    },
    output: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 229.8,
      change: 1.45,
      changePercent: 0.63,
      volume: 42150000,
      dollarVolume: '$9.7B',
      priceLabel: 'Last Close',
    },
  },

  strategy_eval: {
    sample: true,
    capturedAt: '2026-10-12T18:30:00Z',
    sampleNote: 'Static captured quantitative strategy backtest sample for inspection.',
    paidRoute: {
      method: 'POST',
      url: 'https://stockbloc.ai.studio/api/v1/agent/strategy/evaluate',
      price: '$0.10 USDC (x402, Base)',
      atomicAmount: '100000',
      body: {
        allocation: { NVDA: 0.5, CEG: 0.3, RKLB: 0.2 },
        benchmark: 'super_sonic_tsunami',
        horizonDays: 90,
      },
    },
    output: {
      status: 'evaluation_success',
      portfolioMetrics: {
        annualizedExpectedReturnPercent: 31.4,
        sharpeRatio: 2.18,
        maxDrawdownPercent: -14.2,
        convictionGrade: 'A',
      },
    },
  },

  forecasts: {
    sample: true,
    capturedAt: '2026-10-12T18:30:00Z',
    sampleNote: 'Static captured Brier-calibrated forecast publication schema sample.',
    paidRoute: {
      method: 'POST',
      url: 'https://stockbloc.ai.studio/api/v1/intelligence/forecasts',
      price: '$0.05 USDC (x402, Base)',
      atomicAmount: '50000',
    },
    output: {
      id: 'fc_sample_001',
      status: 'OPEN',
      asset: 'NVDA',
      direction: 'UP',
      probability: 72,
      timeHorizon: '90-Day',
    },
  },

  sec_8k_events: {
    sample: true,
    capturedAt: '2026-11-18T12:00:00Z',
    sampleNote: 'Static sample of Form 8-K item-level event extraction from SEC EDGAR submissions.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/sec/8k-events?ticker=NVDA&limit=5',
      price: '$0.05 USDC (x402, Base)',
      atomicAmount: '50000',
    },
    output: {
      status: 'success',
      source: 'SEC EDGAR Submissions API (data.sec.gov/submissions)',
      ticker: 'NVDA',
      count: 1,
      events: [
        {
          ticker: 'NVDA',
          companyName: 'NVIDIA CORP',
          cik: '0001045810',
          form: '8-K',
          filingDate: '2026-08-26',
          accessionNumber: '0001045810-26-000142',
          items: [
            { code: '2.02', title: 'Results of Operations and Financial Condition' },
            { code: '9.01', title: 'Financial Statements and Exhibits' },
          ],
          filingUrl: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000142/',
        },
      ],
    },
  },

  intelligence_changes: {
    sample: true,
    capturedAt: '2026-11-18T14:30:00Z',
    sampleNote: 'Static sample of per-ticker change detection for NVDA since 2026-11-17T00:00:00Z (0 network calls). Call GET /api/v1/intelligence/changes?ticker=NVDA&since=2026-11-17T00:00:00Z via x402 ($0.01 USDC on Base).',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/intelligence/changes?ticker=NVDA&since=2026-11-17T00:00:00Z',
      price: '$0.01 USDC (x402, Base)',
      atomicAmount: '10000',
    },
    output: {
      status: 'success',
      ticker: 'NVDA',
      since: '2026-11-17T00:00:00Z',
      effectiveSince: '2026-11-17T00:00:00.000Z',
      windowClamped: false,
      asOf: '2026-11-18T14:30:00.000Z',
      coverageNote: 'Checks SEC EDGAR 8-K/10-K/10-Q filings, deterministic 5-factor SB Score vs daily bars as of since, and tracked institutional Form 13F-HR filings as of their reported filing timestamps (not real-time tick surveillance).',
      summary: '2 changes since Nov 17',
      count: 2,
      changes: [
        {
          type: 'sb_score',
          what: 'SB Score Momentum factor rose from 60 to 64 (+4 pts)',
          detail: 'Momentum: 60 -> 64 (+4 pts); overall SB Score 48 -> 49',
          changedAt: '2026-11-18T14:30:00.000Z',
        },
        {
          type: 'filing',
          what: 'New Form 8-K filed (Items 2.02, 9.01)',
          detail: 'NVIDIA CORP filed Form 8-K on 2026-11-17 (Accession 0001045810-26-000088): 2.02: Results of Operations and Financial Condition; 9.01: Financial Statements and Exhibits',
          changedAt: '2026-11-17T21:20:51.000Z',
          link: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/nvda-20261117.htm',
        },
      ],
    },
  },

  space_telemetry: {
    sample: true,
    capturedAt: '2026-11-18T12:00:00Z',
    sampleNote: 'Static sample of live Space Telemetry bundle (CelesTrak Starlink SATCAT counts, Launch Library 2 windows, and space/power equities).',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/space/telemetry',
      price: '$0.05 USDC (x402, Base)',
      atomicAmount: '50000',
    },
    output: {
      status: 'success',
      starlinkConstellation: {
        totalInOrbit: 11208,
        operationalCount: 10941,
        raisingOrPartialCount: 267,
        source: 'CelesTrak SATCAT Catalog (celestrak.org/satcat)',
      },
      launches: {
        upcoming: [
          {
            name: 'Falcon 9 Block 5 | USSF-317',
            net: '2026-11-20T02:46:00Z',
            provider: 'SpaceX',
          },
        ],
      },
    },
  },

  signals_8k: {
    sample: true,
    capturedAt: '2026-11-18T12:00:00Z',
    sampleNote: 'Static sample of a real NVDA Form 8-K filed November 17, 2026 (0 network calls). Call GET /api/v1/signals/8k via x402 ($0.05 USDC on Base) for live multi-ticker 8-K monitoring.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/signals/8k?ticker=NVDA',
      price: '$0.05 USDC (x402, Base)',
      atomicAmount: '50000',
    },
    output: {
      status: 'success',
      source: 'SEC EDGAR Submissions & Filing Text (sec.gov)',
      since: '2026-11-17T00:00:00.000Z',
      asOf: '2026-11-18T12:00:00Z',
      count: 1,
      filings: [
        {
          ticker: 'NVDA',
          companyName: 'NVIDIA CORP',
          filedDate: '2026-11-17',
          acceptanceDateTime: '2026-11-17T21:20:51.000Z',
          accessionNumber: '0001045810-26-000088',
          filingUrl: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/nvda-20261117.htm',
          items: ['2.02', '9.01'],
          itemLabels: [
            '2.02: Results of Operations and Financial Condition',
            '9.01: Financial Statements and Exhibits',
          ],
          summary:
            'On November 17, 2026, NVIDIA Corporation, or the Company, issued a press release announcing its results for the quarter ended October 25, 2026. The press release is attached as Exhibit 99.1 and is incorporated herein by reference. Attached hereto as Exhibit 99.2 and incorporated by reference herein is financial information and commentary by Colette M. Kress, Interim Chief Executive Officer, Executive Vice President and Chief Financial Officer of the Company, regarding results for the quarter ended October 25, 2026, or the CFO Commentary.',
        },
      ],
    },
  },
  data_insider: {
    sample: true,
    sampleNote:
      'Static sample of a real SEC EDGAR Form 4 filing for NVDA (0 network calls). Call GET /api/v1/data/insider?ticker=NVDA via x402 ($0.02 USDC on Base) for live Form 4 insider buys and sells.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/data/insider?ticker=NVDA',
      price: '$0.02 USDC (x402, Base)',
      atomicAmount: '20000',
    },
    output: {
      status: 'success',
      source: 'SEC EDGAR Form 4',
      ticker: 'NVDA',
      companyName: 'NVIDIA CORP',
      cik: '0001045810',
      count: 1,
      asOf: '2026-11-18T22:25:00.000Z',
      coverageNote:
        'Covers open-market and private insider purchases (Form 4 code P) and sales (Form 4 code S) from SEC EDGAR recent Form 4 XML filings; excludes gifts, tax withholdings, and equity awards.',
      transactions: [
        {
          ticker: 'NVDA',
          insiderName: 'Teter Timothy S.',
          insiderTitle: 'EVP, General Counsel and Sec',
          transactionDate: '2026-09-21',
          filedDate: '2026-09-23',
          transactionType: 'sell',
          shares: 12483,
          pricePerShare: 222.1932,
          totalValue: 2773637.72,
          sharesOwnedAfter: 2705637,
          filingUrl:
            'https://www.sec.gov/Archives/edgar/data/1045810/000169684126000014/xslF345X06/wk-form4_1790196985.xml',
          asOf: '2026-11-18T22:25:00.000Z',
        },
      ],
    },
  },
  data_congress: {
    sample: true,
    sampleNote:
      'Static sample of a real U.S. House Periodic Transaction Report for NVDA (0 network calls). Call GET /api/v1/data/congress?ticker=NVDA or ?person=Pelosi via x402 ($0.02 USDC on Base) for live House and Senate disclosures.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/data/congress?ticker=NVDA',
      price: '$0.02 USDC (x402, Base)',
      atomicAmount: '20000',
    },
    output: {
      status: 'success',
      query: {
        ticker: 'NVDA',
      },
      count: 1,
      asOf: '2026-11-18T22:25:00.000Z',
      chamberStatus: {
        house: 'available',
        senate: 'available',
      },
      coverageNote:
        'House Clerk electronic Periodic Transaction Reports (200* PTR PDFs); Senate eFD electronic Periodic Transaction Reports (HTML tables). Scanned paper PDFs are excluded unless electronically filed; amountRange reflects disclosed bracket verbatim.',
      trades: [
        {
          person: 'Hon. Nancy Pelosi',
          chamber: 'House',
          ticker: 'NVDA',
          transactionDate: '2026-01-16',
          disclosedDate: '2026-01-23',
          transactionType: 'purchase',
          amountRange: '$250,001 - $500,000',
          sourceUrl: 'https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20033725.pdf',
          asOf: '2026-11-18T22:25:00.000Z',
        },
      ],
    },
  },
};

