import re

with open('src/components/PodcastNewsFeed.tsx', 'r') as f:
    content = f.read()

content = content.replace("Read Source", "Watch Video")
content = content.replace("Curated briefs sorted strictly by subject matter: energy grid", "Curated video intelligence briefs sorted strictly by subject matter: energy grid")
content = content.replace("PodcastNewsArticle", "PodcastNewsArticle") # wait, type is still PodcastNewsArticle

with open('src/components/PodcastNewsFeed.tsx', 'w') as f:
    f.write(content)
