import React, { useState, useEffect } from "react";
import { YouTubeVideo } from "../../types";
import {
  FEATURED_YOUTUBE_CHANNEL,
  INITIAL_YOUTUBE_VIDEOS,
} from "../../data/youtube";
import {
  syncYouTubeFeeds,
  getStoredYouTubeVideos,
  getLastSyncTimestamp,
  formatTimeSinceSync,
} from "../../utils/youtubeSync";
import {
  Play,
  Youtube,
  ExternalLink,
  Share2,
  Sparkles,
  X,
  Check,
  Eye,
  Clock,
  Tv,
  Film,
  Link as LinkIcon,
  RefreshCw,
  Info,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { appendUTM } from "../../utils/utm";
import { trackEvent } from "../../utils/analytics";

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const shortsMatch = trimmed.match(
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  );
  if (shortsMatch) return shortsMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortLinkMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortLinkMatch) return shortLinkMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

export const YouTubeHub: React.FC = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>(() => getStoredYouTubeVideos());
  const [selectedCategory, setSelectedCategory] = useState<string>("LATEST");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [selectedCategory]);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => getLastSyncTimestamp());

  // Auto-sync feeds on mount if > 24 hours
  useEffect(() => {
    let mounted = true;

    const runSync = async (force: boolean = false) => {
      setIsSyncing(true);
      try {
        const result = await syncYouTubeFeeds(force);
        if (mounted && result.videos && result.videos.length > 0) {
          setVideos(result.videos);
          setLastSyncTime(result.syncedAt);
        }
      } catch (err) {
        console.error("Failed to sync YouTube RSS feeds:", err);
      } finally {
        if (mounted) setIsSyncing(false);
      }
    };

    runSync(false);

    return () => {
      mounted = false;
    };
  }, []);

  const handleManualRefresh = () => {
    triggerHaptic("refresh");
    setIsSyncing(true);
    syncYouTubeFeeds(true).then((res) => {
      if (res.videos) {
        setVideos(res.videos);
        setLastSyncTime(res.syncedAt);
      }
      setIsSyncing(false);
    });
  };

  const categories = [
    "LATEST",
    "13F BREAKDOWNS",
    "CREDIT STRATEGY",
    "REAL ESTATE",
    "MARKET ANALYSIS",
  ];

  const filteredVideos =
    selectedCategory === "LATEST"
      ? videos
      : videos.filter((v) => {
          if (selectedCategory === "MARKET ANALYSIS" && v.category === "Stock Market") return true;
          return v.category.toUpperCase() === selectedCategory;
        });

  const realLifeShorts = videos.filter(
    (v) => v.category === "Real Life Shorts" || v.isShort,
  );

  const handleShareVideo = (video: YouTubeVideo) => {
    triggerHaptic("selection");
    const url =
      video.videoUrl || `https://youtube.com/shorts/${video.youtubeId}`;
    navigator.clipboard.writeText(
      `Watch "${video.title}" on Stock Bloc YouTube:\n${url}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 space-y-6 max-w-[1400px] mx-auto text-white font-mono">
      {/* Featured Channel Banner */}
      <div className="relative rounded-3xl bg-neutral-900 border border-white/15 overflow-hidden shadow-2xl">
        {/* Banner image background */}
        <div className="h-32 w-full relative">
          <img
            src={FEATURED_YOUTUBE_CHANNEL.bannerUrl}
            alt="YouTube Banner"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Channel Details Overlay */}
        <div className="p-6 pt-0 relative z-10 -mt-10 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-20 h-20 rounded-2xl border-2 border-red-500 overflow-hidden shadow-2xl shrink-0 bg-black">
                <img
                  src={FEATURED_YOUTUBE_CHANNEL.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-xl font-black tracking-wider text-white uppercase flex items-center gap-2">
                  {FEATURED_YOUTUBE_CHANNEL.channelName}
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </h2>
                <p className="text-xs text-neutral-400 font-mono">
                  {FEATURED_YOUTUBE_CHANNEL.handle} •{" "}
                  {FEATURED_YOUTUBE_CHANNEL.subscribers} Subscribers
                </p>
              </div>
            </div>

            {/* Subscribe CTA Button */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={FEATURED_YOUTUBE_CHANNEL.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-600/30 shrink-0"
              >
                <Youtube className="w-4 h-4 text-white" />
                <span>@StockBloc Channel</span>
              </a>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            {FEATURED_YOUTUBE_CHANNEL.description}
          </p>

          {/* Stats Badges & 24-Hour Sync Bar */}
          <div className="flex flex-col gap-3 pt-3 border-t border-white/10 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                <Tv className="w-3.5 h-3.5 text-red-500" />
                <span>5 Monitored YouTube Channels</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>24H Feed Sync: {formatTimeSinceSync(lastSyncTime)}</span>
                </span>

                <button
                  onClick={handleManualRefresh}
                  disabled={isSyncing}
                  title="Force refresh feeds now"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-red-400" : ""}`} />
                </button>
              </div>
            </div>
            <div className="text-[11px] text-neutral-300 bg-black/60 p-3.5 rounded-2xl border border-emerald-500/30 flex flex-col gap-2 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wide text-[10px]">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated 5:00 AM EST Server & Service Worker Sync Active</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Daily 5 AM Task Running
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-white">Daily 5:00 AM EST Background Task:</strong> The Express server automatically executes a scheduled task every morning at 5:00 AM EST to fetch the latest video metadata across all monitored YouTube channels.
                </li>
                <li>
                  <strong className="text-white">Service Worker PWA Caching:</strong> The background Service Worker (`public/sw.js`) manages offline availability and background syncing, caching the fresh 5:00 AM EST updates instantly.
                </li>
                <li>
                  <strong className="text-white">YouTube RSS Indexing Note:</strong> Public YouTube RSS feeds index new video releases within 1–6 hours of upload.
                </li>
                <li>
                  <strong className="text-white">Manual Refresh:</strong> Click the <RefreshCw className="w-3 h-3 inline text-cyan-400 mx-0.5" /> <strong>Refresh Feeds</strong> button above at any time to query the server and YouTube RSS feed directly.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Featured Real Life Video Shorts Carousel / Section */}
      {realLifeShorts.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-red-950/60 via-neutral-900 to-amber-950/40 border border-red-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-red-400 animate-bounce" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Featured Stock Bloc Real Life YouTube Shorts
              </h3>
            </div>
            <a
              href="https://youtube.com/@stockbloc/shorts?si=Vw68ofdfkScz1CyD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-extrabold uppercase bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full border border-red-500/30 flex items-center gap-1 hover:bg-red-500/30"
            >
              <span>View @StockBloc Shorts</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {realLifeShorts.map((short) => (
              <div
                key={short.id}
                onClick={() => { trackEvent("video_watched", { videoId: short.youtubeId }); setActiveVideo(short); }}
                className="group relative rounded-2xl bg-neutral-950 border border-red-500/20 p-3 space-y-2.5 cursor-pointer hover:border-red-500/60 transition-all hover:scale-[1.01]"
              >
                <div className="relative aspect-[9/16] max-h-64 w-full rounded-xl overflow-hidden bg-black mx-auto">
                  <img
                    src={short.thumbnailUrl}
                    alt={short.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    SHORT
                  </span>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-mono px-2 py-0.5 rounded-md">
                    {short.duration}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {short.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mt-1">
                    <span>{short.channelName}</span>
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" /> Watch Short
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Top Intel Spotlight (Videos 1 & 2) */}
      {videos.length >= 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Primary Intel Focus: Top Releases #1 & #2</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              High Priority Media
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[videos[0], videos[1]].map((video, idx) => (
              <div
                key={`spotlight_${video.id}_${idx}`}
                className={`relative rounded-3xl p-4 space-y-3 transition-all group border shadow-2xl ${
                  idx === 0
                    ? "bg-gradient-to-b from-red-950/80 via-neutral-900 to-black border-red-500/50 hover:border-red-400 shadow-red-950/50"
                    : "bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border-amber-500/40 hover:border-amber-400 shadow-amber-950/40"
                }`}
              >
                {/* Spotlight Badge Header */}
                <div className="flex items-center justify-between text-[10px] font-black uppercase">
                  <span
                    className={`px-3 py-1 rounded-full flex items-center gap-1.5 border shadow-sm ${
                      idx === 0
                        ? "bg-red-600 text-white border-red-400 animate-pulse"
                        : "bg-amber-500 text-black border-amber-300 font-bold"
                    }`}
                  >
                    <span>{idx === 0 ? "🔥 TOP INTEL #1" : "⚡ TOP INTEL #2"}</span>
                  </span>
                  <span className="text-neutral-400 font-mono text-[9px]">{video.publishedDate}</span>
                </div>

                {/* Video Thumbnail */}
                <div
                  onClick={() => { trackEvent("video_watched", { videoId: video.youtubeId }); setActiveVideo(video); }}
                  className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black cursor-pointer group-hover:scale-[1.01] transition-transform shadow-lg border border-white/10"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform border border-white/20">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white border border-white/10">
                    {video.duration}
                  </span>
                </div>

                {/* Video Info */}
                <div className="space-y-1.5">
                  <h4
                    onClick={() => { trackEvent("video_watched", { videoId: video.youtubeId }); setActiveVideo(video); }}
                    className="font-black text-sm text-white leading-snug cursor-pointer group-hover:text-red-400 transition-colors line-clamp-2"
                  >
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed font-sans">
                    {video.description || `Official video release from ${video.channelName}.`}
                  </p>
                </div>

                {/* Quick Action Bar */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] gap-2">
                  <button
                    onClick={() => { trackEvent("video_watched", { videoId: video.youtubeId }); setActiveVideo(video); }}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs shadow-lg shadow-red-600/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Video #{idx + 1}</span>
                  </button>
                  <a
                    href={appendUTM(
                      video.videoUrl || `https://www.youtube.com/watch?v=${video.youtubeId}`,
                      `youtube_spotlight_${video.youtubeId}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                    title="Open on YouTube"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlist Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Stock Bloc Channel Video Feed
          </h3>
          <span className="text-xs text-neutral-400">
            {filteredVideos.length} Videos
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Cards Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.map((video, idx) => (
          <div
            key={video.id}
            className={`group p-4 rounded-3xl bg-neutral-900/90 border space-y-3 hover:border-red-500/40 transition-all relative ${
              idx === 0
                ? "border-red-500/40 bg-gradient-to-b from-red-950/20 to-neutral-900"
                : idx === 1
                ? "border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-neutral-900"
                : "border-white/10"
            }`}
          >
            {/* Rank badge header for top videos */}
            {idx < 2 && selectedCategory === "LATEST" && (
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase pb-1 border-b border-white/5">
                <span className={idx === 0 ? "text-red-400 flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
                  <Sparkles className="w-3 h-3" />
                  <span>{idx === 0 ? "Video #1: Primary Intel Release" : "Video #2: Featured Intel Release"}</span>
                </span>
                <span className="text-neutral-500">Rank #{idx + 1}</span>
              </div>
            )}

            {/* Video Thumbnail with Play Button Overlay */}
            <div
              onClick={() => { trackEvent("video_watched", { videoId: video.youtubeId }); setActiveVideo(video); }}
              className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black cursor-pointer group-hover:scale-[1.01] transition-transform"
            >
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current ml-1" />
                </div>
              </div>

              {/* Duration Pill */}
              <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-white flex items-center gap-1 border border-white/10">
                <Clock className="w-3 h-3 text-red-400" />
                {video.duration}
              </span>

              {/* Category Badge */}
              <span className="absolute top-3 left-3 bg-red-600/90 text-white font-extrabold uppercase text-[9px] px-2.5 py-1 rounded-full shadow-md">
                {video.category}
              </span>
            </div>

            {/* Video Info */}
            <div className="space-y-2">
              <h4
                onClick={() => { trackEvent("video_watched", { videoId: video.youtubeId }); setActiveVideo(video); }}
                className="font-extrabold text-base text-white leading-snug cursor-pointer hover:text-red-400 transition-colors"
              >
                {video.title}
              </h4>

              <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                <span className="text-red-400 font-semibold">
                  {video.channelName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {video.views}
                </span>
                <span>•</span>
                <span>{video.publishedDate}</span>
              </div>

              <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                {video.description}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { trackEvent("video_watched", { videoId: video.youtubeId }); setActiveVideo(video); }}
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 font-bold flex items-center gap-1 active:scale-95 cursor-pointer text-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-red-400" />
                    <span>Play in App</span>
                  </button>

                  <a
                    href={appendUTM(
                      video.videoUrl ||
                        `https://www.youtube.com/watch?v=${video.youtubeId}`,
                      `youtube_card_${video.youtubeId}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black flex items-center gap-1 active:scale-95 transition-all text-xs shadow-md shadow-red-600/20"
                  >
                    <span>WATCH ON YOUTUBE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <button
                  onClick={() => handleShareVideo(video)}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VIDEO PLAYER MODAL WITH REAL IFRAME EMBEDDING */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="w-full max-w-2xl bg-neutral-950 border border-white/15 rounded-3xl p-6 shadow-2xl relative text-white space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player Header */}
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Stock Bloc Official Channel (@StockBloc) •{" "}
                {activeVideo.category}
              </span>
            </div>

            {/* Real Interactive YouTube iFrame Video Player */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl ${
                activeVideo.isShort
                  ? "aspect-[9/16] max-h-[480px] mx-auto"
                  : "aspect-video"
              }`}
            >
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-white leading-tight">
                {activeVideo.title}
              </h3>

              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono border-b border-white/10 pb-3">
                <span>{activeVideo.channelName} (@StockBloc)</span>
                <span>
                  {activeVideo.views} • {activeVideo.publishedDate}
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {activeVideo.description}
              </p>

              {/* Key Takeaways */}
              {activeVideo.keyTakeaways &&
                activeVideo.keyTakeaways.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                      Key Takeaways in this Lesson
                    </span>
                    <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
                      {activeVideo.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={
                    activeVideo.videoUrl ||
                    `https://youtube.com/shorts/${activeVideo.youtubeId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-600/30"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open on YouTube App</span>
                </a>

                <button
                  onClick={() => handleShareVideo(activeVideo)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span>{copied ? "Copied Link" : "Share"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
