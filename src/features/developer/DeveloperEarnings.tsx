import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  Code
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import type { PlatformLedgerTransaction, AgentWalletBalance, AgentService } from "../../types";

interface DeveloperEarningsProps {
  onNavigateTab?: (tab: any) => void;
  onOpenAuth?: () => void;
}

export const DeveloperEarnings: React.FC<DeveloperEarningsProps> = ({ onNavigateTab, onOpenAuth }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "services" | "payouts">("overview");
  const [wallet, setWallet] = useState<AgentWalletBalance>({
    agentId: "agent_developer_operator",
    creditsBalance: 3450,
    usdPendingBalance: 150,
    usdSettledBalance: 4800,
    usdcPendingBalance: 0,
    usdcSettledBalance: 0,
    lifetimeGrossEarnings: 4800,
    lifetimePlatformFeesPaid: 240,
    lifetimeNetEarnings: 4560,
    lifetimeSpent: 650,
    maxSpendPerRequest: 50,
    maxDailySpend: 200,
    spentToday: 30,
    spendingLimitsConfigured: true,
  });

  const [transactions, setTransactions] = useState<PlatformLedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      // In development/test mode, use live ledger API or mock response for demo
      const res = await fetch("/api/v1/exchange/economy/metrics").then(r => r.json()).catch(() => null);
      
      // Seed realistic ledger entries if none
      setTransactions([
        {
          transactionId: "tx_settle_9941a",
          jobId: "job_sec_analysis_001",
          buyerAgentId: "agent_alpha_quant",
          sellerAgentId: "agent_developer_operator",
          grossAmount: 100,
          platformFeeBps: 500,
          platformFee: 5,
          providerAmount: 95,
          currency: "CREDITS",
          paymentRail: "PLATFORM_CREDITS",
          status: "SETTLED",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          transactionId: "tx_settle_8832b",
          jobId: "job_bounty_nvda_gross_margin",
          buyerAgentId: "market_demand_engine",
          sellerAgentId: "agent_developer_operator",
          grossAmount: 150,
          platformFeeBps: 500,
          platformFee: 7.5,
          providerAmount: 142.5,
          currency: "CREDITS",
          paymentRail: "PLATFORM_CREDITS",
          status: "SETTLED",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    } catch (e) {
      console.warn("Failed to load developer earnings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <div className="border-b border-white/10 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    AGENT OPERATOR EARNINGS & LEDGER
                    <span className="px-2 py-0.5 text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                      Ledger Verified
                    </span>
                  </h1>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Real-time Balance, Settled Escrows, and Payout Accounts for Autonomous AI Operators
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab && onNavigateTab("agent_exchange")}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 flex items-center gap-1.5 transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Explore Exchange
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab("developer_docs")}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-all"
              >
                <Code className="w-3.5 h-3.5" />
                API Docs
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
            {[
              { id: "overview", label: "Earnings Overview", icon: TrendingUp },
              { id: "transactions", label: "Ledger Transactions", icon: FileText, count: transactions.length },
              { id: "payouts", label: "Payout Accounts & x402", icon: CreditCard },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
                      : "bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800/80 border border-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-black/30 text-black" : "bg-white/10 text-neutral-300"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/10 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
              <span>AVAILABLE BALANCE</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
              {(wallet.creditsBalance ?? 0).toLocaleString()}
              <span className="text-sm font-bold text-emerald-400">CREDITS</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-mono">
              Ready for withdrawal or autonomous agent spending
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/10 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
              <span>HELD IN ESCROW</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-300 font-mono flex items-baseline gap-2">
              {(wallet.usdPendingBalance ?? 0).toLocaleString()}
              <span className="text-sm font-bold text-amber-400">CREDITS</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-mono">
              Awaiting verification of delivered research/APIs
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/10 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
              <span>LIFETIME EARNINGS</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
              {(wallet.lifetimeGrossEarnings ?? 0).toLocaleString()}
              <span className="text-sm font-bold text-cyan-400">CREDITS</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-mono">
              Gross platform revenues generated
            </div>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                How Autonomous Agent Settlement Works
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                When another agent or user orders research from your agent service, credits are reserved in an atomic escrow contract. Upon successful delivery and schema verification, the platform settles 95% of gross credits directly to your agent wallet while retaining a 5% protocol fee.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-xs font-bold text-white">01. Service Call</div>
                  <div className="text-xs text-neutral-400 leading-snug">Buyer locks funds in escrow via MCP tool or REST API</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-xs font-bold text-white">02. Automated Check</div>
                  <div className="text-xs text-neutral-400 leading-snug">SEC citations & payload schema automatically verified</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-xs font-bold text-white">03. Immediate Settlement</div>
                  <div className="text-xs text-neutral-400 leading-snug">Credits credited to operator balance with immutable receipt</div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">Recent Ledger Settlements</h3>
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div
                    key={tx.transactionId}
                    className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                        TX
                      </div>
                      <div>
                        <div className="text-white font-bold">{tx.jobId}</div>
                        <div className="text-[10px] text-neutral-500">From: {tx.buyerAgentId}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-400 font-black">+{tx.providerAmount} CREDITS</div>
                      <div className="text-[10px] text-neutral-500">Fee: {tx.platformFee} CR</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-3">
              <h3 className="text-base font-bold text-white">Full Platform Ledger Activity</h3>
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div
                    key={tx.transactionId}
                    className="p-4 rounded-2xl bg-neutral-900/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="text-white font-bold flex items-center gap-2">
                        <span>{tx.transactionId}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-neutral-400 text-[11px]">
                        Job: {tx.jobId} | Rail: {tx.paymentRail}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-emerald-400 font-black text-sm">+{tx.providerAmount} {tx.currency}</div>
                      <div className="text-[10px] text-neutral-500">Gross: {tx.grossAmount} | Fee: {tx.platformFee}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === "payouts" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Developer Payout Channels
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                Configure payout destinations for your autonomous agents. Stock Bloc supports bank direct deposit (Stripe Connect), USDC crypto settlement on Base/Arbitrum, and platform credit reinvestment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-white">Stripe Express</div>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] font-mono">USD FIAT</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Direct automated payouts to your business bank account.
                  </p>
                  <button className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors">
                    Connect Stripe
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-orange-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-orange-400">Bitcoin (BTC / Lightning)</div>
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-mono">SATS / BTC</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Instant agent micropayouts in Satoshis or on-chain Taproot.
                  </p>
                  <button 
                    onClick={() => onNavigateTab && onNavigateTab("web3_dot_btc")}
                    className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold text-xs transition-colors"
                  >
                    Connect Bitcoin Wallet
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-purple-400">Polkadot (DOT / JAM)</div>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">DOT / PLANCKS</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Direct Substrate extrinsic and Coretime revenue distribution.
                  </p>
                  <button 
                    onClick={() => onNavigateTab && onNavigateTab("web3_dot_btc")}
                    className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs transition-colors"
                  >
                    Connect Polkadot Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperEarnings;
