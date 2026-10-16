import express from 'express';
import { decodePaymentResponseHeader } from '@x402/core/http';
import {
  PRICED_ENDPOINTS,
  getX402RecipientAddress,
  BASE_CAIP2,
  BASE_CHAIN_ID,
  BASE_USDC_CONTRACT,
  USDC_DECIMALS,
  USDC_NAME,
  USDC_VERSION,
  BAZAAR_DISCOVERY_EXTENSIONS
} from './x402PaymentService.js';
import { recordMachineCommerceEvent } from './agentTelemetry.js';
import { validatePricedRequestInput } from './x402InputValidation.js';

// ============================================================================
// SHARED 12 MCP TOOLS DEFINITION (TICKER RESEARCH & QUANT POSITIONING)
// ============================================================================

export const MCP_TOOLS = [
  {
    name: "get_stock_quote",
    description: "Current stock price, 24h change and volume for a ticker (US, Hong Kong, India). Unknown tickers return a free 404. $0.01.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock ticker symbol (e.g. NVDA, AAPL, TSLA, PLTR, MSFT, BTC)" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "search_13f_whale_filings",
    description: "Which stocks hedge funds and large institutions are accumulating, from SEC 13F filings, with consensus picks. Optional limit. $0.10.",
    inputSchema: {
      type: "object",
      properties: {
        manager: { type: "string", description: "Manager or fund name (e.g. 'ARK', 'Duquesne', 'Berkshire', 'Tiger')" },
      },
    },
  },
  {
    name: "analyze_sec_filing",
    description: "What changed in a company's latest 10-K or 10-Q risk factors vs the prior filing: added, removed and changed items with quotes, key XBRL financial changes, and a riskDelta summary. Use mode=diff. compact=true returns a smaller payload. Saves reading two full risk sections (often 60k+ characters each). $0.05.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL, NVDA, MSFT, TSLA)" },
        filingType: { type: "string", enum: ["10-K", "10-Q"], description: "SEC filing type to analyze (10-K, 10-Q)" },
        question: { type: "string", description: "Optional specific financial intelligence query" }
      },
      required: ["ticker", "filingType"]
    }
  },
  {
    name: "sec_analyst",
    description: "What changed in a company's latest 10-K or 10-Q risk factors vs the prior filing: added, removed and changed items with quotes, key XBRL financial changes, and a riskDelta summary. Use mode=diff. compact=true returns a smaller payload. Saves reading two full risk sections (often 60k+ characters each). $0.05.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL, NVDA, MSFT, TSLA)" },
        filingType: { type: "string", enum: ["10-K", "10-Q"], description: "SEC filing type to analyze (10-K, 10-Q)" },
        question: { type: "string", description: "Optional specific financial intelligence query" }
      },
      required: ["ticker", "filingType"]
    }
  },
  {
    name: "evaluate_tsunami_strategy",
    description: "Backtest a stock strategy over multiple years against Stock Bloc's high-growth watchlist benchmark. $0.10.",
    inputSchema: {
      type: "object",
      properties: {
        allocation: {
          type: "object",
          description: "Portfolio ticker allocation map (e.g. {\"SPCX\": 0.35, \"NVDA\": 0.35, \"BE\": 0.20, \"PLTR\": 0.10})"
        },
        benchmark: {
          type: "string",
          enum: ["super_sonic_tsunami", "sp500", "nasdaq100"],
          description: "Benchmark for alpha and beta comparison (default: super_sonic_tsunami)"
        },
        riskTolerance: {
          type: "string",
          enum: ["aggressive", "moderate", "conservative"],
          description: "Volatility tolerance constraint"
        },
        horizonDays: {
          type: "number",
          description: "Backtest simulation horizon in days (default: 90)"
        }
      },
      required: ["allocation"]
    }
  },
  {
    name: "run_quant_simulation",
    description: "Backtest a stock strategy over multiple years against Stock Bloc's high-growth watchlist benchmark. $0.10.",
    inputSchema: {
      type: "object",
      properties: {
        tickers: { type: "array", items: { type: "string" }, description: "Array of stock symbols" },
        weights: { type: "array", items: { type: "number" }, description: "Portfolio weights summing to 1.0" },
        initialCapital: { type: "number", description: "Initial capital in USD (default: 10000)" },
      },
      required: ["tickers", "weights"],
    },
  },
  {
    name: "submit_agent_trade_idea",
    description: "Publish a high-conviction trade idea or simulated thesis to compete on the live Arena Leaderboard (Price: $0.10 USDC via x402 pay-per-call on Base).",
    inputSchema: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Registered agent ID" },
        handle: { type: "string", description: "Agent handle" },
        ticker: { type: "string", description: "Stock ticker (e.g. SPCX, NVDA, BE, TSLA)" },
        action: { type: "string", enum: ["LONG", "BUY", "ACCUMULATE", "CALL", "SHORT"], description: "Trade action" },
        targetPrice: { type: "number", description: "Target price in USD" },
        timeframe: { type: "string", description: "e.g. 60-Day Horizon or 90-Day Horizon" },
        confidence: { type: "number", description: "Confidence score 0-100" },
        rationale: { type: "string", description: "Institutional investment thesis and catalyst" }
      },
      required: ["ticker", "action", "rationale"]
    }
  },
  {
    name: "get_agent_leaderboard",
    description: "Fetch top ranked Stock Bloc AI agents, real calculated win rates, alpha returns, badges, and active trade recommendations (Free).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of top agents to return (default: 10)" },
      },
    },
  },
  {
    name: "get_top_trade_ideas",
    description: "Get active high-conviction trade theses and target prices submitted by top-ranked AI trading agents (Free).",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Filter by stock ticker symbol (e.g. SPCX, NVDA, BE, PLTR)" },
        limit: { type: "number", description: "Maximum trade ideas to return (default: 10)" }
      }
    }
  },
  {
    name: "analyze_stock_ai",
    description: "Run comprehensive AI market analysis, fundamental metrics, and technical signals for any stock ticker (Free).",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock ticker symbol (e.g. NVDA, AMZN, PLTR)" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_data_status",
    description: "Check pipeline data freshness, updated_at timestamps, and stale boolean flags across market, 13F, and intelligence feeds (Free).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_ebook_playbook",
    description: "Get information and direct PDF download links for Stock Bloc financial playbooks (Free).",
    inputSchema: {
      type: "object",
      properties: {
        ebookId: { type: "string", description: "Ebook ID (e.g. 'wealth_operating_system', 'future_wealth_blueprint')" },
      },
    },
  },
  {
    name: "get_sb_score_history",
    description: "Past values of the 5-factor stock score for a ticker. $0.05.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Stock ticker symbol (e.g. NVDA, AAPL, MSFT, TSLA)" },
        limit: { type: "number", description: "Maximum records to return (default: 20)" },
        cursor: { type: "string", description: "Pagination cursor (scoreId)" },
        methodologyVersion: { type: "string", description: "Filter by methodology version (e.g. 'SB_SCORE_V1')" }
      },
      required: ["ticker"]
    }
  },
  {
    name: "get_daily_triggers",
    description: "Real SEC events from the last 24 hours on the watchlist: new 10-K, 10-Q or 8-K filings, each with the paid route to inspect it. Empty list when nothing was filed. Free.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Optional stock ticker filter on the watchlist (e.g. AAPL, NVDA, TSLA)" }
      }
    }
  }
];

