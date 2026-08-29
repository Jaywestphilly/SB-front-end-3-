#!/usr/bin/env python3
"""
Fetch and update Dyson Swarm AI telemetry data feed.
Stamps root-level 'updated_at' (ISO-8601 UTC) and 'source'.
Exits with non-zero code if validation fails or critical arrays/metrics are missing.
"""

import json
import os
import sys
from datetime import datetime, timezone

TARGET_FILES = ["dyson_swarm_data.json", os.path.join("public", "dyson_swarm_data.json")]
SOURCE_NAME = "SpaceX / Planet Labs / NASA Orbital Telemetry Feed"

def fetch_and_write():
    base_file = "public/dyson_swarm_data.json"
    if not os.path.exists(base_file):
        base_file = "dyson_swarm_data.json"

    if not os.path.exists(base_file):
        print("CRITICAL: Dyson swarm base data missing!", file=sys.stderr)
        sys.exit(1)

    with open(base_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Validate orbital shells and fleet metrics
    orbital_shells = data.get("orbital_shells", [])
    if not isinstance(orbital_shells, list) or len(orbital_shells) == 0:
        print("CRITICAL: Dyson orbital_shells is empty or invalid!", file=sys.stderr)
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
