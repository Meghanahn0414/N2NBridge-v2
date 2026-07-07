#!/usr/bin/env bash
# Deploys the LookupService (Python/FastAPI) — same approach as deploy-backend.sh,
# see the comments there for why Python ships source rather than a compiled
# artifact, and why .env is never overwritten by this script.
#
# Run this from your build machine (your PC via Git Bash, or a CI runner).
# NEVER run this ON the VPS.
set -euo pipefail

# ---------- CONFIG (edit these) ----------
REPO_URL="git@github.com:Meghanahn0414/N2NBridge-v2.git"
BRANCH="main"
SUBDIR="LookupService"                  # this repo is a monorepo — ship only this subfolder
APP_NAME="n2n-lookup"
DEPLOY_USER="deploy"
DEPLOY_HOST="CHANGE_ME"                 # your Ubuntu VPS IP, e.g. 203.0.113.10
DEPLOY_BASE="/var/www/${APP_NAME}"      # server target dir
KEEP_RELEASES=5                         # retained for rollback
SERVICE_NAME="n2n-lookup"               # systemd unit that runs: uvicorn main:app --host 0.0.0.0 --port 9001
# ------------------------------------------

TS=$(date +%Y%m%d%H%M%S)
WORK=$(mktemp -d)
ARTIFACT="/tmp/${APP_NAME}-${TS}.tar.gz"

cleanup() { rm -rf "$WORK" "$ARTIFACT"; }
trap cleanup EXIT

# 1. Clone (shallow, build machine only)
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$WORK/src"

# 2. Package the app source — excluding .git, venv, caches, and .env
tar -czf "$ARTIFACT" \
  --exclude=".venv" --exclude="venv" --exclude="__pycache__" \
  --exclude="*.pyc" --exclude=".env" --exclude="tests" \
  -C "$WORK/src/$SUBDIR" .

# 3. Ship to server
RELEASE_DIR="${DEPLOY_BASE}/releases/${TS}"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${RELEASE_DIR}' '${DEPLOY_BASE}/shared'"
scp "$ARTIFACT" "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/artifact-${TS}.tar.gz"

# 4. Activate: extract, install dependencies on the server, symlink in the
#    server's own persistent .env, atomic symlink switch, restart, prune.
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<EOF
  set -euo pipefail
  tar -xzf "/tmp/artifact-${TS}.tar.gz" -C "${RELEASE_DIR}"
  rm -f "/tmp/artifact-${TS}.tar.gz"

  python3 -m venv "${RELEASE_DIR}/venv"
  "${RELEASE_DIR}/venv/bin/pip" install --quiet --upgrade pip
  "${RELEASE_DIR}/venv/bin/pip" install --quiet -r "${RELEASE_DIR}/requirements.txt"

  # First deploy ever: create the real .env once, by hand, at
  # ${DEPLOY_BASE}/shared/.env on the server — this script never touches it
  # again after that.
  ln -sfn "${DEPLOY_BASE}/shared/.env" "${RELEASE_DIR}/.env"

  ln -sfn "${RELEASE_DIR}" "${DEPLOY_BASE}/current"

  if systemctl list-units --full --all | grep -q "${SERVICE_NAME}.service"; then
    sudo systemctl restart "${SERVICE_NAME}"
  fi

  cd "${DEPLOY_BASE}/releases"
  ls -1dt */ | tail -n +\$((${KEEP_RELEASES}+1)) | xargs -r rm -rf
EOF

echo "Done. Live: ${DEPLOY_BASE}/current -> ${RELEASE_DIR}"
