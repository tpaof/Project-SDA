#!/bin/bash
# ==============================================================================
# MoneyMate - VM Setup Script
# ติดตั้ง Docker, Docker Compose, Nginx และเตรียม VM สำหรับ production
# Usage: chmod +x setup-vm.sh && sudo ./setup-vm.sh
# ==============================================================================
set -euo pipefail

APP_DIR="/opt/moneymate"
SWAP_SIZE="2G"

echo "🖥️  MoneyMate VM Setup Script"
echo "=============================="
echo ""

# ------------------------------------------------------------------------------
# 1. Update system
# ------------------------------------------------------------------------------
echo "📦 [1/8] Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y \
  curl \
  git \
  unzip \
  htop \
  jq \
  ufw \
  fail2ban \
  logrotate

# ------------------------------------------------------------------------------
# 2. Install Docker Engine
# ------------------------------------------------------------------------------
echo "🐳 [2/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  echo "Docker installed successfully"
else
  echo "Docker already installed: $(docker --version)"
fi

# Add current user to docker group (if run with sudo by non-root)
if [ -n "${SUDO_USER:-}" ]; then
  usermod -aG docker "$SUDO_USER"
  echo "Added $SUDO_USER to docker group"
fi

# Enable Docker on boot
systemctl enable docker
systemctl start docker

# ------------------------------------------------------------------------------
# 3. Install Docker Compose plugin
# ------------------------------------------------------------------------------
echo "🔧 [3/8] Installing Docker Compose plugin..."
apt-get install -y docker-compose-plugin
echo "Docker Compose: $(docker compose version)"

# ------------------------------------------------------------------------------
# 4. Install Nginx
# ------------------------------------------------------------------------------
echo "🌐 [4/8] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# ------------------------------------------------------------------------------
# 5. Configure firewall (UFW)
# ------------------------------------------------------------------------------
echo "🔥 [5/8] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'    # 80 + 443
ufw --force enable
ufw status verbose

# ------------------------------------------------------------------------------
# 6. Configure fail2ban (SSH brute-force protection)
# ------------------------------------------------------------------------------
echo "🛡️  [6/8] Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban

# ------------------------------------------------------------------------------
# 7. Setup swap space (for OCR worker memory)
# ------------------------------------------------------------------------------
echo "💾 [7/8] Setting up swap space (${SWAP_SIZE})..."
if [ ! -f /swapfile ]; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  # Add to fstab if not already there
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  # Tune swappiness
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo "Swap enabled: ${SWAP_SIZE}"
else
  echo "Swap already configured"
fi

# ------------------------------------------------------------------------------
# 8. Create app directory & log rotation
# ------------------------------------------------------------------------------
echo "📂 [8/8] Creating app directory structure..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/backups"

# Set ownership to invoking user
if [ -n "${SUDO_USER:-}" ]; then
  chown -R "$SUDO_USER":"$SUDO_USER" "$APP_DIR"
fi

# Setup log rotation for Docker
cat > /etc/logrotate.d/moneymate << 'EOF'
/var/log/moneymate/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
mkdir -p /var/log/moneymate

# Docker daemon log rotation
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

# ------------------------------------------------------------------------------
# Done!
# ------------------------------------------------------------------------------
echo ""
echo "============================================"
echo "✅ VM setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Log out and back in (for Docker group)"
echo "  2. Clone repo:    cd $APP_DIR && git clone https://github.com/tpaof/Project-SDA.git ."
echo "  3. Copy env:      cp deploy/.env.example .env"
echo "  4. Edit .env:     nano .env"
echo "  5. Setup SSL:     sudo ./deploy/setup-ssl.sh your-domain.com your@email.com"
echo "  6. Deploy:        ./deploy/deploy.sh"
echo ""
