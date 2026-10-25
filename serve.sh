#!/usr/bin/env bash
# Serve the Linear Algebra Explorer in the foreground at http://localhost:PORT (default 8123). Ctrl-C stops it.
cd "$(dirname "$0")"
PORT="${1:-8123}"
echo "Linear Algebra Explorer → http://localhost:$PORT   (Ctrl-C to stop)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
