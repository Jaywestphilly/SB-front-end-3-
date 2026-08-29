import urllib.request
import json

cids = [
    ("Stock Bloc", "UCwNl7IKcxlC3fuA38VFReOw"),
    ("All-In Podcast", "UCESLZhusAkFfsNsApnjF_Cg"),
    ("Peter Diamandis", "UCvxm0qTrGN_1LMYgUaftWyQ"),
    ("Limitless", "UCCRxYlYOmLE2l5wxs3ckJtg"),
    ("Alexander Wissner-Gross", "UCvjvMqS2tiyIZJm0AqwXvcw")
]

for name, cid in cids:
    url = f"https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fchannel_id%3D{cid}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=10)
        data = json.loads(res.read().decode('utf-8'))
        status = data.get('status')
        items = data.get('items', [])
        print(f"{name} ({cid}): status={status}, items_count={len(items)}")
        if items:
            print(f"   First video: [{items[0].get('guid', '').split(':')[-1]}] {items[0].get('title')}")
            print(f"   Link: {items[0].get('link')}")
    except Exception as e:
        print(f"Error {name}: {e}")

