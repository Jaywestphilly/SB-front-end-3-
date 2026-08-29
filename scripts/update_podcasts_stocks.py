import re

# 1. Update src/data/podcasts.ts
with open('src/data/podcasts.ts', 'r') as f:
    content = f.read()

index = content.find("export const PODCAST_NEWS_ARTICLES")
if index != -1:
    content = content[:index] + """export const PODCAST_NEWS_ARTICLES: PodcastNewsArticle[] = [
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
    subjectCategory: "mindset_performance",
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
  }
];"""
    with open('src/data/podcasts.ts', 'w') as f:
        f.write(content)
    print("Updated podcasts.ts")

# 2. Update src/data/stocks.ts
with open('src/data/stocks.ts', 'r') as f:
    content = f.read()

index = content.find("export const STOCK_NEWS_FEED: StockNews[] = [")
if index != -1:
    new_feed = """export const STOCK_NEWS_FEED: StockNews[] = [
  {
    id: "yt_stock_allin1",
    title: "All-In Podcast E188: Markets bounce back, AI spending boom, startup valuations",
    source: "All-In Podcast",
    timeAgo: "10m ago",
    url: "https://www.youtube.com/watch?v=v8q81K5f1J8",
    relatedSymbol: "NVDA",
    sentiment: "positive",
  },
  {
    id: "yt_stock_diamandis1",
    title: "Peter Diamandis: How AI is Accelerating Human Longevity",
    source: "Peter Diamandis",
    timeAgo: "25m ago",
    url: "https://www.youtube.com/watch?v=cim3kmqD5-8",
    relatedSymbol: "CRSP",
    sentiment: "positive",
  },
  {
    id: "yt_stock_sb1",
    title: "Stock Bloc: Tesla’s 2026 Master Plan: Why You Can’t Ignore Robotaxi & Optimus",
    source: "Stock Bloc",
    timeAgo: "1h ago",
    url: "https://www.youtube.com/watch?v=cim3kmqD5-8",
    relatedSymbol: "TSLA",
    sentiment: "positive",
  },
  {
    id: "yt_stock_limitless1",
    title: "Limitless: Rewire Your Brain For Wealth & High Performance",
    source: "Limitless",
    timeAgo: "2h ago",
    url: "https://www.youtube.com/watch?v=J8fR878V1b4",
    relatedSymbol: "SPY",
    sentiment: "positive",
  },
  {
    id: "yt_stock_allin2",
    title: "All-In Podcast E187: Rate Cuts, Election Impact on Tech",
    source: "All-In Podcast",
    timeAgo: "3h ago",
    url: "https://www.youtube.com/watch?v=v4e48-G81xI",
    relatedSymbol: "QQQ",
    sentiment: "positive",
  },
  {
    id: "yt_stock_sb2",
    title: "Stock Bloc: The Anti-Addiction Stock About to Explode",
    source: "Stock Bloc",
    timeAgo: "5h ago",
    url: "https://www.youtube.com/watch?v=6MSDow1AVUc",
    relatedSymbol: "SPY",
    sentiment: "positive",
  }
];"""
    content = content[:index] + new_feed
    with open('src/data/stocks.ts', 'w') as f:
        f.write(content)
    print("Updated stocks.ts")
