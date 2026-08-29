import { CreditFactor, CreditCardItem } from "../types";

export const CREDIT_FACTORS: CreditFactor[] = [
  {
    id: "payment_history",
    name: "Payment History",
    weightPercent: 35,
    status: "Excellent",
    scoreImpact: "High Impact (35%)",
    userValue: "100% On-Time",
    targetValue: "100% On-Time",
    description:
      "Tracks whether you pay your bills on time every month. A single 30 day late payment can drop your score by 60 to 110 points.",
    tip: "Set up Auto-Pay for minimum amounts on all revolving cards so you never miss a deadline.",
  },
  {
    id: "credit_utilization",
    name: "Credit Utilization Ratio",
    weightPercent: 30,
    status: "Good",
    scoreImpact: "High Impact (30%)",
    userValue: "8% Utilization",
    targetValue: "< 10% (Under 1% is Optimal)",
    description:
      "Total credit balances divided by total credit limits across all revolving credit lines.",
    tip: "Use the 15/3 payment rule: Pay half your balance 15 days before statement close date and the rest 3 days before.",
  },
  {
    id: "credit_age",
    name: "Length of Credit History",
    weightPercent: 15,
    status: "Good",
    scoreImpact: "Medium Impact (15%)",
    userValue: "4 Yrs 8 Mos Avg",
    targetValue: "7+ Years Avg",
    description:
      "Average age of your open accounts and the age of your oldest active account.",
    tip: "Never close your oldest zero-annual-fee credit card. Keep it active by putting a small recurring subscription on it.",
  },
  {
    id: "credit_mix",
    name: "Credit Mix",
    weightPercent: 10,
    status: "Excellent",
    scoreImpact: "Low Impact (10%)",
    userValue: "Revolving & Installment",
    targetValue: "Revolving + Mortgages/Loans",
    description:
      "Demonstrates ability to manage different credit types (credit cards, auto loans, mortgages, personal loans).",
    tip: "Having 2-3 credit cards plus an active installment loan (auto, mortgage, or credit builder loan) optimizes mix.",
  },
  {
    id: "new_credit",
    name: "New Credit & Hard Inquiries",
    weightPercent: 10,
    status: "Excellent",
    scoreImpact: "Low Impact (10%)",
    userValue: "1 Inquiry in 12 Mos",
    targetValue: "< 2 Inquiries in 2 Yrs",
    description:
      "Hard inquiries from lender applications stay on report for 2 years (affect score for 1 year).",
    tip: "Space out credit applications by at least 6 months unless rate-shopping for mortgages or auto loans in a 14-day window.",
  },
];

export const CREDIT_CARDS_RECOMMENDED: CreditCardItem[] = [
  {
    id: "card_sofi",
    name: "SoFi Unlimited 2% Credit Card",
    issuer: "SoFi",
    type: "Rewards",
    minScoreNeeded: 670,
    annualFee: "$0",
    introApr: "0% Intro APR for 15 months",
    perks: [
      "Unlimited 2% Cash Back",
      "Free Credit Score Monitoring",
      "Cell Phone Protection",
    ],
    recommendedFor:
      "Everyday cash back & building credit while saving on interest",
    applyUrl: "https://www.creditkarma.com",
  },
  {
    id: "card_chase_freedom",
    name: "Chase Freedom Unlimited®",
    issuer: "Chase",
    type: "Rewards",
    minScoreNeeded: 690,
    annualFee: "$0",
    introApr: "0% Intro APR for 15 months",
    perks: [
      "5% on Travel",
      "3% Dining & Drugstores",
      "1.5% Unlimited Everything Else",
    ],
    recommendedFor:
      "High rewards multiplier and establishing primary bank relationship",
    applyUrl: "https://www.creditkarma.com",
  },
  {
    id: "card_discover_secured",
    name: "Discover it® Secured Credit Card",
    issuer: "Discover",
    type: "Secured",
    minScoreNeeded: 300,
    annualFee: "$0",
    introApr:
      "Automatic reviews starting at 7 months to transition to unsecured",
    perks: [
      "2% Cash Back Gas & Dining",
      "Cashback Match at Year 1",
      "No Credit Score Required",
    ],
    recommendedFor:
      "Rebuilding credit from scratch with a refundable security deposit",
    applyUrl: "https://www.creditkarma.com",
  },
  {
    id: "card_amex_biz",
    name: "The Business Platinum Card® from American Express",
    issuer: "American Express",
    type: "Business",
    minScoreNeeded: 720,
    annualFee: "$695",
    introApr: "Flexible payment limits",
    perks: [
      "150K Bonus Points",
      "Airport Lounge Access",
      "Does not report to personal credit utilization",
    ],
    recommendedFor:
      "Real estate investors & business owners separating business expenses",
    applyUrl: "https://www.creditkarma.com",
  },
];

export const CREDIT_REPAIR_STEPS = [
  {
    title: "1. Become an Authorized User (Piggybacking)",
    desc: "Get added to a relative or mentor’s credit card with a 10+ year flawless payment history and high credit limit. Their credit history gets reported on your profile within 30-45 days.",
  },
  {
    title: "2. Master the Statement Date vs Due Date Rule",
    desc: "Banks report your balance to Experian, TransUnion, and Equifax on your STATEMENT CLOSE DATE (not your due date). Pay your balance down to 1-3% before statement close for a instant score boost.",
  },
  {
    title: "3. Goodwill Adjustment Letters for Late Payments",
    desc: "If you have an isolated 30-day late payment with a creditor you have been with for years, send a Goodwill Adjustment Letter asking the manager to delete the negative remark as a courtesy.",
  },
  {
    title: "4. Dispute Inaccuracies & Medical Collections",
    desc: "Under the FCRA (Fair Credit Reporting Act), credit bureaus must verify any disputed debt within 30 days. Paid medical collections under $500 are legally barred from appearing on credit reports.",
  },
];
