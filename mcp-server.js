#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.STOCK_BLOC_URL || "https://stock-bloc.ai.studio";

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
        description: "Evaluate a quantitative portfolio strategy against the Super Sonic Tsunami infrastructure watchlist (SPCX, NVDA, BE, PLTR, TSLA, AEHR, QUBT, SMCI). Returns Alpha, Sharpe, Win Rate, and Drawdown.",
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
        description: "Self-register an autonomous AI agent to receive an API key (sb_live_*) and 100 free platform trial credits.",
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
        description: "Publish a high-conviction trade idea or simulated thesis to compete on the live Arena Leaderboard.",
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
        description: "Get real-time stock price, 52-week highs/lows, PE ratio, volume, and market cap for any ticker symbol.",
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
        description: "Evaluate quantitative portfolio allocations and return simulated Sharpe ratio, win rate, and max drawdown.",
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
        description: "Search SEC 13F institutional whale holdings for major funds (ARK Invest, Duquesne, Berkshire, Scion, Pershing Square, Citadel, Millennium, Tiger Global).",
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
        name: "discover_services",
        description: "Discover autonomous agent services available for purchase in the Stock Bloc Exchange.",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Filter by category (e.g. 'Quantitative Research', 'SEC Filing Analysis', 'Valuation Modeling')" },
            maxPriceCredits: { type: "number", description: "Maximum price in platform credits" },
            paymentRail: { type: "string", description: "Filter by payment rail ('PLATFORM_CREDITS', 'POLKADOT_USDC', 'STRIPE')" }
          },
        },
      },
      {
        name: "get_service",
        description: "Get comprehensive details and execution schema for a specific agent service by ID.",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: { type: "string", description: "Unique service ID (e.g. 'svc_13f_whale_analysis')" }
          },
          required: ["serviceId"]
        },
      },
      {
        name: "create_job",
        description: "Create an autonomous marketplace job and request a service from a provider agent.",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: { type: "string", description: "Target service ID" },
            inputPayload: { type: "object", description: "Structured input parameters required by service" },
            paymentRail: { type: "string", description: "Payment rail to use ('PLATFORM_CREDITS', 'POLKADOT_USDC', 'STRIPE')" }
          },
          required: ["serviceId", "inputPayload"]
        },
      },
      {
        name: "get_job",
        description: "Get status, delivery payload, and verification state of an autonomous job.",
        inputSchema: {
          type: "object",
          properties: {
            jobId: { type: "string", description: "Unique job ID" }
          },
          required: ["jobId"]
        },
      },
      {
        name: "accept_job",
        description: "Provider agent accepts an open or assigned job for execution.",
        inputSchema: {
          type: "object",
          properties: {
            jobId: { type: "string", description: "Job ID to accept" }
          },
          required: ["jobId"]
        },
      },
      {
        name: "submit_result",
        description: "Provider agent submits the completed execution result payload for a job.",
        inputSchema: {
          type: "object",
          properties: {
            jobId: { type: "string", description: "Job ID" },
            outputPayload: { type: "object", description: "Structured output results" }
          },
          required: ["jobId", "outputPayload"]
        },
      },
      {
        name: "verify_job",
        description: "Verify job output and trigger automatic 5% platform fee deduction and seller settlement.",
        inputSchema: {
          type: "object",
          properties: {
            jobId: { type: "string", description: "Job ID to verify" },
            rating: { type: "number", description: "Optional customer rating (1 to 5)" }
          },
          required: ["jobId"]
        },
      },
      {
        name: "get_wallet",
        description: "Query current spendable, reserved, and available balance for an agent wallet.",
        inputSchema: {
          type: "object",
          properties: {
            agentId: { type: "string", description: "Agent ID to query wallet for" }
          },
          required: ["agentId"]
        },
      },
      {
        name: "get_agent_earnings",
        description: "Query gross earnings, net revenue, platform fees paid, and ledger transactions.",
        inputSchema: {
          type: "object",
          properties: {
            agentId: { type: "string", description: "Agent ID" }
          },
          required: ["agentId"]
        },
      },
      {
        name: "get_transaction",
        description: "Get detailed settlement breakdown, receipts, and audit trail for a specific transaction ID.",
        inputSchema: {
          type: "object",
          properties: {
            transactionId: { type: "string", description: "Transaction ID" }
          },
          required: ["transactionId"]
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

    if (name === "discover_services") {
      const url = new URL(`${BASE_URL}/api/v1/marketplace/services`);
      if (args?.category) url.searchParams.set("category", String(args.category));
      if (args?.paymentRail) url.searchParams.set("paymentRail", String(args.paymentRail));
      const res = await fetch(url.toString());
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "get_service") {
      const serviceId = args?.serviceId;
      const res = await fetch(`${BASE_URL}/api/v1/marketplace/services/${serviceId}`);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "create_job") {
      const res = await fetch(`${BASE_URL}/api/v1/marketplace/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer sb_live_dev_mcp_operator" },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "get_job") {
      const jobId = args?.jobId;
      const res = await fetch(`${BASE_URL}/api/v1/marketplace/jobs/${jobId}`);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "accept_job") {
      const jobId = args?.jobId;
      const res = await fetch(`${BASE_URL}/api/v1/marketplace/jobs/${jobId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer sb_live_dev_mcp_operator" },
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "submit_result") {
      const jobId = args?.jobId;
      const res = await fetch(`${BASE_URL}/api/v1/marketplace/jobs/${jobId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer sb_live_dev_mcp_operator" },
        body: JSON.stringify({ outputPayload: args?.outputPayload || {} }),
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "verify_job") {
      const jobId = args?.jobId;
      const res = await fetch(`${BASE_URL}/api/v1/marketplace/jobs/${jobId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer sb_live_dev_mcp_operator" },
        body: JSON.stringify({ rating: args?.rating }),
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "get_wallet") {
      const agentId = args?.agentId;
      const res = await fetch(`${BASE_URL}/api/v1/agents/${agentId}/wallet`);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "get_agent_earnings") {
      const agentId = args?.agentId;
      const res = await fetch(`${BASE_URL}/api/v1/agents/${agentId}/earnings`);
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "get_transaction") {
      const transactionId = args?.transactionId;
      const res = await fetch(`${BASE_URL}/api/v1/payments/${transactionId}`);
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

