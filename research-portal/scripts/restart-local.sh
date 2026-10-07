#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="/Users/nimnapathum/Documents/ChatGPT/Research/research-portal"
NODE24="/opt/homebrew/opt/node@24/bin"
LOG_DIR="$PROJECT_ROOT/.local-logs"

export PATH="$NODE24:$PATH"
cd "$PROJECT_ROOT"

echo "Using Node: $(node --version)"
echo "Using npm:  $(npm --version)"

stop_port() {
  local port="$1"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)"

  if [[ -n "$pids" ]]; then
    echo "Stopping process on port $port: $pids"
    kill $pids || true
    sleep 2
  else
    echo "Nothing running on port $port"
  fi
}

stop_port 4000
stop_port 3000

mkdir -p "$LOG_DIR"

echo "Starting API..."
nohup npm run dev:api >"$LOG_DIR/api.log" 2>&1 &
API_PID=$!

sleep 2

echo "Starting web app..."
nohup npm run dev:web >"$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!

sleep 5

echo
echo "Processes:"
echo "API PID: $API_PID"
echo "Web PID: $WEB_PID"

echo
echo "API check:"
if curl -fsS http://127.0.0.1:4000/health; then
  echo
  echo "API is running."
else
  echo "API is not healthy. See $LOG_DIR/api.log"
fi

echo
echo "Web check:"
if curl -fsSI http://127.0.0.1:3000/login >/dev/null; then
  echo "Web app is running."
else
  echo "Web app is not responding. See $LOG_DIR/web.log"
fi

echo
echo "Logs:"
echo "  tail -f $LOG_DIR/api.log"
echo "  tail -f $LOG_DIR/web.log"
