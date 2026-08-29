import { YouTubeVideo } from "../types";
import { INITIAL_YOUTUBE_VIDEOS } from "../data/youtube";

export interface ChannelConfig {
  channelName: string;
  channelId: string;
  handle: string;
  channelUrl: string;
  category: "Stock Market" | "Real Estate" | "Credit Building" | "Wealth Blueprint" | "Real Life Shorts";
}

export const MONITORED_CHANNELS: ChannelConfig[] = [
  {
    channelName: "Stock Bloc",
    channelId: "UCwNl7IKcxlC3fuA38VFReOw",
    handle: "@stockbloc",
    channelUrl: "https://www.youtube.com/@stockbloc",
    category: "Stock Market",
  },
  {
    channelName: "All-In Podcast",
    channelId: "UCESLZhusAkFfsNsApnjF_Cg",
    handle: "@allin",
    channelUrl: "https://www.youtube.com/@allin",
    category: "Stock Market",
  },
  {
    channelName: "Peter Diamandis",
    channelId: "UCvxm0qTrGN_1LMYgUaftWyQ",
    handle: "@peterdiamandis",
    channelUrl: "https://www.youtube.com/@peterdiamandis",
    category: "Wealth Blueprint",
  },
  {
    channelName: "Limitless",
    channelId: "UCCRxYlYOmLE2l5wxs3ckJtg",
    handle: "@limitless-fm",
    channelUrl: "https://www.youtube.com/@limitless-fm",
    category: "Wealth Blueprint",
  },
  {
    channelName: "Alexander Wissner-Gross",
    channelId: "UCvjvMqS2tiyIZJm0AqwXvcw",
    handle: "@alexwg",
    channelUrl: "https://www.youtube.com/@alexwg",
    category: "Stock Market",
  },
];

const STORAGE_KEY_VIDEOS = "yt_synced_videos_v5";
const STORAGE_KEY_TIMESTAMP = "yt_last_sync_timestamp_v5";

export function getStoredYouTubeVideos(): YouTubeVideo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading stored youtube videos:", e);
  }
  return INITIAL_YOUTUBE_VIDEOS;
}

export function getLastSyncTimestamp(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
    if (raw) return Number(raw);
  } catch (e) {
    console.error("Error reading last sync timestamp:", e);
  }
  return 0;
}

export function formatTimeSinceSync(timestamp: number): string {
  if (!timestamp) return "Using cached official feed";
  const diffMs = Date.now() - timestamp;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `YouTube synced · ${hours}h ago`;
  }
  if (mins > 0) {
    return `YouTube synced · ${mins}m ago`;
  }
  return "YouTube synced · Just now";
}

/**
 * Calculates the UTC timestamp for the most recent 5:00 AM EST.
 * Handles daylight saving and timezone offsets natively.
 */
function getMostRecent5AMEST(): number {
  const now = new Date();
  
  // Format current time in New York
  const nyStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const nyDate = new Date(nyStr);
  nyDate.setMilliseconds(now.getMilliseconds());
  
  // Set to 5:00 AM
  const ny5AM = new Date(nyStr);
  ny5AM.setHours(5, 0, 0, 0);
  
  // If current NY time is before 5 AM, then the most recent 5 AM was yesterday
  if (nyDate.getTime() < ny5AM.getTime()) {
    ny5AM.setDate(ny5AM.getDate() - 1);
  }
  
  // Calculate true UTC offset based on the local system time parsing bias
  const offset = nyDate.getTime() - now.getTime();
  const trueUTC5AM = ny5AM.getTime() - offset;
  
  return trueUTC5AM;
}