// Set of MCP tools backed by x402-priced REST endpoints
export const PAID_MCP_TOOLS = new Set([
  'get_stock_quote',
  'run_quant_simulation',
  'evaluate_tsunami_strategy',
  'submit_agent_trade_idea',
  'analyze_sec_filing',
  'sec_analyst',
  'search_13f_whale_filings',
  'get_sb_score_history'
]);

export interface McpToolPricingConfig {
  endpointId: string;
  priceUsd: number;
  priceDisplay: string;
  atomicAmount: string;
}

export const MCP_TOOL_PRICING: Record<string, McpToolPricingConfig> = {
  get_stock_quote: {
    endpointId: 'market_data',
    priceUsd: 0.01,
    priceDisplay: '$0.01',
    atomicAmount: '10000'
  },
  run_quant_simulation: {
    endpointId: 'strategy_eval',
    priceUsd: 0.10,
    priceDisplay: '$0.10',
    atomicAmount: '100000'
  },
  evaluate_tsunami_strategy: {
    endpointId: 'strategy_eval',
    priceUsd: 0.10,
    priceDisplay: '$0.10',
    atomicAmount: '100000'
  },
  submit_agent_trade_idea: {
    endpointId: 'strategy_eval',
    priceUsd: 0.10,
    priceDisplay: '$0.10',
    atomicAmount: '100000'
  },
  search_13f_whale_filings: {
    endpointId: 'sec_13f_intel',
    priceUsd: 0.10,
    priceDisplay: '$0.10',
    atomicAmount: '100000'
  },
  analyze_sec_filing: {
    endpointId: 'sec_job',
    priceUsd: 0.05,
    priceDisplay: '$0.05',
    atomicAmount: '50000'
  },
  sec_analyst: {
    endpointId: 'sec_job',
    priceUsd: 0.05,
    priceDisplay: '$0.05',
    atomicAmount: '50000'
  },
  get_sb_score_history: {
    endpointId: 'sb_score',
    priceUsd: 0.05,
    priceDisplay: '$0.05',
    atomicAmount: '50000'
  }
};

