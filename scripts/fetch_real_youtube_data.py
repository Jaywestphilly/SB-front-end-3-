import urllib.request
import json
import re
import xml.etree.ElementTree as ET

channel_urls = {
    "Stock Bloc": "https://youtube.com/@stockbloc?si=t-CCfX4j7tR38aql",
    "All-In Podcast": "https://youtube.com/@allin?si=4Z1e-FNrDG0NZ6Im",
    "Peter Diamandis": "https://youtube.com/@peterdiamandis?si=etM73y7vYi09YXJf",
    "Limitless": "https://youtube.com/@limitless-fm?si=_vWy5BQxMM_2cplD",
    "Alexander Wissner-Gross": "https://youtube.com/@alexwg?si=PqS4_tRfz52Z1mgn"
}

results = {}

for name, url in channel_urls.items():
    print(f"Fetching for {name} ({url})...")
    # Clean handle from URL
    handle = url.split("youtube.com/")[1].split("?")[0] # e.g. @allin
    # Get HTML via youtube direct or invidious or rss
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    }
    try:
        req = urllib.request.Request(f"https://www.youtube.com/{handle}", headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        
        # Extract channel_id
        channel_ids = re.findall(r'channel_id=([a-zA-Z0-9_-]+)', html)
        if not channel_ids:
            channel_ids = re.findall(r'"channelId":"([a-zA-Z0-9_-]+)"', html)
            
        cid = channel_ids[0] if channel_ids else None
        
        # Extract video IDs from page
        video_ids = list(dict.fromkeys(re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)))
        
        print(f"Name: {name} | Channel ID: {cid} | Found {len(video_ids)} video IDs: {video_ids[:5]}")
        
        # Fetch RSS feed if CID found
        videos_data = []
        if cid:
            rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}"
            try:
                rss_req = urllib.request.Request(rss_url, headers=headers)
                rss_xml = urllib.request.urlopen(rss_req, timeout=10).read().decode('utf-8', errors='ignore')
                root = ET.fromstring(rss_xml)
                ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015', 'media': 'http://search.yahoo.com/mrss/'}
                for entry in root.findall('atom:entry', ns):
                    v_id = entry.find('yt:videoId', ns).text
                    title = entry.find('atom:title', ns).text
                    published = entry.find('atom:published', ns).text
                    link = entry.find('atom:link', ns).attrib['href']
                    media = entry.find('media:group', ns)
                    desc = media.find('media:description', ns).text if media is not None and media.find('media:description', ns) is not None else ""
                    thumb = f"https://img.youtube.com/vi/{v_id}/hqdefault.jpg"
                    videos_data.append({
                        "youtubeId": v_id,
                        "title": title,
                        "published": published,
                        "videoUrl": f"https://www.youtube.com/watch?v={v_id}",
                        "thumbnailUrl": thumb,
                        "description": desc[:200] if desc else ""
                    })
            except Exception as e:
                print(f"  RSS error for {name}: {e}")
                
        results[name] = {
            "channelUrl": f"https://www.youtube.com/{handle}",
            "channelId": cid,
            "handle": handle,
            "videos": videos_data if videos_data else [{"youtubeId": vid, "title": f"{name} Video", "videoUrl": f"https://www.youtube.com/watch?v={vid}", "thumbnailUrl": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg", "description": ""} for vid in video_ids[:5]]
        }
    except Exception as e:
        print(f"Error fetching {name}: {e}")

print("FINAL RESULTS SUMMARY:")
print(json.dumps(results, indent=2))

with open('yt_scraped_results.json', 'w') as f:
    json.dump(results, f, indent=2)

