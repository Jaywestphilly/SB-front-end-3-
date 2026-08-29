import urllib.request
import json
import xml.etree.ElementTree as ET

channels = [
    ("Stock Bloc", "https://www.youtube.com/feeds/videos.xml?user=stockbloc"),
    ("All-In", "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fchannel_id%3DUCESpCpt-mU_TfbAeB42iU3Q"), # All-In Channel UC...
    ("Peter Diamandis", "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fuser%3Dpeterdiamandis"),
]

# Let's test fetching YouTube channel RSS feeds using handles or rss2json
handles = ["@stockbloc", "@allin", "@peterdiamandis", "@limitless-fm", "@alexwg"]

for h in handles:
    url = f"https://api.allorigins.win/get?url={urllib.parse.quote('https://www.youtube.com/' + h)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=10)
        data = json.loads(res.read().decode('utf-8'))
        html = data.get('contents', '')
        # find channel_id or canonical url or video links
        import re
        channel_ids = re.findall(r'channel_id=([a-zA-Z0-9_-]+)', html)
        canonical = re.findall(r'<link rel="canonical" href="([^"]+)"', html)
        video_ids = re.findall(r'/watch\?v=([a-zA-Z0-9_-]{11})', html)
        print(f"Handle {h}: channel_ids={set(channel_ids[:3])}, videos={list(set(video_ids))[:5]}")
    except Exception as e:
        print(f"Error for {h}: {e}")

