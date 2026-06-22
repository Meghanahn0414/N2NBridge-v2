#!/bin/bash
# ============================================================
# CRM Redeploy Script — run this for every subsequent deployment
# Usage: bash deploy.sh
# ============================================================
set -e

REPO_DIR="/home/ubuntu/CRM-01"
VENV_DIR="$REPO_DIR/.venv"
FRONTEND_DIST="/var/www/crm/frontend"

echo "=== [1/4] Pulling latest code ==="
cd "$REPO_DIR"
git pull

echo "=== [2/4] Updating backend dependencies ==="
source "$VENV_DIR/bin/activate"
pip install -r Backend/requirements.txt

echo "=== [3/4] Rebuilding and deploying frontend ==="
cd "$REPO_DIR/Frontend"
npm install
npm run build
sudo cp -r dist/* "$FRONTEND_DIST/"
sudo chown -R www-data:www-data "$FRONTEND_DIST"

echo "=== [4/4] Restarting backend service ==="
sudo systemctl restart crm-backend

echo ""
echo "============================================================"
echo " Redeploy Complete!"
echo "============================================================"
echo " Backend status : sudo systemctl status crm-backend"
echo " Backend logs   : sudo journalctl -u crm-backend -f"
echo "============================================================"
