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

  delta_changes: {
    sample: true,
    capturedAt: '2026-11-18T12:00:00Z',
    sampleNote: 'Static sample of lightweight watchlist & intelligence delta changes since a timestamp.',
    paidRoute: {
      method: 'GET',
      url: 'https://stockbloc.ai.studio/api/v1/intelligence/changes?since=2026-11-17T00:00:00Z',
      price: '$0.01 USDC (x402, Base)',
      atomicAmount: '10000',
    },
    output: {
      status: 'success',
      since: '2026-11-17T00:00:00Z',
      counts: {
        secFilings: 2,
        marketMovers: 3,
        researchMemos: 1,
        forecasts: 2,
        upcomingSpaceLaunches: 3,
      },
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
};
