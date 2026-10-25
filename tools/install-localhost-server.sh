#!/usr/bin/env bash
# Install a macOS LaunchAgent that serves this folder at http://localhost:PORT (default 8123).
# It starts at login, restarts if it stops, and binds to 127.0.0.1 only (not reachable from other machines).
# Remove it again with tools/uninstall-localhost-server.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8123}"
LABEL="com.linear-algebra-explorer.serve"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
PY="$(command -v python3)"
LOG="/tmp/linear-algebra-explorer.log"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$PY</string>
    <string>-m</string>
    <string>http.server</string>
    <string>$PORT</string>
    <string>--bind</string>
    <string>127.0.0.1</string>
    <string>--directory</string>
    <string>$ROOT</string>
  </array>
  <key>WorkingDirectory</key><string>$ROOT</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST
UID_="$(id -u)"
launchctl bootout "gui/$UID_/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_" "$PLIST"
launchctl kickstart -k "gui/$UID_/$LABEL"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://localhost:$PORT/" >/dev/null 2>&1; then
    echo "Serving $ROOT at http://localhost:$PORT — starts automatically at login (LaunchAgent $LABEL, log: $LOG)"
    exit 0
  fi
  sleep 0.5
done
echo "The server did not answer on port $PORT. Check $LOG and: launchctl print gui/$UID_/$LABEL" >&2
exit 1
