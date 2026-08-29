import { YouTubeVideo } from "../../types";

export type FeedSortOption = "NEWEST" | "OLDEST" | "CATALYSTS" | "OFFICIAL" | "POPULAR";

export interface UnifiedFeedItem {
  id: string;
  youtubeId?: string;
  title: string;
  channelName: string;
  publishedDate: string;
  timestamp: number; // numeric ms epoch for deterministic sorting
  thumbnailUrl: string;
  duration?: string;
  views?: string;
  viewCount?: number;
  description: string;
  keyTakeaways?: string[];
  category: string;
  videoUrl?: string;
  embedUrl?: string;
  watchUrl?: string;
  itemCategory: "youtube" | "news_video";
  isStockBloc: boolean;
  isAlexWg: boolean;
  isShort?: boolean;
}

/**
 * Universal robust feed date parser supporting ISO strings, bullet-separated metadata,
 * Unix timestamps (seconds & milliseconds), and standard text dates.
 */
export function parseFeedDate(dateVal?: string | number | null): number {
  if (!dateVal) return 0;
  if (typeof dateVal === "number") {
    // If in seconds (< 1e11), convert to milliseconds
    return dateVal < 1e11 ? dateVal * 1000 : dateVal;
  }

  const str = String(dateVal).trim();
  if (!str) return 0;

  // Pure numeric string
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    return num < 1e11 ? num * 1000 : num;
  }

  // Handle strings with author bullets e.g. "@alexwg • Aug 12, 2026" or "Stock Bloc • Aug 10, 2026"
  let cleanStr = str;
  if (cleanStr.includes("•")) {
    const parts = cleanStr.split("•");
    cleanStr = parts[parts.length - 1].trim();
  }

  // Handle relative strings like "2 hours ago", "yesterday"
  const now = Date.now();
  const lower = cleanStr.toLowerCase();
  if (lower.includes("min") || lower.includes("sec") || lower.includes("hour")) {
    const match = lower.match(/(\d+)\s*(min|sec|hour)/);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2];
      const mult = unit.startsWith("h") ? 3600000 : unit.startsWith("m") ? 60000 : 1000;
      return now - val * mult;
    }
    return now;
  }
  if (lower.includes("day")) {
    const match = lower.match(/(\d+)\s*day/);
    const days = match ? parseInt(match[1], 10) : 1;
    return now - days * 86400000;
  }

  // Standard Date parsing
  const parsed = Date.parse(cleanStr);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  return 0;
}

/**
 * Parses rough view counts into numerical order for popularity sorting.
 */
