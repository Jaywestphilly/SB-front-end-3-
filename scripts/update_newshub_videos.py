import re

with open('src/components/NewsHub.tsx', 'r') as f:
    content = f.read()

# 1. Update CombinedFeedItem type to only use youtube
old_type = """export type CombinedFeedItem =
  | (YouTubeVideo & { itemCategory: "youtube"; type: "youtube_video"; timestamp: string })
  | {
      id: string;
      type: "podcast_macro" | "live_news";
      itemCategory: "podcast";
      title: string;
      sourceName: string;
      timeAgo: string;
      summary: string;
      tickers: string[];
      sentiment: "Bullish" | "Bearish" | "Neutral";
      sourceUrl: string;
      imageUrl?: string;
      timestamp: string;
      isGrounded?: boolean;
    };"""

new_type = """export type CombinedFeedItem =
  | (YouTubeVideo & { itemCategory: "youtube"; type: "youtube_video"; timestamp: string });"""

content = content.replace(old_type, new_type)
print("Replaced CombinedFeedItem type")

with open('src/components/NewsHub.tsx', 'w') as f:
    f.write(content)
