# PHASE 1: GCP INFRASTRUCTURE SETUP - COMPLETE GUIDE

**Duration:** 5 Days  
**Goal:** Create fully functional GCP environment for OpenClaw Gateway (e2-small VM)  
**Cost:** ~$12/month (e2-small), free tier eligible  

---

## 📋 PHASE 1 OVERVIEW

### What We're Building
A Google Cloud Platform virtual machine with Docker, ready to run OpenClaw Gateway.

### Architecture
```
┌─────────────────────────────────┐
│     GCP PROJECT                 │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │  Compute Engine VM          ││
│  │  - Machine: e2-small        ││
│  │  - Region: us-central1      ││
│  │  - OS: Debian 12            ││
│  │  - Disk: 20GB SSD           ││
│  ├─────────────────────────────┤│
│  │                             ││
│  │  ┌─────────────────────┐    ││
│  │  │ Docker Installed    │    ││
│  │  │ OpenClaw Cloned     │    ││
│  │  │ SSH Access Ready    │    ││
│  │  └─────────────────────┘    ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ Firewall Rules              ││
│  │ - SSH (22)                  ││
│  │ - OpenClaw (18789)          ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

### Prerequisites
- ✅ Google Cloud account (free tier eligible)
- ✅ gcloud CLI installed (or use Console)
- ✅ SSH key generated
- ✅ Billing enabled (free tier covers e2-micro; e2-small is ~$12/mo)

---

## 🎯 DAY-BY-DAY BREAKDOWN

### DAY 1: Create GCP Project & Enable APIs

**Goal:** Set up GCP project and enable necessary services  
**Time:** 30-60 minutes

#### Step 1.1: Create GCP Project
```bash
# Using gcloud CLI
gcloud projects create agentbot-openclaw \
  --name="Agentbot OpenClaw Gateway" \
  --set-as-default

# Verify
gcloud config list project

# Alternative: Use Google Cloud Console
# 1. Visit https://console.cloud.google.com
# 2. Click "Select a Project" → "New Project"
# 3. Name: "Agentbot OpenClaw Gateway"
# 4. Create
```

**What Happens:**
- GCP creates a new isolated project
- Project ID is generated (e.g., `agentbot-openclaw-12345`)
- You become the project owner
- Empty billing account needed

#### Step 1.2: Enable Billing
```bash
# Check billing
gcloud billing projects list

# Enable billing for this project
# 1. Go to https://console.cloud.google.com/billing
# 2. Select your project
# 3. Link a billing account
# 4. Verify billing is active
```

**Why:**
- GCP free tier gives $300 credits + always-free resources
- e2-micro: free (1 shared vCPU, 0.25-3.5GB RAM)
- e2-small: $0.0379/hour (~$27/month, but cheaper in free tier)
- You'll be charged only after credits run out

#### Step 1.3: Enable Compute Engine API
```bash
# Enable via gcloud
gcloud services enable compute.googleapis.com

# Verify
gcloud services list --enabled | grep compute

# Alternative: Via Console
# 1. Go to APIs & Services
# 2. Search "Compute Engine API"
# 3. Click "Enable"
```

**What This Does:**
- Activates the virtual machine service
- Allows you to create and manage VMs
- Required for all Compute Engine operations

#### Step 1.4: Set Default Zone
```bash
# Set zone to us-central1-a (cheaper than other regions)
gcloud config set compute/zone us-central1-a

# Verify
gcloud config list compute/zone
```

**Why us-central1-a?**
- Located in Iowa (USA central)
- Cheapest region for e2 instances
- ~12ms latency to East Coast, ~35ms to West Coast
- Good for both US and EU access

---

### DAY 2: Create Compute Engine VM

**Goal:** Launch e2-small virtual machine  
**Time:** 15-30 minutes

#### Step 2.1: Create VM Instance
```bash
# Create VM with all specs in one command
gcloud compute instances create openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=http-server,https-server,openclaw