export function parseViewCount(viewsStr?: string): number {
  if (!viewsStr) return 0;
  const s = viewsStr.toLowerCase().replace(/,/g, "").trim();
  if (s.includes("k")) return parseFloat(s) * 1000;
  if (s.includes("m")) return parseFloat(s) * 1000000;
  if (s.includes("b")) return parseFloat(s) * 1000000000;
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

/**
 * Evaluates whether an item contains a high-priority catalyst (Breaking, FOMC, 13F whale, etc.)
 */
export function getFeedCatalystWeight(item: UnifiedFeedItem): number {
  const text = `${item.title} ${item.description} ${item.category}`.toLowerCase();
  let score = 0;
  if (text.includes("breaking") || text.includes("urgent") || text.includes("halt")) score += 100;
  if (text.includes("13f") || text.includes("whale") || text.includes("buffett") || text.includes("burry")) score += 80;
  if (text.includes("fomc") || text.includes("fed") || text.includes("powell") || text.includes("cpi") || text.includes("rate cut")) score += 70;
  if (text.includes("earnings") || text.includes("guidance") || text.includes("revenue")) score += 60;
  if (text.includes("quantum") || text.includes("dyson") || text.includes("supercomputer") || text.includes("orbital")) score += 50;
  if (item.isStockBloc) score += 30;
  return score;
}

/**
 * Normalizes and unifies raw intel feed items and YouTube RSS videos into a deduplicated stream.
 */
export function normalizeAndUnifyFeed(
  intelFeed: any[],
  feedVideos: YouTubeVideo[]
): UnifiedFeedItem[] {
  const unifiedMap = new Map<string, UnifiedFeedItem>();

  // 1. Process feedVideos first (richer video metadata)
  feedVideos.forEach((v, index) => {
    const rawDate = v.publishedDate || "";
    let ts = parseFeedDate(rawDate);
    if (!ts || ts === 0) {
      // Fallback relative timestamp based on index to preserve sequence
      ts = Date.now() - index * 3600000;
    }

    const channel = v.channelName || "Stock Bloc";
    const isSb = channel.toLowerCase().includes("stock bloc");
    const isAlex = channel.toLowerCase().includes("alexwg") || channel.toLowerCase().includes("wissner-gross");
    const key = (v.youtubeId || v.id || v.title).trim();

    unifiedMap.set(key, {
      id: v.id || `yt-${v.youtubeId || index}`,
      youtubeId: v.youtubeId,
      title: v.title || "Market Intelligence Dispatch",
      channelName: channel,
      publishedDate: v.publishedDate || "Recent",
      timestamp: ts,
      thumbnailUrl: v.thumbnailUrl || (v.youtubeId ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` : "/stockbloc-logo.png"),
      duration: v.duration || "Video",
      views: v.views || "Verified",
      viewCount: parseViewCount(v.views),
      description: v.description || "",
      keyTakeaways: v.keyTakeaways || [],
      category: v.category || (isSb ? "Stock Bloc Official" : "Market Intelligence"),
      videoUrl: v.videoUrl || (v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : undefined),
      embedUrl: v.youtubeId ? `https://www.youtube.com/embed/${v.youtubeId}` : undefined,
      watchUrl: v.videoUrl || (v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : undefined),
      itemCategory: isSb ? "youtube" : "news_video",
      isStockBloc: isSb,
      isAlexWg: isAlex,
      isShort: v.isShort,
    });
  });

  // 2. Merge intelFeed, enriching existing entries or creating new ones
  intelFeed.forEach((item, index) => {
    const key = (item.video_id || item.id || item.watch_url || item.title || `intel-${index}`).trim();
    const rawDate = item.published_date || item.published || "";
    let ts = parseFeedDate(rawDate);
    if (!ts || ts === 0) {
      ts = Date.now() - (index + 2) * 3600000;
    }

    const channel = item.channel_name || item.channelName || "Intel Dispatch";
    const isSb = channel.toLowerCase().includes("stock bloc");
    const isAlex = channel.toLowerCase().includes("alexwg") || channel.toLowerCase().includes("wissner-gross");

    const existing = unifiedMap.get(key) || (item.video_id ? unifiedMap.get(item.video_id) : undefined);

    if (existing) {
      // Merge best attributes
      existing.title = item.title || existing.title;
      if (item.summary && (!existing.description || item.summary.length > existing.description.length)) {
        existing.description = item.summary;
      }
      if (item.keyTakeaways && item.keyTakeaways.length > 0) {
        existing.keyTakeaways = item.keyTakeaways;
      }
      if (ts > 0 && (!existing.timestamp || existing.timestamp === 0)) {
        existing.timestamp = ts;
      }
      if (item.category) existing.category = item.category;
    } else {
      unifiedMap.set(key, {
        id: item.id || (item.video_id ? `intel-${item.video_id}` : `intel-${index}`),
        youtubeId: item.video_id,
        title: item.title || "Market Intelligence Dispatch",
        channelName: channel,
        publishedDate: item.published_date || "Recent",
        timestamp: ts,
        thumbnailUrl: item.thumbnail || (item.video_id ? `https://img.youtube.com/vi/${item.video_id}/hqdefault.jpg` : "/stockbloc-logo.png"),
        duration: "LIVE",
        views: "Verified",
        viewCount: 10000,
        description: item.summary || item.description || "",
        keyTakeaways: item.keyTakeaways || [],
        category: item.category || (isSb ? "Stock Bloc Official" : "Market Intelligence"),
        videoUrl: item.watch_url || item.video_url || (item.video_id ? `https://www.youtube.com/watch?v=${item.video_id}` : undefined),
        embedUrl: item.embed_url || (item.video_id ? `https://www.youtube.com/embed/${item.video_id}` : undefined),
        watchUrl: item.watch_url || item.video_url || (item.video_id ? `https://www.youtube.com/watch?v=${item.video_id}` : undefined),
        itemCategory: isSb ? "youtube" : "news_video",
        isStockBloc: isSb,
        isAlexWg: isAlex,
        isShort: false,
      });
    }
  });

  return Array.from(unifiedMap.values());
}

/**
 * Deterministically sorts unified feed items according to user sort choice.
 */
export function sortUnifiedFeed(
  items: UnifiedFeedItem[],
  sortOption: FeedSortOption = "NEWEST"
): UnifiedFeedItem[] {
  const list = [...items];

  switch (sortOption) {
    case "NEWEST":
      return list.sort((a, b) => b.timestamp - a.timestamp);

    case "OLDEST":
      return list.sort((a, b) => a.timestamp - b.timestamp);

    case "CATALYSTS":
      return list.sort((a, b) => {
        const weightA = getFeedCatalystWeight(a);
        const weightB = getFeedCatalystWeight(b);
        if (weightB !== weightA) return weightB - weightA;
        return b.timestamp - a.timestamp;
      });

    case "OFFICIAL":
      return list.sort((a, b) => {
        if (a.isStockBloc && !b.isStockBloc) return -1;
        if (!a.isStockBloc && b.isStockBloc) return 1;
        return b.timestamp - a.timestamp;
      });

    case "POPULAR":
      return list.sort((a, b) => {
        const countA = a.viewCount || 0;
        const countB = b.viewCount || 0;
        if (countB !== countA) return countB - countA;
        return b.timestamp - a.timestamp;
      });

    default:
      return list.sort((a, b) => b.timestamp - a.timestamp);
  }
}