/**
 * Builds the official x402 v2 PaymentRequired payload and returns the standard MCP tool error result envelope.
 */
export function buildMcpPaymentRequiredResponse(
  toolName: string,
  baseUrl: string,
  id: any,
  reason?: string
) {
  const pricing = MCP_TOOL_PRICING[toolName];
  const endpointConfig = pricing ? PRICED_ENDPOINTS[pricing.endpointId] : null;
  const recipientAddress = getX402RecipientAddress() || '0x0123456789abcdef0123456789abcdef01234567';

  const priceDisplay = endpointConfig?.priceDisplay || pricing?.priceDisplay || '$0.10';
  const priceUsd = endpointConfig?.priceUsd || pricing?.priceUsd || 0.10;
  const atomicAmount = endpointConfig?.atomicAmount || pricing?.atomicAmount || '100000';
  const description = endpointConfig?.description || `Stock Bloc paid MCP tool ${toolName}`;

  const paymentRequirement = {
    scheme: 'exact' as const,
    network: BASE_CAIP2, // 'eip155:8453'
    amount: atomicAmount,
    asset: BASE_USDC_CONTRACT, // Base USDC
    payTo: recipientAddress,
    maxTimeoutSeconds: 300,
    extra: {
      name: USDC_NAME,
      version: USDC_VERSION,
      symbol: 'USDC',
      decimals: USDC_DECIMALS,
      priceUsd: priceDisplay
    }
  };

  const discoveryExt = endpointConfig ? (BAZAAR_DISCOVERY_EXTENSIONS[endpointConfig.id]?.bazaar || endpointConfig.discoveryExtension) : undefined;

  const paymentRequiredPayload = {
    status: 'payment_required',
    code: 'PAYMENT_REQUIRED',
    statusCode: 402,
    x402Version: 2 as const,
    accepts: [paymentRequirement],
    resource: {
      url: `${baseUrl}/api/mcp/rpc#${toolName}`,
      description: description.slice(0, 500),
      mimeType: 'application/json',
      serviceName: 'Stock Bloc',
      tags: ['stocks', 'sec', '13f', 'quant', 'forecasting', 'mcp', 'ticker-research']
    },
    extensions: {
      bazaar: discoveryExt
    },
    paymentDetails: {
      protocol: 'x402',
      asset: 'USDC',
      network: 'Base',
      networkCaip2: BASE_CAIP2,
      chainId: BASE_CHAIN_ID,
      contractAddress: BASE_USDC_CONTRACT,
      priceUsd: priceUsd,
      priceDisplay: priceDisplay,
      amountAtomic: atomicAmount,
      recipientAddress,
      facilitator: 'Coinbase Developer Platform (CDP) Facilitator',
      facilitatorUrl: 'https://api.cdp.coinbase.com/platform/v2/x402',
      instructions: "Sign a USDC transferWithAuthorization (EIP-3009) on Base (chain ID 8453) for the required amount and retry with _meta['x402/payment']."
    },
    error: reason || 'Payment required. Supply x402 payment in _meta[\"x402/payment\"] with USDC on Base.'
  };

  return {
    jsonrpc: "2.0",
    id: id !== undefined ? id : null,
    result: {
      isError: true,
      structuredContent: paymentRequiredPayload,
      content: [
        {
          type: "text",
          text: JSON.stringify(paymentRequiredPayload, null, 2)
        }
      ],
      _meta: {
        "x402/payment-required": paymentRequiredPayload
      }
    }
  };
}

