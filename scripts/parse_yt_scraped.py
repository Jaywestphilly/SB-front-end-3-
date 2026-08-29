import json

with open('yt_scraped_results.json') as f:
    data = json.load(f)

for name, ch in data.items():
    print(f"=== {name} ({ch['handle']}) ===")
    print(f"Channel ID: {ch['channelId']}")
    print(f"Channel URL: {ch['channelUrl']}")
    print("Videos:")
    for v in ch['videos'][:3]:
        print(f"  - [{v['youtubeId']}] {v['title']}")
        print(f"    URL: {v['videoUrl']}")
    print()
