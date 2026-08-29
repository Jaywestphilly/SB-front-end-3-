import re

with open('src/data/podcasts.ts', 'r') as f:
    content = f.read()

old_articles = re.search(r'export const PODCAST_NEWS_ARTICLES: PodcastNewsArticle\[\] = \[\s*{.*?}\s*\];', content, re.DOTALL)

new_articles = """export const PODCAST_NEWS_ARTICLES: PodcastNewsArticle[] = [
  {
    id: "yt_spacex_starship",
    subjectCategory: "exponential_tech",
    subjectName: "Space Exploration",
    episodeTitle: "SpaceX Starship Successfully Achieves Orbit",
    episodeNumber: "Live News Video",
    publishedDate: "Recent",
    readTime: "05:12",
    summary: "Bloomberg's coverage of SpaceX's latest successful Starship launch and recovery attempts, expanding the company's orbital dominance and cementing Elon Musk's lead in the space race.",
    keyTopics: ["Starship Launch", "Orbital Flight", "Space Economy", "Reusable Rockets"],
    relatedTickers: ["SPCX", "TSLA"],
    sentiment: "Bullish",
    imageUrl: "https://img.youtube.com/vi/J8fR878V1b4/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=J8fR878V1b4",
    keyTakeaways: [
      "Starship successfully achieved orbit.",
      "Crucial milestone for interplanetary travel.",
      "Valuation of SpaceX surges past $210B."
    ],
  },
  {
    id: "yt_fed_powell",
    subjectCategory: "macro_ai",
    subjectName: "Macro & Infrastructure",
    episodeTitle: "Jerome Powell on Federal Reserve Rate Decision",
    episodeNumber: "Live News Video",
    publishedDate: "Recent",
    readTime: "10:30",
    summary: "Jerome Powell discusses the Fed's decision on interest rates, inflation targets, and the economic outlook for the remainder of the year. Investors watch closely for signals of potential rate cuts.",
    keyTopics: ["Interest Rates", "Inflation", "Federal Reserve", "Monetary Policy"],
    relatedTickers: ["SPY", "FED", "QQQ"],
    sentiment: "Neutral",
    imageUrl: "https://img.youtube.com/vi/N5WbZ_wL1J0/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=N5WbZ_wL1J0",
    keyTakeaways: [
      "Rates remain unchanged for now.",
      "Inflation is cooling but still above target.",
      "Data dependency emphasizes patience."
    ],
  },
  {
    id: "yt_nvidia_earnings",
    subjectCategory: "exponential_tech",
    subjectName: "Exponential Tech & Longevity",
    episodeTitle: "Nvidia Earnings Blow Past Wall Street Estimates",
    episodeNumber: "Live News Video",
    publishedDate: "Recent",
    readTime: "04:45",
    summary: "Nvidia (NVDA) reports record-breaking data center revenue driven by insatiable AI chip demand, continuing to beat analyst projections and securing its trillion-dollar valuation.",
    keyTopics: ["AI Chips", "Data Center", "GPU Demand", "Revenue Growth"],
    relatedTickers: ["NVDA", "TSM"],
    sentiment: "Bullish",
    imageUrl: "https://img.youtube.com/vi/v8q81K5f1J8/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=v8q81K5f1J8",
    keyTakeaways: [
      "Unprecedented demand for H100 and Blackwell chips.",
      "Data center revenue hits all-time highs.",
      "Forward guidance remains extremely strong."
    ],
  }
];"""

if old_articles:
    content = content.replace(old_articles.group(0), new_articles)
    with open('src/data/podcasts.ts', 'w') as f:
        f.write(content)
    print("Replaced articles successfully.")
else:
    print("Could not find PODCAST_NEWS_ARTICLES")
