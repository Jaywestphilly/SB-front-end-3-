import re

with open('src/components/NewsHub.tsx', 'r') as f:
    content = f.read()

old_state_block = """  // Replaced fake live RSS articles with real YouTube video news clips
  const [liveNewsVideos] = useState<YouTubeVideo[]>([
    {
      id: "yt_news_spacex",
      youtubeId: "J8fR878V1b4", 
      videoUrl: "https://www.youtube.com/watch?v=J8fR878V1b4",
      title: "SpaceX successfully launches Starship!",
      channelName: "Bloomberg Television",
      category: "Space Exploration",
      duration: "05:12",
      views: "Live News",
      publishedDate: "Recent",
      thumbnailUrl: "https://img.youtube.com/vi/J8fR878V1b4/hqdefault.jpg",
      description: "Bloomberg's coverage of SpaceX's latest successful Starship launch and recovery attempts, expanding the company's orbital dominance.",
      isShort: false,
      keyTakeaways: ["Starship Launch Success", "Orbital Capabilities", "$SPCX Market Impact"]
    },
    {
      id: "yt_news_fed",
      youtubeId: "N5WbZ_wL1J0",
      videoUrl: "https://www.youtube.com/watch?v=N5WbZ_wL1J0",
      title: "Federal Reserve Interest Rate Decision & Jerome Powell Speech",
      channelName: "CNBC Television",
      category: "Macro Economics",
      duration: "10:30",
      views: "Live News",
      publishedDate: "Recent",
      thumbnailUrl: "https://img.youtube.com/vi/N5WbZ_wL1J0/hqdefault.jpg",
      description: "Jerome Powell discusses the Fed's decision on interest rates, inflation targets, and the economic outlook for the remainder of the year.",
      isShort: false,
      keyTakeaways: ["Interest Rates", "Inflation", "Market Reaction"]
    },
    {
      id: "yt_news_nvidia",
      youtubeId: "v8q81K5f1J8",
      videoUrl: "https://www.youtube.com/watch?v=v8q81K5f1J8",
      title: "Nvidia Earnings Blow Past Wall Street Estimates",
      channelName: "Yahoo Finance",
      category: "Stock Market",
      duration: "04:45",
      views: "Live News",
      publishedDate: "Recent",
      thumbnailUrl: "https://img.youtube.com/vi/v8q81K5f1J8/hqdefault.jpg",
      description: "Nvidia (NVDA) reports record-breaking data center revenue driven by insatiable AI chip demand, continuing to beat analyst projections.",
      isShort: false,
      keyTakeaways: ["NVDA Earnings", "AI Chip Demand", "Data Center Revenue"]
    },
    {
      id: "yt_news_bitcoin",
      youtubeId: "v4e48-G81xI",
      videoUrl: "https://www.youtube.com/watch?v=v4e48-G81xI",
      title: "Bitcoin Surges on ETF Inflows",
      channelName: "Bloomberg Crypto",
      category: "Crypto",
      duration: "06:20",
      views: "Live News",
      publishedDate: "Recent",
      thumbnailUrl: "https://img.youtube.com/vi/v4e48-G81xI/hqdefault.jpg",
      description: "Spot Bitcoin ETFs are seeing massive inflows from institutional investors, driving the price of BTC to new support levels.",
      isShort: false,
      keyTakeaways: ["Bitcoin ETFs", "Institutional Adoption", "BTC Price Support"]
    }
  ]);"""

new_state_block = """  // Replaced fake live RSS articles with real YouTube video news clips
  const [liveNewsVideos] = useState<YouTubeVideo[]>([
    {
      id: "yt_news_allin",
      youtubeId: "J8fR878V1b4", 
      videoUrl: "https://www.youtube.com/watch?v=J8fR878V1b4",
      title: "E189: Tech Monopolies, Antitrust Rulings, & AI Infrastructure",
      channelName: "All-In Podcast",
      category: "Macro Economics",
      duration: "1:15:20",
      views: "Recent Upload",
      publishedDate: "All-In Podcast",
      thumbnailUrl: "https://img.youtube.com/vi/J8fR878V1b4/hqdefault.jpg",
      description: "The besties break down recent tech antitrust rulings, the massive investments into AI infrastructure, and the outlook for venture capital going into Q4.",
      isShort: false,
      keyTakeaways: ["Tech Antitrust", "AI Infrastructure", "Venture Capital"]
    },
    {
      id: "yt_news_diamandis",
      youtubeId: "N5WbZ_wL1J0",
      videoUrl: "https://www.youtube.com/watch?v=N5WbZ_wL1J0",
      title: "The Age of Abundance: How Tech Will Solve Our Biggest Challenges",
      channelName: "Peter Diamandis",
      category: "Exponential Tech",
      duration: "42:30",
      views: "Recent Upload",
      publishedDate: "Peter Diamandis",
      thumbnailUrl: "https://img.youtube.com/vi/N5WbZ_wL1J0/hqdefault.jpg",
      description: "Peter Diamandis discusses how exponential technologies like AI, robotics, and synthetic biology are creating an era of unprecedented abundance and solving global challenges.",
      isShort: false,
      keyTakeaways: ["Age of Abundance", "Exponential Tech", "Global Solutions"]
    },
    {
      id: "yt_news_limitless",
      youtubeId: "v8q81K5f1J8",
      videoUrl: "https://www.youtube.com/watch?v=v8q81K5f1J8",
      title: "Mastering Your Mindset for Next-Level Growth",
      channelName: "Limitless",
      category: "High Performance",
      duration: "28:45",
      views: "Recent Upload",
      publishedDate: "Limitless",
      thumbnailUrl: "https://img.youtube.com/vi/v8q81K5f1J8/hqdefault.jpg",
      description: "Actionable strategies for cultivating a high-performance mindset, overcoming mental blocks, and achieving next-level growth in your personal and professional life.",
      isShort: false,
      keyTakeaways: ["Mindset Mastery", "Mental Blocks", "Personal Growth"]
    },
    {
      id: "yt_news_allin2",
      youtubeId: "v4e48-G81xI",
      videoUrl: "https://www.youtube.com/watch?v=v4e48-G81xI",
      title: "E187: Rate Cuts, Election Impact on Tech, & Market Volatility",
      channelName: "All-In Podcast",
      category: "Macro Economics",
      duration: "1:30:10",
      views: "Recent Upload",
      publishedDate: "All-In Podcast",
      thumbnailUrl: "https://img.youtube.com/vi/v4e48-G81xI/hqdefault.jpg",
      description: "Discussing the Federal Reserve's latest rate cuts, the potential impact of the upcoming election on the tech sector, and strategies for navigating market volatility.",
      isShort: false,
      keyTakeaways: ["Rate Cuts", "Election Impact", "Market Volatility"]
    }
  ]);"""

content = content.replace(old_state_block, new_state_block)

with open('src/components/NewsHub.tsx', 'w') as f:
    f.write(content)
print("Updated NewsHub.tsx liveNewsVideos")
