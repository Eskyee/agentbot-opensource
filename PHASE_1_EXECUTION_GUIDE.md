# PHASE 1 EXECUTION SUMMARY & INSTRUCTIONS

**Status:** 🟢 **READY TO EXECUTE**  
**Date:** March 9, 2026  
**Goal:** Deploy OpenClaw Gateway on GCP in 3-4 weeks

---

## 📖 PHASE 1 COMPLETE EXPLANATION

### What is Phase 1?

Phase 1 creates the **GCP infrastructure** (Google Cloud Platform) that will run the OpenClaw Gateway. Think of it as "building the house" before "moving in the furniture" (Phase 2: OpenClaw deployment).

### Architecture Overview

```
Your Laptop (Client)
    ↓
    └─→ SSH Tunnel (Port 22) ──────┐
                                   ↓
                          GCP Cloud
                              ↓
                    ┌──────────────────────┐
                    │  Debian 12 VM        │
                    │  e2-small            │
                    │  (2 vCPU, 2GB RAM)   │
                    │  20GB Disk           │
                    ├──────────────────────┤
                    │ Docker Engine        │
                    │ OpenClaw Repository  │
                    │ Persistent Storage   │
                    │   ~/.openclaw/       │
                    │   ~/.openclaw/work   │
                    └──────────────────────┘
                              ↓
                    Shared Database
                    (PostgreSQL/Redis)
                    (from Agentbot)
```

### Why Phase 1?

**Problem Without Infrastructure:**
- OpenClaw needs to run 24/7
- Can't run on your laptop (not always on, network changes)
- Need persistent storage (survives reboots)
- Need stable, public IP address
- Need auto-restart on crash

**Solution (Phase 1):**
- GCP provides 24/7 VM (always running)
- e2-small = cheap ($12/mo) + reliable
- Persistent storage built-in
- Static IP address included
- VM auto-restarts after crash
- Global data center infrastructure

---

## 🎯 PHASE 1: WHAT YOU BUILD

### Day 1: Create GCP Project (30-60 min)
**Goal:** Set up the GCP account and enable necessary services

**What happens:**
1. Create new GCP project (isolated environment)
2. Link billing account (free tier = $300 credit + 12 months free)
3. Enable Compute Engine API (allows VM creation)
4. Set default zone (us-central1-a = cheapest)

**Result:** GCP account ready for VMs

### Day 2: Create VM Instance (15-30 min)
**Goal:** Launch the virtual machine

**Specifications:**
- Machine Type: e2-small (2 vCPU, 2GB RAM)
- Boot Disk: 20GB SSD (plenty for Docker + data)
- OS: Debian 12 (latest stable Linux)
- Region: us-central1 (cheapest, central USA)
- Zone: us-central1-a
- Firewall: SSH (22) + OpenClaw (18789)

**Result:** Linux VM running, SSH access ready

### Day 3: SSH Setup & System (20-30 min)
**Goal:** Connect to VM and prepare it

**What happens:**
1. SSH into VM (remote terminal)
2. Update Linux packages (security patches)
3. Install basic tools (git, curl, etc.)
4. Verify system resources

**Result:** VM fully updated, ready for software

### Day 4: Docker & OpenClaw (20-30 min)
**Goal:** Install Docker and get code

**What happens:**
1. Install Docker (containerization platform)
2. Install Docker Compose (multi-container orchestration)
3. Clone OpenClaw repository (get source code)
4. Verify installation

**Result:** Docker ready, code on VM

### Day 5: Persistence & Config (15-20 min)
**Goal:** Create directories and configure environment

**What happens:**
1. Create ~/.openclaw (where gateway config lives)
2. Create ~/.openclaw/workspace (agent data)
3. Create .env file (secrets, tokens, ports)
4. Verify everything

**Result:** VM fully ready for Phase 2

---

## 🔧 HOW TO EXECUTE PHASE 1

### Prerequisites

Before you start, you need:

1. **Google Cloud Account**
   - Free tier eligible (no credit card needed for free tier)
   - Or add billing if using paid resources
   - Visit: https://console.cloud.google.com

2. **gcloud CLI installed**
   - Install: https://cloud.google.com/sdk/docs/install
   - Verify: `gcloud --version`

3. **Local Terminal Access**
   - Linux/Mac: Terminal app
   - Windows: PowerShell or WSL

### Option A: Automated Execution (Recommended)

**Simplest approach - runs everything automatically**

```bash
# 1. Install gcloud CLI (if not already installed)
# https://cloud.google.com/sdk/docs/install

# 2. Login to Google Cloud
gcloud auth login

# 3. Download and run the script
bash phase1_setup.sh

# 4. When prompted, open Google Cloud Console to enable billing
# (Manual step only - click "Link Billing Account")

# 5. Script completes automatically
# (Total time: ~20 minutes)
```

**Script does:**
- ✅ Creates GCP project
- ✅ Enables APIs
- ✅ Creates VM instance
- ✅ Configures firewall
- ✅ Installs Docker
- ✅ Clones OpenClaw
- ✅ Creates directories
- ✅ Generates configuration

**Output:**
```
✅ DAY 1 COMPLETE: GCP Project Ready
✅ DAY 2 COMPLETE: VM Ready
✅ DAY 3 COMPLETE: SSH & System Ready
✅ DAY 4 COMPLETE: Docker & OpenClaw Ready
✅ DAY 5 COMPLETE: Configuration Ready

✅ PHASE 1 COMPLETE: GCP INFRASTRUCTURE READY

📊 SUMMARY:
  Project ID:        agentbot-openclaw-XXXXXXXXX
  VM Instance:       openclaw-gateway
  External IP:       XXX.XXX.XXX.XXX
  OPENCLAW_GATEWAY_TOKEN: abc123def456...
  GOG_KEYRING_PASSWORD: xyz789abc456...
```

