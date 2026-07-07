#!/usr/bin/env bash
# Deploys the Frontend (Vite/React static SPA) — build-once, ship-artifact-only.
# Run this from your build machine (your PC via Git Bash, or a CI runner).
# NEVER run this ON the VPS.
set -euo pipefail

# ---------- CONFIG (edit these) ----------
REPO_URL="git@github.com:Meghanahn0414/N2NBridge-v2.git"
BRANCH="main"
SUBDIR="Frontend"                       # this repo is a monorepo — build only this subfolder
APP_NAME="n2n-frontend"
DEPLOY_USER="deploy"
DEPLOY_HOST="CHANGE_ME"                 # your Ubuntu VPS IP, e.g. 203.0.113.10
DEPLOY_BASE="/var/www/${APP_NAME}"      # server target dir
KEEP_RELEASES=5                         # retained for rollback
BUILD_CMD="npm ci && npm run build"     # vite build -> dist/
ARTIFACT_DIR="dist"                     # folder the build produces
SERVICE_NAME=""                         # static site served by nginx — no systemd service
# ------------------------------------------

TS=$(date +%Y%m%d%H%M%S)
WORK=$(mktemp -d)
ARTIFACT="/tmp/${APP_NAME}-${TS}.tar.gz"

cleanup() { rm -rf "$WORK" "$ARTIFACT"; }
trap cleanup EXIT

# 1. Clone (shallow, build machine only)
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$WORK/src"

# 2. Build (only the Frontend subfolder)
( cd "$WORK/src/$SUBDIR" && eval "$BUILD_CMD" )

# 3. Package the build output only (no source)
tar -czf "$ARTIFACT" -C "$WORK/src/$SUBDIR/$ARTIFACT_DIR" .

# 4. Ship to server
RELEASE_DIR="${DEPLOY_BASE}/releases/${TS}"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${RELEASE_DIR}'"
scp "$ARTIFACT" "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/artifact-${TS}.tar.gz"

# 5. Activate (atomic symlink switch) + prune old releases
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<EOF
  set -euo pipefail
  tar -xzf "/tmp/artifact-${TS}.tar.gz" -C "${RELEASE_DIR}"
  rm -f "/tmp/artifact-${TS}.tar.gz"
  ln -sfn "${RELEASE_DIR}" "${DEPLOY_BASE}/current"
  if [ -n "${SERVICE_NAME}" ] && systemctl list-units --full --all | grep -q "${SERVICE_NAME}.service"; then
    sudo systemctl restart "${SERVICE_NAME}"
  fi
  cd "${DEPLOY_BASE}/releases"
  ls -1dt */ | tail -n +\$((${KEEP_RELEASES}+1)) | xargs -r rm -rf
EOF

echo "Done. Live: ${DEPLOY_BASE}/current -> ${RELEASE_DIR}"
