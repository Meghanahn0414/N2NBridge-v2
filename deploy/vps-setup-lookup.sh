#!/usr/bin/env bash
# ONE-TIME provisioning for a server that is ONLY the Lookup Service — the
# one fixed, centrally-hosted address every representative's Backend and
# every citizen app talks to. Run this ON that new VPS, as root, once.
#
# Usage (on the new VPS):
#   sudo bash vps-setup-lookup.sh
set -euo pipefail

DEPLOY_USER="deploy"
APP="n2n-lookup"

echo "== Updating system packages =="
apt-get update -y
apt-get upgrade -y

echo "== Installing prerequisites =="
apt-get install -y python3 python3-venv python3-pip ufw certbot python3-certbot-nginx nginx

echo "== Creating deploy user =="
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
mkdir -p "/home/${DEPLOY_USER}/.ssh"
chmod 700 "/home/${DEPLOY_USER}/.ssh"
touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"

echo "== Creating app directory structure =="
mkdir -p "/var/www/${APP}/releases" "/var/www/${APP}/shared"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/var/www/${APP}"

echo "== Scoped sudo: deploy user may restart only n2n-lookup, passwordless =="
cat > /etc/sudoers.d/deploy-restart-lookup <<'SUDOERS'
deploy ALL=(root) NOPASSWD: /bin/systemctl restart n2n-lookup
SUDOERS
chmod 440 /etc/sudoers.d/deploy-restart-lookup

echo "== Firewall: allow SSH, HTTP, HTTPS only (nginx will proxy to the app) =="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "======================================================================"
echo "Provisioning done. Remaining MANUAL steps:"
echo ""
echo "1. On your BUILD machine, copy your SSH public key into this file on"
echo "   the new server:  /home/${DEPLOY_USER}/.ssh/authorized_keys"
echo "   (same key you already use for the other server is fine to reuse)"
echo ""
echo "2. Once key login works, disable password login in /etc/ssh/sshd_config"
echo "   (PasswordAuthentication no), then: systemctl restart sshd"
echo ""
echo "3. Create the real secrets ONCE, by hand, at:"
echo "     /var/www/n2n-lookup/shared/.env"
echo "   Copy from LookupService/.env.example, but set a strong, random"
echo "   LOOKUP_REGISTER_KEY here — every representative's Backend must be"
echo "   given this SAME key so it's allowed to register itself."
echo ""
echo "4. From your BUILD machine, edit deploy/deploy-lookup.sh:"
echo "     DEPLOY_HOST=\"<this new server's IP>\""
echo "   then run:  bash deploy-lookup.sh"
echo ""
echo "5. Copy deploy/systemd/n2n-lookup.service to /etc/systemd/system/, then:"
echo "     systemctl daemon-reload && systemctl enable --now n2n-lookup"
echo ""
echo "6. (Recommended) Point a domain's DNS A record at this server's IP,"
echo "   set up nginx to reverse-proxy to 127.0.0.1:9001, and run certbot"
echo "   for HTTPS — a citizen app should never send OTPs/tokens over plain"
echo "   HTTP in production."
echo "======================================================================"
