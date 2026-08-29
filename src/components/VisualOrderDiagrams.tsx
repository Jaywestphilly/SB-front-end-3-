import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Compass,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  DollarSign,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export const VisualOrderDiagrams: React.FC = () => {
  const [selectedOrderType, setSelectedOrderType] = useState<
    "market" | "limit" | "stop_loss" | "trailing_stop"
  >("limit");
  const [targetLimitPrice, setTargetLimitPrice] = useState<number>(115);
  const [stopPrice, setStopPrice] = useState<number>(95);
  const [currentStockPrice] = useState<number>(120);

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-black border border-emerald-500/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <Compass className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Visual Order Execution Diagrams
              </h3>
              <p className="text-xs font-tech text-emerald-200/80">
                Interactive price-action visualizers: how market, limit & stop
                orders trigger in live trading
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
            Interactive Simulator
          </div>
        </div>

        {/* Order Type Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setSelectedOrderType("market");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedOrderType === "market"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 font-black shadow-lg shadow-emerald-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>1. Market Order</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setSelectedOrderType("limit");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedOrderType === "limit"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-black shadow-lg shadow-cyan-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-cyan-400" />
            <span>2. Limit Order</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setSelectedOrderType("stop_loss");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedOrderType === "stop_loss"
                ? "bg-rose-500/20 text-rose-300 border-rose-400 font-black shadow-lg shadow-rose-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>3. Stop-Loss Order</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setSelectedOrderType("trailing_stop");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedOrderType === "trailing_stop"
                ? "bg-purple-500/20 text-purple-300 border-purple-400 font-black shadow-lg shadow-purple-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>4. Trailing Stop</span>
          </button>
        </div>
      </div>

      {/* Visual Diagram Card */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-6 relative overflow-hidden">
        {/* 1. MARKET ORDER DIAGRAM */}
        {selectedOrderType === "market" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-base font-black font-mono text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Market Order Execution: Immediate Fill
                </h4>
                <p className="text-sm text-neutral-300 font-sans mt-0.5">
                  Buys or sells instantly at the current ask or bid price
                  available in the order book.
                </p>
              </div>
              <div className="px-3 py-1 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold shrink-0">
                Guaranteed Execution Speed
              </div>
            </div>

            {/* Visual Graphic Canvas */}
            <div className="p-6 rounded-xl bg-black/80 border border-emerald-500/30 relative space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-400 border-b border-white/10 pb-2">
                <span>STOCK PRICE PATH</span>
                <span className="text-emerald-400 font-bold">
                  CURRENT ASK: ${currentStockPrice}.00
                </span>
              </div>

              {/* Simulated Price Line Chart SVG */}
              <div className="relative h-44 w-full flex items-center justify-center">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 500 160"
                >
                  {/* Grid Lines */}
                  <line
                    x1="0"
                    y1="40"
                    x2="500"
                    y2="40"
                    stroke="#333"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="0"
                    y1="80"
                    x2="500"
                    y2="80"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                  />
                  <line
                    x1="0"
                    y1="120"
                    x2="500"
                    y2="120"
                    stroke="#333"
                    strokeDasharray="4 4"
                  />

                  {/* Price Path */}
                  <path
                    d="M 20 120 Q 80 130 140 100 T 260 80 T 380 80 T 480 80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                  />

                  {/* Immediate Execution Point */}
                  <circle
                    cx="260"
                    cy="80"
                    r="9"
                    fill="#10b981"
                    className="animate-ping opacity-75"
                  />
                  <circle
                    cx="260"
                    cy="80"
                    r="7"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Label Callout */}
                  <g transform="translate(260, 30)">
                    <rect
                      x="-65"
                      y="-18"
                      width="130"
                      height="26"
                      rx="6"
                      fill="#10b981"
                    />
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fill="#000000"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      INSTANT FILL @ $120
                    </text>
                  </g>
                </svg>
              </div>

              {/* Explainer Box */}
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs font-sans text-emerald-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300 font-mono">
                    When to use:
                  </strong>{" "}
                  Market orders prioritize speed over exact price. Perfect for
                  highly liquid mega-cap stocks ($NVDA, $AAPL, $VOO) where you
                  want to enter immediately without risking missing the trade.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LIMIT ORDER DIAGRAM */}
        {selectedOrderType === "limit" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-base font-black font-mono text-cyan-400 flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-cyan-400" />
                  Buy Limit Order: Wait for Your Price
                </h4>
                <p className="text-sm text-neutral-300 font-sans mt-0.5">
                  Sets a maximum price you are willing to pay. Order stays
                  pending until price dips to your limit price.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  Set Limit Price:
                </span>
                <input
                  type="range"
                  min="100"
                  max="119"
                  value={targetLimitPrice}
                  onChange={(e) => setTargetLimitPrice(Number(e.target.value))}
                  className="w-28 accent-cyan-400 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40">
                  ${targetLimitPrice}.00
                </span>
              </div>
            </div>

            {/* Visual Graphic Canvas */}
            <div className="p-6 rounded-xl bg-black/80 border border-cyan-500/30 relative space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-400 border-b border-white/10 pb-2">
                <span>CURRENT MARKET: $120.00</span>
                <span className="text-cyan-400 font-bold">
                  YOUR LIMIT PRICE: ${targetLimitPrice}.00
                </span>
              </div>

              {/* Simulated Price Line Chart SVG */}
              <div className="relative h-48 w-full flex items-center justify-center">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 500 170"
                >
                  {/* Current Price Reference Line */}
                  <line
                    x1="0"
                    y1="30"
                    x2="500"
                    y2="30"
                    stroke="#666"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="10"
                    y="22"
                    fill="#aaa"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    Current Market ($120)
                  </text>

                  {/* Target Limit Price Line */}
                  <line
                    x1="0"
                    y1="120"
                    x2="500"
                    y2="120"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                  />
                  <text
                    x="380"
                    y="112"
                    fill="#06b6d4"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    LIMIT TRIGGER: ${targetLimitPrice}
                  </text>

                  {/* Stock Price Pullback Curve */}
                  <path
                    d="M 20 30 Q 120 20 200 70 T 320 120 T 420 80 T 480 60"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3.5"
                  />

                  {/* Fill Point */}
                  <circle
                    cx="320"
                    cy="120"
                    r="9"
                    fill="#06b6d4"
                    className="animate-ping opacity-75"
                  />
                  <circle
                    cx="320"
                    cy="120"
                    r="7"
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Label Callout */}
                  <g transform="translate(320, 155)">
                    <rect
                      x="-70"
                      y="-14"
                      width="140"
                      height="24"
                      rx="6"
                      fill="#06b6d4"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill="#000000"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      BUY LIMIT FILLED @ ${targetLimitPrice}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Explainer Box */}
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs font-sans text-cyan-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-300 font-mono">
                    When to use:
                  </strong>{" "}
                  Never overpay! If a stock is trading at $120 but you only want
                  to pay $115, set a Buy Limit Order. Your order will sit safely
                  in the order book until sellers push the price down to $115.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. STOP-LOSS ORDER DIAGRAM */}
        {selectedOrderType === "stop_loss" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-base font-black font-mono text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  Stop-Loss Order: Automatic Risk Protection
                </h4>
                <p className="text-sm text-neutral-300 font-sans mt-0.5">
                  Triggers an automatic sell order if the stock crashes down to
                  your stop trigger price to cap losses.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  Set Stop Trigger:
                </span>
                <input
                  type="range"
                  min="80"
                  max="110"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(Number(e.target.value))}
                  className="w-28 accent-rose-400 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-rose-300 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/40">
                  ${stopPrice}.00
                </span>
              </div>
            </div>

            {/* Visual Graphic Canvas */}
            <div className="p-6 rounded-xl bg-black/80 border border-rose-500/30 relative space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-400 border-b border-white/10 pb-2">
                <span>ENTRY BOUGHT @ $120.00</span>
                <span className="text-rose-400 font-bold">
                  STOP TRIGGER: ${stopPrice}.00
                </span>
              </div>

              {/* Simulated Price Line Chart SVG */}
              <div className="relative h-48 w-full flex items-center justify-center">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 500 170"
                >
                  {/* Purchase Price Line */}
                  <line
                    x1="0"
                    y1="30"
                    x2="500"
                    y2="30"
                    stroke="#10b981"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="10"
                    y="22"
                    fill="#10b981"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    Bought Entry ($120)
                  </text>

                  {/* Stop Loss Floor Line */}
                  <line
                    x1="0"
                    y1="110"
                    x2="500"
                    y2="110"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                  />
                  <text
                    x="380"
                    y="102"
                    fill="#f43f5e"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    STOP FLOOR: ${stopPrice}
                  </text>

                  {/* Price Crash Curve */}
                  <path
                    d="M 20 30 Q 100 40 180 80 T 280 110 T 380 145 T 480 160"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3.5"
                  />

                  {/* Trigger Point */}
                  <circle
                    cx="280"
                    cy="110"
                    r="9"
                    fill="#f43f5e"
                    className="animate-ping opacity-75"
                  />
                  <circle
                    cx="280"
                    cy="110"
                    r="7"
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Label Callout */}
                  <g transform="translate(280, 70)">
                    <rect
                      x="-80"
                      y="-14"
                      width="160"
                      height="24"
                      rx="6"
                      fill="#f43f5e"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      STOP-LOSS FILLED @ ${stopPrice}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Explainer Box */}
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs font-sans text-rose-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-300 font-mono">
                    Wall Street Rule #1:
                  </strong>{" "}
                  Always protect your portfolio capital. Placing a Stop-Loss at
                  ${stopPrice} ensures that even if the stock crashes all the
                  way down to $50 overnight, your position is automatically sold
                  at ${stopPrice} to limit your total drawdown.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRAILING STOP ORDER DIAGRAM */}
        {selectedOrderType === "trailing_stop" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-base font-black font-mono text-purple-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Trailing Stop Order: Locking in Maximum Profit
                </h4>
                <p className="text-sm text-neutral-300 font-sans mt-0.5">
                  The stop price dynamically adjusts UPWARD as the stock
                  rallies, but locks in place when price drops.
                </p>
              </div>
              <div className="px-3 py-1 rounded bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono text-xs font-bold shrink-0">
                Dynamic Profit Lock ($10 Trail)
              </div>
            </div>

            {/* Visual Graphic Canvas */}
            <div className="p-6 rounded-xl bg-black/80 border border-purple-500/30 relative space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-400 border-b border-white/10 pb-2">
                <span>ENTRY: $100.00</span>
                <span className="text-purple-300">PEAK RALLY: $150.00</span>
                <span className="text-purple-400 font-bold">
                  TRAILING EXIT: $140.00
                </span>
              </div>

              {/* Simulated Price Line Chart SVG */}
              <div className="relative h-48 w-full flex items-center justify-center">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 500 170"
                >
                  {/* Stock Price Curve */}
                  <path
                    d="M 20 140 Q 120 100 220 50 T 320 20 T 400 60 T 480 80"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3.5"
                  />

                  {/* Trailing Stop Dynamic Path */}
                  <path
                    d="M 20 160 Q 120 120 220 70 T 320 40 L 480 40"
                    fill="none"
                    stroke="#e879f9"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Peak Point */}
                  <circle cx="320" cy="20" r="5" fill="#a855f7" />
                  <text
                    x="320"
                    y="10"
                    textAnchor="middle"
                    fill="#a855f7"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    PEAK $150
                  </text>

                  {/* Trailing Exit Trigger Point */}
                  <circle
                    cx="400"
                    cy="60"
                    r="9"
                    fill="#e879f9"
                    className="animate-ping opacity-75"
                  />
                  <circle
                    cx="400"
                    cy="60"
                    r="7"
                    fill="#e879f9"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Label Callout */}
                  <g transform="translate(400, 95)">
                    <rect
                      x="-80"
                      y="-14"
                      width="160"
                      height="24"
                      rx="6"
                      fill="#e879f9"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill="#000000"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      TRAILED EXIT FILLED @ $140
                    </text>
                  </g>
                </svg>
              </div>

              {/* Explainer Box */}
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 text-xs font-sans text-purple-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300 font-mono">
                    How it works:
                  </strong>{" "}
                  If you buy at $100 and set a $10 Trailing Stop, your stop
                  starts at $90. As the stock rallies to $150, your stop
                  automatically climbs to $140. When the stock pulls back to
                  $140, your order fills, securing $40 in profit without manual
                  watching!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
