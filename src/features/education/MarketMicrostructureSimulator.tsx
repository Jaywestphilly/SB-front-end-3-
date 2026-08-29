import React, { useState, useEffect } from "react";
import {
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  HelpCircle,
  Clock,
  Compass,
  DollarSign,
  Cpu,
  RefreshCw,
  Play,
  Pause
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const MICROSTRUCTURE_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "Regulation NMS Rule 611 (Order Protection Rule)",
    source: "SEC Division of Trading and Markets (17 CFR § 242.611)",
    sourceType: "Regulatory Agency",
    asOfDate: "Permanent SEC Rule",
    updateFrequency: "Permanent Physics",
    details: "Requires trading centers to establish policies reasonably designed to prevent trade-throughs on protected automated quotations at the NBBO."
  },
  {
    metricName: "Payment for Order Flow (PFOF) & SEC Rule 606 Disclosures",
    source: "SEC Rule 606 Quarterly Order Routing Reports (Robinhood, Citadel Securities, Two Sigma)",
    sourceType: "SEC Filing",
    asOfDate: "Q2 2026 Filings",
    updateFrequency: "Quarterly",
    details: "Wholesale market maker internalizer internalization rates, price improvement statistics (Rule 605), and routing rebates."
  },
  {
    metricName: "SIP (Securities Information Processor) Latency Benchmarks",
    source: "Consolidated Tape Association (CTA) & UTP SIP Performance Metrics",
    sourceType: "Market Exchange",
    asOfDate: "August 2026",
    updateFrequency: "Monthly",
    details: "Microsecond quotation latency for Consolidated Tape System (CTS) and Consolidated Quotation System (CQS)."
  }
];

interface OrderBookLevel {
  price: number;
  shares: number;
  totalVolume: number;
  ordersCount: number;
}

