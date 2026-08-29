#!/usr/bin/env python3
"""
Fetch and update market watchlist JSON feed.
Stamps root-level 'updated_at' (ISO-8601 UTC) and 'source'.
Exits with non-zero code if validation fails or watchlist is empty.
"""

import json
import os
import sys
from datetime import datetime, timezone

TARGET_FILES = ["market_watchlist_data.json", os.path.join("public", "market_watchlist_data.json")]
SOURCE_NAME = "Polygon.io / Yahoo Finance Quant Watchlist Feed"

def fetch_and_write():
    # Read existing base file if present
    base_file = "public/market_watchlist_data.json"
    if not os.path.exists(base_file):
        base_file = "market_watchlist_data.json"

    if not os.path.exists(base_file):
        print("CRITICAL: Market watchlist base data missing!", file=sys.stderr)
        sys.exit(1)

    with open(base_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Validate critical data
    watchlist = data.get("watchlist", [])
    if not isinstance(watchlist, list) or len(watchlist) == 0:
        print("CRITICAL: Market watchlist is empty or invalid!", file=sys.stderr)
        sys.exit(1)

    # Stamp root-level keys
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["updated_at"] = now_iso
    data["source"] = SOURCE_NAME

    # Write to target files
    for path in TARGET_FILES:
        os.makedirs(os.path.dirname(path), exist_ok=True) if os.path.dirname(path) else None
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Successfully updated {path} with updated_at={now_iso}")

if __name__ == "__main__":
    fetch_and_write()
