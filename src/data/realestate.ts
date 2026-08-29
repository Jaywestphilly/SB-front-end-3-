import { RealEstateCalcInput } from "../types";

export const DEFAULT_REAL_ESTATE_INPUT: RealEstateCalcInput = {
  propertyPrice: 385000,
  downPaymentPercent: 20,
  interestRate: 6.75,
  loanTermYears: 30,
  monthlyRent: 3200,
  propertyTaxAnnual: 4800,
  insuranceAnnual: 1400,
  maintenancePercent: 8,
  vacancyPercent: 5,
  propertyManagementPercent: 8,
};

export interface RealEstateStrategy {
  id: string;
  title: string;
  badge: string;
  summary: string;
  keyFormula: string;
  bestFor: string;
  steps: string[];
}

export const REAL_ESTATE_STRATEGIES: RealEstateStrategy[] = [
  {
    id: "house_hacking",
    title: "House Hacking Multi-Family",
    badge: "Beginner Low Down Payment",
    summary:
      "Buy a 2 to 4-unit residential property with an FHA (3.5% down) or VA loan, live in one unit, and let tenants pay your mortgage.",
    keyFormula:
      "Net Housing Cost = Total Mortgage Rental Income from Other Units",
    bestFor:
      "First-time investors looking to eliminate their primary living expenses.",
    steps: [
      "Get pre-approved for FHA 3.5% down or Conventional 5% down.",
      "Analyze 2-4 unit properties near job centers and universities.",
      "Audit existing leases and verify seller utility expenses.",
      "Move into one unit for at least 12 months, then refinance & repeat.",
    ],
  },
  {
    id: "brrrr_method",
    title: "The BRRRR Method",
    badge: "High Velocity Wealth",
    summary:
      "Buy distressed, Rehab, Rent out, Refinance based on new After Repair Value (ARV), and Repeat with your recycled capital.",
    keyFormula:
      "Capital Recovered = Refinance Loan Amount (75% ARV) Initial Purchase & Rehab Cost",
    bestFor:
      "Investors seeking exponential portfolio scaling without running out of cash.",
    steps: [
      "Find off-market properties priced 25-30% below ARV.",
      "Fund purchase using hard money, private money, or HELOC.",
      "Execute high-ROI renovations (kitchens, bathrooms, curb appeal).",
      "Lease at top market rent and do a cash-out refinance with a bank.",
    ],
  },
  {
    id: "dscr_cashflow",
    title: "DSCR Loan Cash Flow Investing",
    badge: "No Income Verification",
    summary:
      "Debt Service Coverage Ratio (DSCR) loans qualify based purely on property rental income exceeding the mortgage, bypassing personal W-2 income checks.",
    keyFormula:
      "DSCR Ratio = Net Operating Income (NOI) / Annual Debt Service (Ideal > 1.25x)",
    bestFor:
      "Self-employed entrepreneurs and scale investors with multiple mortgages.",
    steps: [
      "Target cash-flowing markets with >1.20x DSCR metrics.",
      "Maintain credit score above 680 to secure 75-80% LTV.",
      "Lock fixed 30-year DSCR financing under an LLC name.",
    ],
  },
  {
    id: "reit_dividends",
    title: "REITs & Data Center Real Estate",
    badge: "Passive Cash Flow",
    summary:
      "Invest in publicly traded Real Estate Investment Trusts like Realty Income ($O) or Equinix ($EQIX) required by law to distribute 90%+ of taxable income to shareholders.",
    keyFormula: "FFO Yield = Funds From Operations / Share Price",
    bestFor: "100% hands-off passive income with daily liquidity.",
    steps: [
      "Filter for triple-net lease REITs ($O) or data center REITs ($EQIX).",
      "Track Funds From Operations (FFO) payout ratios (<80% is safe).",
      "DRIP (Dividend Reinvestment Plan) monthly payouts to compound returns.",
    ],
  },
];
