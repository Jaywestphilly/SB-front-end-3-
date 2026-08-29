import React, { useState, useEffect } from "react";
import { GraduationCap, ExternalLink, PlayCircle, BookOpen, Share2, Check, Sparkles } from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { FALLBACK_UNIVERSITY_COURSES } from "../../data/mitCoursesData";

export const MitCoursesHub: React.FC = () => {
  const [courses, setCourses] = useState<any[]>(FALLBACK_UNIVERSITY_COURSES);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isCopied, setIsCopied] = useState(false);

  const categories = ["All", "Computer Science & AI", "Finance & Economics", "Mathematics & Physics"];

  const handleShare = () => {
    triggerHaptic("selection");
    const shareUrl = `${window.location.origin}/education`;
    if (navigator.share) {
      navigator.share({
        title: "Stock Bloc | MIT & University OpenCourseWare",
        text: "Access free official university lectures & playlists from MIT, Yale, and Stanford.",
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetch("/api/education/youtube-courses")
      .then((res) => {
        if (!res.ok) throw new Error("Status: " + res.status);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        // Soft fallback to client curated catalog if endpoint fails
        setIsLoading(false);
      });
  }, []);

  const filteredCourses = selectedCategory === "All"
    ? courses
    : courses.filter((c) => c.category === selectedCategory || (selectedCategory === "Computer Science & AI" && c.snippet?.title?.toLowerCase().includes("computer")) || (selectedCategory === "Finance & Economics" && (c.snippet?.title?.toLowerCase().includes("finance") || c.snippet?.title?.toLowerCase().includes("econ"))));

  return (
    <div className="p-4 sm:p-6 space-y-8 font-mono text-cyan-100 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/30 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-400" />
            <span>MIT OpenCourseWare & University Matrix</span>
          </h1>
          <p className="text-sm text-cyan-400/80 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            Verified Curated Playlists & Lectures from MIT, Yale, & Stanford
          </p>
        </div>

        <button
          onClick={handleShare}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 hover:border-purple-400 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer self-start sm:self-auto shadow-lg shadow-purple-950/30"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-purple-400" />
              <span>Share Education Hub</span>
            </>
          )}
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              triggerHaptic("selection");
              setSelectedCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-all shrink-0 ${
              selectedCategory === cat
                ? "bg-purple-500 text-black shadow-lg shadow-purple-500/30"
                : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-sm font-bold text-purple-300 animate-pulse">Syncing university course catalog...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-8 text-center bg-neutral-900 border border-white/10 rounded-2xl">
          <p className="text-neutral-400">No courses matching selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((playlist: any) => {
            const snippet = playlist.snippet;
            const thumbnailUrl = snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url;
            const itemUrl = typeof playlist.id === "string" && playlist.id.startsWith("PL")
              ? `https://www.youtube.com/playlist?list=${playlist.id}`
              : playlist.id
              ? `https://www.youtube.com/watch?v=${playlist.id}`
              : "https://www.youtube.com/@mitocw";

            return (
              <a
                key={playlist.id || snippet?.title}
                href={itemUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic("selection")}
                className="bg-black/80 border border-purple-500/30 hover:border-purple-400/80 rounded-2xl overflow-hidden flex flex-col group transition-all"
              >
                {thumbnailUrl && (
                  <div className="relative aspect-video bg-neutral-900 overflow-hidden border-b border-purple-500/30">
                    <img 
                      src={thumbnailUrl} 
                      alt={snippet.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-full border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{playlist.videoCount || "Official Playlist"}</span>
                    </div>
                    <div className="absolute bottom-3 right-3 p-2 bg-purple-500/90 text-black rounded-full shadow-lg shadow-purple-500/50 backdrop-blur-md">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-black text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                    {snippet.title}
                  </h3>
                  <p className="text-xs text-cyan-200/60 font-sans line-clamp-3 mb-4 flex-1">
                    {snippet.description || "Official university lecture series."}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest bg-purple-950 px-2 py-1 rounded border border-purple-500/20">
                      {snippet.channelTitle || "MIT OpenCourseWare"}
                    </span>
                    <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

