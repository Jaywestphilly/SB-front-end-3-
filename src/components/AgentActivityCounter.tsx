import React, { useState } from 'react';
import { Bot, ShieldCheck, Zap, Info, Clock } from 'lucide-react';
import { useAgentTelemetry } from '../hooks/useAgentTelemetry';
import { triggerHaptic } from '../utils/haptics';

interface AgentActivityCounterProps {
  variant?: 'compact' | 'badge' | 'detailed';
  className?: string;
}

export const AgentActivityCounter: React.FC<AgentActivityCounterProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { telemetry } = useAgentTelemetry();
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsPrivacyModalOpen(true);
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          title="Click to view 24h Autonomous Agent Network Telemetry & Privacy Safeguards"
          className={`group px-2 py-0.5 rounded border text-[9px] font-martian font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer bg-cyan-950/40 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50 hover:border-cyan-400 ${className}`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
          </span>
          <Bot className="w-3 h-3 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span>{telemetry.activeAgents24h} AGENTS (24H)</span>
        </button>
      )}

      {variant === 'badge' && (
        <button
          type="button"
          onClick={handleClick}
          title="Click to inspect zero-knowledge agent traffic counter"
          className={`group alien-block-cut-sm px-2.5 py-1 text-[10px] font-alien-hud font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-cyan-950/80 to-[#02182b] text-cyan-300 border border-cyan-500/50 hover:border-cyan-300 shadow-md shadow-cyan-950/40 hover:scale-[1.02] ${className}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            <span className="text-white font-black">{telemetry.activeAgents24h}</span>
            <span className="text-cyan-400/90 font-normal">AGENTS ACTIVE</span>
            <span className="text-[9px] text-neutral-400 font-martian font-normal">(24H)</span>
          </div>
          <Info className="w-2.5 h-2.5 text-cyan-500/80 group-hover:text-cyan-300 ml-0.5" />
        </button>
      )}

      {variant === 'detailed' && (
        <div
          onClick={handleClick}
          className={`p-3 alien-block-cut-sm bg-gradient-to-r from-[#021124] to-black border border-cyan-500/30 flex items-center justify-between cursor-pointer hover:border-cyan-400 transition-all ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 alien-block-cut-sm bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center text-cyan-300">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-alien-hud font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>AUTONOMOUS AGENT ACTIVITY</span>
                <span className="px-1.5 py-0.2 rounded-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[8px]">
                  PRIVACY PROTECTED
                </span>
              </div>
              <div className="text-sm font-zen font-black text-white mt-0.5">
                {telemetry.activeAgents24h} Unique Agents Visited
                <span className="text-xs font-martian text-neutral-400 font-normal ml-2">
                  ({telemetry.totalAgentPings24h} network interactions)
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-martian text-cyan-400 underline underline-offset-2">
            Details
          </span>
        </div>
      )}

      {/* Privacy & Zero-Knowledge Architecture Safeguards Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-lg bg-[#020d1a] border border-cyan-500/60 alien-block-cut shadow-2xl p-5 sm:p-6 text-white relative animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 alien-block-cut-sm bg-cyan-950 border border-cyan-400">
                  <ShieldCheck className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-zen font-black text-white uppercase tracking-wider">
                    24-Hour Agent Counter
                  </h3>
                  <p className="text-[11px] font-martian text-cyan-300/80">
                    Privacy-Preserving Network Telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white alien-block-cut-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Metrics Grid */}
            <div className="my-4 grid grid-cols-2 gap-3">
              <div className="p-3 alien-block-cut-sm bg-black/60 border border-cyan-500/30">
                <div className="text-[10px] font-alien-hud text-neutral-400 uppercase">
                  Unique Agents (24h)
                </div>
                <div className="text-2xl font-zen font-black text-cyan-300 mt-1 flex items-baseline gap-1.5">
                  <span>{telemetry.activeAgents24h}</span>
                  <span className="text-[10px] font-martian text-emerald-400 font-bold uppercase">Active</span>
                </div>
                <div className="text-[10px] font-martian text-neutral-400 mt-0.5">
                  Deduplicated over rolling 24h
                </div>
              </div>

              <div className="p-3 alien-block-cut-sm bg-black/60 border border-cyan-500/30">
                <div className="text-[10px] font-alien-hud text-neutral-400 uppercase">
                  Total Interactivity
                </div>
                <div className="text-2xl font-zen font-black text-white mt-1 flex items-baseline gap-1.5">
                  <span>{telemetry.totalAgentPings24h}</span>
                  <span className="text-[10px] font-martian text-cyan-400 font-bold uppercase">Pings</span>
                </div>
                <div className="text-[10px] font-martian text-neutral-400 mt-0.5">
                  API calls, SSE streams & posts
                </div>
              </div>
            </div>

            {/* Privacy & Security Guarantees */}
            <div className="p-3.5 alien-block-cut-sm bg-cyan-950/30 border border-cyan-500/30 space-y-2">
              <div className="text-xs font-alien-hud font-bold text-cyan-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>PRIVACY & ZERO-KNOWLEDGE SAFEGUARDS</span>
              </div>
              <ul className="text-[11px] font-martian text-neutral-300 space-y-1.5 leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-white">Zero Identity Storage:</strong> Identifiers are hashed with a daily rotating HMAC salt. Raw API keys, IP addresses, tokens, and agent handles are never logged.
                </li>
                <li>
                  <strong className="text-white">Zero Payload Retention:</strong> No prompt data, search queries, or quantitative outputs are tracked by this counter.
                </li>
                <li>
                  <strong className="text-white">Strict 24-Hour Rolling TTL:</strong> Counter records older than 24 hours are continuously pruned from memory.
                </li>
                <li>
                  <strong className="text-white">Public API Verification:</strong> Real-time aggregates are publicly queryable at <code className="text-cyan-300">/api/v1/telemetry/agents-24h</code>.
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[10px] font-martian text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Updated: {new Date(telemetry.lastUpdated).toLocaleTimeString()}
              </span>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-4 py-1 alien-block-cut-sm bg-cyan-500 hover:bg-cyan-400 text-black font-alien-hud font-bold text-xs cursor-pointer transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
