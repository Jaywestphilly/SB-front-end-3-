import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Layers,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  DollarSign,
  BarChart3,
  ArrowRight,
  Sparkles,
  Info,
  Percent,
  Clock,
  HelpCircle,
  Activity,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface OptionStrikeRow {
  strike: number;
  callBid: number;
  callAsk: number;
  callDelta: number;
  callTheta: number;
  callVolume: number;
  callIV: number;
  putBid: number;
  putAsk: number;
  putDelta: number;
  putTheta: number;
  putVolume: number;
  putIV: number;
}

export const VisualOptionsTree: React.FC = () => {
  const [selectedOutlook, setSelectedOutlook] = useState<"bullish" | "bearish">(
    "bullish",
  );
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    price: number;
  }>({
    symbol: "NVDA",
    price: 130,
  });
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [selectedContract, setSelectedContract] = useState<{
    type: "CALL" | "PUT";
    strike: number;
    premium: number;
    delta: number;
    theta: number;
  }>({
    type: "CALL",
    strike: 135,
    premium: 4.5,
    delta: 0.48,
    theta: -0.06,
  });

  // Mock Option Chain Data around Stock Price
  const generateOptionChain = (stockPrice: number): OptionStrikeRow[] => {
    const strikes = [
      stockPrice - 15,
      stockPrice - 10,
      stockPrice - 5,
      stockPrice,
      stockPrice + 5,
      stockPrice + 10,
      stockPrice + 15,
    ];

    return strikes.map((strike) => {
      const diff = stockPrice - strike;
      const isCallITM = diff > 0;
      const isPutITM = diff < 0;

      // Premium calculation formula
      const intrinsicCall = Math.max(0, diff);
      const timeValue = Math.max(1.2, 8.5 - Math.abs(diff) * 0.45);
      const callPrice = Number((intrinsicCall + timeValue).toFixed(2));

      const intrinsicPut = Math.max(0, -diff);
      const putPrice = Number((intrinsicPut + timeValue).toFixed(2));

      return {
        strike,
        callBid: Number((callPrice * 0.96).toFixed(2)),
        callAsk: Number((callPrice * 1.04).toFixed(2)),
        callDelta: Number((0.5 + diff / 30).toFixed(2)),
        callTheta: -0.05,
        callVolume: Math.floor(1200 + Math.abs(diff) * 150),
        callIV: 38,
        putBid: Number((putPrice * 0.96).toFixed(2)),
        putAsk: Number((putPrice * 1.04).toFixed(2)),
        putDelta: Number((-0.5 + diff / 30).toFixed(2)),
        putTheta: -0.05,
        putVolume: Math.floor(950 + Math.abs(diff) * 120),
        putIV: 39,
      };
    });
  };

  const chain = generateOptionChain(selectedStock.price);

  // Computed P&L Payoff metrics
  const totalCost = Number((selectedContract.premium * 100).toFixed(2));
  const breakevenPrice =
    selectedContract.type === "CALL"
      ? Number((selectedContract.strike + selectedContract.premium).toFixed(2))
      : Number((selectedContract.strike - selectedContract.premium).toFixed(2));

  return (
    <div className="space-y-6 select-none">
      {/* SECTION 1: INTERACTIVE OPTIONS DECISION TREE */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-black border border-purple-500/40 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
              <Layers className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Options Strategy Decision Tree
              </h3>
              <p className="text-xs font-tech text-purple-200/80">
                Visual flow chart: match market outlook to high-probability
                option contracts
              </p>
            </div>
          </div>

          {/* Outlook Toggles */}
          <div className="flex items-center gap-2 p-1 bg-black/60 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setSelectedOutlook("bullish");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedOutlook === "bullish"
                  ? "bg-emerald-500 text-black shadow-md font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>BULLISH OUTLOOK</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setSelectedOutlook("bearish");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedOutlook === "bearish"
                  ? "bg-rose-500 text-white shadow-md font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>BEARISH OUTLOOK</span>
            </button>
          </div>
        </div>

        {/* Tree Flow Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Node 1: Market Outlook */}
          <div className="p-4 rounded-xl bg-black/70 border border-purple-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block mb-1">
                STEP 1: MARKET OUTLOOK
              </span>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                {selectedOutlook === "bullish" ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">
                      Expecting Stock Rise
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">Expecting Stock Fall</span>
                  </>
                )}
              </h4>
              <p className="text-sm text-neutral-300 font-sans mt-2 leading-relaxed">
                {selectedOutlook === "bullish"
                  ? "You believe upcoming earnings, product launches, or technical breakouts will drive share prices higher."
                  : "You anticipate market pullbacks, valuation contraction, or negative macroeconomic news pushing prices lower."}
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse hidden md:block" />
            </div>
          </div>

          {/* Node 2: Primary Strategy Choice */}
          <div className="p-4 rounded-xl bg-black/70 border border-purple-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block mb-1">
                STEP 2: PRIMARY CONTRACT TYPE
              </span>
              <h4 className="text-sm font-black text-white">
                {selectedOutlook === "bullish"
                  ? "BUY CALL OPTION"
                  : "BUY PUT OPTION"}
              </h4>
              <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 font-sans space-y-1">
                <div>
                  <strong className="text-white">Cap Risk:</strong> Only pay
                  Premium upfront
                </div>
                <div>
                  <strong className="text-white">Upside:</strong> Unlimited
                  profit potential
                </div>
                <div>
                  <strong className="text-white">Leverage:</strong> 1 contract
                  controls 100 shares
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse hidden md:block" />
            </div>
          </div>

          {/* Node 3: Income Alternative */}
          <div className="p-4 rounded-xl bg-black/70 border border-purple-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block mb-1">
                INCOME ALTERNATIVE
              </span>
              <h4 className="text-sm font-black text-white">
                {selectedOutlook === "bullish"
                  ? "SELL CASH-SECURED PUT"
                  : "SELL COVERED CALL"}
              </h4>
              <p className="text-sm text-neutral-300 font-sans mt-2 leading-relaxed">
                {selectedOutlook === "bullish"
                  ? "Sell a Put at a discount strike price. Collect instant premium income today while offering to buy the stock if it dips."
                  : "If you already own 100 shares, sell a Call option above market price to collect passive cash flow while holding."}
              </p>
            </div>
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] text-center font-bold">
              INSTANT CASH PREMIUM COLLECTED
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE OPTIONS CHAIN & PAYOFF DIAGRAM SIMULATOR */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Live Options Chain & P&L Payoff Simulator
            </h3>
            <p className="text-xs font-tech text-neutral-400">
              Select stock ticker, strike price & contract type to calculate
              Breakeven & Payoff
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Stock Selector */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-neutral-800 font-mono text-xs">
              <span className="text-neutral-500 text-[10px] uppercase pl-1">
                Ticker:
              </span>
              {[
                { symbol: "NVDA", price: 130 },
                { symbol: "AAPL", price: 220 },
                { symbol: "TSLA", price: 250 },
                { symbol: "VOO", price: 510 },
              ].map((stk) => (
                <button
                  key={stk.symbol}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedStock(stk);
                    setSelectedContract({
                      type: "CALL",
                      strike: stk.price + 5,
                      premium: 4.2,
                      delta: 0.48,
                      theta: -0.05,
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    selectedStock.symbol === stk.symbol
                      ? "bg-purple-500 text-white font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  ${stk.symbol}
                </button>
              ))}
            </div>

            {/* Expiration Date Selector */}
            <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-xl border border-neutral-800 font-mono text-xs">
              <span className="text-neutral-500 text-[10px] uppercase pl-1">
                Exp:
              </span>
              {[7, 30, 60].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    triggerHaptic("selection");
                    setExpirationDays(days);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    expirationDays === days
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Stock Banner */}
        <div className="p-4 rounded-xl bg-black/80 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-base font-black text-white">
              ${selectedStock.symbol}
            </span>
            <span className="text-neutral-400">
              Share Price:{" "}
              <strong className="text-emerald-400">
                ${selectedStock.price}.00
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
              IV: 38%
            </span>
          </div>

          <div className="flex items-center gap-4 text-neutral-300 text-[11px]">
            <span>
              Selected:{" "}
              <strong className="text-cyan-300">
                ${selectedContract.strike} {selectedContract.type}
              </strong>
            </span>
            <span>
              Ask Premium:{" "}
              <strong className="text-emerald-400">
                ${selectedContract.premium.toFixed(2)}
              </strong>{" "}
              (${(selectedContract.premium * 100).toFixed(0)} Total)
            </span>
          </div>
        </div>

        {/* Options Chain Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[11px]">
              <tr>
                <th
                  colSpan={3}
                  className="px-3 py-2 text-center bg-emerald-950/20 text-emerald-400 font-bold border-r border-neutral-800"
                >
                  CALL OPTIONS (BULLISH)
                </th>
                <th className="px-3 py-2 text-center bg-purple-950/30 text-purple-300 font-black">
                  STRIKE
                </th>
                <th
                  colSpan={3}
                  className="px-3 py-2 text-center bg-rose-950/20 text-rose-400 font-bold border-l border-neutral-800"
                >
                  PUT OPTIONS (BEARISH)
                </th>
              </tr>
              <tr className="border-t border-neutral-800 text-[10px] text-neutral-500 uppercase">
                <th className="px-3 py-1.5 text-right">Call Ask</th>
                <th className="px-3 py-1.5 text-center">Delta</th>
                <th className="px-3 py-1.5 text-center border-r border-neutral-800">
                  ITM/OTM
                </th>
                <th className="px-3 py-1.5 text-center font-bold text-white">
                  Target
                </th>
                <th className="px-3 py-1.5 text-center border-l border-neutral-800">
                  ITM/OTM
                </th>
                <th className="px-3 py-1.5 text-center">Delta</th>
                <th className="px-3 py-1.5 text-left">Put Ask</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/60">
              {chain.map((row) => {
                const isCallITM = selectedStock.price > row.strike;
                const isPutITM = selectedStock.price < row.strike;
                const isSelectedCall =
                  selectedContract.type === "CALL" &&
                  selectedContract.strike === row.strike;
                const isSelectedPut =
                  selectedContract.type === "PUT" &&
                  selectedContract.strike === row.strike;

                return (
                  <tr
                    key={row.strike}
                    className="hover:bg-neutral-800/50 transition-all"
                  >
                    {/* Call Ask Button */}
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          setSelectedContract({
                            type: "CALL",
                            strike: row.strike,
                            premium: row.callAsk,
                            delta: row.callDelta,
                            theta: row.callTheta,
                          });
                        }}
                        className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                          isSelectedCall
                            ? "bg-emerald-500 text-black shadow-md font-black"
                            : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
                        }`}
                      >
                        ${row.callAsk.toFixed(2)}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center text-neutral-400 text-[11px]">
                      {row.callDelta}
                    </td>
                    <td className="px-3 py-2 text-center border-r border-neutral-800">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isCallITM
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {isCallITM ? "ITM" : "OTM"}
                      </span>
                    </td>

                    {/* Strike Center Column */}
                    <td
                      className={`px-3 py-2 text-center font-black text-sm ${
                        row.strike === selectedStock.price
                          ? "text-purple-300 bg-purple-500/20"
                          : "text-white"
                      }`}
                    >
                      ${row.strike}
                    </td>

                    {/* Put Section */}
                    <td className="px-3 py-2 text-center border-l border-neutral-800">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isPutITM
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {isPutITM ? "ITM" : "OTM"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-neutral-400 text-[11px]">
                      {row.putDelta}
                    </td>
                    <td className="px-3 py-2 text-left">
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          setSelectedContract({
                            type: "PUT",
                            strike: row.strike,
                            premium: row.putAsk,
                            delta: row.putDelta,
                            theta: row.putTheta,
                          });
                        }}
                        className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                          isSelectedPut
                            ? "bg-rose-500 text-white shadow-md font-black"
                            : "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30"
                        }`}
                      >
                        ${row.putAsk.toFixed(2)}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Option Contract P&L Payoff Card */}
        <div className="p-5 rounded-2xl bg-black/80 border border-purple-500/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-black font-mono text-purple-300 uppercase">
                Contract P&L Payoff Analysis: {selectedStock.symbol} $
                {selectedContract.strike} {selectedContract.type}
              </h4>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Total Cash Premium Required:{" "}
              <strong className="text-emerald-400">
                ${totalCost.toFixed(2)}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                Breakeven Stock Price
              </span>
              <p className="text-base font-black text-cyan-300">
                ${breakevenPrice.toFixed(2)}
              </p>
              <p className="text-[10px] text-neutral-400 font-sans">
                {selectedContract.type === "CALL"
                  ? `Stock must rise above $${breakevenPrice} for profit at expiration.`
                  : `Stock must fall below $${breakevenPrice} for profit at expiration.`}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                Max Loss
              </span>
              <p className="text-base font-black text-rose-400">
                ${totalCost.toFixed(2)}
              </p>
              <p className="text-[10px] text-neutral-400 font-sans">
                Capped strictly at the total cash premium paid upfront.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                Greeks Exposure
              </span>
              <div className="flex items-center gap-3 text-xs font-bold pt-0.5">
                <span className="text-cyan-300">
                  Delta: {selectedContract.delta}
                </span>
                <span className="text-rose-400">
                  Theta: {selectedContract.theta}/day
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Position gains ~${(selectedContract.delta * 100).toFixed(0)} per
                $1 stock move.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
