#!/bin/bash
set -e
echo "Updating NewsHub and verifying feeds..."
python3 scripts/verify_and_update_feeds.py