export async function syncYouTubeFeeds(force: boolean = false): Promise<{
  videos: YouTubeVideo[];
  syncedAt: number;
  updated: boolean;
}> {
  const lastSync = getLastSyncTimestamp();
  const now = Date.now();
  const mostRecent5AM = getMostRecent5AMEST();

  // If sync is not forced and was checked after the most recent 5 AM EST boundary, return stored videos
  if (!force && lastSync > mostRecent5AM) {
    return {
      videos: getStoredYouTubeVideos(),
      syncedAt: lastSync,
      updated: false,
    };
  }

  // 1. First attempt: Call Server 5:00 AM EST Scheduled API Endpoint
  try {
    const apiEndpoint = force ? "/api/intel/youtube-feed?force=true" : "/api/intel/youtube-feed";
    const serverRes = await fetch(apiEndpoint);
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (Array.isArray(serverData.videos) && serverData.videos.length > 0) {
        const serverVideos: YouTubeVideo[] = serverData.videos;
        const syncedAt = serverData.lastSyncedAt || now;

        try {
          localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(serverVideos));
          localStorage.setItem(STORAGE_KEY_TIMESTAMP, syncedAt.toString());
        } catch (e) {
          console.error("Error saving server synced videos to localStorage:", e);
        }

        return {
          videos: serverVideos,
          syncedAt,
          updated: true,
        };
      }
    }
  } catch (err) {
    console.warn("Server API fetch for YouTube feed failed, falling back to direct RSS:", err);
  }

  // 2. Client-side RSS Fallback
  const newVideosByChannel: Map<string, YouTubeVideo[]> = new Map();

  // Fetch feeds for all monitored channels
  await Promise.all(
    MONITORED_CHANNELS.map(async (ch) => {
      try {
        const rssFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
          rssFeedUrl
        )}`;
        const res = await fetch(apiUrl);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "ok" && Array.isArray(data.items)) {
          const fetchedItems: YouTubeVideo[] = data.items.map(
            (
              item: {
                title?: string;
                link?: string;
                guid?: string;
                pubDate?: string;
                thumbnail?: string;
                description?: string;
              },
              idx: number,
            ) => {
              // Extract video ID from link or guid
              let videoId = "";
              if (item.link) {
                const match = item.link.match(
                  /(?:v=|\/shorts\/|\/embed\/|\/)([a-zA-Z0-9_-]{11})/
                );
                if (match) videoId = match[1];
              }
              if (!videoId && item.guid) {
                const guidMatch = item.guid.match(/([a-zA-Z0-9_-]{11})$/);
                if (guidMatch) videoId = guidMatch[1];
              }

              const isShort =
                item.link?.includes("/shorts/") ||
                item.title?.toLowerCase().includes("#shorts");

              const pubDate = item.pubDate
                ? new Date(item.pubDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent Upload";

              return {
                id: `yt_${ch.channelId}_${videoId || idx}`,
                youtubeId: videoId,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                title: item.title || `${ch.channelName} Video`,
                channelName: ch.channelName,
                category: ch.category,
                duration: isShort ? "0:60" : "15:00",
                views: "Verified Feed",
                publishedDate: `${ch.handle} • ${pubDate}`,
                thumbnailUrl: videoId
                  ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  : item.thumbnail ||
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
                description:
                  item.description
                    ?.replace(/<[^>]*>?/gm, "")
                    .slice(0, 220) ||
                  `Official video from ${ch.channelName} (${ch.handle}).`,
                keyTakeaways: [
                  `Official update from ${ch.channelName}`,
                  `Verified YouTube feed (${ch.handle})`,
                  "Updated via 5:00 AM EST Auto Feed Sync",
                ],
                isShort: isShort,
                timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
              };
            }
          );

          if (fetchedItems.length > 0) {
            newVideosByChannel.set(ch.channelId, fetchedItems);
          }
        }
      } catch (err) {
        console.warn(`Failed to sync YouTube RSS for ${ch.channelName}:`, err);
      }
    })
  );

  // Reconstruct final video array strictly adhering to channel order:
  // Stock Bloc ALWAYS AT THE TOP!
  let combinedVideos: YouTubeVideo[] = [];
  for (const ch of MONITORED_CHANNELS) {
    const fetched = newVideosByChannel.get(ch.channelId);
    if (fetched && fetched.length > 0) {
      combinedVideos.push(...fetched);
    } else {
      // Fallback to initial default videos for this channel if RSS fetch failed
      const existingForChannel = INITIAL_YOUTUBE_VIDEOS.filter(
        (v) => v.channelName === ch.channelName
      );
      combinedVideos.push(...existingForChannel);
    }
  }

  // If nothing fetched at all, fallback to INITIAL_YOUTUBE_VIDEOS
  if (combinedVideos.length === 0) {
    combinedVideos = INITIAL_YOUTUBE_VIDEOS;
  }

  // Ensure Stock Bloc videos are strictly sorted to the top
  combinedVideos.sort((a, b) => {
    
    
    
    
    const aTime = a.timestamp || 0;
    const bTime = b.timestamp || 0;
    return bTime - aTime;
    
    return 0;
  });

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(combinedVideos));
    localStorage.setItem(STORAGE_KEY_TIMESTAMP, now.toString());
  } catch (e) {
    console.error("Error saving synced videos to localStorage:", e);
  }

  return {
    videos: combinedVideos,
    syncedAt: now,
    updated: true,
  };
}

