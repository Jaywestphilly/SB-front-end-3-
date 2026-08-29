const fs = require('fs');
const file = 'src/components/NewsHub.tsx';
let data = fs.readFileSync(file, 'utf8');

const stateBlock = `
  const [activeTab, setActiveTab] = useState<"ALL" | "YOUTUBE" | "NEWS_VIDEOS">("ALL");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideoModal, setActiveVideoModal] = useState<YouTubeVideo | null>(null);
  const [feedVideos, setFeedVideos] = useState<YouTubeVideo[]>(() => getStoredYouTubeVideos());
  const [intelFeed, setIntelFeed] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Jaywestphilly/stock-bloc-backend/main/intel_news_feed.json")
      .then(res => res.json())
      .then(data => {
        if (data.intel_feed) {
          const feed = data.intel_feed;
          const stockBloc = feed.filter((v: any) => v.channel_name === "The Stock Bloc (Official)");
          const drAlex = feed.filter((v: any) => v.channel_name === "Dr. Alexander Wissner-Gross (@alexwg)");
          const others = feed.filter((v: any) => v.channel_name !== "The Stock Bloc (Official)" && v.channel_name !== "Dr. Alexander Wissner-Gross (@alexwg)");
          setIntelFeed([...stockBloc, ...drAlex, ...others]);
        }
      })
      .catch(console.error);
  }, []);
`;

data = data.replace(/const \[activeTab, setActiveTab\] = useState[^;]+;\n\s*const \[selectedSector, setSelectedSector\] = useState[^;]+;\n\s*const \[searchQuery, setSearchQuery\] = useState[^;]+;\n\s*const \[activeVideoModal, setActiveVideoModal\] = useState[^;]+;\n\s*const \[feedVideos, setFeedVideos\] = useState[^;]+;/, stateBlock.trim());

const renderBlock = `
      {/* FEED STREAM CONTAINER */}
      <div className="space-y-4">
        {/* Render Live Intel Feed */}
        {intelFeed.map((video, idx) => {
          const isNews = video.channel_name !== "The Stock Bloc (Official)";
          const borderColor = isNews ? "border-cyan-500/30" : "border-rose-500/30";
          const bgColor = isNews ? "bg-[#050b14]/90" : "bg-[#0b0306]/90";
          const iconColor = isNews ? "text-cyan-400" : "text-rose-500";
          const shadowColor = isNews ? "shadow-[0_0_20px_rgba(6,182,212,0.08)]" : "shadow-[0_0_20px_rgba(244,63,94,0.08)]";

          return (
            <article
              key={video.video_id || idx}
              className={\`\${bgColor} border \${borderColor} rounded-2xl p-4 sm:p-5 transition-all space-y-3 relative overflow-hidden \${shadowColor}\`}
            >
              <div className={\`flex items-center justify-between gap-2 border-b \${isNews ? "border-cyan-500/20" : "border-rose-500/20"} pb-2\`}>
                <div className="flex items-center gap-2">
                  <Youtube className={\`w-5 h-5 \${iconColor}\`} />
                  <span className="text-white font-bold text-xs uppercase tracking-wider">
                    {video.channel_name}
                  </span>
                </div>
                <span className="text-neutral-500 text-[10px] font-bold">
                  {video.published}
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl">
                  <iframe
                    src={video.embed_url}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full absolute inset-0 border-0"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={video.watch_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        
        {/* Render the stream of items */}
`;

data = data.replace(/\{\/\* FEED STREAM CONTAINER \*\/\}\s*<div className="space-y-4">\s*\{\/\* Render the stream of items \*\/\}/, renderBlock);

fs.writeFileSync(file, data);
console.log('patched');