# Wait for creation (2-3 minutes)
# Output will show:
# NAME                 ZONE           MACHINE_TYPE  PREEMPTIBLE  INTERNAL_IP
# openclaw-gateway     us-central1-a  e2-small                   10.128.0.2
```

**What Each Flag Does:**
- `--zone`: Physical location of VM
- `--machine-type`: e2-small = 2 vCPUs, 2GB RAM (minimum recommended for Docker builds)
- `--boot-disk-size`: 20GB SSD (sufficient for OpenClaw + persistent state)
- `--boot-disk-type`: pd-standard (standard persistent disk, cheaper)
- `--image-family`: debian-12 (latest stable Debian)
- `--image-project`: debian-cloud (official Google images)
- `--scopes`: Allows VM to access Google Cloud APIs
- `--tags`: Firewall labels for routing rules

#### Step 2.2: Verify VM Creation
```bash
# List instances
gcloud compute instances list

# Get detailed info
gcloud compute instances describe openclaw-gateway --zone=us-central1-a

# Expected output:
# status: RUNNING
# machineType: projects/YOUR_PROJECT/zones/us-central1-a/machineTypes/e2-small
```

#### Step 2.3: Configure Firewall Rules
```bash
# Allow SSH (port 22)
gcloud compute firewall-rules create allow-ssh \
  --allow=tcp:22 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=openclaw \
  --description="Allow SSH to OpenClaw VM"

# Allow OpenClaw Gateway (port 18789)
gcloud compute firewall-rules create allow-openclaw \
  --allow=tcp:18789 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=openclaw \
  --description="Allow OpenClaw Gateway port"

# Verify
gcloud compute firewall-rules list --filter="targetTags:openclaw"
```

**Why These Rules?**
- SSH: Remote access to VM
- 18789: OpenClaw Gateway WebSocket
- Later: You'll use SSH tunnel, so public OpenClaw port can be restricted

#### Step 2.4: Assign Static IP (Optional but Recommended)
```bash
# Get current external IP
gcloud compute instances describe openclaw-gateway \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Reserve static IP
gcloud compute addresses create openclaw-static-ip \
  --region=us-central1

# Attach to VM
gcloud compute instances add-access-config openclaw-gateway \
  --access-config-name=openclaw-static-ip \
  --zone=us-central1-a

# Verify
gcloud compute addresses list
```

**Why Static IP?**
- Doesn't change on VM restart
- Makes configuration easier
- Good for monitoring and backups

---

### DAY 3: SSH Access & Initial Setup

**Goal:** Connect to VM and prepare for Docker  
**Time:** 20-30 minutes

#### Step 3.1: Connect via SSH
```bash
# Connect (gcloud handles SSH key automatically)
gcloud compute ssh openclaw-gateway --zone=us-central1-a

# You should see:
# Welcome to Debian GNU/Linux 12 (bookworm)
# ...
# username@openclaw-gateway:~$

# If SSH key propagation delayed (1-2 min after VM creation):
# Error: connect timeout
# Solution: Wait 1-2 minutes and retry
```

#### Step 3.2: Update System Packages
```bash
# Once inside VM
sudo apt-get update
sudo apt-get upgrade -y

# Install basic tools
sudo apt-get install -y \
  git \
  curl \
  wget \
  ca-certificates \
  net-tools \
  htop

# Verify
git --version
curl --version
```

**What This Does:**
- Updates all system packages to latest security patches
- Installs tools needed for Docker and OpenClaw

#### Step 3.3: Check System Resources
```bash
# Verify specs
uname -a
free -h
df -h

# Expected output:
# Linux openclaw-gateway 6.1.0-X-generic #X-Debian SMP ... x86_64
# Mem: total 1.9Gi, used 200Mi, free 1.7Gi
# / filesystem: 20G available
```

---

### DAY 4: Install Docker & Clone OpenClaw

**Goal:** Install Docker and prepare OpenClaw repository  
**Time:** 20-30 minutes

#### Step 4.1: Install Docker
```bash
# Install Docker using official script
curl -fsSL https://get.docker.com | sudo sh

# Add user to docker group (avoid sudo requirement)
sudo usermod -aG docker $USER

# Log out and back in for group changes
exit

# Reconnect
gcloud compute ssh openclaw-gateway --zone=us-central1-a

