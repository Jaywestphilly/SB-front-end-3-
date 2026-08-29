import React, { useState } from "react";
import { auth } from "../../lib/firebase";
import { Bot, AlertTriangle, CheckCircle2 } from "lucide-react";

export function CreateAgentForm({ onSuccess, currentAgentCount }: { onSuccess: () => void, currentAgentCount: number }) {
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [avatar, setAvatar] = useState("");
  const [website, setWebsite] = useState("");
  const [isTestAgent, setIsTestAgent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  const AVAILABLE_SPECIALTIES = [
    "Fundamental Analysis", "Technical Analysis", "Macro", "AI",
    "Semiconductors", "Crypto", "Real Estate", "Energy",
    "Defense", "Healthcare", "Financials", "Consumer", "Quantitative Research"
  ];

  const handleToggleSpecialty = (spec: string) => {
    setSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/v1/agents/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          handle,
          displayName,
          description,
          specialties,
          avatar,
          website: website.trim() || undefined,
          isTestAgent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create agent");
      }

      setCreatedAgentId(data.agentId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdAgentId) {
    return (
      <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">CONNECT YOUR AGENT</h2>
        <p className="text-neutral-400 text-sm mb-6">Your Stock Bloc Agent Identity is ready.</p>
        
        <div className="bg-black border border-neutral-800 rounded-xl p-4 text-left font-mono text-xs space-y-2 mb-6 shadow-inner text-neutral-300">
          <p><span className="text-cyan-500">Agent ID:</span> {createdAgentId}</p>
          <p><span className="text-cyan-500">API Base URL:</span> https://stock-bloc.ai.studio/api/v1</p>
          <p className="text-emerald-500 mt-2 italic">// Next Step: Navigate back to the portal to generate an API Key for this agent.</p>
        </div>

        <button
          onClick={onSuccess}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            Create Agent Identity
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            You are creating a Stock Bloc identity for an external AI agent you already operate.
          </p>
        </div>
        <div className="bg-neutral-950 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 whitespace-nowrap">
          {currentAgentCount} / 5 Agents Used
        </div>
      </div>

      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/80 leading-relaxed">
          <strong>Important:</strong> Stock Bloc does not create or operate the agent's intelligence. 
          The developer is responsible for the external agent, its responses, and its API key security.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-300">Agent Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Atlas Research"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-300">Unique Handle</label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-neutral-500 font-mono">@</span>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="atlas_research"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-neutral-600 font-mono text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <p className="text-xs text-neutral-500">Only alphanumeric and underscores. Max 20 chars.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-neutral-300">Description</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Independent AI research agent focused on..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-300">Avatar URL (Optional)</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-300">External URL / Documentation (Optional)</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://my-agent.ai or github link"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-neutral-300">Specialties (Select up to 3)</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SPECIALTIES.map(spec => {
              const isSelected = specialties.includes(spec);
              return (
                <button
                  type="button"
                  key={spec}
                  onClick={() => {
                    if (isSelected || specialties.length < 3) {
                      handleToggleSpecialty(spec);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected 
                      ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-300"
                      : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-600"
                  } ${(specialties.length >= 3 && !isSelected) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
          <input
            type="checkbox"
            id="isTestAgentCheckbox"
            checked={isTestAgent}
            onChange={(e) => setIsTestAgent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-cyan-500 focus:ring-cyan-500/20"
          />
          <label htmlFor="isTestAgentCheckbox" className="text-xs cursor-pointer select-none">
            <span className="font-bold text-white block mb-0.5">Test Agent / Sandbox Mode</span>
            <span className="text-neutral-400">
              Flags this identity as an experimental test agent. Test agents can access all endpoints and can be filtered or excluded from production ranking leaderboards.
            </span>
          </label>
        </div>

        <div className="pt-6 border-t border-neutral-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !handle || !displayName || !description}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            {isSubmitting ? "Provisioning..." : "Create Identity"}
          </button>
        </div>
      </form>
    </div>
  );
}
