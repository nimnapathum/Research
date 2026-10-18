#!/usr/bin/env bash
# Run on the Oracle VM after the desired commit has been pushed to origin/main.
set -Eeuo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'HELP'
Usage: bash research-portal/scripts/deploy-hosted.sh [--dry-run]

Run as the Ubuntu SSH user during a maintenance window. This script pulls
origin/main, stages a separate release, backs up the local PostgreSQL database,
stops the API and web services, builds and migrates, then restarts and checks them.

Optional environment overrides:
  SOURCE_CHECKOUT  default $HOME/Research
  APP_USER         default studyapp
  DEPLOY_ROOT      default /srv/security-trust
  DB_NAME          default security_trust_portal (local PostgreSQL)
  NODE_BIN         default /usr/local/bin/node (must be Node 24)
  PUBLIC_URL       default https://nimnapathum.tech; set to empty to skip public check
  PORTAL_ENV_FILE  default the active API release's .env

The script never pushes work or changes the private evidence/assignment folders.
HELP
  exit 0
fi
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != "--dry-run" ) ]]; then
  echo "Use --help for usage." >&2
  exit 2
fi
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1
if [[ $EUID -eq 0 ]]; then
  echo "Run as the SSH user, not with sudo; the script invokes sudo where needed." >&2
  exit 2
fi

SOURCE_CHECKOUT="${SOURCE_CHECKOUT:-$HOME/Research}"
APP_USER="${APP_USER:-studyapp}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/srv/security-trust}"
DB_NAME="${DB_NAME:-security_trust_portal}"
NODE_BIN="${NODE_BIN:-/usr/local/bin/node}"
PUBLIC_URL="${PUBLIC_URL-https://nimnapathum.tech}"
for value in "$SOURCE_CHECKOUT" "$DEPLOY_ROOT" "$NODE_BIN"; do
  if [[ "$value" != /* || "$value" =~ [[:space:]] ]]; then
    echo "Deployment paths must be absolute and contain no whitespace." >&2
    exit 2
  fi
done
if [[ ! "$DB_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "DB_NAME must be a simple PostgreSQL database name." >&2
  exit 2
fi
if [[ ! -x "$NODE_BIN" || "$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')" != 24 ]]; then
  echo "Set NODE_BIN to the absolute path of Node 24." >&2
  exit 2
fi
if [[ ! -d "$SOURCE_CHECKOUT/.git" || "$(git -C "$SOURCE_CHECKOUT" branch --show-current)" != main ]]; then
  echo "Expected a Git checkout on main at $SOURCE_CHECKOUT" >&2
  exit 2
fi
if ! git -C "$SOURCE_CHECKOUT" diff --quiet || ! git -C "$SOURCE_CHECKOUT" diff --cached --quiet; then
  echo "The VM checkout has tracked local changes. Resolve them before deploying." >&2
  exit 2
fi

API_SERVICE=security-trust-api.service
WEB_SERVICE=security-trust-web.service
API_OVERRIDE="/etc/systemd/system/$API_SERVICE.d/zz-study-release.conf"
WEB_OVERRIDE="/etc/systemd/system/$WEB_SERVICE.d/zz-study-release.conf"
API_WORKDIR="$(systemctl show -p WorkingDirectory --value "$API_SERVICE")"
if [[ "$API_WORKDIR" != */research-portal/apps/api ]]; then
  echo "Unexpected API working directory: $API_WORKDIR" >&2
  exit 2
fi
ACTIVE_ENV="${PORTAL_ENV_FILE:-$(dirname "$(dirname "$API_WORKDIR")")/.env}"
if [[ ! -f "$ACTIVE_ENV" ]]; then
  echo "Active portal .env not found at $ACTIVE_ENV" >&2
  exit 2
fi
echo "Source: $SOURCE_CHECKOUT"
echo "Active API: $API_WORKDIR"
echo "Environment: $ACTIVE_ENV (contents are not printed)"
echo "Target: origin/main"
if [[ $DRY_RUN -eq 1 ]]; then
  echo "Dry run: would pull, stage, back up $DB_NAME, stop, build, migrate, switch and health-check."
  exit 0
fi

sudo -v
git -C "$SOURCE_CHECKOUT" pull --ff-only origin main
COMMIT="$(git -C "$SOURCE_CHECKOUT" rev-parse HEAD)"
REMOTE_COMMIT="$(git -C "$SOURCE_CHECKOUT" rev-parse refs/remotes/origin/main)"
if [[ "$COMMIT" != "$REMOTE_COMMIT" ]]; then
  echo "The VM checkout is ahead of origin/main; deploy only the pushed commit." >&2
  exit 1
fi
RELEASE_ID="${COMMIT:0:8}-$(date -u +%Y%m%dT%H%M%SZ)-$$"
RELEASE_DIR="$DEPLOY_ROOT/releases/$RELEASE_ID"
BACKUP_DIR="$DEPLOY_ROOT/backups/$(date -u +%Y%m%dT%H%M%SZ)-before-$RELEASE_ID"
NODE_DIR="$(dirname "$NODE_BIN")"

