#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

bash "$SCRIPT_DIR/restart-local.sh"
cd "$REPO_ROOT/research-portal"
node --env-file=.env scripts/smoke-natural.mjs
