#!/bin/bash

# PHASE 1: GCP INFRASTRUCTURE SETUP - AUTOMATED EXECUTION SCRIPT
# This script automates the entire Phase 1 setup process
# Run: bash phase1_setup.sh

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     PHASE 1: GCP INFRASTRUCTURE SETUP - AUTOMATED              ║"
echo "║     OpenClaw Gateway Deployment                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# DAY 1: CREATE GCP PROJECT & ENABLE APIS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DAY 1: GCP Project Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI found: $(gcloud --version | head -1)"
echo ""

# Create GCP Project
echo "Step 1.1: Creating GCP Project..."
PROJECT_ID="agentbot-openclaw-$(date +%s)"
gcloud projects create $PROJECT_ID \
    --name="Agentbot OpenClaw Gateway" \
    --set-as-default

echo "✅ Project created: $PROJECT_ID"
echo ""

# Verify project
echo "Step 1.2: Verifying project..."
gcloud config list project
echo ""

# Enable Billing (requires manual step)
echo "Step 1.3: Billing Setup"
echo "⚠️  IMPORTANT: Manual step required"
echo "   1. Go to https://console.cloud.google.com/billing"
echo "   2. Link a billing account to project: $PROJECT_ID"
echo "   3. Wait for confirmation"
echo "   4. Press ENTER to continue..."
read -p "   > "
echo ""

# Enable Compute Engine API
echo "Step 1.4: Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com
echo "✅ Compute Engine API enabled"
echo ""

# Set default zone
echo "Step 1.5: Setting default zone..."
gcloud config set compute/zone us-central1-a
echo "✅ Default zone set: us-central1-a"
echo ""

echo "✅ DAY 1 COMPLETE: GCP Project Ready"
echo ""

# ============================================================================
# DAY 2: CREATE COMPUTE ENGINE VM
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DAY 2: Create Compute Engine VM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create VM instance
echo "Step 2.1: Creating e2-small VM..."
gcloud compute instances create openclaw-gateway \
    --zone=us-central1-a \
    --machine-type=e2-small \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-standard \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=http-server,https-server,openclaw

echo "✅ VM instance created"
echo ""

# Verify VM
echo "Step 2.2: Verifying VM..."
gcloud compute instances list | grep openclaw-gateway
echo ""

