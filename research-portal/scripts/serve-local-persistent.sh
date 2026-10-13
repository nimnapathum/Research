#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/restart-local.sh"
echo "Local portal is running in this tmux session. Leave this session open during rehearsal."
exec /bin/zsh -i
