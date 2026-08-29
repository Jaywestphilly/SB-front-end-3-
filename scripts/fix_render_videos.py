import re

with open('src/components/NewsHub.tsx', 'r') as f:
    content = f.read()

old_render = """          filteredStream.map((item) => {
            // RENDER YOUTUBE VIDEO ITEM
            if (item.itemCategory === "youtube") {"""

new_render = """          filteredStream.map((item) => {
            // RENDER YOUTUBE VIDEO ITEM
            if (item.itemCategory === "youtube" || item.itemCategory === "news_video") {
              const video = item as YouTubeVideo;
              const isNews = item.itemCategory === "news_video";
              const borderColor = isNews ? "border-cyan-500/30 hover:border-cyan-500/60" : "border-rose-500/30 hover:border-rose-500/60";
              const iconColor = isNews ? "text-cyan-400" : "text-rose-500";
              const labelText = isNews ? video.channelName : "Stock Bloc Official Video";
              const shadowColor = isNews ? "shadow-[0_0_20px_rgba(6,182,212,0.08)]" : "shadow-[0_0_20px_rgba(244,63,94,0.08)]";

              return (
                <article
                  key={video.id}
                  className={`bg-[#0b0306]/90 border ${borderColor} rounded-2xl p-4 sm:p-5 transition-all space-y-3 relative overflow-hidden group ${shadowColor}`}
                >
                  <div className={`flex items-center justify-between gap-2 border-b ${isNews ? "border-cyan-500/20" : "border-rose-500/20"} pb-2`}>
                    <div className="flex items-center gap-2">
                      <Youtube className={`w-5 h-5 ${iconColor}`} />
                      <span className="text-white font-bold text-xs uppercase tracking-wider">
                        {labelText}
                      </span>
                      {video.isShort && (
                        <span className={`px-2 py-0.5 bg-neutral-800 text-neutral-300 border border-neutral-700 text-[9px] font-black rounded uppercase`}>
                          Short
                        </span>
                      )}
                      {isNews && (
                        <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-500/50 text-[9px] font-black rounded uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                          Live News
                        </span>
                      )}
                    </div>
                    <span className="text-neutral-500 text-[10px] whitespace-nowrap">
                      {video.publishedDate}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pt-2">
                    {/* Thumbnail */}
                    <div 
                      className="w-full sm:w-64 h-36 sm:h-auto rounded-lg overflow-hidden relative cursor-pointer group-hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all flex-shrink-0"
                      onClick={() => {
                        triggerHaptic("success");
                        setActiveVideoModal(video);
                      }}
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-300" />
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-[10px] font-black">
                        {video.duration}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`w-12 h-12 rounded-full ${isNews ? "bg-cyan-500/90" : "bg-rose-500/90"} flex items-center justify-center shadow-lg backdrop-blur-md`}>
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {getItemTags(item).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {getItemTags(item).map((tag) => (
                              <span
                                key={tag}
                                className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                                  isNews ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400" : "bg-neutral-900 border-neutral-800 text-neutral-400"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className={`text-base font-bold text-white mb-2 leading-tight ${isNews ? "group-hover:text-cyan-400" : "group-hover:text-rose-400"} transition-colors`}>
                          {video.title}
                        </h3>
                        <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3">
                          {video.description}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {video.keyTakeaways &&
                          video.keyTakeaways.map((takeaway, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 ${isNews ? "bg-cyan-950/20 text-cyan-300 border-cyan-500/20" : "bg-rose-950/20 text-rose-300 border-rose-500/20"} border text-[10px] font-bold rounded`}
                            >
                              {takeaway}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
"""

# I need to match everything up to the closing `}` of the old `if (item.itemCategory === "youtube") { ... }`.
# But wait, python replace on such a large block is risky if my old_string doesn't match perfectly.