export const MarketMicrostructureSimulator: React.FC = () => {
  const [midPrice, setMidPrice] = useState<number>(150.00);
  const [spreadBps, setSpreadBps] = useState<number>(2); // 2 cents / 1.3 bps
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "ICEBERG">("LIMIT");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderSize, setOrderSize] = useState<number>(500);
  const [routingVenue, setRoutingVenue] = useState<"WHOLESALER_PFOF" | "LIT_EXCHANGE" | "DARK_POOL">("WHOLESALER_PFOF");
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Generate synthetic order book ladder around midPrice
  const halfSpread = 0.01;
  const bestBid = midPrice - halfSpread;
  const bestAsk = midPrice + halfSpread;

  const bids: OrderBookLevel[] = [
    { price: bestBid, shares: 1200, totalVolume: 1200, ordersCount: 8 },
    { price: bestBid - 0.01, shares: 2400, totalVolume: 3600, ordersCount: 14 },
    { price: bestBid - 0.02, shares: 4100, totalVolume: 7700, ordersCount: 22 },
    { price: bestBid - 0.03, shares: 3500, totalVolume: 11200, ordersCount: 19 },
    { price: bestBid - 0.04, shares: 6200, totalVolume: 17400, ordersCount: 31 }
  ];

  const asks: OrderBookLevel[] = [
    { price: bestAsk, shares: 900, totalVolume: 900, ordersCount: 6 },
    { price: bestAsk + 0.01, shares: 2100, totalVolume: 3000, ordersCount: 12 },
    { price: bestAsk + 0.02, shares: 3800, totalVolume: 6800, ordersCount: 20 },
    { price: bestAsk + 0.03, shares: 4900, totalVolume: 11700, ordersCount: 25 },
    { price: bestAsk + 0.04, shares: 7100, totalVolume: 18800, ordersCount: 38 }
  ];

  const handleSimulateExecution = () => {
    triggerHaptic("medium");
    const timestamp = new Date().toLocaleTimeString();
    let message = "";

    if (routingVenue === "WHOLESALER_PFOF") {
      if (orderSide === "BUY") {
        const fillPrice = bestAsk - 0.002; // Price improvement
        message = `[${timestamp}] Internalizer Filled ${orderSize} shares @ $${fillPrice.toFixed(3)} (+$${((bestAsk - fillPrice) * orderSize).toFixed(2)} price improvement vs NBBO Ask). PFOF Rebate paid to broker: $${(orderSize * 0.0015).toFixed(2)}.`;
      } else {
        const fillPrice = bestBid + 0.002;
        message = `[${timestamp}] Internalizer Filled ${orderSize} shares @ $${fillPrice.toFixed(3)} (+$${((fillPrice - bestBid) * orderSize).toFixed(2)} price improvement vs NBBO Bid).`;
      }
    } else if (routingVenue === "LIT_EXCHANGE") {
      if (orderType === "MARKET") {
        const fillPrice = orderSide === "BUY" ? bestAsk : bestBid;
        message = `[${timestamp}] Swept Lit Book (Nasdaq/NYSE): ${orderSize} shares filled @ $${fillPrice.toFixed(2)}. Taker Fee charged: $${(orderSize * 0.003).toFixed(2)}.`;
      } else if (orderType === "ICEBERG") {
        message = `[${timestamp}] Placed Iceberg Limit Order: 100 shares displayed on Book @ $${(orderSide === "BUY" ? bestBid : bestAsk).toFixed(2)}, ${orderSize - 100} shares hidden in queue reserve.`;
      } else {
        message = `[${timestamp}] Rested on Lit Book: ${orderSize} shares @ $${(orderSide === "BUY" ? bestBid : bestAsk).toFixed(2)}. Maker rebate pending fill.`;
      }
    } else {
      message = `[${timestamp}] Dark Pool Midpoint Cross: ${orderSize} shares matched @ exact midpoint $${midPrice.toFixed(2)} (Zero market impact, zero public tape quote leakage).`;
    }

    setExecutionLog((prev) => [message, ...prev.slice(0, 5)]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-black border border-cyan-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Activity className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Market Microstructure & Order Book Simulator
              </h2>
            </div>
            <p className="text-xs text-cyan-200/80 font-mono">
              Level 2 Depth of Book, PFOF Internalization vs Lit Exchanges & Iceberg Routing
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
            Reg NMS Rule 611 Engine
          </div>
        </div>
      </div>

      {/* NBBO TICKER BAR */}
      <div className="p-4 rounded-xl bg-black/80 border border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-4">
          <span className="text-neutral-400">NBBO Ticker: <strong className="text-white">XYZ CORP</strong></span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            BID: ${bestBid.toFixed(2)} × 1,200 (Nasdaq)
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30">
            ASK: ${bestAsk.toFixed(2)} × 900 (NYSE Arca)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-neutral-400">Midpoint: <strong className="text-cyan-400">${midPrice.toFixed(2)}</strong></span>
          <span className="text-neutral-400">Spread: <strong className="text-amber-400">$0.02 (1.3 bps)</strong></span>
        </div>
      </div>

      {/* MAIN GRID: ORDER LADDER + EXECUTION CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ORDER BOOK DEPTH LADDER */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Level 2 Depth of Book (Order Ladder)
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">Depth: 5 Ticks</span>
          </div>

          {/* ASKS (RED) */}
          <div className="space-y-1">
            <div className="grid grid-cols-4 text-[10px] font-mono text-neutral-500 uppercase pb-1 border-b border-white/5">
              <span>Ask Price</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Cumulative</span>
              <span className="text-right">Orders</span>
            </div>
            {asks.slice().reverse().map((level, i) => (
              <div key={i} className="grid grid-cols-4 text-xs font-mono py-1 px-2 rounded bg-red-950/20 hover:bg-red-950/40 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 right-0 bg-red-500/10"
                  style={{ width: `${(level.totalVolume / 20000) * 100}%` }}
                />
                <span className="text-red-400 font-bold z-10">${level.price.toFixed(2)}</span>
                <span className="text-right text-neutral-200 z-10">{level.shares.toLocaleString()}</span>
                <span className="text-right text-neutral-400 z-10">{level.totalVolume.toLocaleString()}</span>
                <span className="text-right text-neutral-500 z-10">{level.ordersCount}</span>
              </div>
            ))}
          </div>

          {/* SPREAD DIVIDER */}
          <div className="py-2 px-3 rounded-lg bg-neutral-950 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">--- SPREAD $0.02 ---</span>
            <span className="text-cyan-400 font-bold">Consolidated SIP Mid: ${midPrice.toFixed(2)}</span>
          </div>

          {/* BIDS (GREEN) */}
          <div className="space-y-1">
            {bids.map((level, i) => (
              <div key={i} className="grid grid-cols-4 text-xs font-mono py-1 px-2 rounded bg-emerald-950/20 hover:bg-emerald-950/40 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 right-0 bg-emerald-500/10"
                  style={{ width: `${(level.totalVolume / 20000) * 100}%` }}
                />
                <span className="text-emerald-400 font-bold z-10">${level.price.toFixed(2)}</span>
                <span className="text-right text-neutral-200 z-10">{level.shares.toLocaleString()}</span>
                <span className="text-right text-neutral-400 z-10">{level.totalVolume.toLocaleString()}</span>
                <span className="text-right text-neutral-500 z-10">{level.ordersCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ORDER EXECUTION SIMULATOR PANEL */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            Smart Order Router (SOR) Terminal
          </h3>

          <div className="space-y-3">
            {/* Side Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderSide("BUY")}
                className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  orderSide === "BUY"
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                    : "bg-neutral-950 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => setOrderSide("SELL")}
                className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  orderSide === "SELL"
                    ? "bg-red-500 text-black shadow-lg shadow-red-500/30"
                    : "bg-neutral-950 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Order Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-neutral-400">Order Instruction</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["MARKET", "LIMIT", "ICEBERG"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      orderType === t
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400"
                        : "bg-neutral-950 text-neutral-400 border border-white/5"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Venue Routing */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-neutral-400">Execution Venue</label>
              <div className="space-y-1">
                {[
                  { id: "WHOLESALER_PFOF", label: "Retail Wholesaler (PFOF / Citadel / Virtu)" },
                  { id: "LIT_EXCHANGE", label: "Lit Public Exchange (NYSE / Nasdaq)" },
                  { id: "DARK_POOL", label: "Institutional Dark Pool (Midpoint ATS)" }
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setRoutingVenue(v.id as any)}
                    className={`w-full p-2 rounded-lg text-left text-xs font-mono transition-all cursor-pointer ${
                      routingVenue === v.id
                        ? "bg-amber-500/20 text-amber-300 border border-amber-400 font-bold"
                        : "bg-neutral-950 text-neutral-400 border border-white/5 hover:text-white"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-mono text-neutral-300">
                <span>Order Quantity</span>
                <span className="text-cyan-400 font-bold">{orderSize.toLocaleString()} shares</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={orderSize}
                onChange={(e) => setOrderSize(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Execute Button */}
            <button
              onClick={handleSimulateExecution}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95 transition-all"
            >
              Route & Execute Order
            </button>
          </div>

          {/* LIVE EXECUTION AUDIT TRAIL */}
          <div className="p-3 rounded-xl bg-black border border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">
              Execution Tape & Price Improvement Audit
            </span>
            {executionLog.length === 0 ? (
              <p className="text-[11px] text-neutral-500 italic font-mono">
                Click 'Route & Execute Order' to simulate smart order routing.
              </p>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px]">
                {executionLog.map((log, index) => (
                  <div key={index} className="text-neutral-300 leading-snug border-b border-white/5 pb-1">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA PROVENANCE */}
      <DataProvenanceCard
        category="Market Microstructure & High-Frequency Mechanics"
        lastUpdated="August 2026 (SEC Rule 611 & SIP Standards)"
        sources={MICROSTRUCTURE_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
