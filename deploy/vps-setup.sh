#!/usr/bin/env bash
# ONE-TIME provisioning script — run this ON the VPS itself, as root (or via
# sudo), exactly once. This is the only script in this folder meant to run on
# the server; deploy-frontend.sh / deploy-backend.sh / deploy-lookup.sh always
# run from your build machine, never here.
#
# Usage (on the VPS):
#   sudo bash vps-setup.sh
set -euo pipefail

DEPLOY_USER="deploy"
APPS=("n2n-frontend" "n2n-backend" "n2n-lookup")

echo "== Updating system packages =="
apt-get update -y
apt-get upgrade -y

echo "== Installing prerequisites =="
apt-get install -y python3 python3-venv python3-pip nginx ufw certbot python3-certbot-nginx

echo "== Creating deploy user =="
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
mkdir -p "/home/${DEPLOY_USER}/.ssh"
chmod 700 "/home/${DEPLOY_USER}/.ssh"
touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"

echo ">>> Paste your build machine's PUBLIC key into:"
echo ">>>   /home/${DEPLOY_USER}/.ssh/authorized_keys"
echo ">>> (this script does NOT do that step for you — see the printed instructions at the end)"

echo "== Creating app directory structure =="
for app in "${APPS[@]}"; do
  mkdir -p "/var/www/${app}/releases" "/var/www/${app}/shared"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/var/www/${app}"
done

echo "== Scoped sudo: deploy user may restart only the two app services, passwordless =="
cat > /etc/sudoers.d/deploy-restart <<'SUDOERS'
deploy ALL=(root) NOPASSWD: /bin/systemctl restart n2n-backend
deploy ALL=(root) NOPASSWD: /bin/systemctl restart n2n-lookup
SUDOERS
chmod 440 /etc/sudoers.d/deploy-restart

echo "== Firewall: allow SSH, HTTP, HTTPS only =="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "======================================================================"
echo "Provisioning done. Remaining MANUAL steps:"
echo ""
echo "1. On your BUILD machine, if you don't already have an SSH key:"
echo "     ssh-keygen -t ed25519 -C \"deploy@n2n\""
echo "   Then copy its PUBLIC key (id_ed25519.pub) into this file on the VPS:"
echo "     /home/${DEPLOY_USER}/.ssh/authorized_keys"
echo ""
echo "2. Once key login works, disable password login in /etc/ssh/sshd_config:"
echo "     PasswordAuthentication no"
echo "   then: systemctl restart sshd"
echo ""
echo "3. Create the real production secrets ONCE, by hand, at:"
echo "     /var/www/n2n-backend/shared/.env"
echo "     /var/www/n2n-lookup/shared/.env"
echo "   (copy from Backend/.env.example and LookupService/.env.example,"
echo "   filling in real Mongo Atlas URL, JWT secret, Twilio/SMTP, and a"
echo "   strong LOOKUP_REGISTER_KEY — the deploy scripts never touch these files.)"
echo ""
echo "4. From your BUILD machine, run the three deploy-*.sh scripts to ship"
echo "   the first release of each app (this also installs each app's Python"
echo "   dependencies into its own venv on the server)."
echo ""
echo "5. THEN copy the systemd unit files (deploy/systemd/*.service) to"
echo "   /etc/systemd/system/, then:"
echo "     systemctl daemon-reload"
echo "     systemctl enable --now n2n-backend n2n-lookup"
echo ""
echo "6. Copy deploy/nginx/n2n-frontend.conf to /etc/nginx/sites-available/,"
echo "   symlink it into sites-enabled, then: nginx -t && systemctl reload nginx"
echo "======================================================================"
