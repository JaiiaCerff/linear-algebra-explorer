#!/usr/bin/env bash
# Remove the LaunchAgent installed by install-localhost-server.sh
set -uo pipefail
LABEL="com.linear-algebra-explorer.serve"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$PLIST"
echo "Removed $LABEL. The app still works by opening index.html or running ./serve.sh"
