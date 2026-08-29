import React from "react";
import { Terminal, Code, Database, Globe, ArrowRight, Server, FileJson } from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

export const DocsHub: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-8 font-mono text-cyan-100 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 border-b border-cyan-500/30 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black uppercase text-white flex items-center gap-3">
          <Terminal className="w-8 h-8 text-purple-400" />
          <span>Agents & APIs</span>
        </h1>
        <p className="text-sm text-cyan-400/80 uppercase tracking-widest">
          SYSTEM.DOCS // Stock Bloc Integration Architecture
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OpenAPI Spec */}
        <div className="p-5 bg-neutral-900 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-colors cursor-pointer" onClick={() => triggerHaptic('selection')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">OpenAPI Spec</h3>
          </div>
          <p className="text-sm text-neutral-400 mb-4">RESTful endpoints for market data, portfolios, and user management.</p>
          <a href="/openapi.json" className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 uppercase">
            View Swagger UI <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* /llms.txt */}
        <div className="p-5 bg-neutral-900 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-colors cursor-pointer" onClick={() => triggerHaptic('selection')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <FileJson className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">/llms.txt</h3>
          </div>
          <p className="text-sm text-neutral-400 mb-4">Standardized context file for LLMs to understand the Stock Bloc ecosystem.</p>
          <a href="/llms.txt" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase">
            View llms.txt <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* MCP Server Endpoints */}
        <div className="p-5 bg-neutral-900 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-colors cursor-pointer" onClick={() => triggerHaptic('selection')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">MCP Server</h3>
          </div>
          <p className="text-sm text-neutral-400 mb-4">Model Context Protocol endpoints for native agent tool execution.</p>
          <a href="/.well-known/mcp.json" className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 uppercase">
            View MCP Manifest <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Agent Integration Guides */}
        <div className="p-5 bg-neutral-900 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-colors cursor-pointer" onClick={() => triggerHaptic('selection')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Integration Guides</h3>
          </div>
          <p className="text-sm text-neutral-400 mb-4">Tutorials for building custom agents using Stock Bloc tools.</p>
          <a href="/llms.txt" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 uppercase">
            Read Docs <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      <div className="p-6 bg-purple-950/20 border border-purple-500/30 rounded-xl">
        <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          Machine-Readable Pricing
        </h3>
        <p className="text-sm text-neutral-400 mb-4">Agents can fetch our live product catalog via JSON endpoint.</p>
        <div className="bg-black/50 p-4 rounded-lg border border-purple-500/20 font-mono text-xs overflow-x-auto text-cyan-300">
          GET /pricing.json
        </div>
        <a href="/pricing.json" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 uppercase">
            View Endpoint <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
