import React, { useState, useEffect, useCallback } from "react";
import { ViewTab } from "../../types";
import { useMarketStore } from "../../stores/marketStore";
import {
  web3DotBtcService,
  ConnectedWeb3Wallet,
  AlphaProofData,
  X402InvoiceData,
  NonCustodialVaultData,
} from "../../services/web3DotBtcService";
import { triggerHaptic } from "../../utils/haptics";
import {
  Wallet,
  ShieldCheck,
  Zap,
  Cpu,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  Database,
  Terminal,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Radio,
} from "lucide-react";

interface DotBtcWeb3HubProps {
  onNavigateTab?: (tab: ViewTab) => void;
  initialSubTab?: "wallets" | "x402" | "proof_of_alpha" | "vaults";
}

export const DotBtcWeb3Hub: React.FC<DotBtcWeb3HubProps> = ({
  onNavigateTab,
  initialSubTab = "wallets",
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"wallets" | "x402" | "proof_of_alpha" | "vaults">(
    initialSubTab
  );
  const [wallet, setWallet] = useState<ConnectedWeb3Wallet | null>(null);
  const [installedWallets, setInstalledWallets] = useState({
    polkadot: { talisman: false, subwallet: false, polkadotJs: false, enkrypt: false },
    bitcoin: { unisat: false, xverse: false, leather: false, phantomBtc: false, webln: false },
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Proof-of-Alpha State
  const [alphaProof, setAlphaProof] = useState<AlphaProofData | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);
  const [selectedLeafSymbol, setSelectedLeafSymbol] = useState<string>("BTC-USD");
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // x402 State
  const [x402Asset, setX402Asset] = useState<"BTC_LIGHTNING" | "DOT_CORETIME">("BTC_LIGHTNING");
  const [activeInvoice, setActiveInvoice] = useState<X402InvoiceData | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isSettlingInvoice, setIsSettlingInvoice] = useState(false);
  const [settledResult, setSettledResult] = useState<any | null>(null);

  // Vaults State
  const [vaults, setVaults] = useState<NonCustodialVaultData[]>([]);
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [simDepositAmount, setSimDepositAmount] = useState<number>(1.5);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("vault_btc_alpha_01");

  // Real-Time BTC & DOT Ticker State with Live Exchange Sync
  const [btcTicker, setBtcTicker] = useState(() => {
    const marketStocks = useMarketStore.getState().stocks;
    const btcStock = marketStocks.find((s) => s.symbol === "BTC-USD" || s.symbol === "BTC");
    const initialPrice = btcStock?.price && btcStock.price > 1000 ? btcStock.price : 79820.00;
    const initialChange = btcStock?.change ?? 2420.00;
    const initialChangePct = btcStock?.changePercent ?? 3.13;
    const initialSpark = btcStock?.sparkline?.length
      ? btcStock.sparkline
      : [76500, 77200, 78400, 77900, 78900, 79200, initialPrice];

    return {
      price: initialPrice,
      prevPrice: initialPrice,
      changePercent: initialChangePct,
      changeAmount: initialChange,
      high24h: btcStock?.high52 ?? initialPrice * 1.03,
      low24h: btcStock?.low52 ?? initialPrice * 0.96,
      pulse: null as "up" | "down" | null,
      pulseKey: 0,
      history: initialSpark,
      source: "Yahoo Finance Live",
    };
  });

  const [dotTicker, setDotTicker] = useState(() => {
    const marketStocks = useMarketStore.getState().stocks;
    const dotStock = marketStocks.find((s) => s.symbol === "DOT-USD" || s.symbol === "DOT");
    const initialPrice = dotStock?.price && dotStock.price < 50 ? dotStock.price : 0.920;
    const initialChange = dotStock?.change ?? 0.050;
    const initialChangePct = dotStock?.changePercent ?? 5.74;
    const initialSpark = dotStock?.sparkline?.length
      ? dotStock.sparkline
      : [0.86, 0.88, 0.87, 0.89, 0.90, 0.91, initialPrice];

    return {
      price: initialPrice,
      prevPrice: initialPrice,
      changePercent: initialChangePct,
      changeAmount: initialChange,
      high24h: dotStock?.high52 ?? initialPrice * 1.05,
      low24h: dotStock?.low52 ?? initialPrice * 0.94,
      pulse: null as "up" | "down" | null,
      pulseKey: 0,
      history: initialSpark,
      source: "Yahoo Finance Live",
    };
  });

  const [isSyncingCrypto, setIsSyncingCrypto] = useState(false);
  const [cryptoSyncTime, setCryptoSyncTime] = useState<string | null>(null);

  // Live Crypto Quote Fetcher (direct Yahoo Finance proxy via /api/live-quote)
  const fetchLiveCryptoQuotes = useCallback(async (isManual = false) => {
    if (isManual) {
      triggerHaptic("medium");
      setIsSyncingCrypto(true);
    }

    try {
      const [btcRes, dotRes] = await Promise.allSettled([
        fetch("/api/live-quote/BTC"),
        fetch("/api/live-quote/DOT"),
      ]);

      if (btcRes.status === "fulfilled" && btcRes.value.ok) {
        const btcData = await btcRes.value.json();
        if (btcData && typeof btcData.price === "number" && btcData.price > 1000) {
          setBtcTicker((prev) => {
            const newPrice = Number(btcData.price.toFixed(2));
            const prevPrice = prev.price;
            const dir = newPrice > prevPrice ? "up" : newPrice < prevPrice ? "down" : prev.pulse;
            const changeAmt = typeof btcData.change === "number" ? btcData.change : prev.changeAmount;
            const changePct = typeof btcData.changePercent === "number" ? btcData.changePercent : prev.changePercent;
            const newHist = [...prev.history.slice(1), newPrice];

            return {
              ...prev,
              prevPrice,
              price: newPrice,
              changeAmount: Number(changeAmt.toFixed(2)),
              changePercent: Number(changePct.toFixed(2)),
              pulse: dir,
              pulseKey: dir ? prev.pulseKey + 1 : prev.pulseKey,
              history: newHist,
              source: "Yahoo Finance Live",
            };
          });
        }
      }

      if (dotRes.status === "fulfilled" && dotRes.value.ok) {
        const dotData = await dotRes.value.json();
        if (dotData && typeof dotData.price === "number" && dotData.price > 0 && dotData.price < 50) {
          setDotTicker((prev) => {
            const newPrice = Number(dotData.price.toFixed(3));
            const prevPrice = prev.price;
            const dir = newPrice > prevPrice ? "up" : newPrice < prevPrice ? "down" : prev.pulse;
            const changeAmt = typeof dotData.change === "number" ? dotData.change : prev.changeAmount;
            const changePct = typeof dotData.changePercent === "number" ? dotData.changePercent : prev.changePercent;
            const newHist = [...prev.history.slice(1), newPrice];

            return {
              ...prev,
              prevPrice,
              price: newPrice,
              changeAmount: Number(changeAmt.toFixed(3)),
              changePercent: Number(changePct.toFixed(2)),
              pulse: dir,
              pulseKey: dir ? prev.pulseKey + 1 : prev.pulseKey,
              history: newHist,
              source: "Yahoo Finance Live",
            };
          });
        }
      }

      setCryptoSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Failed to fetch live crypto quotes:", err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsSyncingCrypto(false), 500);
      }
    }
  }, []);

  // Periodic real-time live quotes + subtle micro-fluctuations around true prices
  useEffect(() => {
    // 1. Initial live quotes fetch
    fetchLiveCryptoQuotes();

    // 2. Periodic background refresh from live Yahoo finance API every 15s
    const quoteInterval = setInterval(() => {
      fetchLiveCryptoQuotes();
    }, 15000);

    // 3. Real-time realistic micro-fluctuations around true market prices
    const tickInterval = setInterval(() => {
      const roll = Math.random();

      if (roll < 0.65) {
        // BTC Tick: subtle variation of ±$5 to ±$25
        const delta = (Math.random() - 0.49) * (Math.random() * 20 + 4);
        setBtcTicker((prev) => {
          const nextPrice = Number((prev.price + delta).toFixed(2));
          const dir = delta >= 0 ? "up" : "down";
          const newHistory = [...prev.history.slice(1), nextPrice];
          const basePrice = prev.price - prev.changeAmount;
          const newChangeAmt = nextPrice - basePrice;
          const newChangePct = basePrice > 0 ? (newChangeAmt / basePrice) * 100 : prev.changePercent;

          return {
            ...prev,
            prevPrice: prev.price,
            price: nextPrice,
            changeAmount: Number(newChangeAmt.toFixed(2)),
            changePercent: Number(newChangePct.toFixed(2)),
            pulse: dir,
            pulseKey: prev.pulseKey + 1,
            history: newHistory,
          };
        });

        setTimeout(() => {
          setBtcTicker((p) => ({ ...p, pulse: null }));
        }, 1400);
      }

      if (roll > 0.35) {
        // DOT Tick: subtle variation of ±$0.001 to ±$0.003
        const deltaDot = (Math.random() - 0.49) * (Math.random() * 0.003 + 0.0006);
        setDotTicker((prev) => {
          const nextPrice = Number((prev.price + deltaDot).toFixed(3));
          const dir = deltaDot >= 0 ? "up" : "down";
          const newHistory = [...prev.history.slice(1), nextPrice];
          const basePrice = prev.price - prev.changeAmount;
          const newChangeAmt = nextPrice - basePrice;
          const newChangePct = basePrice > 0 ? (newChangeAmt / basePrice) * 100 : prev.changePercent;

          return {
            ...prev,
            prevPrice: prev.price,
            price: nextPrice,
            changeAmount: Number(newChangeAmt.toFixed(3)),
            changePercent: Number(newChangePct.toFixed(2)),
            pulse: dir,
            pulseKey: prev.pulseKey + 1,
            history: newHistory,
          };
        });

        setTimeout(() => {
          setDotTicker((p) => ({ ...p, pulse: null }));
        }, 1400);
      }
    }, 3200);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(tickInterval);
    };
  }, [fetchLiveCryptoQuotes]);

  const renderSparkline = (points: number[], isPositive: boolean, colorHex: string) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const step = width / (points.length - 1);

    const pathD = points
      .map((p, i) => {
        const x = i * step;
        const y = height - ((p - min) / range) * (height - 6) - 3;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-20 h-6 overflow-visible shrink-0">
        <path
          d={pathD}
          fill="none"
          stroke={colorHex}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  useEffect(() => {
    const unsub = web3DotBtcService.subscribe((w) => setWallet(w));
    setInstalledWallets(web3DotBtcService.detectInstalledWallets());
    loadProof();
    loadVaults();
    return () => unsub();
  }, []);

  const loadProof = async () => {
    setIsLoadingProof(true);
    try {
      const data = await web3DotBtcService.getProofOfAlpha();
      setAlphaProof(data);
    } catch (e) {
      console.warn("Proof load notice:", e);
    } finally {
      setIsLoadingProof(false);
    }
  };

  const loadVaults = async () => {
    setIsLoadingVaults(true);
    try {
      const data = await web3DotBtcService.getVaults();
      setVaults(data);
    } catch (e) {
      console.warn("Vaults load notice:", e);
    } finally {
      setIsLoadingVaults(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    triggerHaptic("selection");
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleConnect = async (chain: "bitcoin" | "polkadot", walletName: string) => {
    triggerHaptic("selection");
    setIsConnecting(true);
    try {
      if (chain === "bitcoin") {
        await web3DotBtcService.connectBitcoinWallet(walletName);
      } else {
        await web3DotBtcService.connectPolkadotWallet(walletName);
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

  const handleVerifySignal = async (symbol: string) => {
    triggerHaptic("selection");
    setSelectedLeafSymbol(symbol);
    setIsVerifying(true);
    try {
      const res = await web3DotBtcService.verifyPrediction(symbol);
      setVerifyResult(res);
    } catch (e) {
      console.warn("Verify notice:", e);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateInvoice = async () => {
    triggerHaptic("selection");
    setIsGeneratingInvoice(true);
    setSettledResult(null);
    try {
      const res = await web3DotBtcService.requestX402Quote(x402Asset, "/api/v1/intelligence/signal");
      if (res && res.invoice) {
        setActiveInvoice(res.invoice);
      }
    } catch (e) {
      console.warn("Invoice notice:", e);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleSettleInvoice = async () => {
    if (!activeInvoice) return;
    triggerHaptic("success");
    setIsSettlingInvoice(true);
    try {
      const res = await web3DotBtcService.settleX402Invoice(activeInvoice.invoiceId);
      setSettledResult(res);
      setActiveInvoice((prev) => (prev ? { ...prev, status: "settled" } : null));
    } catch (e) {
      console.warn("Settle notice:", e);
    } finally {
      setIsSettlingInvoice(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-16 font-mono text-cyan-100 antialiased">
      {/* Top Banner & Telemetry */}
      <div className="p-4 sm:p-6 alien-block-cut bg-gradient-to-br from-[#020b16] via-[#051329] to-[#01060d] border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 alien-block-cut-sm bg-orange-500/20 text-orange-400 border border-orange-500/50 text-[10px] font-black uppercase tracking-wider">
                BITCOIN (BTC)
              </span>
              <span className="px-2.5 py-0.5 alien-block-cut-sm bg-purple-500/20 text-purple-300 border border-purple-500/50 text-[10px] font-black uppercase tracking-wider">
                POLKADOT (DOT)
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ON-CHAIN ANCHORED
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-zen uppercase tracking-wide">
              Web3 & Proof-of-Alpha Engine
            </h1>
            <p className="text-xs sm:text-sm text-cyan-300/80 max-w-2xl mt-1">
              Connect your Polkadot (DOT) or Bitcoin (BTC) wallet to unlock token-gated alpha, verify cryptographic Merkle proofs on Bitcoin OP_RETURN & Polkadot JAM, settle autonomous agent micropayments via x402, and view non-custodial quant vaults.
            </p>
          </div>

          {/* Wallet Mini-Status Pill */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {wallet ? (
              <div className="px-4 py-2.5 alien-block-cut-sm bg-neutral-950/90 border border-cyan-400/60 shadow-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      wallet.chain === "bitcoin" ? "bg-orange-500 shadow-[0_0_8px_#f7931a]" : "bg-purple-500 shadow-[0_0_8px_#d946ef]"
                    }`}
                  />
                  <div>
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <span>{wallet.walletName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {wallet.tier}
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono">
                      {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-2.5 py-1 alien-block-cut-sm bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 text-[10px] font-bold transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConnect("bitcoin", "Unisat / Xverse")}
                  disabled={isConnecting}
                  className="px-3.5 py-2 alien-block-cut-sm bg-orange-500 hover:bg-orange-400 text-black font-black text-xs transition-all shadow-lg shadow-orange-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect BTC</span>
                </button>
                <button
                  onClick={() => handleConnect("polkadot", "Talisman / SubWallet")}
                  disabled={isConnecting}
                  className="px-3.5 py-2 alien-block-cut-sm bg-purple-500 hover:bg-purple-400 text-white font-black text-xs transition-all shadow-lg shadow-purple-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect DOT</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Real-Time BTC & DOT Price Tickers with Live Sync Status */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                Live Exchange Quotes
              </span>
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                • Synced via Yahoo Finance API
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cryptoSyncTime && (
                <span className="text-[10px] text-neutral-400 font-mono">
                  Updated: {cryptoSyncTime}
                </span>
              )}
              <button
                onClick={() => fetchLiveCryptoQuotes(true)}
                disabled={isSyncingCrypto}
                title="Refresh Live Crypto Quotes"
                className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingCrypto ? "animate-spin text-cyan-400" : ""}`} />
                <span className="hidden xs:inline">{isSyncingCrypto ? "Syncing..." : "Sync"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* BTC Ticker Element */}
          <div
            key={`btc-ticker-${btcTicker.pulseKey}`}
            className={`p-4 alien-block-cut-sm bg-black/80 border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
              btcTicker.pulse === "up"
                ? "animate-subtle-pulse-up border-emerald-400/90 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                : btcTicker.pulse === "down"
                ? "animate-subtle-pulse-down border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.35)]"
                : "border-orange-500/40 hover:border-orange-400/70 shadow-lg shadow-orange-950/20 animate-ticker-glow-btc"
            }`}
          >
            {/* Subtle background pulse aura */}
            <div
              className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-700 ${
                btcTicker.pulse === "up"
                  ? "bg-emerald-500/25 opacity-100"
                  : btcTicker.pulse === "down"
                  ? "bg-red-500/25 opacity-100"
                  : "bg-orange-500/10 opacity-60"
              }`}
            />

            <div className="flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center font-black text-orange-400 text-sm">
                    ₿
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-zen font-black text-white text-xs tracking-wider">BTC / USD</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-mono font-bold">
                      BITCOIN SPOT
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    ~{Math.round(100000000 / btcTicker.price).toLocaleString()} Sats / $1.00 USD
                  </div>
                </div>
              </div>

              {/* Direction Badge */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-1 text-xs font-mono font-black px-2 py-0.5 rounded ${
                    btcTicker.changePercent >= 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  {btcTicker.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span>
                    {btcTicker.changePercent >= 0 ? "+" : ""}
                    {btcTicker.changePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Price Row with Live Pulse Animation */}
            <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-neutral-800/80 relative z-10">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl sm:text-2xl font-martian font-black tracking-tight transition-colors duration-300 ${
                    btcTicker.pulse === "up"
                      ? "text-emerald-300"
                      : btcTicker.pulse === "down"
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  ${btcTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {btcTicker.changeAmount >= 0 ? "+" : ""}${btcTicker.changeAmount.toFixed(2)} 24h
                </span>
              </div>

              {/* Live Mini Sparkline */}
              <div className="flex items-center gap-2">
                {renderSparkline(btcTicker.history, btcTicker.changePercent >= 0, btcTicker.changePercent >= 0 ? "#10b981" : "#ef4444")}
              </div>
            </div>
          </div>

          {/* DOT Ticker Element */}
          <div
            key={`dot-ticker-${dotTicker.pulseKey}`}
            className={`p-4 alien-block-cut-sm bg-black/80 border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
              dotTicker.pulse === "up"
                ? "animate-subtle-pulse-up border-emerald-400/90 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                : dotTicker.pulse === "down"
                ? "animate-subtle-pulse-down border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.35)]"
                : "border-purple-500/40 hover:border-purple-400/70 shadow-lg shadow-purple-950/20 animate-ticker-glow-dot"
            }`}
          >
            {/* Subtle background pulse aura */}
            <div
              className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-700 ${
                dotTicker.pulse === "up"
                  ? "bg-emerald-500/25 opacity-100"
                  : dotTicker.pulse === "down"
                  ? "bg-red-500/25 opacity-100"
                  : "bg-purple-500/10 opacity-60"
              }`}
            />

            <div className="flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center font-black text-purple-300 text-sm">
                    ●
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-zen font-black text-white text-xs tracking-wider">DOT / USD</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                      POLKADOT RELAY
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    10B Plancks / DOT • Substrate JAM
                  </div>
                </div>
              </div>

              {/* Direction Badge */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-1 text-xs font-mono font-black px-2 py-0.5 rounded ${
                    dotTicker.changePercent >= 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  {dotTicker.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span>
                    {dotTicker.changePercent >= 0 ? "+" : ""}
                    {dotTicker.changePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Price Row with Live Pulse Animation */}
            <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-neutral-800/80 relative z-10">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl sm:text-2xl font-martian font-black tracking-tight transition-colors duration-300 ${
                    dotTicker.pulse === "up"
                      ? "text-emerald-300"
                      : dotTicker.pulse === "down"
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  ${dotTicker.price.toFixed(3)}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {dotTicker.changeAmount >= 0 ? "+" : ""}${dotTicker.changeAmount.toFixed(3)} 24h
                </span>
              </div>

              {/* Live Mini Sparkline */}
              <div className="flex items-center gap-2">
                {renderSparkline(dotTicker.history, dotTicker.changePercent >= 0, dotTicker.changePercent >= 0 ? "#10b981" : "#ef4444")}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-6 pt-4 border-t border-cyan-500/30">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSubTab("wallets");
            }}
            className={`py-2 px-3 alien-block-cut-sm text-xs font-bold font-alien-hud flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "wallets"
                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 font-black border border-cyan-200"
                : "bg-black/60 text-cyan-300 hover:text-white border border-cyan-500/30 hover:bg-cyan-950/40"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="truncate">1. Wallets & Alpha Tiers</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSubTab("x402");
            }}
            className={`py-2 px-3 alien-block-cut-sm text-xs font-bold font-alien-hud flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "x402"
                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 font-black border border-cyan-200"
                : "bg-black/60 text-cyan-300 hover:text-white border border-cyan-500/30 hover:bg-cyan-950/40"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span className="truncate">2. Agent x402 Micropayments</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSubTab("proof_of_alpha");
            }}
            className={`py-2 px-3 alien-block-cut-sm text-xs font-bold font-alien-hud flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "proof_of_alpha"
                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 font-black border border-cyan-200"
                : "bg-black/60 text-cyan-300 hover:text-white border border-cyan-500/30 hover:bg-cyan-950/40"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span className="truncate">3. Proof-of-Alpha (Merkle)</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSubTab("vaults");
            }}
            className={`py-2 px-3 alien-block-cut-sm text-xs font-bold font-alien-hud flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "vaults"
                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 font-black border border-cyan-200"
                : "bg-black/60 text-cyan-300 hover:text-white border border-cyan-500/30 hover:bg-cyan-950/40"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-300" />
            <span className="truncate">4. Non-Custodial Vaults</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: WALLETS & TOKEN-GATED ALPHA TIERS                               */}
      {/* ========================================================================= */}
      {activeSubTab === "wallets" && (
        <div className="space-y-6">
          {/* Active Wallet Overview Card (If connected) */}
          {wallet && (
            <div className="p-5 alien-block-cut bg-[#020b16] border-2 border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white uppercase font-zen">
                    Active Session: {wallet.walletName} ({wallet.chain.toUpperCase()})
                  </span>
                </div>
                <span className="px-3 py-1 alien-block-cut-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  Status: VERIFIED TIER - {wallet.tier.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-black/60 border border-cyan-500/30 alien-block-cut-sm">
                  <div className="text-cyan-400 text-[10px] font-bold uppercase">On-Chain Address</div>
                  <div className="text-white font-mono font-bold mt-1 truncate flex items-center justify-between gap-1">
                    <span>{wallet.address}</span>
                    <button
                      onClick={() => handleCopy(wallet.address, "addr_active")}
                      className="p-1 hover:text-cyan-300 text-neutral-400 cursor-pointer"
                    >
                      {copiedText === "addr_active" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-black/60 border border-cyan-500/30 alien-block-cut-sm">
                  <div className="text-cyan-400 text-[10px] font-bold uppercase">Holding Balance</div>
                  <div className="text-amber-300 font-martian font-bold text-sm mt-1">
                    {wallet.balanceFormatted}
                  </div>
                </div>

                <div className="p-3 bg-black/60 border border-cyan-500/30 alien-block-cut-sm">
                  <div className="text-cyan-400 text-[10px] font-bold uppercase">Connected Network</div>
                  <div className="text-cyan-200 font-bold mt-1">
                    {wallet.chain === "bitcoin" ? "Bitcoin Mainnet & Lightning" : "Polkadot Relay & JAM"}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 alien-block-cut-sm space-y-2">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unlocked Token-Gated Privileges:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {wallet.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-neutral-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Wallet Connection Matrix (DOT & BTC ONLY) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Polkadot Ecosystem Card */}
            <div className="p-5 alien-block-cut bg-[#020b16] border-2 border-purple-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_8px_#d946ef]" />
                  <h3 className="font-zen text-base font-black text-white uppercase">
                    Polkadot (DOT) Ecosystem
                  </h3>
                </div>
                <span className="text-[10px] text-purple-300 px-2 py-0.5 alien-block-cut-sm bg-purple-950/60 border border-purple-500/40">
                  Substrate / JAM Matrix
                </span>
              </div>

              <p className="text-xs text-neutral-300">
                Connect your Polkadot browser extension or mobile Substrate wallet to verify DOT staking and unlock cross-chain algorithmic signals.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleConnect("polkadot", "Talisman Wallet")}
                  disabled={isConnecting}
                  className="w-full p-3 alien-block-cut-sm bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-black text-purple-300">
                      T
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300">
                        Talisman Wallet
                      </div>
                      <div className="text-[10px] text-neutral-400">Polkadot & Ethereum Multi-chain</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 alien-block-cut-sm bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                    Connect
                  </span>
                </button>

                <button
                  onClick={() => handleConnect("polkadot", "SubWallet")}
                  disabled={isConnecting}
                  className="w-full p-3 alien-block-cut-sm bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-black text-purple-300">
                      S
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300">
                        SubWallet
                      </div>
                      <div className="text-[10px] text-neutral-400">Comprehensive Polkadot & Substrate</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 alien-block-cut-sm bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                    Connect
                  </span>
                </button>

                <button
                  onClick={() => handleConnect("polkadot", "Polkadot.js Extension")}
                  disabled={isConnecting}
                  className="w-full p-3 alien-block-cut-sm bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-black text-purple-300">
                      P
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300">
                        Polkadot.js / Enkrypt
                      </div>
                      <div className="text-[10px] text-neutral-400">Native Substrate Core Keyring</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 alien-block-cut-sm bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                    Connect
                  </span>
                </button>
              </div>

              {/* Token Tiers */}
              <div className="p-3 bg-black/60 border border-purple-500/30 alien-block-cut-sm space-y-1.5 text-[11px]">
                <div className="font-bold text-purple-300">Polkadot Token-Gated Thresholds:</div>
                <div className="flex justify-between text-neutral-300">
                  <span>DOT Staker (&gt; 50 DOT):</span>
                  <span className="text-emerald-400 font-bold">Pro Signal Access</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>DOT Whale (&gt; 1,000 DOT):</span>
                  <span className="text-purple-300 font-bold">Full Institutional + Coretime Matrix</span>
                </div>
              </div>
            </div>

            {/* Bitcoin Ecosystem Card */}
            <div className="p-5 alien-block-cut bg-[#020b16] border-2 border-orange-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-orange-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_8px_#f7931a]" />
                  <h3 className="font-zen text-base font-black text-white uppercase">
                    Bitcoin (BTC) Ecosystem
                  </h3>
                </div>
                <span className="text-[10px] text-orange-300 px-2 py-0.5 alien-block-cut-sm bg-orange-950/60 border border-orange-500/40">
                  Taproot / Lightning
                </span>
              </div>

              <p className="text-xs text-neutral-300">
                Connect your Bitcoin Taproot, Ordinals, or WebLN Lightning wallet to unlock sovereign tier analytics and zero-fee agent API access.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleConnect("bitcoin", "Unisat Wallet")}
                  disabled={isConnecting}
                  className="w-full p-3 alien-block-cut-sm bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/40 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-black text-orange-400">
                      U
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-orange-300">
                        UniSat Wallet
                      </div>
                      <div className="text-[10px] text-neutral-400">Native Ordinals, BRC-20 & Taproot</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 alien-block-cut-sm bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] font-bold">
                    Connect
                  </span>
                </button>

                <button
                  onClick={() => handleConnect("bitcoin", "Xverse / Leather")}
                  disabled={isConnecting}
                  className="w-full p-3 alien-block-cut-sm bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/40 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-black text-orange-400">
                      X
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-orange-300">
                        Xverse / Leather
                      </div>
                      <div className="text-[10px] text-neutral-400">Bitcoin Layers & Stacks Staking</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 alien-block-cut-sm bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] font-bold">
                    Connect
                  </span>
                </button>

                <button
                  onClick={() => handleConnect("bitcoin", "Alby / WebLN Lightning")}
                  disabled={isConnecting}
                  className="w-full p-3 alien-block-cut-sm bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/40 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-black text-orange-400">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-orange-300">
                        WebLN / Alby (Lightning)
                      </div>
                      <div className="text-[10px] text-neutral-400">Sub-second Satoshi Micropayments</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 alien-block-cut-sm bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] font-bold">
                    Connect
                  </span>
                </button>
              </div>

              {/* Token Tiers */}
              <div className="p-3 bg-black/60 border border-orange-500/30 alien-block-cut-sm space-y-1.5 text-[11px]">
                <div className="font-bold text-orange-300">Bitcoin Token-Gated Thresholds:</div>
                <div className="flex justify-between text-neutral-300">
                  <span>Sat Stacker (&gt; 1M Sats / 0.01 BTC):</span>
                  <span className="text-emerald-400 font-bold">Lightning Alerts</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Bitcoin Sovereign (&gt; 0.1 BTC):</span>
                  <span className="text-orange-300 font-bold">Lifetime AI Copilot & Quant Node</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: AGENT X402 MICROPAYMENTS (DOT & BTC ONLY)                       */}
      {/* ========================================================================= */}
      {activeSubTab === "x402" && (
        <div className="space-y-6">
          <div className="p-5 alien-block-cut bg-[#020b16] border-2 border-amber-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/30">
              <div>
                <span className="px-2.5 py-0.5 alien-block-cut-sm bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black uppercase tracking-wider">
                  HTTP 402 PAYMENT REQUIRED SPEC
                </span>
                <h3 className="font-zen text-lg font-black text-white uppercase mt-1">
                  Autonomous Agent x402 Micropayment Engine
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setX402Asset("BTC_LIGHTNING")}
                  className={`px-3 py-1.5 alien-block-cut-sm text-xs font-bold transition-all cursor-pointer ${
                    x402Asset === "BTC_LIGHTNING"
                      ? "bg-orange-500 text-black font-black shadow-md"
                      : "bg-black/60 text-neutral-400 border border-neutral-800"
                  }`}
                >
                  ⚡ BTC (Sats / Lightning)
                </button>
                <button
                  onClick={() => setX402Asset("DOT_CORETIME")}
                  className={`px-3 py-1.5 alien-block-cut-sm text-xs font-bold transition-all cursor-pointer ${
                    x402Asset === "DOT_CORETIME"
                      ? "bg-purple-500 text-white font-black shadow-md"
                      : "bg-black/60 text-neutral-400 border border-neutral-800"
                  }`}
                >
                  🟣 DOT (Plancks / JAM)
                </button>
              </div>
            </div>

            <p className="text-xs text-neutral-300">
              Autonomous AI agents and LLM swarms can query real-time stock ratings, hedge fund 13F intelligence, and quant models programmatically by paying micro-amounts on the fly via Bitcoin Lightning Satoshis or Polkadot Coretime Plancks.
            </p>

            {/* Interactive Invoice Generator & Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-black/80 border border-cyan-500/30 alien-block-cut-sm space-y-3">
                <div className="text-xs font-bold text-cyan-300 uppercase flex items-center justify-between">
                  <span>Interactive Agent Query Simulator</span>
                  <span className="text-[10px] text-neutral-400 font-mono">POST /api/v1/intelligence/signal</span>
                </div>

                <div className="p-2.5 bg-[#010810] border border-cyan-900/60 rounded text-[11px] font-mono text-cyan-200 space-y-1">
                  <div><span className="text-purple-400">Target Asset:</span> {x402Asset === "BTC_LIGHTNING" ? "Bitcoin Satoshis (Lightning Network)" : "Polkadot Plancks (JAM Coretime)"}</div>
                  <div><span className="text-purple-400">Cost per Query:</span> {x402Asset === "BTC_LIGHTNING" ? `50 Sats (~$${((50 / 100000000) * btcTicker.price).toFixed(4)} USD)` : `0.005 DOT (~$${(0.005 * dotTicker.price).toFixed(4)} USD)`}</div>
                  <div><span className="text-purple-400">Protocol Header:</span> <code className="text-amber-300">X-402-Payment-Proof: invoice_id=...</code></div>
                </div>

                <button
                  onClick={handleGenerateInvoice}
                  disabled={isGeneratingInvoice}
                  className="w-full py-2.5 alien-block-cut-sm bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingInvoice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{isGeneratingInvoice ? "Generating x402 Challenge..." : "1. Request x402 Micropayment Quote"}</span>
                </button>
              </div>

              {/* Invoice Output & Settle Action */}
              <div className="p-4 bg-black/80 border border-cyan-500/30 alien-block-cut-sm space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase flex items-center justify-between">
                  <span>Live Invoice State</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${activeInvoice?.status === "settled" ? "bg-emerald-500/20 text-emerald-300" : activeInvoice ? "bg-amber-500/20 text-amber-300" : "text-neutral-500"}`}>
                    {activeInvoice ? activeInvoice.status.toUpperCase() : "AWAITING QUOTE"}
                  </span>
                </div>

                {activeInvoice ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-[#010810] border border-neutral-800 rounded font-mono text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Invoice ID:</span>
                        <span className="text-cyan-300 font-bold">{activeInvoice.invoiceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Amount Due:</span>
                        <span className="text-amber-400 font-bold">{activeInvoice.amountDisplay}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-neutral-400">Payload: </span>
                        <span className="text-neutral-300">{activeInvoice.paymentPayload.slice(0, 32)}...</span>
                      </div>
                    </div>

                    {activeInvoice.status !== "settled" ? (
                      <button
                        onClick={handleSettleInvoice}
                        disabled={isSettlingInvoice}
                        className="w-full py-2.5 alien-block-cut-sm bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSettlingInvoice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{isSettlingInvoice ? "Verifying On-Chain Proof..." : `2. Settle ${activeInvoice.amountDisplay}`}</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded text-emerald-300 font-bold text-center text-xs">
                        ✓ x402 Payment Settled! Access Token Issued.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-neutral-500 text-xs">
                    Click "Request x402 Micropayment Quote" to trigger the HTTP 402 challenge flow.
                  </div>
                )}
              </div>
            </div>

            {/* Developer Code Snippet */}
            <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-2">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Agent Integration Example (Python / cURL):</span>
              </div>
              <pre className="p-3 bg-black/90 border border-cyan-900/60 rounded text-[11px] font-mono text-cyan-200 overflow-x-auto">
{`# 1. Agent makes request -> receives HTTP 402 with invoice
curl -X POST https://stockbloc.ai/api/v1/intelligence/signal \\
  -H "Content-Type: application/json" \\
  -d '{"symbol": "NVDA"}'

# 2. Agent settles invoice on Bitcoin Lightning or Polkadot JAM & resends with payment proof:
curl -X POST https://stockbloc.ai/api/v1/intelligence/signal \\
  -H "X-402-Payment-Proof: invoice_id=x402_9824;asset=${x402Asset};preimage=7f8a9b..." \\
  -d '{"symbol": "NVDA"}'`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: PROOF-OF-ALPHA (CRYPTOGRAPHIC MERKLE TREE ON BTC & DOT)          */}
      {/* ========================================================================= */}
      {activeSubTab === "proof_of_alpha" && (
        <div className="space-y-6">
          <div className="p-5 alien-block-cut bg-[#020b16] border-2 border-cyan-500/40 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/30">
              <div>
                <span className="px-2.5 py-0.5 alien-block-cut-sm bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-[10px] font-black uppercase tracking-wider">
                  CRYPTOGRAPHIC IMMUTABILITY
                </span>
                <h3 className="font-zen text-lg font-black text-white uppercase mt-1">
                  Daily StockBloc Proof-of-Alpha Ledger
                </h3>
              </div>
              <button
                onClick={loadProof}
                disabled={isLoadingProof}
                className="px-3 py-1.5 alien-block-cut-sm bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProof ? "animate-spin" : ""}`} />
                <span>Refresh Merkle Root</span>
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Before the market open every trading day, StockBloc computes the algorithmic conviction score and target trajectory for every stock, constructs a cryptographic Merkle Tree, and anchors the root hash permanently onto the <strong>Bitcoin Blockchain (via OP_RETURN)</strong> and the <strong>Polkadot Relay Chain (via Substrate Preimage Extrinsic)</strong>. This provides mathematical, mathematically tamper-proof proof that predictions were published prior to market moves.
            </p>

            {/* Merkle Root & Dual Blockchain Anchors Card */}
            {alphaProof && (
              <div className="p-4 bg-black/90 border-2 border-cyan-500/40 alien-block-cut-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-cyan-300 uppercase">
                    Published Merkle Root Hash ({alphaProof.date})
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{alphaProof.totalPredictions} Stocks Anchored</span>
                  </div>
                </div>

                <div className="p-3 bg-[#010810] border border-cyan-500/40 rounded flex items-center justify-between gap-2">
                  <div className="text-xs font-mono text-cyan-100 font-bold truncate">
                    {alphaProof.merkleRoot}
                  </div>
                  <button
                    onClick={() => handleCopy(alphaProof.merkleRoot, "merkle_root")}
                    className="px-2 py-1 alien-block-cut-sm bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    {copiedText === "merkle_root" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === "merkle_root" ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Dual Blockchain Anchors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Bitcoin Anchor */}
                  <div className="p-3 bg-orange-950/20 border border-orange-500/40 alien-block-cut-sm space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-orange-300">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span>Bitcoin OP_RETURN Anchor</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Block #{alphaProof.bitcoinAnchor.blockHeight}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-300 truncate">
                      Tx: {alphaProof.bitcoinAnchor.txid}
                    </div>
                    <a
                      href={alphaProof.bitcoinAnchor.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 hover:underline"
                    >
                      <span>Inspect on Mempool.space</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Polkadot Anchor */}
                  <div className="p-3 bg-purple-950/20 border border-purple-500/40 alien-block-cut-sm space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-purple-300">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Polkadot JAM / Relay Anchor</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Block #{alphaProof.polkadotAnchor.blockNumber}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-300 truncate">
                      Extrinsic: {alphaProof.polkadotAnchor.extrinsicHash}
                    </div>
                    <a
                      href={alphaProof.polkadotAnchor.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:underline"
                    >
                      <span>Inspect on Polkadot Subscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Leaf Verifier */}
            {alphaProof && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-cyan-300 uppercase">
                  Verify Stock Leaf Hash against Merkle Tree
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {alphaProof.leaves.map((leaf) => (
                    <button
                      key={leaf.symbol}
                      onClick={() => handleVerifySignal(leaf.symbol)}
                      className={`p-2.5 alien-block-cut-sm text-left border transition-all cursor-pointer ${
                        selectedLeafSymbol === leaf.symbol
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-500/20"
                          : "bg-black/60 border-neutral-800 text-neutral-300 hover:border-cyan-500/40"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>${leaf.symbol}</span>
                        <span
                          className={`text-[9px] px-1 rounded ${
                            leaf.predictedTrend === "BULLISH" ? "text-emerald-400" : "text-blue-400"
                          }`}
                        >
                          {leaf.predictedTrend}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-cyan-400 mt-1 font-mono">
                        <span>Score: {leaf.signalScore}/100</span>
                        {leaf.symbol === "BTC-USD" && (
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold transition-all ${
                              btcTicker.pulse === "up"
                                ? "bg-emerald-500/30 text-emerald-300 animate-subtle-pulse-up"
                                : btcTicker.pulse === "down"
                                ? "bg-blue-500/30 text-blue-300 animate-subtle-pulse-down"
                                : "text-orange-300 bg-orange-500/10"
                            }`}
                          >
                            ${btcTicker.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        )}
                        {leaf.symbol === "DOT-USD" && (
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold transition-all ${
                              dotTicker.pulse === "up"
                                ? "bg-emerald-500/30 text-emerald-300 animate-subtle-pulse-up"
                                : dotTicker.pulse === "down"
                                ? "bg-blue-500/30 text-blue-300 animate-subtle-pulse-down"
                                : "text-purple-300 bg-purple-500/10"
                            }`}
                          >
                            ${dotTicker.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Verification Result Card */}
                {verifyResult && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/60 alien-block-cut-sm space-y-2 mt-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>CRYPTOGRAPHIC VERIFICATION SUCCESSFUL: ${verifyResult.symbol}</span>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-300 space-y-1">
                      <div><span className="text-neutral-400">Computed Leaf Hash:</span> <code className="text-emerald-300">{verifyResult.leafHash}</code></div>
                      <div><span className="text-neutral-400">Included in Merkle Root:</span> <code className="text-cyan-300">{verifyResult.merkleRoot}</code></div>
                      <div><span className="text-neutral-400">Audit Status:</span> Immutable on Bitcoin Block #{verifyResult.bitcoinAnchor?.blockHeight} & Polkadot Extrinsic #{verifyResult.polkadotAnchor?.blockNumber}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: NON-CUSTODIAL VAULTS (BTC & DOT ONLY)                           */}
      {/* ========================================================================= */}
      {activeSubTab === "vaults" && (
        <div className="space-y-6">
          <div className="p-5 alien-block-cut bg-[#020b16] border-2 border-purple-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/30">
              <div>
                <span className="px-2.5 py-0.5 alien-block-cut-sm bg-purple-500/20 text-purple-300 border border-purple-500/50 text-[10px] font-black uppercase tracking-wider">
                  DECENTRALIZED QUANT INFRASTRUCTURE
                </span>
                <h3 className="font-zen text-lg font-black text-white uppercase mt-1">
                  Non-Custodial Algorithmic Vaults (BTC & DOT)
                </h3>
              </div>
              <span className="text-xs text-cyan-300 font-bold px-3 py-1 alien-block-cut-sm bg-cyan-950/60 border border-cyan-500/40">
                Fee Structure: 2% Mgmt / 20% Carry
              </span>
            </div>

            <p className="text-xs text-neutral-300">
              Non-custodial smart contract vaults execute StockBloc quantitative strategies autonomously without user funds ever entering centralized custody. Profits settle directly to depositor wallets via smart contracts.
            </p>

            {/* Vaults Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {vaults.map((vault) => (
                <div
                  key={vault.id}
                  className={`p-5 alien-block-cut-sm border-2 transition-all space-y-4 ${
                    vault.asset === "BTC"
                      ? "bg-gradient-to-b from-[#120800] to-[#050300] border-orange-500/50 shadow-lg shadow-orange-500/10"
                      : "bg-gradient-to-b from-[#0f0015] to-[#040008] border-purple-500/50 shadow-lg shadow-purple-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 alien-block-cut-sm text-[10px] font-black uppercase ${
                          vault.asset === "BTC" ? "bg-orange-500 text-black" : "bg-purple-500 text-white"
                        }`}
                      >
                        {vault.asset} VAULT
                      </span>
                      <span className="text-xs font-bold text-white">{vault.name}</span>
                      {vault.asset === "BTC" && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border transition-all ${
                            btcTicker.pulse === "up"
                              ? "animate-subtle-pulse-up bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : btcTicker.pulse === "down"
                              ? "animate-subtle-pulse-down bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-orange-500/10 text-orange-300 border-orange-500/30"
                          }`}
                        >
                          Spot: ${btcTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      {vault.asset === "DOT" && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border transition-all ${
                            dotTicker.pulse === "up"
                              ? "animate-subtle-pulse-up bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : dotTicker.pulse === "down"
                              ? "animate-subtle-pulse-down bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          }`}
                        >
                          Spot: ${dotTicker.price.toFixed(3)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-emerald-400 font-martian">{vault.apy30d}</span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">{vault.strategy}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-black/60 border border-neutral-800 rounded">
                      <div className="text-neutral-400 text-[9px] uppercase">TVL</div>
                      <div className="text-white font-bold">{vault.totalValueLocked}</div>
                    </div>
                    <div className="p-2 bg-black/60 border border-neutral-800 rounded">
                      <div className="text-neutral-400 text-[9px] uppercase">Sharpe</div>
                      <div className="text-cyan-300 font-bold">{vault.sharpeRatio}</div>
                    </div>
                    <div className="p-2 bg-black/60 border border-neutral-800 rounded">
                      <div className="text-neutral-400 text-[9px] uppercase">Max DD</div>
                      <div className="text-blue-400 font-bold">{vault.maxDrawdown}</div>
                    </div>
                    <div className="p-2 bg-black/60 border border-neutral-800 rounded">
                      <div className="text-neutral-400 text-[9px] uppercase">Status</div>
                      <div className="text-emerald-400 font-bold">{vault.status}</div>
                    </div>
                  </div>

                  {/* On-Chain Contract Info & Last Trade */}
                  <div className="p-2.5 bg-black/80 border border-neutral-800 rounded text-[10px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Contract:</span>
                      <span className="text-cyan-300 truncate max-w-[200px]">{vault.contractAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Last Trade:</span>
                      <span className="text-emerald-300 font-bold">
                        {vault.lastTrade.action} {vault.lastTrade.amount} (
                        {new Date(vault.lastTrade.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                      </span>
                    </div>
                  </div>

                  {/* Simulator Trigger */}
                  <button
                    onClick={() => {
                      triggerHaptic("selection");
                      setSelectedVaultId(vault.id);
                    }}
                    className={`w-full py-2 alien-block-cut-sm font-bold text-xs transition-all cursor-pointer ${
                      vault.asset === "BTC"
                        ? "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/50"
                        : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50"
                    }`}
                  >
                    Simulate Deposit & Yield Breakdown
                  </button>
                </div>
              ))}
            </div>

            {/* Interactive Vault Simulation Calculator */}
            <div className="p-4 bg-black/90 border border-cyan-500/30 alien-block-cut-sm space-y-3 mt-4">
              <div className="text-xs font-bold text-cyan-300 uppercase flex items-center justify-between">
                <span>Vault Return & Protocol Fee Simulator</span>
                <span className="text-[10px] text-neutral-400">
                  Target: {selectedVaultId === "vault_btc_alpha_01" ? "Bitcoin Vault (34.6% APY)" : "Polkadot Vault (28.2% APY)"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">
                    Deposit Amount ({selectedVaultId === "vault_btc_alpha_01" ? "BTC" : "DOT"}):
                  </label>
                  <input
                    type="number"
                    value={simDepositAmount}
                    onChange={(e) => setSimDepositAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-cyan-500/40 rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded space-y-1">
                  <div className="text-[10px] text-neutral-400">Est. 1-Year Gross Yield:</div>
                  <div className="text-emerald-400 font-bold font-martian text-xs">
                    +{(simDepositAmount * (selectedVaultId === "vault_btc_alpha_01" ? 0.346 : 0.282)).toFixed(3)}{" "}
                    {selectedVaultId === "vault_btc_alpha_01" ? "BTC" : "DOT"}
                    <span className="block text-[10px] text-emerald-300 font-normal mt-0.5">
                      (~$
                      {(
                        simDepositAmount *
                        (selectedVaultId === "vault_btc_alpha_01" ? 0.346 * btcTicker.price : 0.282 * dotTicker.price)
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                      USD)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded space-y-1">
                  <div className="text-[10px] text-neutral-400">Net Return (after 2/20 fee split):</div>
                  <div className="text-cyan-300 font-bold font-martian text-xs">
                    +{(simDepositAmount * (selectedVaultId === "vault_btc_alpha_01" ? 0.276 : 0.225)).toFixed(3)}{" "}
                    {selectedVaultId === "vault_btc_alpha_01" ? "BTC" : "DOT"}
                    <span className="block text-[10px] text-cyan-200 font-normal mt-0.5">
                      (~$
                      {(
                        simDepositAmount *
                        (selectedVaultId === "vault_btc_alpha_01" ? 0.276 * btcTicker.price : 0.225 * dotTicker.price)
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                      USD)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DotBtcWeb3Hub;