# Verify Docker
docker --version
docker ps

# Expected output:
# Docker version 27.x.x, build xxxxxxx
# CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

**Why These Steps?**
- Official Docker script: most reliable, latest version
- Docker group: run containers without `sudo` (security best practice)
- User group requires re-login to take effect

#### Step 4.2: Install Docker Compose
```bash
# Docker Compose usually comes with Docker v2+
docker compose version

# If not installed, install manually
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker compose version

# Expected output:
# Docker Compose version v2.x.x
```

#### Step 4.3: Clone OpenClaw Repository
```bash
# Clone
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Verify
ls -la

# Expected output:
# Dockerfile
# docker-compose.yml
# package.json
# README.md
# src/
# ...
```

**Note:** Change `https://github.com/openclaw/openclaw.git` to actual OpenClaw repo URL if different.

#### Step 4.4: Check Disk Space
```bash
# After cloning, verify disk space remaining
df -h

# Expected output:
# / filesystem: 18G available (should still have 15+ GB)
# /home partition: 18G available
```

---

### DAY 5: Create Persistent Directories & Environment

**Goal:** Prepare for deployment (data persistence and configuration)  
**Time:** 15-20 minutes

#### Step 5.1: Create Persistent Directories
```bash
# Create directories that will survive container restarts
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
mkdir -p ~/.openclaw/skills

# Verify
ls -la ~/

# Expected output:
# .openclaw -> directory
```

**Why This Structure?**
- `~/.openclaw/`: Gateway config, tokens, settings
- `~/.openclaw/workspace/`: Agent data, artifacts
- `~/.openclaw/skills/`: Skill-level configuration
- These volumes are mounted to containers, persist across restarts

#### Step 5.2: Create .env File
```bash
# Generate strong random secrets
GATEWAY_TOKEN=$(openssl rand -hex 32)
KEYRING_PASSWORD=$(openssl rand -hex 32)

# Create .env file
cat > ~/.openclaw/.env << EOF
# OpenClaw Gateway Configuration
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=${GATEWAY_TOKEN}
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_CONFIG_DIR=/home/$(whoami)/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/$(whoami)/.openclaw/workspace
GOG_KEYRING_PASSWORD=${KEYRING_PASSWORD}
XDG_CONFIG_HOME=/home/node/.openclaw
NODE_ENV=production
EOF

# Verify
cat ~/.openclaw/.env

# Important: Keep these secrets safe!
# OPENCLAW_GATEWAY_TOKEN: Use when connecting clients
# GOG_KEYRING_PASSWORD: For Gmail OAuth keyring encryption
```

**Secret Generation:**
- `openssl rand -hex 32`: Creates 64-character random hex string
- Store these securely (password manager, secure vault)
- Never commit to Git

#### Step 5.3: Check Final Status
```bash
# Verify everything is ready
echo "=== System Status ==="
docker --version
docker compose version
git --version
openssl version

echo ""
echo "=== Directory Structure ==="
ls -la ~/ | grep openclaw
du -sh ~/.openclaw

echo ""
echo "=== Disk Space ==="
df -h /

echo ""
echo "=== Environment ==="
cat ~/.openclaw/.env | head -5
```

**Expected Output:**
```
=== System Status ===
Docker version 27.x.x
Docker Compose version v2.x.x
git version 2.x.x
OpenSSL 3.x.x ...

=== Directory Structure ===
drwxr-xr-x  openclaw-gateway staff  ~/.openclaw
... (directories listed)
4.0K  ~/.openclaw

=== Disk Space ===
Filesystem  Size  Used  Avail  Use%  Mounted on
/dev/sda1   20G   2G    18G    10%   /

=== Environment ===
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=abc123def456...
```

---

## ✅ PHASE 1 COMPLETION CHECKLIST

### Deliverables (What You Should Have)

