#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="/Users/nimnapathum/Documents/ChatGPT/Research/research-portal"
NODE24="/opt/homebrew/opt/node@24/bin"
LOG_DIR="$PROJECT_ROOT/.local-logs"
STUDY_ROOT="/Users/nimnapathum/Documents/ChatGPT/Research/study-system"

export PATH="$NODE24:$PATH"
export STUDY_MATERIALS_ROOT="$STUDY_ROOT"
export STUDY_PUBLIC_URL="http://127.0.0.1:4175"
export CHECKPOINT_BRIDGE_ENABLED=1
export STUDY_PROTOCOL=natural
export STUDY_EVIDENCE_ROOT="$PROJECT_ROOT/.local-evidence"
export STUDY_PACKAGE_ROOT="$PROJECT_ROOT/.local-packages"
cd "$PROJECT_ROOT"

echo "Using Node: $(node --version)"
echo "Using npm:  $(npm --version)"
echo "Applying portal database migrations..."
npm run db:migrate

stop_tree() {
  local root_pid="$1"
  local descendants="$root_pid"
  local pending="$root_pid"
  local children=""
  while [[ -n "$pending" ]]; do
    children=""
    for process_id in $pending; do
      children="$children $(pgrep -P "$process_id" || true)"
    done
    pending="$(echo "$children" | xargs)"
    descendants="$descendants $pending"
  done
  # Stop watcher parents together with children so they cannot respawn a stale server.
  kill $descendants 2>/dev/null || true
}

for service in api web checkpoint; do
  if [[ -f "$LOG_DIR/$service.pid" ]]; then
    managed_pid="$(cat "$LOG_DIR/$service.pid")"
    managed_command="$(ps -p "$managed_pid" -o command= || true)"
    if [[ "$managed_command" == *"npm run dev:"* || "$managed_command" == *"$STUDY_ROOT/app/server.mjs"* ]]; then
      stop_tree "$managed_pid"
    fi
  fi
done

stop_port() {
  local port="$1"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)"

  if [[ -n "$pids" ]]; then
    echo "Stopping process on port $port: $pids"
    for listener_pid in $pids; do
      root_pid="$listener_pid"
      parent_pid="$(ps -p "$root_pid" -o ppid= | xargs)"
      while [[ -n "$parent_pid" && "$parent_pid" != "1" ]]; do
        parent_command="$(ps -p "$parent_pid" -o command= || true)"
        case "$parent_command" in
          *"npm run dev:api"*|*"npm run start:dev"*|*"npm run dev:web"*|*"npm run dev"*|*"node_modules/@nestjs/cli/bin/nest.js"*|*"node_modules/next/dist/bin/next"*|*"scripts/run-web.mjs"*)
            root_pid="$parent_pid"
            parent_pid="$(ps -p "$root_pid" -o ppid= | xargs)" ;;
          *) break ;;
        esac
      done
      stop_tree "$root_pid"
    done
    sleep 2
  else
    echo "Nothing running on port $port"
  fi
}

stop_port 4000
stop_port 3000
stop_port 4175

mkdir -p "$LOG_DIR"

echo "Starting recorded-task checkpoint service..."
nohup node "$STUDY_ROOT/app/server.mjs" >"$LOG_DIR/checkpoint.log" 2>&1 &
CHECKPOINT_PID=$!
echo "$CHECKPOINT_PID" > "$LOG_DIR/checkpoint.pid"

echo "Starting API..."
nohup npm run dev:api >"$LOG_DIR/api.log" 2>&1 &
API_PID=$!
echo "$API_PID" > "$LOG_DIR/api.pid"

sleep 2

echo "Starting web app..."
nohup npm run dev:web >"$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$LOG_DIR/web.pid"

sleep 5

echo
echo "Processes:"
echo "API PID: $API_PID"
echo "Web PID: $WEB_PID"
echo "Checkpoint PID: $CHECKPOINT_PID"

echo
echo "Checkpoint check:"
if curl -fsS http://127.0.0.1:4175/health; then
  echo
  echo "Checkpoint service is running."
else
  echo "Checkpoint service is not healthy. See $LOG_DIR/checkpoint.log"
fi

echo
echo "API check:"
if curl -fsS http://127.0.0.1:4000/health; then
  echo
  echo "API is running."
else
  echo "API is not healthy. See $LOG_DIR/api.log"
fi
node -e 'fetch("http://127.0.0.1:4000/health").then(r=>r.json()).then(h=>{if(h.protocol!=="natural")throw Error("Wrong API protocol: "+h.protocol);console.log("API natural mode confirmed")}).catch(e=>{console.error(e.message);process.exit(1)})'

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
echo "  tail -f $LOG_DIR/checkpoint.log"
