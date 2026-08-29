import re

with open('src/components/NewsHub.tsx', 'r') as f:
    content = f.read()

# 2. Replace the state block and fetching logic
old_state_block = """  const [activeTab, setActiveTab] = useState<"ALL" | "YOUTUBE" | "PODCASTS">("ALL");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideoModal, setActiveVideoModal] = useState<YouTubeVideo | null>(null);

  // Live News stories from Google News RSS feed via client-side CORS bridges
  const [liveNewsStories, setLiveNewsStories] = useState<any[]>([
    {
      id: "citadel-securities-baseline",
      type: "live_news",
      itemCategory: "podcast",
      title: "Citadel Securities Expands AI Integration Across Automated Market-Making Corridors",
      summary: "Ken Griffin's Citadel Securities leverages proprietary deep learning networks to optimize algorithmic order routing, servicing a major portion of US retail equity and option volume.",
      sourceName: "Financial Times",
      timeAgo: "Today (Grounded Baseline)",
      tickers: ["SPY", "QQQ"],
      sentiment: "Bullish",
      sourceUrl: "https://www.ft.com",
      timestamp: new Date().toISOString(),
      isGrounded: true,
    },
    {
      id: "spacex-tender-baseline",
      type: "live_news",
      itemCategory: "podcast",
      title: "SpaceX Secondary Market Tenders Valuation Tops $210 Billion",
      summary: "Elon Musk's SpaceX has finalized a secondary market tender offer valuing the private aerospace manufacturer at more than $210 billion, solidifying its position as the most valuable private US startup. Direct shares trade around $112 per share.",
      sourceName: "Bloomberg & Reuters",
      timeAgo: "Today (Grounded Baseline)",
      tickers: ["SPCX"],
      sentiment: "Bullish",
      sourceUrl: "https://www.reuters.com",
      timestamp: new Date().toISOString(),
      isGrounded: true,
    }
  ]);
  const [isFetchingRss, setIsFetchingRss] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchLiveRssFeeds = async () => {
      setIsFetchingRss(true);
      const keywords = ["SpaceX", "Citadel Securities", "Bitcoin", "Fed Rates"];
      const fetchedStories: any[] = [];

      for (const kw of keywords) {
        if (!active) break;
        try {
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(kw)}&hl=en-US&gl=US&ceid=US:en`;
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === "ok" && Array.isArray(data.items)) {
              data.items.slice(0, 4).forEach((item: any, index: number) => {
                const title = item.title || "";
                const link = item.link || "";
                const pubDate = item.pubDate || "Recently";
                const source = item.author || "Google News";
                const summary = item.description || item.content || `Live market RSS feed tracking updates for ${kw}.`;

                let sentiment: "Bullish" | "Bearish" | "Neutral" = "Neutral";
                const lowerTitle = title.toLowerCase();
                if (lowerTitle.includes("gain") || lowerTitle.includes("surge") || lowerTitle.includes("up") || lowerTitle.includes("bull") || lowerTitle.includes("growth") || lowerTitle.includes("record")) {
                  sentiment = "Bullish";
                } else if (lowerTitle.includes("drop") || lowerTitle.includes("fall") || lowerTitle.includes("down") || lowerTitle.includes("bear") || lowerTitle.includes("decline") || lowerTitle.includes("loss")) {
                  sentiment = "Bearish";
                }

                let mappedTickers = [kw.toUpperCase()];
                if (kw === "SpaceX") mappedTickers = ["SPCX"];
                else if (kw === "Citadel Securities") mappedTickers = ["SPY"];
                else if (kw === "Fed Rates") mappedTickers = ["FED"];

                fetchedStories.push({
                  id: `rss-${kw}-${index}-${Date.now()}`,
                  type: "live_news",
                  itemCategory: "podcast",
                  title: title,
                  summary: summary.replace(/<[^>]*>/g, "").slice(0, 200) + "...",
                  sourceName: source,
                  timeAgo: pubDate,
                  tickers: mappedTickers,
                  sentiment: sentiment,
                  sourceUrl: link,
                  timestamp: new Date().toISOString(),
                });
              });
            }
          } else {
            throw new Error("rss2json bad response");
          }
        } catch (err) {
          console.warn(`rss2json failed for ${kw}, trying allorigins proxy...`, err);
          try {
            const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(kw)}&hl=en-US&gl=US&ceid=US:en`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
              const resJson = await response.json();
              const xmlContent = resJson.contents;
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
              const items = xmlDoc.getElementsByTagName("item");
              
              for (let i = 0; i < Math.min(items.length, 3); i++) {
                const item = items[i];
                const title = item.getElementsByTagName("title")[0]?.textContent || "";
                const link = item.getElementsByTagName("link")[0]?.textContent || "";
                const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || "Recently";
                const source = item.getElementsByTagName("source")[0]?.textContent || "Google News";
                
                let sentiment: "Bullish" | "Bearish" | "Neutral" = "Neutral";
                const lowerTitle = title.toLowerCase();
                if (lowerTitle.includes("gain") || lowerTitle.includes("surge") || lowerTitle.includes("up") || lowerTitle.includes("bull") || lowerTitle.includes("growth")) {
                  sentiment = "Bullish";
                } else if (lowerTitle.includes("drop") || lowerTitle.includes("fall") || lowerTitle.includes("down") || lowerTitle.includes("bear") || lowerTitle.includes("decline")) {
                  sentiment = "Bearish";
                }

                let mappedTickers = [kw.toUpperCase()];
                if (kw === "SpaceX") mappedTickers = ["SPCX"];
                else if (kw === "Citadel Securities") mappedTickers = ["SPY"];
                else if (kw === "Fed Rates") mappedTickers = ["FED"];

                fetchedStories.push({
                  id: `allorigins-${kw}-${i}-${Date.now()}`,
                  type: "live_news",
                  itemCategory: "podcast",
                  title: title,
                  summary: `Real-time RSS updates tracking the latest developments regarding ${kw}.`,
                  sourceName: source,
                  timeAgo: pubDate,
                  tickers: mappedTickers,
                  sentiment: sentiment,
                  sourceUrl: link,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          } catch (fallbackErr) {
            console.error(`allorigins fallback also failed for ${kw}:`, fallbackErr);
          }
        }
      }

      if (active && fetchedStories.length > 0) {
        setLiveNewsStories(prev => {
          const baselines = prev.filter(s => s.isGrounded);
          const newUnique = fetchedStories.filter(ns => !prev.some(p => p.title === ns.title));
          return [...baselines, ...newUnique];
        });
      }
      setIsFetchingRss(false);
    };

    fetchLiveRssFeeds();
    return () => { active = false; };
  }, []);"""

