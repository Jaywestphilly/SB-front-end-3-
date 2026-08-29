import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ExternalLink,
  DollarSign,
  Award,
  Settings,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { StockTicker } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface BrokerageAffiliateModalProps {
  stock: StockTicker | null;
  isOpen: boolean;
  onClose: () => void;
}

interface BrokeragePartner {
  id: string;
  name: string;
  tagline: string;
  bonusText: string;
  commissionEarned: string;
  badge: string;
  logoBg: string;
  defaultUrl: string;
  accentColor: string;
}

const ROBINHOOD_GIFT_LINK = "https://join.robinhood.com/jumannc3";

const DEFAULT_BROKERAGES: BrokeragePartner[] = [
  {
    id: "robinhood",
    name: "Robinhood",
    tagline: "Commission-free stocks, options, crypto & IPOs",
    bonusText:
      "Sign up for Robinhood with my link and we'll both pick our own gift stock 🎁",
    commissionEarned: "Free Gift Stock For Both 🎁",
    badge: "GIFT STOCK PROMO 🎁",
    logoBg: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
    defaultUrl: ROBINHOOD_GIFT_LINK,
    accentColor: "border-emerald-500/60 hover:border-emerald-400",
  },
  {
    id: "webull",
    name: "Webull",
    tagline: "Advanced trading, Level 2 depth & zero commissions",
    bonusText: "Get up to 12 FREE fractional shares (valued up to $3,000)",
    commissionEarned: "$30 to $100+ Referral Bonus",
    badge: "BEST FOR CHARTS",
    logoBg: "bg-cyan-500/20 border-cyan-500/50 text-cyan-300",
    defaultUrl: "https://www.webull.com",
    accentColor: "border-cyan-500/60 hover:border-cyan-400",
  },
  {
    id: "interactive_brokers",
    name: "Interactive Brokers (IBKR)",
    tagline: "Institutional direct market access & global assets",
    bonusText: "Earn up to $1,000 in free IBKR Stock",
    commissionEarned: "$100 Referral Bonus",
    badge: "INSTITUTIONAL GRADE",
    logoBg: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    defaultUrl: "https://www.interactivebrokers.com",
    accentColor: "border-amber-500/60 hover:border-amber-400",
  },
  {
    id: "etrade",
    name: "E*TRADE / Morgan Stanley",
    tagline: "Award-winning mobile trading, options & research",
    bonusText: "Cash bonus up to $3,500 with qualifying deposit",
    commissionEarned: "$50 to $150 Referral Bonus",
    badge: "TOP CHOICE",
    logoBg: "bg-purple-500/20 border-purple-500/50 text-purple-300",
    defaultUrl: "https://us.etrade.com",
    accentColor: "border-purple-500/60 hover:border-purple-400",
  },
  {
    id: "schwab",
    name: "Charles Schwab",
    tagline: "24/7 client support, satisfaction guarantee & no fee index funds",
    bonusText: "Get up to $1,000 bonus when you open an account",
    commissionEarned: "$50 Referral Bonus",
    badge: "TRUSTED BANK",
    logoBg: "bg-blue-500/20 border-blue-500/50 text-blue-300",
    defaultUrl: "https://www.schwab.com",
    accentColor: "border-blue-500/60 hover:border-blue-400",
  },
];

export const BrokerageAffiliateModal: React.FC<
  BrokerageAffiliateModalProps