### Option B: Manual Execution (Learn as you go)

**For those who want to understand each step**

```bash
# Read the complete guide
cat PHASE_1_GCP_INFRASTRUCTURE_COMPLETE_GUIDE.md

# Then follow the Day 1-5 instructions manually
# Each day has step-by-step commands to run
```

---

## 🔐 SECURITY & SECRETS

### During Phase 1 Setup

Two secrets are generated automatically:

1. **OPENCLAW_GATEWAY_TOKEN**
   - 64-character hex string
   - Used to authenticate OpenClaw clients
   - Save securely (password manager)
   - Example: `a1b2c3d4e5f6g7h8...`

2. **GOG_KEYRING_PASSWORD**
   - 64-character hex string
   - Encrypts Gmail/OAuth credentials
   - Save securely (password manager)
   - Example: `x9y8z7w6v5u4t3s2...`

### Storing Secrets

✅ **Good places:**
- Password manager (1Password, Bitwarden, LastPass)
- Secure note in encrypted app
- KeePass database

❌ **Bad places:**
- GitHub (will be detected, account compromised)
- Plain text files on laptop
- Email
- Slack/Discord messages

---

## ✅ VERIFICATION CHECKLIST

After Phase 1, verify everything is ready:

```bash
# 1. Check GCP Project
gcloud config list project

# 2. Check VM is Running
gcloud compute instances list
# Should show: openclaw-gateway  RUNNING

# 3. Check SSH Access
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="echo 'SSH OK'"

# 4. Check Docker
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="docker --version"

# 5. Check OpenClaw
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="cd openclaw && ls -la"

# 6. Check Persistent Directories
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="ls -la ~/.openclaw/"

# 7. Check Environment
gcloud compute ssh openclaw-gateway --zone=us-central1-a --command="cat ~/.openclaw/.env"
```

**Expected output:** All commands return successfully with no errors ✅

---

## 📊 COST BREAKDOWN

### Free Tier (First 12 Months or $300 Credit)
- e2-micro: Always free
- 30GB SSD storage: Free/month
- 1TB data transfer: Free/month
- 24 hours always-free VM: Free

### After Free Tier Expires
| Resource | Cost | Notes |
|----------|------|-------|
| e2-small VM | $0.0379/hour | ~$27/month |
| Compute: 60 GB storage | $0.80/month | Boot disk only |
| Data transfer | Free (first 1TB) | Or $0.12/GB after |
| **Total** | **~$12/month** | Cheapest option |

### Optimization Options
- **e2-micro** (free tier): May fail Docker builds (1GB RAM)
- **e2-small** (recommended): $12/mo, reliable
- **e2-medium**: $24/mo, faster builds, more reliable

---

## 🚨 TROUBLESHOOTING PHASE 1

### "SSH connection refused"
**Cause:** SSH keys haven't propagated yet (1-2 min after VM creation)  
**Fix:** Wait 2 minutes and retry
```bash
sleep 120
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

### "Quota exceeded"
**Cause:** Free tier limits reached  
**Fix:** Check limits, may need paid account or different region

### "VM won't start / out of memory"
**Cause:** e2-micro too small for Docker  
**Fix:** Upgrade to e2-small (see cost table above)

### "Docker build fails with code 137"
**Cause:** Out of memory (OOM killer)  
**Fix:** Upgrade to e2-medium (2GB → 4GB RAM)

---

## ⏱️ TIMELINE

### Day 1: 30-60 minutes
- Create GCP project
- Enable APIs
- Set defaults
- Link billing

### Day 2: 15-30 minutes
- Create VM
- Configure firewall
- Reserve static IP
- Verify instance

### Day 3: 20-30 minutes
- SSH access
- Update packages
- Install tools
- Verify system

### Day 4: 20-30 minutes
- Install Docker
- Install Docker Compose
- Clone OpenClaw
- Verify installation

### Day 5: 15-20 minutes
- Create directories
- Generate configuration
- Create .env file
- Final verification

### Total: ~2 hours of actual work
### Waiting time: ~3 hours (mostly automated)
### Can be done in: 1 day if dedicated time

---

## 📝 NEXT STEPS (After Phase 1)

Once Phase 1 is complete:

1. **Save credentials** (copy GATEWAY_TOKEN and KEYRING_PASSWORD)
2. **Connect to VM:** `gcloud compute ssh openclaw-gateway --zone=us-central1-a`
3. **Move to Phase 2:** Build Dockerfile with OpenClaw binaries
4. **Deploy gateway:** `docker compose up` (Phase 2)

---

## 🎯 READY?

### To Execute Phase 1:

**Option A (Automated):**
```bash
bash phase1_setup.sh
```

**Option B (Manual):**
```bash
cat PHASE_1_GCP_INFRASTRUCTURE_COMPLETE_GUIDE.md
# Then follow instructions
```

**Option C (Console GUI):**
- Visit https://console.cloud.google.com
- Follow GCP console wizard
- Create VM manually through web interface

---

## ✨ PHASE 1 SUCCESS CRITERIA

After Phase 1 completes successfully, you should have:

✅ GCP project created and configured  
✅ Compute Engine VM running (e2-small, Debian 12)  
✅ Docker installed and verified  
✅ Docker Compose working  
✅ OpenClaw repository cloned  
✅ Persistent directories created (~/.openclaw/)  
✅ Environment file configured (.env)  
✅ SSH access working  
✅ Firewall rules in place (SSH + 18789)  
✅ Static IP assigned  
✅ Credentials saved securely  

**Result:** Infrastructure ready for Phase 2 ✅

---

**Ready to build OpenClaw Gateway? Phase 1 starts here! 🚀**

