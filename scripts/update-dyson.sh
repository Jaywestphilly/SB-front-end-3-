#!/bin/bash
set -e
echo "Updating Dyson Swarm Hub and verifying feeds..."
python3 scripts/verify_and_update_feeds.py