new_state_block = """  const [activeTab, setActiveTab] = useState<"ALL" | "YOUTUBE" | "PODCASTS">("ALL");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideoModal, setActiveVideoModal] = useState<YouTubeVideo | null>(null);

  // Replaced fake live RSS articles with real YouTube video news clips
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
  ]);
"""

content = content.replace(old_state_block, new_state_block)

old_combined_stream = """  // Build combined items stream
  const combinedStream: CombinedFeedItem[] = [
    ...INITIAL_YOUTUBE_VIDEOS.map((v) => ({
      ...v,
      type: "youtube_video" as const,
      itemCategory: "youtube" as const,
      timestamp: "2026-07-29T16:30:00Z",
    })),
    ...liveNewsStories,
  ];"""

new_combined_stream = """  // Build combined items stream
  const combinedStream: CombinedFeedItem[] = [
    ...INITIAL_YOUTUBE_VIDEOS.map((v) => ({
      ...v,
      type: "youtube_video" as const,
      itemCategory: "youtube" as const,
      timestamp: "2026-07-29T16:30:00Z",
    })),
    ...liveNewsVideos.map((v) => ({
      ...v,
      type: "youtube_video" as const,
      itemCategory: "youtube" as const,
      timestamp: "2026-07-29T17:00:00Z", // Slightly newer timestamp to show up top
    })),
  ];"""

content = content.replace(old_combined_stream, new_combined_stream)

old_render_block = """            // RENDER PODCAST / LIVE NEWS FEED ITEM
            const pod = item as any;
            return (
              <article
                key={pod.id}
                className={`transition-all duration-300 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 group relative overflow-hidden ${
                  pod.isGrounded
                    ? "bg-[#0c1821]/95 border-2 border-cyan-500/60 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                    : "bg-[#0b0312]/90 border border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                }`}
              >
                {pod.isGrounded && (
                  <div className="absolute right-0 top-0 h-16 w-16 pointer-events-none overflow-hidden">
                    <div className="absolute top-2 right-[-24px] rotate-45 bg-cyan-500 text-black text-[7px] font-black tracking-widest text-center py-1 w-20 uppercase shadow">
                      Grounded
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-2">
                    {pod.isGrounded ? (
                      <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-black rounded uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                        GROUNDED BASELINE NEWS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-500/40 text-[9px] font-black rounded uppercase tracking-wider flex items-center gap-1">
                        <Radio className="w-3 h-3 text-purple-400" />
                        LIVE RSS
                      </span>
                    )}
                    <span className="text-white font-bold text-xs uppercase truncate max-w-[120px] sm:max-w-none">
                      {pod.sourceName}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                      pod.sentiment === "Bullish" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30" :
                      pod.sentiment === "Bearish" ? "bg-rose-950/80 text-rose-300 border border-rose-500/30" :
                      "bg-neutral-900/80 text-neutral-300 border border-neutral-800"
                    }`}>
                      {pod.sentiment}
                    </span>
                  </div>
                  <span className="text-neutral-500 text-[10px] whitespace-nowrap">{pod.timeAgo}</span>
                </div>

                <div className="space-y-1.5">
                  {/* Sector Badges */}
                  {getItemTags(item).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-1 animate-in fade-in duration-200">
                      {getItemTags(item).map((tag) => {
                        const colors =
                          tag === "AI"
                            ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400"
                            : tag === "Biotech"
                            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                            : tag === "Robotics"
                            ? "bg-purple-950/40 border-purple-500/30 text-purple-400"
                            : "bg-amber-950/40 border-amber-500/30 text-amber-400";
                        return (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${colors}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {pod.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {pod.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    {pod.tickers && pod.tickers.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[9px] font-bold rounded">
                        ${t}
                      </span>
                    ))}
                  </div>

                  <a
                    href={pod.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1"
                  >
                    <span>Read Story</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            );"""

content = content.replace(old_render_block, "")

# Fix the button text
content = content.replace(
    '<span>REAL LIVE NEWS ({liveNewsStories.length})</span>',
    '<span>LATEST NEWS VIDEOS</span>'
)

with open('src/components/NewsHub.tsx', 'w') as f:
    f.write(content)
