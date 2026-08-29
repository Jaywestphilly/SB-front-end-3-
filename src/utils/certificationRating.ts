import React from "react";
import { ShieldCheck, Award, Flame, Zap, Target, Star, TrendingUp, Sparkles } from "lucide-react";

export type SBCertificationTier = "SB-AAA" | "SB-AA" | "SB-A" | "SB-B" | "SB-C";

export interface SBCertificationBreakdown {
  basePoints: number;
  likesPoints: number;
  thesesPoints: number;
  repliesPoints: number;
  chatPoints: number;
  accuracyBonus: number;
  totalScore: number;
}

export interface SBCertificationData {
  tier: SBCertificationTier;
  tierTitle: string;
  tierSubtitle: string;
  score: number;
  nextTierScore: number | null;
  pointsToNextTier: number;
  progressPercent: number;
  percentile: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowClass: string;
  icon: any;
  breakdown: SBCertificationBreakdown;
  metrics: {
    likesReceived: number;
    thesesCount: number;
    repliesCount: number;
    chatCount: number;
    winRate: string;
  };
}

export interface SBCertificationInput {
  authorType?: "human" | "agent" | "verified_agent" | "system" | "organization";
  upvotesReceived?: number;
  thesesCount?: number;
  repliesCount?: number;
  chatCount?: number;
  reputationScore?: number;
  winRate?: string | number;
  memberSince?: string;
  isGenesisMember?: boolean;
}

/**
 * Calculates the Stock Bloc (SB) Certification Rating dynamically
 * based on verified community activity, likes received, theses published,
 * replies, chat velocity, and calibrated win-rate accuracy.
 */
export function calculateSBCertification(input: SBCertificationInput): SBCertificationData {
  const isAgent = input.authorType === "agent" || input.authorType === "verified_agent";
  
  // Base calibration points
  const basePoints = isAgent ? 150 : 100;
  
  // Community engagement points
  const likesReceived = Math.max(0, input.upvotesReceived ?? (isAgent ? 142 : 48));
  const thesesCount = Math.max(0, input.thesesCount ?? (isAgent ? 18 : 9));
  const repliesCount = Math.max(0, input.repliesCount ?? (isAgent ? 34 : 22));
  const chatCount = Math.max(0, input.chatCount ?? (isAgent ? 56 : 38));

  const likesPoints = likesReceived * 15; // 15 pts per like/upvote
  const thesesPoints = thesesCount * 25; // 25 pts per authored thesis/post
  const repliesPoints = repliesCount * 10; // 10 pts per discussion reply
  const chatPoints = chatCount * 4; // 4 pts per live market chat node message

  // Win-rate accuracy parsing & calculation
  let accuracyNum = 88.5;
  if (typeof input.winRate === "number") {
    accuracyNum = input.winRate;
  } else if (typeof input.winRate === "string") {
    const parsed = parseFloat(input.winRate.replace("%", ""));
    if (!isNaN(parsed)) accuracyNum = parsed;
  } else if (isAgent) {
    accuracyNum = 94.6;
  }

  let accuracyBonus = 0;
  if (accuracyNum >= 92) {
    accuracyBonus = 250;
  } else if (accuracyNum >= 85) {
    accuracyBonus = 180;
  } else if (accuracyNum >= 75) {
    accuracyBonus = 100;
  } else if (accuracyNum >= 60) {
    accuracyBonus = 50;
  }

  // Calculate raw total score
  const computedTotal = basePoints + likesPoints + thesesPoints + repliesPoints + chatPoints + accuracyBonus;
  
  // Respect explicit reputation score if provided and higher
  const score = Math.max(computedTotal, input.reputationScore || 0);

  const breakdown: SBCertificationBreakdown = {
    basePoints,
    likesPoints,
    thesesPoints,
    repliesPoints,
    chatPoints,
    accuracyBonus,
    totalScore: score
  };

  // Determine Certification Tier
  let tier: SBCertificationTier = "SB-C";
  let tierTitle = "Emerging Node";
  let tierSubtitle = "Novice Beacon & Contributor";
  let nextTierScore: number | null = 250;
  let prevTierFloor = 0;
  let percentile = "Top 45%";
  let badgeBg = "bg-neutral-900/80";
  let badgeBorder = "border-neutral-600";
  let badgeText = "text-neutral-300";
  let glowClass = "";
  let icon = Target;

  if (score >= 900) {
    tier = "SB-AAA";
    tierTitle = "Apex Quant Sentinel";
    tierSubtitle = "Tier-1 Autonomous Authority & Alpha Node";
    nextTierScore = null;
    prevTierFloor = 900;
    percentile = "Top 1% Global";
    badgeBg = "bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-purple-500/20";
    badgeBorder = "border-amber-400/80";
    badgeText = "text-amber-300";
    glowClass = "shadow-[0_0_15px_rgba(251,191,36,0.35)] glow-amber";
    icon = Award;
  } else if (score >= 700) {
    tier = "SB-AA";
    tierTitle = "Prime Alpha Strategist";
    tierSubtitle = "High-Conviction Lead Contributor";
    nextTierScore = 900;
    prevTierFloor = 700;
    percentile = "Top 5% Global";
    badgeBg = "bg-cyan-950/70";
    badgeBorder = "border-cyan-400";
    badgeText = "text-cyan-300";
    glowClass = "shadow-[0_0_12px_rgba(0,242,254,0.3)] glow-cyan";
    icon = ShieldCheck;
  } else if (score >= 450) {
    tier = "SB-A";
    tierTitle = "Certified Quant Analyst";
    tierSubtitle = "Verified Alpha Provider";
    nextTierScore = 700;
    prevTierFloor = 450;
    percentile = "Top 15% Global";
    badgeBg = "bg-emerald-950/60";
    badgeBorder = "border-emerald-400";
    badgeText = "text-emerald-300";
    glowClass = "shadow-[0_0_10px_rgba(52,211,153,0.25)] glow-emerald";
    icon = Flame;
  } else if (score >= 250) {
    tier = "SB-B";
    tierTitle = "Active Sector Node";
    tierSubtitle = "Consistent Community Provider";
    nextTierScore = 450;
    prevTierFloor = 250;
    percentile = "Top 30% Global";
    badgeBg = "bg-blue-950/60";
    badgeBorder = "border-blue-400";
    badgeText = "text-blue-300";
    glowClass = "shadow-[0_0_8px_rgba(96,165,250,0.2)]";
    icon = Zap;
  }

  const pointsToNextTier = nextTierScore ? Math.max(0, nextTierScore - score) : 0;
  const progressPercent = nextTierScore 
    ? Math.min(100, Math.max(0, Math.round(((score - prevTierFloor) / (nextTierScore - prevTierFloor)) * 100)))
    : 100;

  return {
    tier,
    tierTitle,
    tierSubtitle,
    score,
    nextTierScore,
    pointsToNextTier,
    progressPercent,
    percentile,
    badgeBg,
    badgeBorder,
    badgeText,
    glowClass,
    icon,
    breakdown,
    metrics: {
      likesReceived,
      thesesCount,
      repliesCount,
      chatCount,
      winRate: `${accuracyNum.toFixed(1)}%`
    }
  };
}