sudo install -d -o "$APP_USER" -g "$APP_USER" -m 700 "$RELEASE_DIR"
git -C "$SOURCE_CHECKOUT" archive --format=tar HEAD | sudo -u "$APP_USER" tar -xf - -C "$RELEASE_DIR"
sudo install -o "$APP_USER" -g "$APP_USER" -m 600 "$ACTIVE_ENV" "$RELEASE_DIR/research-portal/.env"
# Preserve private storage paths. Point source materials and research documents at the new release.
sudo -u "$APP_USER" python3 - "$RELEASE_DIR/research-portal/.env" "$RELEASE_DIR" <<'PY'
from pathlib import Path
import sys
path, release = Path(sys.argv[1]), Path(sys.argv[2])
lines = path.read_text().splitlines()
updates = {'STUDY_MATERIALS_ROOT': str(release / 'study-system'),
           'RESEARCH_DOCS_ROOT': str(release)}
kept = [line for line in lines if not any(line.startswith(key + '=') for key in updates)]
path.write_text('\n'.join(kept + [f'{key}={value}' for key, value in updates.items()]) + '\n')
PY

sudo install -d -o root -g root -m 700 "$BACKUP_DIR"
sudo install -o root -g root -m 600 "$ACTIVE_ENV" "$BACKUP_DIR/portal.env"
for item in "$API_OVERRIDE" "$WEB_OVERRIDE"; do
  if sudo test -f "$item"; then
    sudo cp -p "$item" "$BACKUP_DIR/$(basename "$(dirname "$item")").conf"
  fi
done
sudo install -d -o root -g root -m 700 "$BACKUP_DIR/database"
echo "Backing up PostgreSQL database $DB_NAME..."
sudo -u postgres pg_dump -Fc "$DB_NAME" | sudo tee "$BACKUP_DIR/database/portal.dump" >/dev/null
sudo chmod 600 "$BACKUP_DIR/database/portal.dump"

STOPPED=0
SUCCESS=0
rollback() {
  code=$?
  if [[ $SUCCESS -eq 0 && $STOPPED -eq 1 ]]; then
    echo "Deployment failed; restoring the previous service configuration..." >&2
    for service in "$API_SERVICE" "$WEB_SERVICE"; do
      override="/etc/systemd/system/$service.d/zz-study-release.conf"
      saved="$BACKUP_DIR/$service.d.conf"
      if sudo test -f "$saved"; then sudo cp -p "$saved" "$override"; else sudo rm -f "$override"; fi
    done
    sudo systemctl daemon-reload || true
    sudo systemctl start "$API_SERVICE" "$WEB_SERVICE" || true
    echo "Previous services were restarted where possible. Applied database migrations were not reversed." >&2
    echo "Inspect: sudo journalctl -u $API_SERVICE -u $WEB_SERVICE -n 100 --no-pager" >&2
  fi
  exit "$code"
}
trap rollback EXIT

echo "Stopping hosted API and web services for the build on the 1 GB VM..."
STOPPED=1
sudo systemctl stop "$WEB_SERVICE" "$API_SERVICE"
sudo -u "$APP_USER" env PATH="$NODE_DIR:/usr/local/bin:/usr/bin:/bin" bash -c '
  set -Eeuo pipefail
  cd "$1/research-portal"
  npm ci
  npm run build
  npm run db:migrate
' _ "$RELEASE_DIR"

sudo install -d -o root -g root -m 755 "$(dirname "$API_OVERRIDE")" "$(dirname "$WEB_OVERRIDE")"
sudo tee "$API_OVERRIDE" >/dev/null <<EOF
[Service]
WorkingDirectory=$RELEASE_DIR/research-portal/apps/api
EnvironmentFile=
EnvironmentFile=$RELEASE_DIR/research-portal/.env
ExecStart=
ExecStart=$NODE_BIN --env-file=../../.env dist/main.js
EOF
sudo tee "$WEB_OVERRIDE" >/dev/null <<EOF
[Service]
WorkingDirectory=$RELEASE_DIR/research-portal/apps/web
EnvironmentFile=
EnvironmentFile=$RELEASE_DIR/research-portal/.env
ExecStart=
ExecStart=$NODE_BIN ../../node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
EOF
sudo systemctl daemon-reload
if [[ "$(systemctl show -p WorkingDirectory --value "$API_SERVICE")" != "$RELEASE_DIR/research-portal/apps/api" ||
      "$(systemctl show -p WorkingDirectory --value "$WEB_SERVICE")" != "$RELEASE_DIR/research-portal/apps/web" ]]; then
  echo "Systemd did not select the new release directories." >&2
  exit 1
fi
sudo systemctl start "$API_SERVICE" "$WEB_SERVICE"
READY=0
for attempt in {1..20}; do
  if curl -fsS --max-time 3 http://127.0.0.1:4000/health | "$NODE_BIN" -e '
    let text=""; process.stdin.on("data", part => text += part);
    process.stdin.on("end", () => { const value=JSON.parse(text); process.exit(value.ok && value.protocol === "natural" ? 0 : 1); });
  ' && curl -fsSI --max-time 3 http://127.0.0.1:3000/login >/dev/null; then
    READY=1
    break
  fi
  sleep 2
done
if [[ $READY -ne 1 ]]; then
  echo "Local API or web health check failed." >&2
  exit 1
fi
if [[ -n "$PUBLIC_URL" ]]; then
  curl -fsSI --max-time 10 "${PUBLIC_URL%/}/login" >/dev/null
fi
SUCCESS=1
echo "Deployed commit $COMMIT from $RELEASE_DIR"
echo "Backup: $BACKUP_DIR"
echo "API, web, and public login checks passed."
