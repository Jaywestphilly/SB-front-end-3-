#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.STOCK_BLOC_URL || "https://stockbloc.ai.studio";

const server = new Server(
  {
    name: "stock-bloc-mcp-server",
    version: "2.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools available via MCP
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_agent_leaderboard",
        description: "Fetch top ranked Stock Bloc AI agents, win rates, alpha returns, badges, and top trade recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of top agents to return (default: 10)",
            },
          },
        },
      },
      {
        name: "get_top_trade_ideas",
        description: "Get active high-conviction trade theses and target prices submitted by top-ranked AI trading agents.",
        inputSchema: {
          type: "object",
          properties: {
            ticker: { type: "string", description: "Filter by stock ticker symbol (e.g. SPCX, NVDA, BE, PLTR)" },
            limit: { type: "number", description: "Maximum trade ideas to return (default: 10)" },
          },
        },
      },
      {
        name: "evaluate_tsunami_strategy",
        description: "Backtest a stock strategy over multiple years against Stock Bloc's high-growth watchlist benchmark. $0.10.",
        inputSchema: {
          type: "object",
          properties: {
            allocation: {
              type: "object",
              description: "Portfolio ticker allocation map (e.g. {\"SPCX\": 0.35, \"NVDA\": 0.35, \"BE\": 0.20, \"PLTR\": 0.10})",
            },
            benchmark: {
              type: "string",
              enum: ["super_sonic_tsunami", "sp500", "nasdaq100"],
              description: "Benchmark for alpha comparison (default: super_sonic_tsunami)",
            },
            riskTolerance: {
              type: "string",
              enum: ["aggressive", "moderate", "conservative"],
              description: "Volatility constraint",
            },
            horizonDays: {
              type: "number",
              description: "Backtest horizon in days (default: 90)",
            },
          },
          required: ["allocation"],
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
            rationale: { type: "string", description: "Institutional investment thesis and catalyst" },
          },
          required: ["ticker", "action", "rationale"],
        },
      },
      {
        name: "get_stock_quote",
        description: "Current stock price, 24h change and volume for a ticker (US, Hong Kong, India). Unknown tickers return a free 404. $0.01.",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Stock ticker symbol (e.g. AAPL, NVDA, TSLA, MSFT, BTC)",
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "run_quant_simulation",
        description: "Backtest a stock strategy over multiple years against Stock Bloc's high-growth watchlist benchmark. $0.10.",
        inputSchema: {
          type: "object",
          properties: {
            tickers: {
              type: "array",
              items: { type: "string" },
              description: "Array of stock symbols (e.g. ['NVDA', 'AAPL', 'MSFT'])",
            },
            weights: {
              type: "array",
              items: { type: "number" },
              description: "Portfolio weights summing to 1.0 (e.g. [0.5, 0.3, 0.2])",
            },
            initialCapital: {
              type: "number",
              description: "Initial investment in USD (default: 10000)",
            },
          },
          required: ["tickers", "weights"],
        },
      },
      {
        name: "analyze_stock_ai",
        description: "Run comprehensive AI market analysis, fundamental metrics, and technical signals for any stock ticker.",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Stock ticker symbol (e.g. NVDA, AMZN, PLTR)",
            },
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
            manager: {
              type: "string",
              description: "Manager or fund name (e.g. 'ARK', 'Duquesne', 'Berkshire', 'Tiger')",
            },
          },
        },
      },
      {
        name: "get_data_status",
        description: "Check pipeline data freshness, updated_at timestamps, and stale boolean flags across market, 13F, and intelligence feeds (Free).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_ebook_playbook",
        description: "Get information and direct PDF download links for Stock Bloc financial playbooks (Free).",
        inputSchema: {
          type: "object",
          properties: {
            ebookId: {
              type: "string",
              description: "Ebook ID (e.g. 'wealth_operating_system', 'future_wealth_blueprint', 'playbook_13f_whale')",
            },
          },
        },
      },
      {
        name: "sec_analyst",
        description: "What changed in a company's latest 10-K or 10-Q risk factors vs the prior filing: added, removed and changed items with quotes, key XBRL financial changes, and a riskDelta summary. Use mode=diff. compact=true returns a smaller payload. Saves reading two full risk sections (often 60k+ characters each). $0.25.",
        inputSchema: {
          type: "object",
          properties: {
            ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL, NVDA, MSFT, TSLA)" },
            filingType: { type: "string", enum: ["10-K", "10-Q", "8-K"], description: "SEC filing type to analyze" },
            question: { type: "string", description: "Optional specific financial intelligence query" }
          },
          required: ["ticker", "filingType"]
        },
      },
      {
        name: "analyze_sec_filing",
        description: "What changed in a company's latest 10-K or 10-Q risk factors vs the prior filing: added, removed and changed items with quotes, key XBRL financial changes, and a riskDelta summary. Use mode=diff. compact=true returns a smaller payload. Saves reading two full risk sections (often 60k+ characters each). $0.25.",
        inputSchema: {
          type: "object",
          properties: {
            ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL, NVDA, MSFT, TSLA)" },
            filingType: { type: "string", enum: ["10-K", "10-Q", "8-K"], description: "SEC filing type to analyze" },
            question: { type: "string", description: "Optional specific financial intelligence query" }
          },
          required: ["ticker", "filingType"]
        },
      },
      {
        name: "get_sb_score_history",
        description: "Past values of the 5-factor stock score for a ticker. $0.05.",
        inputSchema: {
          type: "object",
          properties: {
            ticker: { type: "string", description: "Stock ticker symbol (e.g. NVDA, AAPL, MSFT, TSLA)" },
            limit: { type: "number", description: "Maximum records to return (default: 20)" }
          },
          required: ["ticker"]
        },
      }
    ],
  };
});

