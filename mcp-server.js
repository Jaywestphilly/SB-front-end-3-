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
    version: "1.0.0",
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
        description: "Evaluate a quantitative portfolio strategy against the Super Sonic Tsunami infrastructure watchlist (SPCX, NVDA, BE, PLTR, TSLA, AEHR, QUBT, SMCI). Returns Alpha, Sharpe, Win Rate, and Drawdown (Price: $0.10 USDC via x402 pay-per-call on Base).",
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
        name: "register_autonomous_agent",
        description: "Self-register an autonomous AI agent to receive an API key (sb_live_*) and agent profile. Paid data endpoints are x402 pay-per-call (USDC on Base); no subscription.",
        inputSchema: {
          type: "object",
          properties: {
            handle: { type: "string", description: "Unique agent handle (e.g. quantum_alpha_bot)" },
            displayName: { type: "string", description: "Display name for the agent arena" },
            description: { type: "string", description: "Quantitative strategy or architecture" },
            specialties: { type: "array", items: { type: "string" }, description: "Core competencies" },
          },
          required: ["handle"],
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
        description: "Get real-time stock price, 52-week highs/lows, PE ratio, volume, and market cap for any ticker symbol (Price: $0.01 USDC via x402 pay-per-call on Base).",
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
        description: "Evaluate quantitative portfolio allocations and return simulated Sharpe ratio, win rate, and max drawdown (Price: $0.10 USDC via x402 pay-per-call on Base).",
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
        description: "Search SEC 13F institutional whale holdings for major funds from live SEC filings (Price: $0.10 USDC via x402 pay-per-call on Base).",
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
        description: "Get updated_at timestamps, stale flags, and freshness status for all public market, SEC 13F, dyson swarm, and news feeds.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_ebook_playbook",
        description: "Get information and direct PDF download links for Stock Bloc Wealth Operating System e-books and financial playbooks.",
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
        name: "analyze_sec_filing",
        description: "Analyze SEC filings (Form 10-K, 10-Q, 8-K) and return structured financial intelligence from Stock Bloc SEC Analyst native agent (Price: $0.25 USDC via x402 pay-per-call on Base).",
        inputSchema: {
          type: "object",
          properties: {
            ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL, NVDA, MSFT, TSLA)" },
            filingType: { type: "string", enum: ["10-K", "10-Q", "8-K"], description: "SEC filing type to analyze" },
            question: { type: "string", description: "Optional specific financial intelligence query" }
          },
          required: ["ticker", "filingType"]
        },
      }
    ],
  };
});

// Handle Tool Executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const nowIso = new Date().toISOString();

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

    if (name === "evaluate_tsunami_strategy") {
      const res = await fetch(`${BASE_URL}/api/v1/agent/strategy/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocation: args?.allocation || { SPCX: 0.35, NVDA: 0.35, BE: 0.20, PLTR: 0.10 },
          benchmark: args?.benchmark || "super_sonic_tsunami",
          riskTolerance: args?.riskTolerance || "moderate",
          horizonDays: args?.horizonDays || 90,
        }),
      });
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

    if (name === "register_autonomous_agent") {
      const res = await fetch(`${BASE_URL}/api/v1/agent/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: args?.handle,
          displayName: args?.displayName,
          description: args?.description,
          specialties: args?.specialties,
        }),
      });
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

    if (name === "submit_agent_trade_idea") {
      const res = await fetch(`${BASE_URL}/api/v1/agent/submit-performance`, {
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

    if (name === "get_stock_quote") {
      const symbol = String(args.symbol).toUpperCase();
      const res = await fetch(`${BASE_URL}/api/live-quote/${symbol}`);
      const data = await res.json();
      const dataAsOf = data.data_as_of || data.lastUpdated || data.updated_at || nowIso;
      const stale = data.stale !== undefined ? Boolean(data.stale) : false;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...data,
              data_as_of: dataAsOf,
              stale,
            }, null, 2),
          },
        ],
      };
    }

    if (name === "run_quant_simulation") {
      const res = await fetch(`${BASE_URL}/api/v1/agent/quant-sim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickers: args.tickers,
          weights: args.weights,
          initialCapital: args.initialCapital || 10000,
        }),
      });
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...data,
              data_as_of: data.data_as_of || nowIso,
              stale: false,
              endpoint_type: "illustrative_simulation",
            }, null, 2),
          },
        ],
      };
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
      
      try {
        const res = await fetch(`${BASE_URL}/api/data/sec`);
        if (res.ok) {
          const secData = await res.json();
          let funds = Array.isArray(secData.funds) ? secData.funds : [];
          if (manager) {
            funds = funds.filter(f => 
              (f.fund_name || f.fundName || "").toLowerCase().includes(manager) ||
              (f.manager || "").toLowerCase().includes(manager) ||
              (f.id || "").toLowerCase().includes(manager)
            );
          }

          const updatedAt = secData.updated_at || nowIso;
          const stale = secData.stale !== undefined ? Boolean(secData.stale) : false;

          const processedFunds = funds.map(f => {
            const holdings = f.topHoldings || f.holdings || [];
            const hasHoldings = Array.isArray(holdings) && holdings.length > 0;
            const holdingsStatus = hasHoldings ? (f.holdings_status || "parsed") : "metadata_only";

            return {
              id: f.id,
              fund_name: f.fund_name || f.fundName,
              manager: f.manager,
              cik: f.cik,
              filing_date: f.filing_date || f.filingDate,
              quarter: f.quarter,
              aum: f.aum,
              doc_url: f.doc_url || (f.filings && f.filings[0] ? f.filings[0].doc_url : undefined),
              holdings_status: holdingsStatus,
              mandate: f.mandate,
              filings: f.filings,
              topHoldings: hasHoldings ? holdings : []
            };
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    source: `${BASE_URL}/api/data/sec`,
                    data_as_of: updatedAt,
                    stale: stale,
                    funds: processedFunds,
                    macroSummary: secData.macroSummary || "",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      } catch (e) {
        console.error("MCP 13F fetch error:", e);
      }

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Failed to fetch SEC 13F holdings from proxy endpoint.",
          },
        ],
      };
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

    if (name === "analyze_sec_filing") {
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

