import { PodcastNewsArticle, SubjectCategoryId } from "../types";

export interface SubjectCategoryInfo {
  id: SubjectCategoryId;
  name: string;
  tagline: string;
  avatarUrl: string;
  coverUrl: string;
  badgeColor: string;
}

export const SUBJECT_CATEGORIES: SubjectCategoryInfo[] = [
  {
    id: "macro_ai",
    name: "Macro & Infrastructure",
    tagline:
      "Global Markets, Data Center Power Grid, HBM3e Memory & Venture Capital",
    avatarUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=160&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    id: "exponential_tech",
    name: "Exponential Tech & Longevity",
    tagline:
      " Autonomous Agents, Quantum Batteries, Gene Editing & Space Infrastructure",
    avatarUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=160&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    id: "wealth_mindset",
    name: "High Performance & Mindset",
    tagline:
      "Cognitive Optimization, Financial Speed Reading, Focus & Execution Habits",
    avatarUrl:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=160&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
];

export const PODCAST_NEWS_ARTICLES: PodcastNewsArticle[] = [
  {
    id: "yt_pod_allin",
    subjectCategory: "macro_ai",
    subjectName: "Macro Economics",
    episodeTitle: "E188: Markets bounce back, AI spending boom, startup valuations",
    episodeNumber: "All-In Podcast",
    publishedDate: "Recent",
    readTime: "1:24:15",
    summary: "The besties discuss the recent market rebound, the massive capital expenditure in AI infrastructure, and where startup valuations are heading. Features deep dives into big tech capex.",
    keyTopics: ["AI infrastructure", "Market rebound", "Startup valuations", "Venture Capital"],
    relatedTickers: ["SPY", "QQQ"],
    sentiment: "Bullish",
    imageUrl: "https://img.youtube.com/vi/v8q81K5f1J8/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=v8q81K5f1J8",
    keyTakeaways: [
      "AI infrastructure spending remains robust.",
      "Market sentiment is shifting positively.",
      "Venture funding is stabilizing."
    ],
  },
  {
    id: "yt_pod_diamandis",
    subjectCategory: "exponential_tech",
    subjectName: "Exponential Tech",
    episodeTitle: "How AI is Accelerating Human Longevity",
    episodeNumber: "Peter Diamandis",
    publishedDate: "Recent",
    readTime: "45:20",
    summary: "Peter Diamandis explores the convergence of artificial intelligence, gene editing, and exponential technologies that are fundamentally extending human healthspans.",
    keyTopics: ["AI in biotech", "Extending healthspan", "Abundance mindset"],
    relatedTickers: ["CRSP", "NVDA"],
    sentiment: "Bullish",
    imageUrl: "https://img.youtube.com/vi/cim3kmqD5-8/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=cim3kmqD5-8",
    keyTakeaways: [
      "AI accelerates drug discovery timelines.",
      "CRISPR and gene editing show clinical promise.",
      "The abundance mindset shifts investment thesis."
    ],
  },
  {
    id: "yt_pod_limitless",
    subjectCategory: "wealth_mindset",
    subjectName: "High Performance",
    episodeTitle: "Rewire Your Brain For Wealth & High Performance",
    episodeNumber: "Limitless",
    publishedDate: "Recent",
    readTime: "32:10",
    summary: "Strategies to break through psychological income ceilings, build high-performance habits, and fundamentally rewire your daily execution routines.",
    keyTopics: ["Mental frameworks", "High performance habits", "Income ceilings"],
    relatedTickers: ["SPY"],
    sentiment: "Neutral",
    imageUrl: "https://img.youtube.com/vi/J8fR878V1b4/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=J8fR878V1b4",
    keyTakeaways: [
      "Identify and break psychological barriers.",
      "Build sustainable daily habits.",
      "Focus on compounding daily growth."
    ],
  },
  {
    id: "yt_pod_alexwg",
    subjectCategory: "exponential_tech",
    subjectName: "Exponential Tech",
    episodeTitle: "Physics of Intelligence, Thermodynamics & AI",
    episodeNumber: "Alexander Wissner-Gross",
    publishedDate: "Recent",
    readTime: "38:45",
    summary: "Dr. Alexander Wissner-Gross (@alexwg) explores causal entropic forces, intelligence as a physical thermodynamic force, and the future of AI computation.",
    keyTopics: ["Physical Intelligence", "Thermodynamic AI", "Causal Entropic Forces"],
    relatedTickers: ["NVDA", "QQQ"],
    sentiment: "Bullish",
    imageUrl: "https://img.youtube.com/vi/-v111d4Yjjc/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=-v111d4Yjjc",
    keyTakeaways: [
      "Intelligence maximizes future freedom of action.",
      "Thermodynamic computing unlocks energy-efficient AI.",
      "Causal entropic forces unify physical and artificial intelligence."
    ],
  }
];