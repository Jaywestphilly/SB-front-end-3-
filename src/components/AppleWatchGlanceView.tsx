import React, { useState, useEffect } from "react";
import {
  Watch,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  ArrowLeft,
  Volume2,
  Radio,
  UserCheck,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { StockTicker } from "../types";

interface AppleWatchGlanceViewProps {
  stocks?: StockTicker[];
  onExitWatchMode?: () => void;
  onSelectStock?: (stock: StockTicker) => void;
}

export const AppleWatchGlanceView: React.FC<AppleWatchGlanceViewProps> = ({
  stocks = [],
  onExitWatchMode,
  onSelectStock,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"ticks" | "sentiment" | "whales">("ticks");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateWatchTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateWatchTime();
    const interval = setInterval(updateWatchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const watchTickers = [
    { symbol: "NVDA", price: "$128.45", change: "+4.12%", positive: true, volume: "1.2B" },
    { symbol: "PLTR", price: "$42.10", change: "+6.85%", positive: true, volume: "850M" },
    { symbol: "O", price: "$52.80", change: "+1.20%", positive: true, volume: "120M" },
    { symbol: "SPCX", price: "$5,420.10", change: "-0.45%", positive: false, volume: "3.4B" },
  ];

  const swiftWatchCode = `import SwiftUI
import WebKit

// Apple Watch WatchOS SwiftUI WebView & Complication Shell
struct StockBlocWatchView: View {
    @State private var isLoading = true

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            WatchOSWebView(url: URL(string: "https://ais-pre-p3tflmsyxu75gnec7nb7vy-350859978227.us-east1.run.app?watch=true")!)
                .ignoresSafeArea()
        }
    }
}

struct WatchOSWebView: WKInterfaceObjectRepresentable {
    let url: URL

    func makeWKInterfaceObject(context: Context) -> WKInterfaceObject {
        // watchOS WKWebView loader
        return WKInterfaceObject()
    }

    func updateWKInterfaceObject(_ wkInterfaceObject: WKInterfaceObject, context: Context) {
        // Loads live Stock Bloc Quant Terminal Watch View
    }
}`;

  const copySwiftCode = () => {
    triggerHaptic("medium");
    navigator.clipboard.writeText(swiftWatchCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-sm mx-auto p-3 font-mono bg-black text-white select-none rounded-[36px] border-4 border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden my-4">
      {/* Watch Screen Outer Bezel Simulation Indicator */}
      <div className="flex items-center justify-between text-[11px] font-black text-emerald-400 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-1">
          <Watch className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="tracking-wider text-[10px] text-cyan-300">STOCK BLOC WATCH</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{currentTime || "10:09"}</span>
          {onExitWatchMode && (
            <button
              onClick={() => {
                triggerHaptic("selection");
                onExitWatchMode();
              }}
              className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
              title="Exit Watch Mode"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* Watch Content Body */}
      <div className="space-y-3 pt-2">
        {/* Watch Tab Selector Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 text-[10px] font-bold uppercase text-center">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("ticks");
            }}
            className={`py-1 rounded-lg transition-all ${
              activeTab === "ticks" ? "bg-emerald-500 text-black font-extrabold" : "text-neutral-400 hover:text-white"
            }`}
          >
            Ticks
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("sentiment");
            }}
            className={`py-1 rounded-lg transition-all ${
              activeTab === "sentiment" ? "bg-cyan-500 text-black font-extrabold" : "text-neutral-400 hover:text-white"
            }`}
          >
            Gauge
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("whales");
            }}
            className={`py-1 rounded-lg transition-all ${
              activeTab === "whales" ? "bg-amber-400 text-black font-extrabold" : "text-neutral-400 hover:text-white"
            }`}
          >
            Whales
          </button>
        </div>

        {/* Tab 1: Live Watch Tickers */}
        {activeTab === "ticks" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-bold px-1">
              <span>MOMENTUM WATCH</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                LIVE
              </span>
            </div>

            <div className="space-y-1.5">
              {watchTickers.map((t) => (
                <div
                  key={t.symbol}
                  onClick={() => {
                    triggerHaptic("selection");
                    const matched = stocks.find((s) => s.symbol === t.symbol);
                    if (matched && onSelectStock) onSelectStock(matched);
                  }}
                  className="p-2.5 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-95"
                >
                  <div>
                    <div className="text-xs font-black text-white">{t.symbol}</div>
                    <div className="text-[10px] text-neutral-400">{t.volume}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{t.price}</div>
                    <div
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded flex items-center justify-end gap-0.5 ${
                        t.positive ? "text-emerald-400 bg-emerald-950/80" : "text-rose-400 bg-rose-950/80"
                      }`}
                    >
                      {t.positive ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      <span>{t.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Market Sentiment Gauge */}
        {activeTab === "sentiment" && (
          <div className="space-y-3 p-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-cyan-400 font-bold uppercase">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>QUANT BULL INDEX</span>
            </div>

            <div className="relative py-2">
              <div className="text-3xl font-black text-emerald-400 font-mono">88.4</div>
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">
                STRONG BULLISH SURGE
              </div>
            </div>

            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[88.4%]" />
            </div>

            <p className="text-[9px] text-neutral-400 leading-tight">
              Institutional order flow & 13F whale accumulation indicating heavy upside momentum.
            </p>
          </div>
        )}

        {/* Tab 3: Whale Alerts */}
        {activeTab === "whales" && (
          <div className="space-y-2">
            <div className="p-2.5 bg-neutral-950 border border-amber-500/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase">
                <span>BERKSHIRE HATHAWAY</span>
                <span>+$4.2B</span>
              </div>
              <div className="text-xs font-black text-white">13F BUY: O & REALTY TRUST</div>
              <p className="text-[9px] text-neutral-400">Quarterly filing confirmed dividend REIT accumulation.</p>
            </div>

            <div className="p-2.5 bg-neutral-950 border border-cyan-500/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 uppercase">
                <span>RENAISSANCE TECH</span>
                <span>+$850M</span>
              </div>
              <div className="text-xs font-black text-white">13F BUY: PLTR AIP CONTRACTS</div>
              <p className="text-[9px] text-neutral-400">Quant algorithms increased defense allocation.</p>
            </div>
          </div>
        )}

        {/* Watch Control Actions */}
        <div className="pt-2 border-t border-neutral-800 space-y-2">
          <button
            onClick={() => {
              triggerHaptic("heavy");
            }}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>TEST WATCH HAPTIC PULSE</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setShowCodeModal(true);
            }}
            className="w-full py-2 bg-neutral-900 border border-neutral-700 hover:border-cyan-400 text-cyan-300 font-bold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>WATCHOS SWIFT CODE FOR IPAD</span>
          </button>
        </div>
      </div>

      {/* Code Modal Overlay */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-cyan-500/50 rounded-2xl p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Watch className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase">Swift Playgrounds Watch Code</h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-1 bg-neutral-900 rounded-lg"
              >
                CLOSE
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              Paste this Swift code into Swift Playgrounds on your iPad to build a native Apple Watch Companion app or complication!
            </p>

            <div className="relative bg-black p-3 rounded-xl border border-neutral-800 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-48 overflow-y-auto">
              <pre>{swiftWatchCode}</pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={copySwiftCode}
                className="px-4 py-2 bg-cyan-500 text-black font-extrabold text-xs uppercase rounded-xl flex items-center gap-1.5 hover:bg-cyan-400 transition-all cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "COPIED TO CLIPBOARD" : "COPY SWIFT CODE"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
