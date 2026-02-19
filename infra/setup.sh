#!/bin/bash
# Agentbot VM Setup Script
# Run this on a fresh Ubuntu 22.04 VM
# Usage: curl -fsSL https://raw.githubusercontent.com/mohanagsk/agentbot/main/infra/setup.sh | bash

set -e

echo "🦞 Agentbot Setup Starting..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_info() { echo -e "${YELLOW}→ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run with sudo: curl -fsSL ... | sudo bash"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
HOME_DIR=$(eval echo ~$ACTUAL_USER)

log_info "Setting up for user: $ACTUAL_USER"

# Step 1: Update system
log_info "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
log_success "System updated"

# Step 2: Install Docker
log_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $ACTUAL_USER
    log_success "Docker installed"
else
    log_success "Docker already installed"
fi

# Step 3: Install Caddy
log_info "Installing Caddy..."
if ! command -v caddy &> /dev/null; then
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
    log_success "Caddy installed"
else
    log_success "Caddy already installed"
fi

# Step 4: Install Node.js 22
log_info "Installing Node.js 22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs
    log_success "Node.js installed"
else
    log_success "Node.js already installed"
fi

# Step 5: Create Agentbot directories
log_info "Creating directories..."
mkdir -p /opt/agentbot/{scripts,data,logs,api}
mkdir -p /backups
chown -R $ACTUAL_USER:$ACTUAL_USER /opt/agentbot
chown -R $ACTUAL_USER:$ACTUAL_USER /backups
log_success "Directories created"

# Step 6: Download scripts
log_info "Downloading Agentbot scripts..."
REPO_RAW="https://raw.githubusercontent.com/mohanagsk/agentbot/main"
curl -fsSL "$REPO_RAW/infra/scripts/provision.sh" -o /opt/agentbot/scripts/provision.sh
curl -fsSL "$REPO_RAW/infra/scripts/backup.sh" -o /opt/agentbot/scripts/backup.sh
curl -fsSL "$REPO_RAW/infra/scripts/restore.sh" -o /opt/agentbot/scripts/restore.sh
curl -fsSL "$REPO_RAW/api/server.js" -o /opt/agentbot/api/server.js
curl -fsSL "$REPO_RAW/api/package.json" -o /opt/agentbot/api/package.json
chmod +x /opt/agentbot/scripts/*.sh
log_success "Scripts downloaded"

# Step 7: Pull OpenClaw Docker image
log_info "Pulling OpenClaw Docker image (this may take a minute)..."
docker pull ghcr.io/openclaw/openclaw:latest
log_success "OpenClaw image ready"

# Step 8: Setup Caddy config
log_info "Configuring Caddy..."
EXTERNAL_IP=$(curl -s ifconfig.me)
cat > /etc/caddy/Caddyfile << EOF
# Agentbot Caddy Configuration

# Health check endpoint
:80 {
    respond /health "OK" 200
}

# User instances will be added dynamically below
# Format: user123.${EXTERNAL_IP}.nip.io { reverse_proxy localhost:PORT }
EOF
systemctl restart caddy
log_success "Caddy configured"

# Step 9: Install API dependencies
log_info "Installing API dependencies..."
cd /opt/agentbot/api
sudo -u $ACTUAL_USER npm install --production 2>/dev/null || npm install --production
log_success "API dependencies installed"

# Step 10: Create systemd service for API
log_info "Creating API service..."
cat > /etc/systemd/system/agentbot-api.service << EOF
[Unit]
Description=Agentbot Provisioning API
After=network.target docker.service

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=/opt/agentbot/api
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable agentbot-api
log_success "API service created"

# Step 11: Setup daily backup cron
log_info "Setting up daily backups..."
echo "0 3 * * * /opt/agentbot/scripts/backup.sh >> /opt/agentbot/logs/backup.log 2>&1" | crontab -
log_success "Daily backup scheduled at 3 AM"

# Step 12: Open firewall ports
log_info "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw --force enable
fi
log_success "Firewall configured"

# Get external IP
EXTERNAL_IP=$(curl -s ifconfig.me)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🦞 Agentbot Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "External IP: $EXTERNAL_IP"
echo ""
echo "Next steps:"
echo "1. Create .env file: nano /opt/agentbot/api/.env"
echo "   Add: GROQ_API_KEY=gsk_your_key_here"
echo "   Add: API_SECRET=$(openssl rand -hex 32)"
echo ""
echo "2. Start the API: sudo systemctl start agentbot-api"
echo ""
echo "3. Test: curl http://localhost:3000/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
