import re

content = """import { YouTubeChannel, YouTubeVideo } from "../types";

export const FEATURED_YOUTUBE_CHANNEL: YouTubeChannel = {
  id: "stock_bloc_official",
  channelName: "Stock Bloc",
  handle: "@stockbloc",
  subscribers: "Official Channel",
  videoCount: "5 Videos",
  avatarUrl:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=160&q=80",
  bannerUrl:
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
  channelUrl: "https://youtube.com/@stockbloc?si=t-CCfX4j7tR38aql",
  description:
    "Official YouTube Channel by Stock Bloc (@stockbloc). Master Real Estate Cash Flow, Stock Market Investing, and Multi-Generational Wealth Creation.",
};

export const INITIAL_YOUTUBE_VIDEOS: YouTubeVideo[] = [
  // Stock Bloc (Must be at the top)
  {
    id: "yt_full_cim3kmqD5-8",
    youtubeId: "cim3kmqD5-8",
    videoUrl: "https://youtu.be/cim3kmqD5-8?si=5oaIHirb32ffge6W",
    title: "Tesla’s 2026 Master Plan: Why You Can’t Ignore Robotaxi & Optimus",
    channelName: "Stock Bloc",
    category: "Stock Market",
    duration: "12:45",
    views: "Official Video",
    publishedDate: "Stock Bloc YouTube",
    thumbnailUrl: "https://img.youtube.com/vi/cim3kmqD5-8/hqdefault.jpg",
    description: "Official full video from Stock Bloc (@stockbloc). Tesla’s 2026 Master Plan: Why You Can’t Ignore Robotaxi & Optimus.",
    isShort: false,
    keyTakeaways: ["Tesla’s 2026 Master Plan", "Robotaxi potential", "Optimus developments"],
  },
  {
    id: "yt_full_6MSDow1AVUc",
    youtubeId: "6MSDow1AVUc",
    videoUrl: "https://youtu.be/6MSDow1AVUc?si=2aPn3pEAfqD_dCMb",
    title: "The Anti-Addiction Stock About to Explode",
    channelName: "Stock Bloc",
    category: "Stock Market",
    duration: "14:20",
    views: "Official Video",
    publishedDate: "Stock Bloc YouTube",
    thumbnailUrl: "https://img.youtube.com/vi/6MSDow1AVUc/hqdefault.jpg",
    description: "Official video from Stock Bloc (@stockbloc). The Anti-Addiction Stock About to Explode.",
    isShort: false,
    keyTakeaways: ["Anti-Addiction Stock analysis", "Growth potential", "Market opportunity"],
  },
  
  // All-In Podcast
  {
    id: "yt_allin_macro",
    youtubeId: "v8q81K5f1J8", 
    videoUrl: "https://www.youtube.com/watch?v=v8q81K5f1J8",
    title: "E188: Markets bounce back, AI spending boom, startup valuations & more",
    channelName: "All-In Podcast",
    category: "Macro Economics",
    duration: "1:24:15",
    views: "New Episode",
    publishedDate: "All-In Podcast",
    thumbnailUrl: "https://img.youtube.com/vi/v8q81K5f1J8/hqdefault.jpg",
    description: "The besties discuss the recent market rebound, the massive capital expenditure in AI infrastructure, and where startup valuations are heading.",
    isShort: false,
    keyTakeaways: ["AI infrastructure spending", "Market rebound analysis", "Venture capital trends"],
  },

  // Peter Diamandis
  {
    id: "yt_diamandis_longevity",
    youtubeId: "cim3kmqD5-8",
    videoUrl: "https://www.youtube.com/watch?v=cim3kmqD5-8",
    title: "How AI is Accelerating Human Longevity and Exponential Tech",
    channelName: "Peter Diamandis",
    category: "Exponential Tech",
    duration: "45:20",
    views: "New Video",
    publishedDate: "Peter Diamandis",
    thumbnailUrl: "https://img.youtube.com/vi/cim3kmqD5-8/hqdefault.jpg",
    description: "Peter Diamandis explores the convergence of artificial intelligence, gene editing, and exponential technologies that are fundamentally extending human healthspans.",
    isShort: false,
    keyTakeaways: ["AI in biotech", "Extending healthspan", "Abundance mindset"],
  },

  // Limitless
  {
    id: "yt_limitless_performance",
    youtubeId: "J8fR878V1b4",
    videoUrl: "https://www.youtube.com/watch?v=J8fR878V1b4",
    title: "Rewire Your Brain For Wealth & High Performance",
    channelName: "Limitless",
    category: "High Performance",
    duration: "32:10",
    views: "New Video",
    publishedDate: "Limitless",
    thumbnailUrl: "https://img.youtube.com/vi/J8fR878V1b4/hqdefault.jpg",
    description: "Strategies to break through psychological income ceilings, build high-performance habits, and fundamentally rewire your daily execution routines.",
    isShort: false,
    keyTakeaways: ["Mental frameworks", "High performance habits", "Income ceilings"],
  }
];

export const YOUTUBE_VIDEOS = INITIAL_YOUTUBE_VIDEOS;
"""

with open('src/data/youtube.ts', 'w') as f:
    f.write(content)
print("Updated youtube.ts")
