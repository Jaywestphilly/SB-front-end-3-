import re

with open("src/components/YouTubeHub.tsx", "r") as f:
    text = f.read()

text = text.replace('import { appendUTM }', 'import { appendUTM }\nimport { trackEvent } from "../utils/analytics";')

# find setActiveVideo(video) or short
text = text.replace('onClick={() => setActiveVideo(short)}', 'onClick={() => { trackEvent("video_watched", { videoId: short.youtubeId }); setActiveVideo(short); }}')
text = text.replace('onClick={() => setActiveVideo(video)}', 'onClick={() => { trackEvent("video_watched", { videoId: video.youtubeId }); setActiveVideo(video); }}')

with open("src/components/YouTubeHub.tsx", "w") as f:
    f.write(text)

