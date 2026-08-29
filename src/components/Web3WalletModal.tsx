import React, { useState, useEffect } from "react";
import {
  web3DotBtcService,
  ConnectedWeb3Wallet,
} from "../services/web3DotBtcService";
import { triggerHaptic } from "../utils/haptics";
import {
  Wallet,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
} from "lucide-react";

interface Web3WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWeb3Hub?: () => void;
}

export const Web3WalletModal: React.FC<Web3WalletModalProps> = ({
  isOpen,
  onClose,
  onNavigateToWeb3Hub,
}) => {
  const [wallet, setWallet] = useState<ConnectedWeb3Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"bitcoin" | "polkadot">("bitcoin");

  useEffect(() => {
    const unsub = web3DotBtcService.subscribe((w) => setWallet(w));
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleConnect = async (chain: "bitcoin" | "polkadot", name: string) => {
    triggerHaptic("selection");
    setIsConnecting(true);
    try {
      if (chain === "bitcoin") {
        await web3DotBtcService.connectBitcoinWallet(name);
      } else {
        await web3DotBtcService.connectPolkadotWallet(name);
      }
    } catch (e) {
      console.warn("Connect notice:", e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    triggerHaptic("selection");
    web3DotBtcService.disconnectWallet();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md p-5 alien-block-cut bg-[#020914] border-2 border-cyan-500/50 shadow-2xl relative space-y-4 font-mono text-cyan-100 antialiased">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span className="font-zen text-sm font-black text-white uppercase tracking-wide">
              Web3 Vault & Alpha Connect
            </span>
          </div>
          <button
            onClick={() => {
              triggerHaptic("selection");
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chain Selector */}
        <div className="grid grid-cols-2 gap-2 bg-black/60 p-1 rounded-xl border border-cyan-900/60">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("bitcoin");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "bitcoin"
                ? "bg-orange-500 text-black font-black shadow-md shadow-orange-500/20"
                : "text-orange-300 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Bitcoin (BTC)</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("polkadot");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "polkadot"
                ? "bg-purple-500 text-white font-black shadow-md shadow-purple-500/20"
                : "text-purple-300 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Polkadot (DOT)</span>
          </button>
        </div>

        {/* If Active Wallet Connected */}
        {wallet && (
          <div className="p-3 bg-neutral-950 border border-emerald-500/40 alien-block-cut-sm space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected: {wallet.walletName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {wallet.tier}
              </span>
            </div>
            <div className="text-[11px] text-neutral-300 font-mono truncate">
              {wallet.address}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-amber-300 font-bold">{wallet.balanceFormatted}</span>
              <button
                onClick={handleDisconnect}
                className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Connect Options */}
        <div className="space-y-2">
          {activeTab === "bitcoin" ? (
            <>
              <button
                onClick={() => handleConnect("bitcoin", "UniSat Wallet")}
                disabled={isConnecting}
                className="w-full p-2.5 alien-block-cut-sm bg-orange-950/30 hover:bg-orange-900/50 border border-orange-500/40 text-left flex items-center justify-between text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="font-bold text-white">UniSat (Taproot & Ordinals)</span>
                <span className="text-[10px] text-orange-300 px-2 py-0.5 rounded bg-orange-500/20">Connect</span>
              </button>
              <button
                onClick={() => handleConnect("bitcoin", "Xverse / Leather")}
                disabled={isConnecting}
                className="w-full p-2.5 alien-block-cut-sm bg-orange-950/30 hover:bg-orange-900/50 border border-orange-500/40 text-left flex items-center justify-between text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="font-bold text-white">Xverse / Leather</span>
                <span className="text-[10px] text-orange-300 px-2 py-0.5 rounded bg-orange-500/20">Connect</span>
              </button>
              <button
                onClick={() => handleConnect("bitcoin", "WebLN / Alby Lightning")}
                disabled={isConnecting}
                className="w-full p-2.5 alien-block-cut-sm bg-orange-950/30 hover:bg-orange-900/50 border border-orange-500/40 text-left flex items-center justify-between text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="font-bold text-white">⚡ WebLN / Alby (Lightning)</span>
                <span className="text-[10px] text-orange-300 px-2 py-0.5 rounded bg-orange-500/20">Connect</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleConnect("polkadot", "Talisman Wallet")}
                disabled={isConnecting}
                className="w-full p-2.5 alien-block-cut-sm bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/40 text-left flex items-center justify-between text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="font-bold text-white">Talisman (Polkadot & Multi-chain)</span>
                <span className="text-[10px] text-purple-300 px-2 py-0.5 rounded bg-purple-500/20">Connect</span>
              </button>
              <button
                onClick={() => handleConnect("polkadot", "SubWallet")}
                disabled={isConnecting}
                className="w-full p-2.5 alien-block-cut-sm bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/40 text-left flex items-center justify-between text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="font-bold text-white">SubWallet (Substrate & Relay)</span>
                <span className="text-[10px] text-purple-300 px-2 py-0.5 rounded bg-purple-500/20">Connect</span>
              </button>
              <button
                onClick={() => handleConnect("polkadot", "Polkadot.js Extension")}
                disabled={isConnecting}
                className="w-full p-2.5 alien-block-cut-sm bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/40 text-left flex items-center justify-between text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="font-bold text-white">Polkadot.js / Enkrypt</span>
                <span className="text-[10px] text-purple-300 px-2 py-0.5 rounded bg-purple-500/20">Connect</span>
              </button>
            </>
          )}
        </div>

        {/* Action to Full Web3 Hub */}
        {onNavigateToWeb3Hub && (
          <button
            onClick={() => {
              triggerHaptic("selection");
              onClose();
              onNavigateToWeb3Hub();
            }}
            className="w-full py-2.5 alien-block-cut-sm bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Full DOT & BTC Proof-of-Alpha Hub</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default Web3WalletModal;
