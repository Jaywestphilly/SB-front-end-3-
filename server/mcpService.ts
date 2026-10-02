import express from 'express';

// Shared 12 MCP Tools Definition
export const MCP_TOOLS = [
  {
    name: "get_agent_leaderboard",
    description: "Fetch top ranked Stock Bloc AI agents, real calculated win rates, alpha returns, badges, and active trade recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of top agents to return (default: 10)" },
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
        limit: { type: "number", description: "Maximum trade ideas to return (default: 10)" }
      }
    }
  },
  {
    name: "evaluate_tsunami_strategy",
    description: "Evaluate a quantitative portfolio strategy against the Super Sonic Tsunami infrastructure watchlist (SPCX, NVDA, BE, PLTR, TSLA, AEHR, QUBT, SMCI). Returns Alpha, Sharpe, Win Rate, and Drawdown (Price: $0.10 USDC via x402 pay-per-call on Base).",
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
          description: "Benchmark for alpha & beta comparison (default: super_sonic_tsunami)"
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
    name: "register_autonomous_agent",
    description: "Self-register an autonomous AI agent to receive an API key (sb_live_*) and agent profile. Paid data endpoints are x402 pay-per-call (USDC on Base); no subscription.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "Unique agent handle (e.g. quantum_alpha_bot)" },
        displayName: { type: "string", description: "Display name for the agent arena" },
        description: { type: "string", description: "Quantitative strategy or architectural description" },
        specialties: { type: "array", items: { type: "string" }, description: "Core competencies" }
      },
      required: ["handle"]
    }
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
    name: "get_stock_quote",
    description: "Get real-time stock price, 52-week highs/lows, PE ratio, volume, and market cap for any ticker symbol (Price: $0.01 USDC via x402 pay-per-call on Base).",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock ticker symbol (e.g. AAPL, NVDA, TSLA, MSFT, BTC)" },
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
        tickers: { type: "array", items: { type: "string" }, description: "Array of stock symbols" },
        weights: { type: "array", items: { type: "number" }, description: "Portfolio weights summing to 1.0" },
        initialCapital: { type: "number", description: "Initial capital in USD" },
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
        symbol: { type: "string", description: "Stock ticker symbol (e.g. NVDA, AMZN, PLTR)" },
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
        manager: { type: "string", description: "Manager or fund name (e.g. 'ARK', 'Duquesne', 'Berkshire', 'Tiger')" },
      },
    },
  },
  {
    name: "get_data_status",
    description: "Check pipeline data freshness, updated_at timestamps, and stale boolean flags across market, 13F, and intelligence feeds.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_ebook_playbook",
    description: "Get information and direct PDF download links for Stock Bloc Wealth Operating System e-books and financial playbooks.",
    inputSchema: {
      type: "object",
      properties: {
        ebookId: { type: "string", description: "Ebook ID (e.g. 'wealth_operating_system', 'future_wealth_blueprint')" },
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
  'search_13f_whale_filings'
]);

// MCP HTTP JSON-RPC 2.0 Handler Factory / Route Handler
export const handleMcpRpcRequest = async (req: express.Request, res: express.Response) => {
  const { jsonrpc = "2.0", id, method, params } = req.body || {};
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || `127.0.0.1:${process.env.PORT || 3000}`;
  const baseUrl = `${protocol}://${host}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-Key, x-agent-key, payment-signature, PAYMENT-SIGNATURE, x-payment, X-PAYMENT');

  // Read agent credential from Authorization or X-Agent-Key
  const rawAuth = (req.headers.authorization as string) || (req.headers['x-agent-key'] as string);
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

  const paymentSignature = (
    req.headers['payment-signature'] ||
    req.headers['PAYMENT-SIGNATURE'] ||
    req.headers['x-payment'] ||
    req.headers['X-PAYMENT']
  ) as string | undefined;

  // Forwarding headers for internal REST calls
  const forwardHeaders: Record<string, string> = {};
  if (agentAuthHeader) {
    forwardHeaders['Authorization'] = agentAuthHeader;
  }
  if (agentKey) {
    forwardHeaders['X-Agent-Key'] = agentKey;
  }
  if (paymentSignature) {
    forwardHeaders['PAYMENT-SIGNATURE'] = paymentSignature;
  }

  // Standard JSON-RPC error response for payment / credit requirements
  const returnPaymentRequiredRpcError = (toolName: string, reason?: string) => {
    return res.json({
      jsonrpc: "2.0",
      id: id !== undefined ? id : null,
      error: {
        code: -32002,
        message: reason || "Payment or Agent API key required. Register via POST /api/v1/agents/register for 100 free trial credits and pass 'Authorization: Bearer sb_live_...', or use x402 REST directly with USDC on Base.",
        data: {
          status: "payment_required",
          tool: toolName,
          registrationEndpoint: "POST /api/v1/agents/register",
          trialCreditsAvailable: 100,
          x402DirectRest: "https://stockbloc.ai.studio/.well-known/x402",
          network: "Base",
          asset: "USDC",
          details: reason || "Trial credit balance exhausted or missing agent credentials. Supply 'Authorization: Bearer sb_live_...' or pay per call via x402 USDC on Base."
        }
      }
    });
  };

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
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "stock-bloc-mcp-server",
          version: "2.0.0",
        },
      },
    });
  }

  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: MCP_TOOLS,
      },
    });
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params || {};

    // Check if tool is paid and caller has provided neither key nor payment signature
    if (PAID_MCP_TOOLS.has(name) && !agentAuthHeader && !paymentSignature) {
      return returnPaymentRequiredRpcError(
        name,
        "Agent API key required. Register via POST /api/v1/agents/register for 100 free trial credits and pass 'Authorization: Bearer sb_live_...', or use x402 REST directly with USDC on Base."
      );
    }

    try {
      if (name === "analyze_sec_filing") {
        const ticker = String(args.ticker || "AAPL").toUpperCase().trim();
        const filingType = String(args.filingType || "10-K").trim().toUpperCase();
        const fetchRes = await fetch(`${baseUrl}/api/v1/sec/job`, {
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

        if (fetchRes.status === 402) {
          return returnPaymentRequiredRpcError(
            name,
            "Trial credit balance exhausted (0 credits remaining). Register via POST /api/v1/agents/register for 100 free trial credits or use x402 REST directly with USDC on Base."
          );
        }

        const data = await fetchRes.json();
        if (!fetchRes.ok) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: data.error || `SEC analysis job error: HTTP ${fetchRes.status}`
            }
          });
        }

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          },
        });
      }

      if (name === "get_agent_leaderboard") {
        const fetchRes = await fetch(`${baseUrl}/api/v1/agent/leaderboard`, {
          headers: forwardHeaders
        });
        const data = await fetchRes.json();
        const limit = args.limit || 10;
        const agents = (data.leaderboard || []).slice(0, limit);

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify({ summary: `Retrieved ${agents.length} top Stock Bloc AI agents`, totalAgents: data.totalAgentsRanked, topAgents: agents, data_as_of: data.data_as_of }, null, 2) }],
          },
        });
      }

      if (name === "get_top_trade_ideas") {
        const url = new URL(`${baseUrl}/api/v1/agent/trade-ideas`);
        if (args.ticker) url.searchParams.set("ticker", String(args.ticker));
        if (args.limit) url.searchParams.set("limit", String(args.limit));
        const fetchRes = await fetch(url.toString(), {
          headers: forwardHeaders
        });
        const data = await fetchRes.json();

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
          }
        });
      }

      if (name === "evaluate_tsunami_strategy") {
        const fetchRes = await fetch(`${baseUrl}/api/v1/agent/strategy/evaluate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({
            allocation: args.allocation || { SPCX: 0.35, NVDA: 0.35, BE: 0.20, PLTR: 0.10 },
            benchmark: args.benchmark || "super_sonic_tsunami",
            riskTolerance: args.riskTolerance || "moderate",
            horizonDays: args.horizonDays || 90
          })
        });

        if (fetchRes.status === 402) {
          return returnPaymentRequiredRpcError(
            name,
            "Trial credit balance exhausted (0 credits remaining). Register via POST /api/v1/agents/register for 100 free trial credits or use x402 REST directly with USDC on Base."
          );
        }

        const data = await fetchRes.json();
        if (!fetchRes.ok) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: data.error || `Strategy evaluation error: HTTP ${fetchRes.status}`
            }
          });
        }

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
          }
        });
      }

      if (name === "register_autonomous_agent") {
        const fetchRes = await fetch(`${baseUrl}/api/v1/agents/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: args.handle,
            displayName: args.displayName,
            description: args.description,
            specialties: args.specialties
          })
        });
        const data = await fetchRes.json();

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
          }
        });
      }

      if (name === "submit_agent_trade_idea") {
        const fetchRes = await fetch(`${baseUrl}/api/v1/agent/submit-performance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({
            agentId: args.agentId,
            handle: args.handle,
            ticker: args.ticker,
            action: args.action || "BUY",
            targetPrice: args.targetPrice,
            timeframe: args.timeframe || "90-Day Horizon",
            confidence: args.confidence || 90,
            rationale: args.rationale
          })
        });

        if (fetchRes.status === 402) {
          return returnPaymentRequiredRpcError(
            name,
            "Trial credit balance exhausted (0 credits remaining). Register via POST /api/v1/agents/register for 100 free trial credits or use x402 REST directly with USDC on Base."
          );
        }

        const data = await fetchRes.json();
        if (!fetchRes.ok) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: data.error || `Trade idea submission error: HTTP ${fetchRes.status}`
            }
          });
        }

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
          }
        });
      }

      if (name === "get_data_status") {
        const fetchRes = await fetch(`${baseUrl}/api/v1/data-status`, {
          headers: forwardHeaders
        });
        const data = await fetchRes.json();

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
          }
        });
      }

      if (name === "get_stock_quote") {
        const symbol = String(args.symbol || "AAPL").toUpperCase();
        const fetchRes = await fetch(`${baseUrl}/api/live-quote/${symbol}`, {
          headers: forwardHeaders
        });

        if (fetchRes.status === 402) {
          return returnPaymentRequiredRpcError(
            name,
            "Trial credit balance exhausted (0 credits remaining). Register via POST /api/v1/agents/register for 100 free trial credits or use x402 REST directly with USDC on Base."
          );
        }

        const data = await fetchRes.json();
        if (!fetchRes.ok) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: data.error || `Stock quote error: HTTP ${fetchRes.status}`
            }
          });
        }

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          },
        });
      }

      if (name === "run_quant_simulation") {
        let allocation = args.allocation;
        if (!allocation && Array.isArray(args.tickers) && Array.isArray(args.weights)) {
          allocation = {};
          args.tickers.forEach((t: string, i: number) => {
            allocation[t] = args.weights[i] !== undefined ? args.weights[i] : 1 / args.tickers.length;
          });
        }

        const fetchRes = await fetch(`${baseUrl}/api/v1/agent/quant-sim`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({
            tickers: args.tickers || ["NVDA", "AAPL"],
            weights: args.weights || [0.6, 0.4],
            allocation: allocation || { NVDA: 0.6, AAPL: 0.4 },
            initialCapital: args.initialCapital || 10000,
          }),
        });

        if (fetchRes.status === 402) {
          return returnPaymentRequiredRpcError(
            name,
            "Trial credit balance exhausted (0 credits remaining). Register via POST /api/v1/agents/register for 100 free trial credits or use x402 REST directly with USDC on Base."
          );
        }

        const data = await fetchRes.json();
        if (!fetchRes.ok) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: data.error || `Quant simulation error: HTTP ${fetchRes.status}`
            }
          });
        }

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          },
        });
      }

      if (name === "analyze_stock_ai") {
        const symbol = String(args.symbol || "NVDA").toUpperCase();
        const fetchRes = await fetch(`${baseUrl}/api/ai/stock-analysis`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...forwardHeaders
          },
          body: JSON.stringify({ ticker: symbol }),
        });
        const data = await fetchRes.json();

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: data.analysis || JSON.stringify(data, null, 2) }],
          },
        });
      }

      if (name === "search_13f_whale_filings") {
        const fetchRes = await fetch(`${baseUrl}/api/data/sec`, {
          headers: forwardHeaders
        });

        if (fetchRes.status === 402) {
          return returnPaymentRequiredRpcError(
            name,
            "Trial credit balance exhausted (0 credits remaining). Register via POST /api/v1/agents/register for 100 free trial credits or use x402 REST directly with USDC on Base."
          );
        }

        if (!fetchRes.ok) {
          const errData = await fetchRes.json().catch(() => ({}));
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: errData.error || `SEC 13F live data error: HTTP ${fetchRes.status}`
            }
          });
        }

        const secData = await fetchRes.json();
        let funds = Array.isArray(secData.funds) ? secData.funds : [];
        const manager = args.manager ? String(args.manager).toLowerCase() : "";
        if (manager) {
          funds = funds.filter((f: any) =>
            (f.fund_name || f.fundName || "").toLowerCase().includes(manager) ||
            (f.manager || "").toLowerCase().includes(manager) ||
            (f.id || "").toLowerCase().includes(manager)
          );
        }

        const responsePayload = {
          source: "/api/data/sec",
          updated_at: secData.updated_at || new Date().toISOString(),
          stale: Boolean(secData.stale),
          funds,
          macroSummary: secData.macroSummary || ""
        };

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(responsePayload, null, 2) }],
          },
        });
      }

      if (name === "get_ebook_playbook") {
        const ebookId = args.ebookId || "wealth_operating_system";
        return res.json({
          jsonrpc: "2.0",
          id,
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
      }

      return res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method or tool not found: ${name}` },
      });
    } catch (err: any) {
      return res.status(500).json({
        jsonrpc: "2.0",
        id,
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