> = ({ stock, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"trade" | "settings">("trade");
  const [customLinks, setCustomLinks] = useState<{ [key: string]: string }>(
    () => {
      try {
        const saved = localStorage.getItem("stockbloc_affiliate_links");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    },
  );

  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);

  const handleOpenBrokerage = (partner: BrokeragePartner) => {
    triggerHaptic("success");
    if (partner.id === "robinhood") {
      window.open(ROBINHOOD_GIFT_LINK, "_blank");
      return;
    }
    const url = customLinks[partner.id] || partner.defaultUrl;
    window.open(url, "_blank");
  };

  const handleSaveCustomLink = (id: string, url: string) => {
    const updated = { ...customLinks, [id]: url };
    setCustomLinks(updated);
    localStorage.setItem("stockbloc_affiliate_links", JSON.stringify(updated));
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="brokerage-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl overflow-y-auto font-mono"
        >
          <motion.div
            key="brokerage-modal-content"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            className="w-full max-w-2xl bg-[#030914] border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative text-white space-y-6 overflow-hidden alien-card my-auto"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-500/20">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-wider text-emerald-100 uppercase">
                      BROKERAGE AFFILIATE NETWORK
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-400 text-black uppercase font-black">
                      $10 $100 / REFERRAL
                    </span>
                  </div>
                  <p className="text-sm text-emerald-400/80 font-sans mt-0.5">
                    {stock
                      ? `Trade $${stock.symbol} & claim exclusive signup bonuses`
                      : "Connect & trade with brokerage referral partners"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  onClose();
                }}
                className="p-2 rounded-full bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Sub-Tabs */}
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveTab("trade");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "trade"
                      ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                      : "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Trade {stock ? `$${stock.symbol}` : "Stocks"}</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveTab("settings");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "settings"
                      ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                      : "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Custom Referral Links</span>
                </button>
              </div>

              {stock && (
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-white">
                    ${stock.symbol}
                  </span>
                  <span
                    className={`ml-2 text-xs font-bold font-mono ${stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    ${stock.price.toFixed(2)} (
                    {stock.changePercent >= 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>

            {/* TAB 1: TRADE BROKERAGE SELECTION */}
            {activeTab === "trade" && (
              <div className="space-y-3 relative z-10 max-h-[60vh] overflow-y-auto pr-1">
                {DEFAULT_BROKERAGES.map((partner) => (
                  <div
                    key={partner.id}
                    className={`p-4 rounded-2xl bg-[#020d18] border transition-all hover:bg-[#041628] space-y-2 group cursor-pointer ${partner.accentColor}`}
                    onClick={() => handleOpenBrokerage(partner)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 ${partner.logoBg}`}
                        >
                          {partner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-white text-base group-hover:text-emerald-300 transition-colors">
                              {partner.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {partner.badge}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-300 font-sans mt-0.5">
                            {partner.tagline}
                          </p>
                        </div>
                      </div>

                      <button className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-emerald-500/20">
                        <span>Trade</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-emerald-950 flex flex-wrap items-center justify-between text-[11px] text-emerald-300/90 font-mono">
                      <span className="flex items-center gap-1 font-bold text-amber-300">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        {partner.bonusText}
                      </span>
                      <span className="text-neutral-400 text-[10px]">
                        Commission:{" "}
                        <strong className="text-emerald-400">
                          {partner.commissionEarned}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: CUSTOM REFERRAL LINK CONFIGURATION */}
            {activeTab === "settings" && (
              <div className="space-y-4 relative z-10 font-sans text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                  <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Earn Referral Bonuses On Your Links
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-200/80 leading-relaxed font-mono">
                    Enter your custom affiliate & referral links below. Whenever
                    users click "Trade" in Stock Bloc, traffic will route
                    directly to your referral codes so you collect 100% of
                    signup commissions!
                  </p>
                </div>

                {savedSettingsMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-black font-bold text-center flex items-center justify-center gap-1.5 font-mono">
                    <Check className="w-4 h-4 text-black" />
                    <span>Custom Affiliate Links Saved Successfully!</span>
                  </div>
                )}

                <div className="space-y-3 font-mono">
                  {DEFAULT_BROKERAGES.map((partner) => (
                    <div
                      key={partner.id}
                      className="p-3 rounded-xl bg-[#020d18] border border-emerald-900/50 space-y-1.5"
                    >
                      <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                        <span>{partner.name} Affiliate URL</span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          Default: {partner.defaultUrl}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={customLinks[partner.id] || ""}
                          onChange={(e) =>
                            handleSaveCustomLink(partner.id, e.target.value)
                          }
                          placeholder={partner.defaultUrl}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-emerald-900 text-emerald-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-400 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-emerald-900/50 flex items-center justify-between text-[10px] text-emerald-400/80 font-mono relative z-10">
              <span>Powered by Stock Bloc Brokerage Affiliate Protocol</span>
              <span>Zero trading platform markup</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
