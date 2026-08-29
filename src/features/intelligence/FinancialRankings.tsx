import React, { useState } from "react";
import { CompanyFinancialRank } from "../../types";
import { FINANCIAL_RANKINGS_DATA } from "../../data/earnings_and_financials";
import {
  Trophy,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  ShieldAlert,
  ArrowUpDown,
  Building2,
  Sparkles,
  Award,
} from "lucide-react";

type MetricTab = "revenue" | "net_profit" | "margin" | "growth";

export const FinancialRankings: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<MetricTab>("revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Sector list
  const sectors = [
    "all",
    ...Array.from(new Set(FINANCIAL_RANKINGS_DATA.map((item) => item.sector))),
  ];

  // Filter and sort items
  const filteredData = FINANCIAL_RANKINGS_DATA.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector =
      selectedSector === "all" || item.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (activeMetric === "revenue") {
      return b.revenueBillions - a.revenueBillions;
    }
    if (activeMetric === "net_profit") {
      return b.netProfitBillions - a.netProfitBillions;
    }
    if (activeMetric === "margin") {
      return b.netMarginPercent - a.netMarginPercent;
    }
    if (activeMetric === "growth") {
      const gA = parseFloat(a.revenueGrowthYoY.replace(/[^0-9.-]/g, "")) || 0;
      const gB = parseFloat(b.revenueGrowthYoY.replace(/[^0-9.-]/g, "")) || 0;
      return gB - gA;
    }
    return 0;
  });

  // Calculate maximums for relative progress bar widths
  const maxRevenue = Math.max(
    ...FINANCIAL_RANKINGS_DATA.map((d) => d.revenueBillions),
  );
  const maxProfit = Math.max(
    ...FINANCIAL_RANKINGS_DATA.map((d) => d.netProfitBillions),
  );
  const maxMargin = Math.max(
    ...FINANCIAL_RANKINGS_DATA.map((d) => d.netMarginPercent),
  );

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-xs shadow-lg shadow-amber-500/20">
          🥇 #1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-black text-xs shadow-md">
          🥈 #2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center font-black text-xs shadow-md">
          🥉 #3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center justify-center font-mono font-bold text-xs">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="w-full space-y-5 select-none pb-12">
      {/* Header Title Section */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-emerald-950/40 border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Global Financial Leaderboards
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
            Annual FY2025/2026
          </span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
          Comprehensive ranking of megacap market leaders ranked by annual
          revenue, net profit totals, operational profit margins, and YoY
          revenue velocity.
        </p>

        {/* Primary Tab Toggle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <button
            onClick={() => setActiveMetric("revenue")}
            className={`px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === "revenue"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Annual Revenue Rank</span>
          </button>

          <button
            onClick={() => setActiveMetric("net_profit")}
            className={`px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === "net_profit"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Net Profit Rank</span>
          </button>

          <button
            onClick={() => setActiveMetric("margin")}
            className={`px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === "margin"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/25"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Net Margin %</span>
          </button>

          <button
            onClick={() => setActiveMetric("growth")}
            className={`px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMetric === "growth"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>YoY Revenue Growth</span>
          </button>
        </div>
      </div>

      {/* Search & Sector Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symbol or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto text-xs">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize whitespace-nowrap cursor-pointer transition-all ${
                selectedSector === sec
                  ? "bg-white text-black font-black"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {sec === "all" ? "All Sectors" : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="space-y-3">
        {sortedData.map((item, index) => {
          const revWidth = (item.revenueBillions / maxRevenue) * 100;
          const profitWidth = (item.netProfitBillions / maxProfit) * 100;
          const marginWidth = (item.netMarginPercent / maxMargin) * 100;

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-amber-500/40 transition-all space-y-3 shadow-md group"
            >
              {/* Header row: Rank, Ticker & Core Metrics */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(index)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base font-mono tracking-tight group-hover:text-amber-400 transition-colors">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10 truncate">
                        {item.sector}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400 font-medium truncate block">
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Metric Summary Box */}
                <div className="text-right shrink-0">
                  {activeMetric === "revenue" && (
                    <div>
                      <span className="text-base font-black text-amber-400 font-mono block">
                        ${item.revenueBillions.toFixed(1)}B
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">
                        Annual Revenue
                      </span>
                    </div>
                  )}

                  {activeMetric === "net_profit" && (
                    <div>
                      <span className="text-base font-black text-emerald-400 font-mono block">
                        ${item.netProfitBillions.toFixed(1)}B
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">
                        Net Profit
                      </span>
                    </div>
                  )}

                  {activeMetric === "margin" && (
                    <div>
                      <span className="text-base font-black text-cyan-400 font-mono block">
                        {item.netMarginPercent.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">
                        Profit Margin
                      </span>
                    </div>
                  )}

                  {activeMetric === "growth" && (
                    <div>
                      <span className="text-base font-black text-purple-400 font-mono block">
                        {item.revenueGrowthYoY}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">
                        YoY Revenue
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparative Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400">
                  <span>Revenue: ${item.revenueBillions}B</span>
                  <span className="text-emerald-400">
                    Profit: ${item.netProfitBillions}B ({item.netMarginPercent}
                    %)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${activeMetric === "revenue" ? revWidth : activeMetric === "net_profit" ? profitWidth : marginWidth}%`,
                    }}
                  />
                </div>
              </div>

              {/* Company Note */}
              <p className="text-xs text-neutral-300 font-medium bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                {item.summaryNote}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