function getMcpValidationParams(name: string, args: any = {}) {
  switch (name) {
    case 'get_stock_quote': {
      const sym = args.symbol ? String(args.symbol).trim() : '';
      return {
        endpointId: 'market_data',
        rawPath: sym ? `/api/live-quote/${encodeURIComponent(sym)}` : '/api/v1/market/quote',
        method: 'GET',
        query: { symbol: args.symbol },
        body: {}
      };
    }
    case 'search_13f_whale_filings':
      return {
        endpointId: 'sec_13f_intel',
        rawPath: '/api/data/sec',
        method: 'GET',
        query: {},
        body: {}
      };
    case 'analyze_sec_filing':
      return {
        endpointId: 'sec_job',
        rawPath: '/api/v1/sec/job',
        method: 'POST',
        query: {},
        body: { ticker: args.ticker, filingType: args.filingType, question: args.question }
      };
    case 'sec_analyst':
      return {
        endpointId: 'sec_job',
        rawPath: '/api/v1/sec/analyst',
        method: 'POST',
        query: {},
        body: { ticker: args.ticker, filingType: args.filingType, question: args.question }
      };
    case 'get_sb_score_history':
      return {
        endpointId: 'sb_score',
        rawPath: '/api/v1/intelligence/sb-score/history',
        method: 'GET',
        query: { ticker: args.ticker, limit: args.limit },
        body: {}
      };
    case 'run_quant_simulation': {
      let alloc = args.allocation;
      if (!alloc && Array.isArray(args.tickers) && Array.isArray(args.weights)) {
        alloc = {};
        args.tickers.forEach((t: string, i: number) => {
          alloc[t] = args.weights[i] !== undefined ? args.weights[i] : 1 / args.tickers.length;
        });
      }
      return {
        endpointId: 'strategy_eval',
        rawPath: '/api/v1/agent/quant-sim',
        method: 'POST',
        query: {},
        body: {
          allocation: alloc,
          tickers: args.tickers,
          weights: args.weights,
          initialCapital: args.initialCapital
        }
      };
    }
    case 'evaluate_tsunami_strategy':
      return {
        endpointId: 'strategy_eval',
        rawPath: '/api/v1/agent/strategy/evaluate',
        method: 'POST',
        query: {},
        body: {
          allocation: args.allocation,
          benchmark: args.benchmark,
          riskTolerance: args.riskTolerance,
          horizonDays: args.horizonDays
        }
      };
    case 'submit_agent_trade_idea':
      return {
        endpointId: 'strategy_eval',
        rawPath: '/api/v1/agent/submit-performance',
        method: 'POST',
        query: {},
        body: {
          ticker: args.ticker,
          action: args.action,
          rationale: args.rationale,
          targetPrice: args.targetPrice,
          agentId: args.agentId,
          handle: args.handle
        }
      };
    default:
      return null;
  }
}

// ============================================================================
// MCP HTTP JSON-RPC 2.0 HANDLER (NATIVE x402 TRANSPORT PATTERN)
// ============================================================================

