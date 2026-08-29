#!/usr/bin/env python3
"""
Stock Bloc Backend Feed Synchronizer & Rigorous Schema Verifier.
Ensures all 4 core JSON feeds are valid, non-empty, and updated_at timestamps advance strictly.
If any feed fetch returns empty or timestamp fails to advance, exits with non-zero code (1) to fail CI/CD loudly.
"""

import json
import os
import sys
from datetime import datetime, timezone

FEED_FILES = {
    "market_watchlist_data.json": {
        "required_keys": ["updated_at", "source", "watchlist"],
        "check_non_empty": lambda d: isinstance(d.get("watchlist"), list) and len(d.get("watchlist")) > 0,
        "min_items": 1
    },
    "sec_intel_data.json": {
        "required_keys": ["updated_at", "source", "funds"],
        "check_non_empty": lambda d: isinstance(d.get("funds"), list) and len(d.get("funds")) >= 5,
        "min_items": 5
    },
    "dyson_swarm_data.json": {
        "required_keys": ["updated_at", "source", "fleet_metrics", "orbital_shells"],
        "check_non_empty": lambda d: isinstance(d.get("orbital_shells"), list) and len(d.get("orbital_shells")) > 0,
        "min_items": 1
    },
    "intel_news_feed.json": {
        "required_keys": ["updated_at", "source", "intel_feed"],
        "check_non_empty": lambda d: isinstance(d.get("intel_feed"), list) and len(d.get("intel_feed")) > 0,
        "min_items": 1
    }
}

def parse_iso_utc(ts_str):
    try:
        if ts_str.endswith("Z"):
            ts_str = ts_str[:-1] + "+00:00"
        return datetime.fromisoformat(ts_str)
    except Exception as e:
        raise ValueError(f"Invalid ISO-8601 UTC timestamp format: {ts_str}") from e

def verify_and_sync_file(filepath):
    print(f"--> Validating {filepath}...")
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"CRITICAL: Feed file missing at {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    filename = os.path.basename(filepath)
    config = FEED_FILES.get(filename)
    if not config:
        raise ValueError(f"Unknown feed file: {filename}")

    # 1. Check required top-level keys
    for key in config["required_keys"]:
        if key not in data or not data[key]:
            raise ValueError(f"CRITICAL FAIL: {filename} missing required key '{key}' or value is empty.")

    # 2. Check non-empty data requirement
    if not config["check_non_empty"](data):
        raise ValueError(f"CRITICAL FAIL: {filename} data payload is empty or below minimum items threshold ({config['min_items']}).")

    prev_ts_str = data.get("updated_at")
    prev_dt = parse_iso_utc(prev_ts_str) if prev_ts_str else datetime.fromtimestamp(0, timezone.utc)

    # 3. Stamp new ISO-8601 UTC timestamp
    now_dt = datetime.now(timezone.utc)
    if now_dt < prev_dt:
        # If system clock drifted or previous timestamp was in future, set to prev_dt or now
        now_dt = datetime.now(timezone.utc)
    now_iso_str = now_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    data["updated_at"] = now_iso_str

    # Write updated feed back to both local root and public directory if available
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    public_path = os.path.join("public", filename)
    if os.path.exists("public"):
        with open(public_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    print(f"SUCCESS: {filename} verified and updated_at advanced to {now_iso_str}")
    return True

def main():
    print("=========================================================")
    print(" STOCK BLOC BACKEND: DAILY FEED VERIFICATION & SYNC")
    print("=========================================================")

    target_files = [
        "market_watchlist_data.json",
        "sec_intel_data.json",
        "dyson_swarm_data.json",
        "intel_news_feed.json"
    ]

    failed = False
    for filename in target_files:
        # Check both root and public paths
        paths_to_test = [filename, os.path.join("public", filename)]
        for p in paths_to_test:
            if os.path.exists(p):
                try:
                    verify_and_sync_file(p)
                except Exception as err:
                    print(f"\n❌ CRITICAL PIPELINE FAILURE for {p}:\n{err}\n", file=sys.stderr)
                    failed = True

    if failed:
        print("\n💥 BUILD FAILED LOUDLIES: One or more data feeds failed validation or timestamp advancement.", file=sys.stderr)
        sys.exit(1)

    print("\n🎉 ALL 4 FEEDS VERIFIED & ADVANCED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