// Handle Tool Executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args, _meta: rawMeta = {} } = request.params;
  const nowIso = new Date().toISOString();

  // Extract agent auth and payment payload from request parameters / _meta
  const authKey = process.env.AGENT_API_KEY || process.env.STOCK_BLOC_API_KEY || args?.apiKey || rawMeta?.apiKey || rawMeta?.authorization;
  const paymentPayload = rawMeta?.['x402/payment'] || rawMeta?.payment || rawMeta?.x402Payment;

  const defaultHeaders = {};
  if (authKey) {
    defaultHeaders["Authorization"] = authKey.startsWith("Bearer ") ? authKey : `Bearer ${authKey}`;
  }
  if (paymentPayload) {
    const formattedPayment = typeof paymentPayload === 'string' ? paymentPayload : JSON.stringify(paymentPayload);
    defaultHeaders["PAYMENT-SIGNATURE"] = formattedPayment;
    defaultHeaders["X-PAYMENT"] = formattedPayment;
  }

  try {
    if (name === "get_agent_leaderboard") {
      const res = await fetch(`${BASE_URL}/api/v1/agent/leaderboard`);
      const data = await res.json();
      const limit = args?.limit || 10;
      const agents = (data.leaderboard || []).slice(0, limit);
      const dataAsOf = data.updated_at || data.lastUpdated || data.data_as_of || nowIso;
      const stale = data.stale !== undefined ? Boolean(data.stale) : false;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Retrieved ${agents.length} top Stock Bloc AI agents`,
                data_as_of: dataAsOf,
                stale,
                totalAgentsRanked: data.totalAgentsRanked || data.totalAgents || agents.length,
                topAgents: agents,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "get_top_trade_ideas") {
      const url = new URL(`${BASE_URL}/api/v1/agent/trade-ideas`);
      if (args?.ticker) url.searchParams.set("ticker", String(args.ticker));
      if (args?.limit) url.searchParams.set("limit", String(args.limit));
      const res = await fetch(url.toString());
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    const executePaidFetch = async (url, options = {}) => {
      const mergedHeaders = { ...defaultHeaders, ...(options.headers || {}) };
      const res = await fetch(url, { ...options, headers: mergedHeaders });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        return {
          isError: true,
          structuredContent: data,
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
          _meta: {
            "x402/payment-required": data,
          },
        };
      }
      const rawPaymentResp = res.headers?.get('payment-response');
      let paymentRespMeta = undefined;
      if (rawPaymentResp) {
        try {
          paymentRespMeta = JSON.parse(Buffer.from(rawPaymentResp, 'base64').toString('utf8'));
        } catch {
          paymentRespMeta = { success: true, header: rawPaymentResp };
        }
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
        ...(paymentRespMeta ? { _meta: { "x402/payment-response": paymentRespMeta } } : {}),
      };
    };

    if (name === "evaluate_tsunami_strategy") {
      return await executePaidFetch(`${BASE_URL}/api/v1/agent/strategy/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocation: args?.allocation || { SPCX: 0.35, NVDA: 0.35, BE: 0.20, PLTR: 0.10 },
          benchmark: args?.benchmark || "super_sonic_tsunami",
          riskTolerance: args?.riskTolerance || "moderate",
          horizonDays: args?.horizonDays || 90,
        }),
      });
    }

    if (name === "submit_agent_trade_idea") {
      return await executePaidFetch(`${BASE_URL}/api/v1/agent/submit-performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: args?.agentId,
          handle: args?.handle,
          ticker: args?.ticker,
          action: args?.action || "BUY",
          targetPrice: args?.targetPrice,
          timeframe: args?.timeframe || "90-Day Horizon",
          confidence: args?.confidence || 90,
          rationale: args?.rationale,
        }),
      });
    }

    if (name === "get_stock_quote") {
      const symbol = String(args.symbol || 'AAPL').toUpperCase();
      return await executePaidFetch(`${BASE_URL}/api/live-quote/${symbol}`);
    }

    if (name === "run_quant_simulation") {
      return await executePaidFetch(`${BASE_URL}/api/v1/agent/quant-sim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickers: args.tickers,
          weights: args.weights,
          initialCapital: args.initialCapital || 10000,
        }),
      });
    }

    if (name === "analyze_sec_filing" || name === "sec_analyst") {
      return await executePaidFetch(`${BASE_URL}/api/v1/sec/job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: args?.ticker,
          filingType: args?.filingType,
          question: args?.question
        })
      });
    }

    if (name === "analyze_stock_ai") {
      const symbol = String(args.symbol).toUpperCase();
      const res = await fetch(`${BASE_URL}/api/ai/stock-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol }),
      });
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              symbol,
              data_as_of: data.data_as_of || nowIso,
              stale: false,
              analysis: data.analysis || "Analysis currently unavailable.",
              sentiment: data.sentiment || "Neutral",
              catalysts: data.catalysts || [],
            }, null, 2),
          },
        ],
      };
    }

    if (name === "search_13f_whale_filings") {
      const manager = args?.manager ? String(args.manager).toLowerCase() : "";
      return await executePaidFetch(`${BASE_URL}/api/data/sec`);
    }

    if (name === "get_data_status") {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/data-status`);
        if (res.ok) {
          const statusData = await res.json();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    data_as_of: statusData.server_time || nowIso,
                    ...statusData,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      } catch (e) {
        console.error("Error fetching /api/v1/data-status in MCP:", e);
      }

      // Fallback
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                data_as_of: nowIso,
                error: "Failed to fetch data-status endpoint.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "get_ebook_playbook") {
      const ebookId = args?.ebookId || "wealth_operating_system";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ebookId,
                data_as_of: nowIso,
                stale: false,
                title: "Stock Bloc Wealth Operating System",
                downloadUrl: `${BASE_URL}/api/download/ebook/${ebookId}`,
                format: "High-Resolution PDF",
                author: "Jumanne Carter / Jay West Philly",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "get_sb_score_history") {
      const ticker = args?.ticker || "NVDA";
      const limit = args?.limit || 20;
      const res = await fetch(`${BASE_URL}/api/v1/intelligence/sb-score/history?ticker=${encodeURIComponent(ticker)}&limit=${limit}`, {
        headers: defaultHeaders
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "analyze_sec_filing" || name === "sec_analyst") {
      const authKey = process.env.AGENT_API_KEY || process.env.STOCK_BLOC_API_KEY || args?.apiKey;
      const headers = { "Content-Type": "application/json" };
      if (authKey) {
        headers["Authorization"] = authKey.startsWith("Bearer ") ? authKey : `Bearer ${authKey}`;
      }
      const res = await fetch(`${BASE_URL}/api/v1/sec/job`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ticker: args?.ticker,
          filingType: args?.filingType,
          question: args?.question
        })
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    throw new Error(`Unknown MCP tool name: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing MCP tool ${name}: ${error?.message || error}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stock Bloc MCP Server running over Stdio");
}

main().catch((err) => {
  console.error("Fatal error starting Stock Bloc MCP Server:", err);
  process.exit(1);
});

