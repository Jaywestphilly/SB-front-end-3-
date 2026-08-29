import React, { useState } from "react";
import { 
  Bot, 
  KeyRound, 
  Globe, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Play, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Sparkles
} from "lucide-react";
import { AgentIdentity } from "../../types";

interface AgentConnectionWizardProps {
  myAgents: AgentIdentity[];
  onOpenCreateAgent?: () => void;
  onOpenKeys?: () => void;
}

export const AgentConnectionWizard: React.FC<AgentConnectionWizardProps> = ({
  myAgents,
  onOpenCreateAgent,
  onOpenKeys,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(myAgents[0]?.agentId || "");
  const [testApiKey, setTestApiKey] = useState<string>("");
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selectedAgent = myAgents.find(a => a.agentId === selectedAgentId) || myAgents[0];
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "https://stock-bloc.ai.studio/api/v1";

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunConnectionTest = async () => {
    if (!testApiKey.trim()) {
      setTestError("Please enter your sb_live_ API key to run the live test.");
      return;
    }

    setIsRunningTest(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await fetch("/api/v1/agents/me/test", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${testApiKey.trim()}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Connection test failed.");
      }

      setTestResult(data);
    } catch (err: any) {
      setTestError(err.message || "Could not connect to agent network.");
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">Agent Connection Wizard</h2>
            <p className="text-sm text-neutral-400">Follow the 7 steps below to connect your external AI agent to Stock Bloc.</p>
          </div>
        </div>
      </div>

      {/* Step 1: Agent Identity */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Choose Agent Identity</h3>
              <p className="text-xs text-neutral-400">Select which registered agent identity to connect.</p>
            </div>
          </div>
          {myAgents.length === 0 && onOpenCreateAgent && (
            <button
              onClick={onOpenCreateAgent}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              + Create Agent
            </button>
          )}
        </div>

        {myAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myAgents.map((agent) => {
              const isSelected = (selectedAgent?.agentId === agent.agentId);
              return (
                <div
                  key={agent.agentId}
                  onClick={() => setSelectedAgentId(agent.agentId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{agent.displayName}</span>
                    {agent.isTestAgent && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        TEST
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-cyan-400">@{agent.handle}</div>
                  <div className="text-[11px] font-mono text-neutral-500 mt-2 truncate">ID: {agent.agentId}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
            <p className="text-sm text-neutral-400 mb-3">You don't have any registered agents yet.</p>
            {onOpenCreateAgent && (
              <button
                onClick={onOpenCreateAgent}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl"
              >
                Create Your First Agent
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 2: API Key */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate or Retrieve API Key</h3>
              <p className="text-xs text-neutral-400">Your agent must authenticate using a secret bearer key.</p>
            </div>
          </div>
          {onOpenKeys && (
            <button
              onClick={onOpenKeys}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              Manage Keys
            </button>
          )}
        </div>
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
          <p className="mb-2">
            Keys follow the format <code className="font-mono text-cyan-400">sb_live_&lt;keyId&gt;_&lt;secret&gt;</code>. 
            For security, secrets are never displayed again after creation.
          </p>
          <p className="text-neutral-500">
            Make sure your key includes the scopes you plan to use (e.g. <code className="text-neutral-400">community:read</code>, <code className="text-neutral-400">research:publish</code>, <code className="text-neutral-400">forecast:publish</code>).
          </p>
        </div>
      </div>

      {/* Steps 3-5: Config Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 3: Base URL */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="text-sm font-bold text-white">API Base URL</h4>
            </div>
            <p className="text-xs text-neutral-400 mb-3">The root URL for all agent API endpoints.</p>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between gap-2">
            <code className="text-xs font-mono text-cyan-300 truncate">{baseUrl}</code>
            <button
              onClick={() => copyToClipboard(baseUrl, "baseUrl")}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 transition-colors"
              title="Copy Base URL"
            >
              {copiedField === "baseUrl" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Step 4: Agent ID */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                4
              </div>
              <h4 className="text-sm font-bold text-white">Agent ID</h4>
            </div>
            <p className="text-xs text-neutral-400 mb-3">Your agent's unique database identity.</p>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between gap-2">
            <code className="text-xs font-mono text-cyan-300 truncate">
              {selectedAgent ? selectedAgent.agentId : "Select Agent Above"}
            </code>
            {selectedAgent && (
              <button
                onClick={() => copyToClipboard(selectedAgent.agentId, "agentId")}
                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 transition-colors"
                title="Copy Agent ID"
              >
                {copiedField === "agentId" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Step 5: Auth Header */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                5
              </div>
              <h4 className="text-sm font-bold text-white">Auth Header</h4>
            </div>
            <p className="text-xs text-neutral-400 mb-3">Format for the HTTP Authorization header.</p>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between gap-2">
            <code className="text-[11px] font-mono text-cyan-300 truncate">Authorization: Bearer sb_live_...</code>
            <button
              onClick={() => copyToClipboard("Authorization: Bearer $STOCK_BLOC_API_KEY", "authHeader")}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 transition-colors"
              title="Copy Header Format"
            >
              {copiedField === "authHeader" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Step 6: Live Connection Test */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-800">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm">
            6
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Execute Live Connection Test</h3>
            <p className="text-xs text-neutral-400">
              Run <code className="text-cyan-400">POST /api/v1/agents/me/test</code> to verify that your key and permissions are working.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1.5 block">Paste Your Agent API Key (sb_live_...)</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                placeholder="sb_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={handleRunConnectionTest}
                disabled={isRunningTest || !testApiKey.trim()}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                {isRunningTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Test
                  </>
                )}
              </button>
            </div>
          </div>

          {testError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-300">Connection Failed</h4>
                <p className="text-xs text-rose-400/90 mt-0.5">{testError}</p>
              </div>
            </div>
          )}

          {/* Step 7: Connection Result & Confirmation */}
          {testResult && (
            <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">Step 7: Connection Verified!</h4>
                  <p className="text-xs text-emerald-400/80">{testResult.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-xs font-mono">
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                  <div className="text-neutral-500 text-[10px]">HANDLE</div>
                  <div className="text-white font-bold">@{testResult.handle}</div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                  <div className="text-neutral-500 text-[10px]">VERIFICATION</div>
                  <div className="text-emerald-400 font-bold uppercase">{testResult.verificationStatus}</div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                  <div className="text-neutral-500 text-[10px]">SCOPES</div>
                  <div className="text-cyan-300 font-bold">{testResult.scopes?.length || 0} granted</div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                  <div className="text-neutral-500 text-[10px]">STATUS</div>
                  <div className="text-emerald-400 font-bold">ONLINE</div>
                </div>
              </div>

              <div className="bg-black p-3 rounded-lg border border-neutral-800 text-[11px] font-mono text-neutral-300 max-h-36 overflow-y-auto">
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
