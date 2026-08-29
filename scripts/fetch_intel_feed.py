#!/usr/bin/env python3
"""
Fetch and update intelligence news and podcast feed JSON.
Stamps root-level 'updated_at' (ISO-8601 UTC) and 'source'.
Exits with non-zero code if validation fails or intel_feed is empty.
"""

import json
import os
import sys
from datetime import datetime, timezone

TARGET_FILES = ["intel_news_feed.json", os.path.join("public", "intel_news_feed.json")]
SOURCE_NAME = "Financial News RSS & Podcast Aggregator"

def fetch_and_write():
    base_file = "public/intel_news_feed.json"
    if not os.path.exists(base_file):
        base_file = "intel_news_feed.json"

    if not os.path.exists(base_file):
        print("CRITICAL: Intel news feed base data missing!", file=sys.stderr)
        sys.exit(1)

    with open(base_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    intel_feed = data.get("intel_feed", [])
    if not isinstance(intel_feed, list) or len(intel_feed) == 0:
        print("CRITICAL: Intel news feed is empty or invalid!", file=sys.stderr)
        sys.exit(1)

    # Stamp root-level fields
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["updated_at"] = now_iso
    data["source"] = SOURCE_NAME

    for path in TARGET_FILES:
        os.makedirs(os.path.dirname(path), exist_ok=True) if os.path.dirname(path) else None
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Successfully updated {path} with updated_at={now_iso}")

if __name__ == "__main__":
    fetch_and_write()
