import re

with open('src/components/NewsHub.tsx', 'r') as f:
    content = f.read()

# Replace activeTab state
content = content.replace('useState<"ALL" | "YOUTUBE" | "PODCASTS">("ALL")', 'useState<"ALL" | "YOUTUBE" | "NEWS_VIDEOS">("ALL")')

# Replace stream mapping
old_map = """    ...liveNewsVideos.map((v) => ({
      ...v,
      type: "youtube_video" as const,
      itemCategory: "youtube" as const,
      timestamp: "2026-07-29T17:00:00Z", // Slightly newer timestamp to show up top
    })),"""
new_map = """    ...liveNewsVideos.map((v) => ({
      ...v,
      type: "youtube_video" as const,
      itemCategory: "news_video" as const,
      timestamp: "2026-07-29T17:00:00Z", // Slightly newer timestamp to show up top
    })),"""
content = content.replace(old_map, new_map)

# Replace filter logic
content = content.replace('if (activeTab === "PODCASTS") return item.itemCategory === "podcast";', 'if (activeTab === "NEWS_VIDEOS") return item.itemCategory === "news_video";')

# Replace buttons
old_button = """          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("PODCASTS");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "PODCASTS"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                : "text-neutral-400 hover:text-purple-300 hover:bg-neutral-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>LATEST NEWS VIDEOS</span>
          </button>"""
new_button = """          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("NEWS_VIDEOS");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "NEWS_VIDEOS"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                : "text-neutral-400 hover:text-purple-300 hover:bg-neutral-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>LATEST NEWS VIDEOS</span>
          </button>"""
content = content.replace(old_button, new_button)

# Also fix the type definition if needed
old_type = """export type CombinedFeedItem =
  | (YouTubeVideo & { itemCategory: "youtube"; type: "youtube_video"; timestamp: string });"""
new_type = """export type CombinedFeedItem =
  | (YouTubeVideo & { itemCategory: "youtube" | "news_video"; type: "youtube_video"; timestamp: string });"""
content = content.replace(old_type, new_type)

with open('src/components/NewsHub.tsx', 'w') as f:
    f.write(content)
