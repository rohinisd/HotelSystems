#!/usr/bin/env bash
# Sync local project to server. Run from repo root in Cursor terminal:
#   bash scripts/sync-to-server.sh
# Or: bash scripts/sync-to-server.sh user@server:/path/to/app

RSYNC_TARGET="${1:-user@your-server:/path/to/HotelSystems}"

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.venv' \
  --exclude '.next' \
  --exclude '__pycache__' \
  --exclude '.git' \
  --exclude '*.pyc' \
  --exclude '.env' \
  --exclude 'postgres_data' \
  ./ "$RSYNC_TARGET/"

echo "Sync to $RSYNC_TARGET done."