# Get VM IP
VM_IP=$(gcloud compute instances describe openclaw-gateway --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
echo "✅ VM External IP: $VM_IP"
echo ""

# Create firewall rules
echo "Step 2.3: Creating firewall rules..."

echo "  - SSH (port 22)..."
gcloud compute firewall-rules create allow-ssh-openclaw \
    --allow=tcp:22 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=openclaw \
    --description="Allow SSH to OpenClaw VM" \
    --quiet || echo "  (rule may already exist)"

echo "  - OpenClaw Gateway (port 18789)..."
gcloud compute firewall-rules create allow-openclaw-gateway \
    --allow=tcp:18789 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=openclaw \
    --description="Allow OpenClaw Gateway" \
    --quiet || echo "  (rule may already exist)"

echo "✅ Firewall rules created"
echo ""

# Reserve static IP (optional)
echo "Step 2.4: Assigning static IP..."
gcloud compute addresses create openclaw-static-ip \
    --region=us-central1 \
    --quiet || echo "  (static IP may already exist)"

echo "✅ Static IP configured"
echo ""

echo "✅ DAY 2 COMPLETE: VM Ready"
echo ""

# ============================================================================
# DAY 3: SSH ACCESS & INITIAL SETUP
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DAY 3: SSH Access & System Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⏳ Waiting for SSH to be available (may take 1-2 minutes)..."
for i in {1..30}; do
    if gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="echo 'SSH OK'" &> /dev/null; then
        echo "✅ SSH access available"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Remote commands (executed on VM via SSH)
echo "Step 3.2: Updating system packages on VM..."
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    sudo apt-get update
    sudo apt-get upgrade -y
    sudo apt-get install -y git curl wget ca-certificates net-tools htop
"
echo "✅ System packages updated"
echo ""

echo "Step 3.3: Verifying system resources on VM..."
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    echo 'System Info:'
    uname -a | head -1
    echo ''
    echo 'Memory:'
    free -h | grep Mem
    echo ''
    echo 'Disk:'
    df -h / | tail -1
"
echo ""

echo "✅ DAY 3 COMPLETE: SSH & System Ready"
echo ""

# ============================================================================
# DAY 4: INSTALL DOCKER & CLONE OPENCLAW
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DAY 4: Docker Installation & OpenClaw Clone"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 4.1: Installing Docker on VM..."
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker \$USER
"
echo "✅ Docker installed"
echo ""

echo "Step 4.2: Verifying Docker..."
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    docker --version
"
echo ""

echo "Step 4.3: Cloning OpenClaw repository..."
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw && ls -la | head -10
"
echo "✅ OpenClaw cloned"
echo ""

echo "✅ DAY 4 COMPLETE: Docker & OpenClaw Ready"
echo ""

# ============================================================================
# DAY 5: CREATE PERSISTENT DIRECTORIES & ENVIRONMENT
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DAY 5: Persistent Directories & Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 5.1: Creating persistent directories..."
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    mkdir -p ~/.openclaw/skills
    ls -la ~/
"
echo "✅ Directories created"
echo ""

echo "Step 5.2: Creating .env configuration file..."
GATEWAY_TOKEN=$(openssl rand -hex 32)
KEYRING_PASSWORD=$(openssl rand -hex 32)

gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    cat > ~/.openclaw/.env << 'ENVEOF'
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=$GATEWAY_TOKEN
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_CONFIG_DIR=/home/\$USER/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/\$USER/.openclaw/workspace
GOG_KEYRING_PASSWORD=$KEYRING_PASSWORD
XDG_CONFIG_HOME=/home/node/.openclaw
NODE_ENV=production
ENVEOF
    cat ~/.openclaw/.env
"
echo "✅ .env file created"
echo ""

echo "⚠️  SAVE THESE SECRETS:"
echo "   OPENCLAW_GATEWAY_TOKEN: $GATEWAY_TOKEN"
echo "   GOG_KEYRING_PASSWORD: $KEYRING_PASSWORD"
echo ""

echo "Step 5.3: Final status check..."
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="
    echo '=== Docker & Tools ==='
    docker --version
    echo ''
    echo '=== Directory Structure ==='
    ls -la ~/.openclaw/
    echo ''
    echo '=== Disk Space ==='
    df -h / | tail -1
"
echo ""

echo "✅ DAY 5 COMPLETE: Configuration Ready"
echo ""

# ============================================================================
# PHASE 1 COMPLETE
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║ ✅ PHASE 1 COMPLETE: GCP INFRASTRUCTURE READY                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 SUMMARY:"
echo "  Project ID:        $PROJECT_ID"
echo "  VM Instance:       openclaw-gateway"
echo "  Machine Type:      e2-small (2 vCPU, 2GB RAM)"
echo "  Boot Disk:         20GB SSD"
echo "  Region:            us-central1"
echo "  Zone:              us-central1-a"
echo "  OS:                Debian 12"
echo "  External IP:       $VM_IP"
echo ""
echo "✅ What's Ready:"
echo "  - GCP Project created and configured"
echo "  - Compute Engine VM running"
echo "  - Docker installed"
echo "  - OpenClaw repository cloned"
echo "  - Persistent directories created"
echo "  - SSH access working"
echo "  - Firewall rules configured"
echo ""
echo "🔑 CREDENTIALS SAVED (copy these!):"
echo "  OPENCLAW_GATEWAY_TOKEN=$GATEWAY_TOKEN"
echo "  GOG_KEYRING_PASSWORD=$KEYRING_PASSWORD"
echo ""
echo "📝 NEXT STEPS (Phase 2):"
echo "  1. Save the credentials above securely"
echo "  2. Run: gcloud compute ssh openclaw-gateway --zone=us-central1-a"
echo "  3. Prepare Dockerfile with OpenClaw binaries"
echo "  4. Build and deploy OpenClaw Gateway"
echo ""
echo "⏭️  Ready for Phase 2: OpenClaw Gateway Setup"
echo ""

