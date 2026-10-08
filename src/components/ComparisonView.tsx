import React from "react";
import { ExternalLink, Check, Minus, ArrowRight, ShieldCheck, Database, Search } from "lucide-react";

export const ComparisonView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-[1240px] mx-auto space-y-8">
        {/* Header / Hero */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 font-mono text-xs uppercase tracking-wider">
            <span>Architecture & Settlement Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Stock Bloc vs Tavily vs Twelve Data
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Independent evaluation matrix for autonomous AI agents, quant engineers, and algorithmic research systems.
          </p>
        </div>

        {/* Comparison Table (Every cell exact as written, no winner badge) */}
        <div className="overflow-x-auto rounded-xl border border-cyan-500/30 bg-[#0b1120] shadow-2xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-cyan-500/30 bg-slate-900/90 font-mono text-xs uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5 font-bold w-[22%]">Feature / Dimension</th>
                <th className="py-4 px-5 font-bold text-cyan-300 bg-cyan-950/20 border-l border-r border-cyan-500/30 w-[32%]">
                  Stock Bloc
                </th>
                <th className="py-4 px-5 font-bold text-slate-300 w-[23%]">Tavily</th>
                <th className="py-4 px-5 font-bold text-slate-300 w-[23%]">Twelve Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {/* Row 1: What it sells */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">What it sells</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  Finished analysis + market data for agents
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Web search results for agents
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Raw market data via REST
                </td>
              </tr>

              {/* Row 2: SEC filing analysis */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">SEC filing analysis</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  Yes, $0.25/call finished output with citations
                </td>
                <td className="py-4 px-5 text-slate-300">
                  No, returns raw web text you parse yourself
                </td>
                <td className="py-4 px-5 text-slate-300">
                  No
                </td>
              </tr>

              {/* Row 3: Payment rail */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">Payment rail</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  x402 v2, USDC on Base, per call
                </td>
                <td className="py-4 px-5 text-slate-300">
                  API key + usage billing
                </td>
                <td className="py-4 px-5 text-slate-300">
                  API key + subscription tiers
                </td>
              </tr>

              {/* Row 4: Signup required */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">Signup required</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  No, unpaid calls return HTTP 402 with price and payment terms
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Yes, API key
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Yes, API key
                </td>
              </tr>

              {/* Row 5: Free tier */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">Free tier</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  100 trial credits on self-registration, no card
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Limited free credits
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Freemium, rate-limited
                </td>
              </tr>

              {/* Row 6: Machine-readable pricing */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">Machine-readable pricing</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  Yes: llms.txt, manifest, OpenAPI, claims.json
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Docs page
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Docs page
                </td>
              </tr>

              {/* Row 7: Agent discovery */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">Agent discovery</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  MCP on Smithery and Glama, x402 manifest, skill repo
                </td>
                <td className="py-4 px-5 text-slate-300">
                  MCP, API docs
                </td>
                <td className="py-4 px-5 text-slate-300">
                  API docs
                </td>
              </tr>

              {/* Row 8: Cheapest call */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">Cheapest call</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  $0.01
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Varies by plan
                </td>
                <td className="py-4 px-5 text-slate-300">
                  Free tier, then paid
                </td>
              </tr>

              {/* Row 9: Live payment proof */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 px-5 font-mono text-xs font-bold text-slate-300 uppercase">Live payment proof</td>
                <td className="py-4 px-5 font-medium text-white bg-cyan-950/10 border-l border-r border-cyan-500/30">
                  1 external x402 settlement 2026-10-03, tx 0x2c768476cb3db3c148001b0aecb2f89f3826f73f87650e6c2044c8e5c50be9c3
                  <div className="mt-1">
                    <a
                      href="https://basescan.org/tx/0x2c768476cb3db3c148001b0aecb2f89f3826f73f87650e6c2044c8e5c50be9c3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono inline-flex items-center gap-1"
                    >
                      <span>View on BaseScan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </td>
                <td className="py-4 px-5 text-slate-300">
                  N/A
                </td>
                <td className="py-4 px-5 text-slate-300">
                  N/A
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Guidance Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: When Stock Bloc is the wrong call */}
          <div className="rounded-xl border border-rose-500/30 bg-[#0b1120] p-6 space-y-4">
            <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>When Stock Bloc is the wrong call</span>
            </h2>
            <ul className="space-y-3 text-sm text-slate-300 leading-relaxed font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">—</span>
                <span><strong>need raw web search:</strong> use Tavily</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">—</span>
                <span><strong>need streaming real-time quotes:</strong> compare Twelve Data websocket pricing</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">—</span>
                <span><strong>need a human dashboard:</strong> free terminal exists but is not the agent product</span>
              </li>
            </ul>
          </div>

          {/* Section 2: When Stock Bloc is the right call */}
          <div className="rounded-xl border border-emerald-500/30 bg-[#0b1120] p-6 space-y-4">
            <h2 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>When Stock Bloc is the right call</span>
            </h2>
            <ul className="space-y-3 text-sm text-slate-300 leading-relaxed font-sans">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>agent needs a finished answer with citations</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>agent holds USDC on Base and can complete x402 without human approval</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>want the agent to see exact price in the 402 before paying</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Machine-Readable Endpoints Bar */}
        <div className="rounded-xl border border-cyan-500/20 bg-slate-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Live Machine-Readable Surfaces
            </div>
            <div className="text-xs text-slate-400">
              Autonomous agents can inspect structured verification assets without human signups.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <a
              href="/.well-known/claims.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:text-white transition-all"
            >
              claims.json
            </a>
            <a
              href="/.well-known/x402"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:text-white transition-all"
            >
              .well-known/x402
            </a>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:text-white transition-all"
            >
              llms.txt
            </a>
            <a
              href="/api/v1/agents/manifest.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:text-white transition-all"
            >
              manifest.json
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 text-center font-mono text-xs text-slate-400">
          <p>
            Last verified 2026-10-07. Prices and tiers change; check linked sources before spending.
          </p>
        </div>
      </div>
    </div>
  );
};
