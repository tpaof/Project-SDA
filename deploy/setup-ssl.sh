#!/bin/bash
# ==============================================================================
# MoneyMate - SSL Certificate Setup (Let's Encrypt / Certbot)
# Usage: sudo ./setup-ssl.sh <domain> <email>
# Example: sudo ./setup-ssl.sh moneymate.example.com admin@example.com
# ==============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: sudo $0 <domain> <email>"
  echo "Example: sudo $0 moneymate.example.com admin@example.com"
  exit 1
fi

echo "🔒 MoneyMate SSL Setup"
echo "======================"
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# ------------------------------------------------------------------------------
# 1. Install Certbot
# ------------------------------------------------------------------------------
echo "📦 [1/4] Installing Certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# ------------------------------------------------------------------------------
# 2. Setup Nginx config with domain (before SSL)
# ------------------------------------------------------------------------------
echo "🌐 [2/4] Configuring Nginx..."

NGINX_CONF="/etc/nginx/sites-available/moneymate"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Copy template and replace domain placeholder
sed "s/\${DOMAIN}/$DOMAIN/g" "$SCRIPT_DIR/nginx/moneymate.conf" > "$NGINX_CONF"

# Create a temporary HTTP-only config for Certbot verification
cat > /etc/nginx/sites-available/moneymate-temp << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'MoneyMate is being configured...';
        add_header Content-Type text/plain;
    }
}
EOF

# Enable temp config
ln -sf /etc/nginx/sites-available/moneymate-temp /etc/nginx/sites-enabled/moneymate
rm -f /etc/nginx/sites-enabled/default
mkdir -p /var/www/certbot

nginx -t && systemctl reload nginx

# ------------------------------------------------------------------------------
# 3. Obtain SSL Certificate
# ------------------------------------------------------------------------------
echo "🔑 [3/4] Obtaining SSL certificate..."
certbot certonly \
  --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN"

# ------------------------------------------------------------------------------
# 4. Enable full Nginx config with SSL
# ------------------------------------------------------------------------------
echo "🔧 [4/4] Enabling full SSL configuration..."

# Now use the real config (with SSL paths)
ln -sf /etc/nginx/sites-available/moneymate /etc/nginx/sites-enabled/moneymate

# Test and reload
nginx -t && systemctl reload nginx

# Clean up temp config
rm -f /etc/nginx/sites-available/moneymate-temp

# ------------------------------------------------------------------------------
# Auto-renewal cron
# ------------------------------------------------------------------------------
echo "⏰ Setting up auto-renewal..."
# Certbot installs a systemd timer by default, verify it's active
systemctl enable certbot.timer
systemctl start certbot.timer

# Also add a cron job as backup
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo ""
echo "============================================"
echo "✅ SSL setup complete!"
echo "============================================"
echo ""
echo "  https://$DOMAIN  → MoneyMate"
echo ""
echo "  Certificate:  /etc/letsencrypt/live/$DOMAIN/"
echo "  Auto-renewal: systemd timer + cron (daily at 3 AM)"
echo ""
echo "  Test renewal:  sudo certbot renew --dry-run"
echo ""
