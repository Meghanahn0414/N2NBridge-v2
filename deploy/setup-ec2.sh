#!/bin/bash
# ============================================================
# CRM EC2 First-Time Setup Script
# Run once on a fresh Ubuntu 22.04 EC2 instance as the "ubuntu" user
# Usage: bash setup-ec2.sh <YOUR_REPO_URL>
# Example: bash setup-ec2.sh https://github.com/your-org/CRM-01.git
# ============================================================
set -e

REPO_URL="${1:?Usage: bash setup-ec2.sh <REPO_URL>}"
REPO_DIR="/home/ubuntu/CRM-01"
VENV_DIR="$REPO_DIR/.venv"
FRONTEND_DIST="/var/www/crm/frontend"
LOG_DIR="/var/log/crm"

echo "=== [1/8] Updating system packages ==="
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y python3.11 python3.11-venv python3-pip nodejs npm nginx git curl

echo "=== [2/8] Cloning repository ==="
if [ -d "$REPO_DIR/.git" ]; then
    echo "Repo already exists — pulling latest..."
    cd "$REPO_DIR" && git pull
else
    git clone "$REPO_URL" "$REPO_DIR"
fi

echo "=== [3/8] Setting up Python virtual environment ==="
python3.11 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$REPO_DIR/Backend/requirements.txt"

echo "=== [4/8] Creating required directories ==="
mkdir -p "$REPO_DIR/Backend/uploads"
sudo mkdir -p "$FRONTEND_DIST" "$LOG_DIR"
sudo chown ubuntu:ubuntu "$LOG_DIR"

echo "=== [5/8] Setting up .env file ==="
if [ ! -f "$REPO_DIR/Backend/.env" ]; then
    cp "$REPO_DIR/Backend/.env.production.example" "$REPO_DIR/Backend/.env"
    echo ""
    echo ">>> ACTION REQUIRED: Edit $REPO_DIR/Backend/.env with your real secrets before continuing!"
    echo "    nano $REPO_DIR/Backend/.env"
    echo "    (Press ENTER to continue after editing, or Ctrl+C to abort)"
    read -r
fi

echo "=== [6/8] Building React frontend ==="
cd "$REPO_DIR/Frontend"
npm install
npm run build
sudo cp -r dist/* "$FRONTEND_DIST/"
sudo chown -R www-data:www-data "$FRONTEND_DIST"

echo "=== [7/8] Configuring Nginx ==="
# Replace placeholder in nginx.conf with real value from .env
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "YOUR_EC2_IP")
sed "s/YOUR_EC2_IP_OR_DOMAIN/$EC2_IP/g" "$REPO_DIR/deploy/nginx.conf" | sudo tee /etc/nginx/sites-available/crm > /dev/null
sudo ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/crm
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "=== [8/8] Installing and starting systemd service ==="
sudo cp "$REPO_DIR/deploy/crm-backend.service" /etc/systemd/system/crm-backend.service
sudo systemctl daemon-reload
sudo systemctl enable crm-backend
sudo systemctl start crm-backend

echo ""
echo "============================================================"
echo " Setup Complete!"
echo "============================================================"
echo " Backend status : sudo systemctl status crm-backend"
echo " Backend logs   : sudo journalctl -u crm-backend -f"
echo " Nginx status   : sudo systemctl status nginx"
echo " App URL        : http://$EC2_IP"
echo " API health     : http://$EC2_IP/api/health"
echo "============================================================"