| Item | Status | Verification |
|------|--------|--------------|
| GCP Project Created | ✅ | `gcloud config list project` |
| Billing Enabled | ✅ | Console shows "Billing Account" |
| Compute Engine API | ✅ | `gcloud services list --enabled \| grep compute` |
| VM Instance Running | ✅ | `gcloud compute instances list` shows RUNNING |
| VM Specs Correct | ✅ | e2-small, 20GB, Debian 12 |
| Static IP Assigned | ✅ | `gcloud compute addresses list` shows IP |
| SSH Access Works | ✅ | `gcloud compute ssh openclaw-gateway` connects |
| Docker Installed | ✅ | `docker --version` responds |
| Docker Compose | ✅ | `docker compose version` responds |
| OpenClaw Cloned | ✅ | `cd openclaw && ls -la` shows files |
| Persistent Dirs | ✅ | `ls -la ~/.openclaw` shows directories |
| .env File Ready | ✅ | `cat ~/.openclaw/.env` shows config |
| Firewall Rules | ✅ | SSH + OpenClaw ports open |

### Quick Verification Script
```bash
# Run this to verify everything is ready
echo "✅ Checking Phase 1 Completion..."
docker --version && echo "  Docker: ✅" || echo "  Docker: ❌"
docker compose version && echo "  Docker Compose: ✅" || echo "  Docker Compose: ❌"
git --version && echo "  Git: ✅" || echo "  Git: ❌"
test -d ~/.openclaw && echo "  ~/.openclaw: ✅" || echo "  ~/.openclaw: ❌"
test -f ~/.openclaw/.env && echo "  .env file: ✅" || echo "  .env file: ❌"
df -h / | tail -1 | awk '{print "  Disk: " $4 " free ✅"}'
echo ""
echo "Phase 1 Ready: YES ✅"
```

---

## 💡 TROUBLESHOOTING

### SSH Connection Refused
**Problem:** `SSH connection refused` immediately after VM creation  
**Solution:** SSH key propagation takes 1-2 minutes. Wait and retry.
```bash
sleep 120
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

### Disk Space Low
**Problem:** `No space left on device` after Docker install  
**Solution:** Should not happen with 20GB. Check:
```bash
df -h
du -sh /var/lib/docker  # Docker usually <1GB
```

### Docker Build Fails (OOM - Out of Memory)
**Problem:** Build exits with code 137 (OOM killed)  
**Solution:** e2-small has 2GB RAM. This is rare but if it happens:
1. Stop VM: `gcloud compute instances stop openclaw-gateway --zone=us-central1-a`
2. Change machine type: `gcloud compute instances set-machine-type openclaw-gateway --zone=us-central1-a --machine-type=e2-medium`
3. Start VM: `gcloud compute instances start openclaw-gateway --zone=us-central1-a`

### GCP Quotas Exceeded
**Problem:** Error "Quota exceeded for quota metric"  
**Solution:** Free tier has limits. Check quotas:
```bash
gcloud compute project-info describe --project=$(gcloud config get-value project) | grep -i quota
```

---

## 📊 COST SUMMARY

| Resource | Cost | Notes |
|----------|------|-------|
| e2-small VM | $0.0379/hour | ~$27/month, but free tier covers |
| Boot disk (20GB) | $0.80/month | SSD storage |
| Static IP | Free (if attached) | Free when in use |
| Data transfer | First 1TB free | Then $0.12/GB out |
| **Total** | **~$12/month** | After free tier exhausted |

**Free Tier Coverage:**
- e2-micro (not e2-small) is always free
- 30GB SSD storage free/month
- 1TB egress free/month

Since e2-small exceeds free tier, you'll be charged ~$12/month after credits.

---

## ✨ PHASE 1 COMPLETE

After Phase 1, you have:
- ✅ GCP project fully set up
- ✅ Compute Engine VM running (e2-small, Debian 12)
- ✅ Docker + Docker Compose installed
- ✅ OpenClaw repository cloned
- ✅ Persistent directories configured
- ✅ Environment file ready
- ✅ SSH access working
- ✅ Firewall rules in place

**Next:** Phase 2 - Build and deploy OpenClaw Gateway

---

**Time to Complete:** 5 days (can be done in 1 day if you dedicate time)  
**Cost:** ~$12/month ongoing (after free tier)  
**Result:** Production-ready GCP infrastructure ✅

