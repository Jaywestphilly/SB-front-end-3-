import { StockTicker } from "../types";

export interface InstitutionalHolder {
  name: string;
  shares: string;
  value: string;
  portfolioWeight: string;
  changeType: "INCREASED" | "DECREASED" | "NEW" | "UNCHANGED";
  changePercent: string;
}

export interface DetailedInstitutionalData {
  ownershipPercent: number; // e.g. 68.4
  holdersCount: number; // e.g. 4280
  sharesHeld: string; // e.g. "1.84B"
  totalValue: string; // e.g. "$236.4B"
  quarterlyNetFlow: string; // e.g. "+$14.2B"
  flowSentiment: "Accumulation" | "Distribution" | "Neutral";
  insiderOwnershipPercent: number; // e.g. 4.2
  retailOwnershipPercent: number; // e.g. 27.4
  buyersCount: number;
  sellersCount: number;
  topHolders: InstitutionalHolder[];
  smartMoneyConvictionScore: number; // out of 10
  quarterly13FFilingDate: string;
}

// Generate realistic seed institutional ownership data for any ticker
export const getInstitutionalDataForStock = (
  stock: StockTicker,
): DetailedInstitutionalData => {
  if (stock.institutionalData) {
    return {
      ...stock.institutionalData,
      smartMoneyConvictionScore: Number(
        (stock.institutionalData.ownershipPercent / 10).toFixed(1),
      ),
      quarterly13FFilingDate: "2026 Q1 SEC 13F Filings",
    };
  }

  // Symbol-based deterministic hashing for consistent & realistic metrics
  const symbol = stock.symbol.toUpperCase();
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Category & market cap tailored ranges
  let baseOwnership = 62;
  if (stock.category === "tsunami") baseOwnership = 74;
  if (stock.category === "ai_infra") baseOwnership = 78;
  if (stock.category === "memory") baseOwnership = 72;
  if (stock.category === "asymmetry") baseOwnership = 58;
  if (stock.category === "credit_fin") baseOwnership = 81;
  if (stock.category === "reits") baseOwnership = 84;
  if (stock.category === "indexes") baseOwnership = 88;

  // Derive ownership percent (bounded 25% 92%)
  const variance = (positiveHash % 28) - 14;
  const ownershipPercent = Math.min(
    92.5,
    Math.max(28.0, Number((baseOwnership + variance * 0.5).toFixed(1))),
  );

  // Derive Insider Ownership & Retail Ownership
  const insiderPercent =
    stock.category === "asymmetry"
      ? Number((8.5 + (positiveHash % 12)).toFixed(1))
      : Number((1.8 + (positiveHash % 6.5)).toFixed(1));

  const retailPercent = Number(
    Math.max(2.0, 100 - ownershipPercent - insiderPercent).toFixed(1),
  );

  // Holders count & Net flows
  const holdersCount = 800 + (positiveHash % 4200);
  const isAccumulation = stock.changePercent >= -1.0 || positiveHash % 3 !== 0;
  const flowSentiment: "Accumulation" | "Distribution" | "Neutral" =
    isAccumulation
      ? "Accumulation"
      : positiveHash % 2 === 0
        ? "Distribution"
        : "Neutral";

  const buyersCount = Math.round(holdersCount * (isAccumulation ? 0.62 : 0.38));
  const sellersCount = Math.round(
    holdersCount * (isAccumulation ? 0.28 : 0.54),
  );

  const netFlowVal = (positiveHash % 18) + 1.2;
  const quarterlyNetFlow = `${isAccumulation ? "+" : "-"}$${netFlowVal.toFixed(1)}B`;

  // Total value & shares held estimation
  const totalValue = `$${((positiveHash % 240) + 12.5).toFixed(1)}B`;
  const sharesHeld = `${((positiveHash % 1400) / 10 + 2.5).toFixed(2)}B`;

  // Top Institutional Holders Roster
  let topHolders: InstitutionalHolder[] = [];

  if (stock.instHolders && stock.instHolders.length > 0) {
    topHolders = stock.instHolders.map((holder, idx) => ({
      name: holder.name,
      shares: "N/A",
      value: holder.value,
      portfolioWeight: "N/A",
      changeType: "UNCHANGED",
      changePercent: "0%",
    }));
  }

  const smartMoneyConvictionScore = Math.min(
    9.8,
    Math.max(
      5.2,
      Number(
        (ownershipPercent / 10 + (isAccumulation ? 1.2 : -0.5)).toFixed(1),
      ),
    ),
  );

  return {
    ownershipPercent,
    holdersCount,
    sharesHeld,
    totalValue,
    quarterlyNetFlow,
    flowSentiment,
    insiderOwnershipPercent: insiderPercent,
    retailOwnershipPercent: retailPercent,
    buyersCount,
    sellersCount,
    topHolders,
    smartMoneyConvictionScore,
    quarterly13FFilingDate: "2026 Q1 SEC 13F Filings",
  };
};