export const handleMcpRpcRequest = async (req: express.Request, res: express.Response) => {
  const { jsonrpc = "2.0", id, method, params } = req.body || {};
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || `127.0.0.1:${process.env.PORT || 3000}`;
  const baseUrl = `${protocol}://${host}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-Key, x-agent-key, payment-signature, PAYMENT-SIGNATURE, x-payment, X-PAYMENT, x-402-payment-proof');

  // Extract agent credentials from headers or JSON-RPC _meta
  const rawMeta = params?._meta || req.body?._meta || {};
  const rawAuth =
    (req.headers.authorization as string) ||
    (req.headers['x-agent-key'] as string) ||
    (typeof rawMeta.apiKey === 'string' ? rawMeta.apiKey : undefined) ||
    (typeof rawMeta.authorization === 'string' ? rawMeta.authorization : undefined);

  let agentKey: string | undefined;
  let agentAuthHeader: string | undefined;

  if (rawAuth) {
    const trimmed = rawAuth.trim();
    if (trimmed.startsWith('Bearer ')) {
      agentKey = trimmed.substring(7).trim();
      agentAuthHeader = trimmed;
    } else {
      agentKey = trimmed;
      agentAuthHeader = `Bearer ${trimmed}`;
    }
  }

  // Extract x402 payment payload from _meta["x402/payment"] or HTTP headers
  const mcpPaymentPayload =
    rawMeta['x402/payment'] ||
    rawMeta['payment'] ||
    rawMeta['x402Payment'];

  const headerPayment = (
    req.headers['payment-signature'] ||
    req.headers['PAYMENT-SIGNATURE'] ||
    req.headers['x-payment'] ||
    req.headers['X-PAYMENT'] ||
    req.headers['x-402-payment-proof']
  ) as string | undefined;

  const effectivePayment = mcpPaymentPayload || headerPayment;

  // Forwarding headers for internal REST calls
  const forwardHeaders: Record<string, string> = {
    'x-payment-source': 'mcp'
  };
  if (agentAuthHeader) {
    forwardHeaders['Authorization'] = agentAuthHeader;
  }
  if (agentKey) {
    forwardHeaders['X-Agent-Key'] = agentKey;
  }
  if (effectivePayment) {
    const formattedPayment = typeof effectivePayment === 'string'
      ? effectivePayment
      : JSON.stringify(effectivePayment);
    forwardHeaders['PAYMENT-SIGNATURE'] = formattedPayment;
    forwardHeaders['X-PAYMENT'] = formattedPayment;
  }

  // Soft-accept MCP JSON-RPC notifications (Glama health sends notifications/initialized).
  if (
    typeof method === 'string' &&
    (method === 'notifications/initialized' ||
      method.startsWith('notifications/') ||
      method === 'initialized')
  ) {
    res.status(200);
    if (id !== undefined && id !== null) {
      return res.json({ jsonrpc: '2.0', id, result: null });
    }
    return res.send('');
  }

  if (method === "ping") {
    return res.json({
      jsonrpc: "2.0",
      id: id !== undefined ? id : null,
      result: {},
    });
  }

  if (method === "initialize") {
    recordMachineCommerceEvent({
      eventType: 'external_discovery',
      source: 'mcp',
      endpoint: 'initialize'
    });
    return res.json({
      jsonrpc: "2.0",
      id: id !== undefined ? id : null,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "stock-bloc-mcp-server",
          version: "2.2.0",
        },
      },
    });
  }

  if (method === "tools/list") {
    recordMachineCommerceEvent({
      eventType: 'external_discovery',
      source: 'mcp',
      endpoint: 'tools/list'
    });
    return res.json({
      jsonrpc: "2.0",
      id: id !== undefined ? id : null,
      result: {
        tools: MCP_TOOLS,
      },
    });
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params || {};

    // If it is a paid MCP tool, validate inputs first!
    if (PAID_MCP_TOOLS.has(name)) {
      const valParams = getMcpValidationParams(name, args);
      if (valParams) {
        const valResult = await validatePricedRequestInput(
          valParams.endpointId,
          valParams.rawPath,
          valParams.method,
          valParams.query,
          valParams.body
        );
        if (!valResult.valid) {
          const failure = valResult as any;
          return res.json({
            jsonrpc: "2.0",
            id: id !== undefined ? id : null,
            result: {
              isError: true,
              charged: false,
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "error",
                    code: failure.code,
                    error: failure.error,
                    message: failure.message,
                    ...(failure.field ? { field: failure.field } : {}),
                    charged: false
                  }, null, 2)
                }
              ]
            }
          });
        }
      }

      // If valid, but no x402 payment, return standard payment required response
      // (Both anonymous and keyed callers without payment get the same response)
      if (!effectivePayment) {
        const pricing = MCP_TOOL_PRICING[name];
        recordMachineCommerceEvent({
          eventType: 'payment_required',
          source: 'mcp',
          endpoint: name,
          amountUsd: pricing?.priceUsd
        });
        return res.json(buildMcpPaymentRequiredResponse(name, baseUrl, id));
      }
    }

    if (effectivePayment) {
      recordMachineCommerceEvent({
        eventType: 'payment_attempt',
        source: 'mcp',
        endpoint: name
      });
    }

    try {
      let fetchRes: any;
      let toolOutputData: any;

      if (name === "analyze_sec_filing" || name === "sec_analyst") {
        const ticker = args.ticker ? String(args.ticker).toUpperCase().trim() : '';
        const filingType = args.filingType ? String(args.filingType).trim().toUpperCase() : '10-K';
        fetchRes = await fetch(`${baseUrl}/api/v1/sec/job`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({
            ticker,
            filingType,
            question: args.question
          })
        });
      } else if (name === "get_stock_quote") {
        const symbol = args.symbol ? String(args.symbol).toUpperCase().trim() : '';
        fetchRes = await fetch(`${baseUrl}/api/live-quote/${symbol}`, {
          headers: forwardHeaders
        });
      } else if (name === "run_quant_simulation") {
        let allocation = args.allocation;
        if (!allocation && Array.isArray(args.tickers) && Array.isArray(args.weights)) {
          allocation = {};
          args.tickers.forEach((t: string, i: number) => {
            allocation[t] = args.weights[i] !== undefined ? args.weights[i] : 1 / args.tickers.length;
          });
        }
        fetchRes = await fetch(`${baseUrl}/api/v1/agent/quant-sim`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({
            tickers: args.tickers,
            weights: args.weights,
            allocation: allocation,
            initialCapital: args.initialCapital || 10000,
          }),
        });
      } else if (name === "evaluate_tsunami_strategy") {
        fetchRes = await fetch(`${baseUrl}/api/v1/agent/strategy/evaluate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({
            allocation: args.allocation,
            benchmark: args.benchmark || "super_sonic_tsunami",
            riskTolerance: args.riskTolerance || "moderate",
            horizonDays: args.horizonDays || 90
          })
        });
      } else if (name === "submit_agent_trade_idea") {
        fetchRes = await fetch(`${baseUrl}/api/v1/agent/submit-performance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({
            agentId: args.agentId,
            handle: args.handle,
            ticker: args.ticker,
            action: args.action,
            targetPrice: args.targetPrice,
            timeframe: args.timeframe || "90-Day Horizon",
            confidence: args.confidence,
            rationale: args.rationale
          })
        });
      } else if (name === "search_13f_whale_filings") {
        fetchRes = await fetch(`${baseUrl}/api/data/sec`, {
          headers: forwardHeaders
        });
      } else if (name === "get_sb_score_history") {
        const ticker = args.ticker ? String(args.ticker).toUpperCase().trim() : '';
        const url = new URL(`${baseUrl}/api/v1/intelligence/sb-score/history`);
        if (ticker) url.searchParams.set("ticker", ticker);
        if (args.limit) url.searchParams.set("limit", String(args.limit));
        if (args.cursor) url.searchParams.set("cursor", String(args.cursor));
        if (args.methodologyVersion) url.searchParams.set("methodologyVersion", String(args.methodologyVersion));

        fetchRes = await fetch(url.toString(), {
          headers: forwardHeaders
        });
      } else if (name === "get_agent_leaderboard") {
        fetchRes = await fetch(`${baseUrl}/api/v1/agent/leaderboard`, {
          headers: forwardHeaders
        });
      } else if (name === "get_top_trade_ideas") {
        const url = new URL(`${baseUrl}/api/v1/agent/trade-ideas`);
        if (args.ticker) url.searchParams.set("ticker", String(args.ticker));
        if (args.limit) url.searchParams.set("limit", String(args.limit));
        fetchRes = await fetch(url.toString(), {
          headers: forwardHeaders
        });
      } else if (name === "analyze_stock_ai") {
        const symbol = String(args.symbol || "NVDA").toUpperCase();
        fetchRes = await fetch(`${baseUrl}/api/ai/stock-analysis`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({ ticker: symbol }),
        });
      } else if (name === "get_data_status") {
        fetchRes = await fetch(`${baseUrl}/api/v1/data-status`, {
          headers: forwardHeaders
        });
      } else if (name === "get_daily_triggers" || name === "daily_triggers") {
        const url = new URL(`${baseUrl}/api/v1/signals/daily-triggers`);
        if (args?.ticker) url.searchParams.set("ticker", String(args.ticker));
        fetchRes = await fetch(url.toString(), {
          headers: forwardHeaders
        });
      } else if (name === "get_ebook_playbook") {
        const ebookId = args.ebookId || "wealth_operating_system";
        return res.json({
          jsonrpc: "2.0",
          id: id !== undefined ? id : null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    ebookId,
                    title: "Stock Bloc Wealth Operating System",
                    downloadUrl: `${baseUrl}/api/download/ebook/${ebookId}`,
                    format: "High-Resolution PDF",
                    author: "Jumanne Carter / Jay West Philly",
                  },
                  null,
                  2
                ),
              },
            ],
          },
        });
      } else {
        return res.status(400).json({
          jsonrpc: "2.0",
          id: id !== undefined ? id : null,
          error: { code: -32601, message: `Method or tool not found: ${name}` },
        });
      }

      // Handle 402 from internal service (exhausted credits, invalid payment, or payment required)
      if (fetchRes.status === 402) {
        const data = await fetchRes.json().catch(() => ({}));
        const pricing = MCP_TOOL_PRICING[name];
        recordMachineCommerceEvent({
          eventType: 'payment_required',
          source: 'mcp',
          endpoint: name,
          amountUsd: pricing?.priceUsd
        });

        const isRejection = data.status === 'payment_rejected' || data.status === 'payment_verification_failed' || data.status === 'payment_settlement_failed';
        const mcpErrorResult = {
          jsonrpc: "2.0",
          id: id !== undefined ? id : null,
          result: {
            isError: true,
            structuredContent: data,
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2)
              }
            ],
            _meta: {
              ...(isRejection ? { "x402/payment-error": data } : {}),
              "x402/payment-required": data
            }
          }
        };

        return res.json(mcpErrorResult);
      }

      // Handle non-OK HTTP statuses
      if (!fetchRes.ok) {
        const errData = await fetchRes.json().catch(() => ({}));
        return res.json({
          jsonrpc: "2.0",
          id: id !== undefined ? id : null,
          error: {
            code: -32000,
            message: errData.error || errData.message || `Internal execution error: HTTP ${fetchRes.status}`
          }
        });
      }

      // Read successful output payload
      toolOutputData = await fetchRes.json();

      if (name === "get_agent_leaderboard") {
        const agents = toolOutputData.leaderboard || [];
        const limit = args.limit || 10;
        const sliced = agents.slice(0, limit);
        toolOutputData = {
          summary: `Retrieved ${sliced.length} top Stock Bloc AI agents`,
          totalAgents: toolOutputData.totalAgentsRanked || agents.length,
          topAgents: sliced,
          data_as_of: toolOutputData.data_as_of || new Date().toISOString()
        };
      } else if (name === "search_13f_whale_filings") {
        let funds = Array.isArray(toolOutputData.funds) ? toolOutputData.funds : [];
        const manager = args.manager ? String(args.manager).toLowerCase() : "";
        if (manager) {
          funds = funds.filter((f: any) =>
            (f.fund_name || f.fundName || "").toLowerCase().includes(manager) ||
            (f.manager || "").toLowerCase().includes(manager) ||
            (f.id || "").toLowerCase().includes(manager)
          );
        }
        toolOutputData = {
          source: "/api/data/sec",
          updated_at: toolOutputData.updated_at || new Date().toISOString(),
          stale: Boolean(toolOutputData.stale),
          funds,
          macroSummary: toolOutputData.macroSummary || ""
        };
      }

      // Decode PAYMENT-RESPONSE header if present
      let paymentResponseMeta: any = undefined;
      const rawPaymentResponse = fetchRes.headers.get('payment-response');
      if (rawPaymentResponse) {
        try {
          paymentResponseMeta = decodePaymentResponseHeader(rawPaymentResponse);
        } catch {
          try {
            paymentResponseMeta = JSON.parse(Buffer.from(rawPaymentResponse, 'base64').toString('utf8'));
          } catch {
            paymentResponseMeta = { success: true, header: rawPaymentResponse };
          }
        }
      }

      return res.json({
        jsonrpc: "2.0",
        id: id !== undefined ? id : null,
        result: {
          content: [
            {
              type: "text",
              text: typeof toolOutputData === "string" ? toolOutputData : JSON.stringify(toolOutputData, null, 2)
            }
          ],
          ...(paymentResponseMeta ? {
            _meta: {
              "x402/payment-response": paymentResponseMeta
            }
          } : {})
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        jsonrpc: "2.0",
        id: id !== undefined ? id : null,
        error: { code: -32603, message: `Internal MCP tool execution error: ${err?.message || err}` },
      });
    }
  }

  return res.status(400).json({
    jsonrpc: "2.0",
    id: id || null,
    error: { code: -32601, message: `Unsupported MCP RPC method: ${method}` },
  });
};
