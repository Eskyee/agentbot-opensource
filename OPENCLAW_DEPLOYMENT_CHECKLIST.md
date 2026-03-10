# OpenClaw Deployment Checklist - Agentbot Analysis

**Date:** March 9, 2026  
**Status:** 🟡 **PARTIALLY IMPLEMENTED - GCP DEPLOYMENT NEEDED**

---

## 📋 OpenClaw Hosting & Deployment Checklist

### Section 1: Infrastructure Setup

| Item | Status | Notes |
|------|--------|-------|
| GCP Project | ❌ **NOT DONE** | Need to create GCP project |
| GCP Billing | ❌ **NOT DONE** | Need to enable billing |
| Compute Engine API | ❌ **NOT DONE** | Need to enable on GCP |
| Compute Engine VM | ❌ **NOT DONE** | Need e2-small minimum |
| VM Specs (20GB disk) | ❌ **NOT DONE** | Required for persistent storage |
| SSH Access | ✅ **READY** | Can use gcloud or console |

**Impact:** Infrastructure layer completely missing

---

### Section 2: Container & Runtime

| Item | Status | Notes |
|------|--------|-------|
| Docker Installation | ✅ **DONE** | Already installed locally |
| Docker Compose | ✅ **DONE** | Configured in `docker-compose.yml` |
| Docker Group | ⚠️ **PARTIAL** | Done locally, needs repeating on GCP VM |
| Docker Image Build | ✅ **DONE** | Working locally & on Vercel |
| Persistent Volumes | ⚠️ **PARTIAL** | Configured locally, needs GCP host volumes |

**Impact:** Runtime setup exists but needs GCP VM adaptation

---

### Section 3: Configuration

| Item | Status | Notes |
|------|--------|-------|
| `.env` File | ✅ **DONE** | Created (dev & production) |
| Environment Variables | ✅ **DONE** | All configured |
| `docker-compose.yml` | ✅ **DONE** | Configured with volumes |
| Persistent Directories | ⚠️ **PARTIAL** | Local: ~/.openclaw exists, needs GCP path |
| Config Directory `/home/node/.openclaw` | ❌ **NOT DONE** | Needs GCP user mapping |
| Workspace Directory | ❌ **NOT DONE** | Needs GCP path `/home/$USER/.openclaw/workspace` |

**Impact:** Config exists but targeting Vercel, not GCP

---

### Section 4: Binary Installation (Critical)

| Item | Status | Notes |
|------|--------|-------|
| Dockerfile with Baked Binaries | ⚠️ **PARTIAL** | Multi-stage build exists, missing OpenClaw binaries |
| Gmail CLI (gog) | ❌ **NOT DONE** | Not in Dockerfile |
| Google Places CLI (goplaces) | ❌ **NOT DONE** | Not in Dockerfile |
| WhatsApp CLI (wacli) | ❌ **NOT DONE** | Not in Dockerfile |
| socat | ❌ **NOT DONE** | Not in Dockerfile |
| Binary Verification | ❌ **NOT DONE** | No `which` commands in build |

**Impact:** Missing OpenClaw-specific binaries in Docker image

---

### Section 5: Gateway Configuration

| Item | Status | Notes |
|------|--------|-------|
| OPENCLAW_GATEWAY_TOKEN | ❌ **NOT DONE** | Not in `.env` |
| OPENCLAW_GATEWAY_BIND | ❌ **NOT DONE** | Not configured (should be "lan") |
| OPENCLAW_GATEWAY_PORT | ❌ **NOT DONE** | Not configured (OpenClaw uses 18789) |
| GOG_KEYRING_PASSWORD | ❌ **NOT DONE** | Not in `.env` |
| XDG_CONFIG_HOME | ❌ **NOT DONE** | Not configured |
| Control UI Origins | ❌ **NOT DONE** | Needs `allowedOrigins` config |

**Impact:** OpenClaw-specific gateway config missing

---

### Section 6: Launch & Verification

| Item | Status | Notes |
|------|--------|-------|
| Build Image | ⚠️ **PARTIAL** | Works for Vercel, needs GCP build |
| Start Container | ✅ **DONE** | docker compose up works locally |
| Verify Logs | ✅ **DONE** | docker logs command available |
| Port Binding | ⚠️ **PARTIAL** | Currently 3000/3001 for Agentbot, not 18789 |
| SSH Tunnel | ❌ **NOT DONE** | Needs `gcloud compute ssh` tunnel config |
| Access from Laptop | ❌ **NOT DONE** | No SSH tunnel setup |
| Dashboard Link Generation | ❌ **NOT DONE** | No `openclaw-cli` commands |

**Impact:** Verification process different from OpenClaw standard

---

### Section 7: Persistence

| Item | Status | Notes |
|------|--------|-------|
| Gateway Config Persistence | ⚠️ **PARTIAL** | Volume configured, wrong path |
| Model Auth Profiles | ⚠️ **PARTIAL** | DB-based, not filesystem |
| Skill Configs | ❌ **NOT DONE** | No `~/.openclaw/skills/` directory |
| Agent Workspace | ⚠️ **PARTIAL** | Runtime data exists, not in OpenClaw format |
| WhatsApp Session | ❌ **NOT DONE** | No WhatsApp integration |
| Gmail Keyring | ❌ **NOT DONE** | No Gmail keyring setup |
| Binary Persistence | ⚠️ **PARTIAL** | Docker image based, missing OpenClaw binaries |

**Impact:** Persistence model different, needs mapping

---

### Section 8: Maintenance & Updates

| Item | Status | Notes |
|------|--------|-------|
| Update Process | ⚠️ **PARTIAL** | `git pull && docker compose up` works |
| OpenClaw Version Tracking | ❌ **NOT DONE** | No OpenClaw versioning in code |
| Rebuild Process | ✅ **DONE** | `docker compose build` available |

**Impact:** Update process needs OpenClaw-specific steps

---

## 🎯 What We Have vs What OpenClaw Expects

### ✅ What We Have (Agentbot Platform)
```
✅ Next.js frontend (Vercel deployment)
✅ Express backend API (port 3001)
✅ PostgreSQL database
✅ Redis cache
✅ Docker Compose setup
✅ GitHub Actions CI/CD
✅ Security middleware
✅ 50+ API endpoints
✅ Multi-provider auth (OAuth, Email, Wallet)
✅ Token gating ($RAVE on Base)
```

### ❌ What We're Missing (OpenClaw-specific)
```
❌ OpenClaw Gateway (ws://0.0.0.0:18789)
❌ GCP VM infrastructure
❌ OpenClaw CLI integration
❌ OpenClaw binaries (gog, goplaces, wacli, socat)
❌ OpenClaw configuration directory (~/.openclaw)
❌ OpenClaw workspace (/workspace)
❌ Model auth keyring
❌ WhatsApp integration
❌ Gmail OAuth keyring
❌ Messaging channels setup
❌ Node pairing configuration
```

---

## 📊 Deployment Comparison

| Aspect | Agentbot (Current) | OpenClaw (Required) |
|--------|------------------|-------------------|
| **Platform** | Vercel (serverless) | GCP Compute Engine (VM) |
| **Runtime** | Next.js/Node.js | OpenClaw Gateway |
| **Port** | 3000 (frontend), 3001 (API) | 18789 (WebSocket) |
| **Storage** | PostgreSQL + Redis | ~/.openclaw/ + workspace |
| **Deployment** | CI/CD via Vercel | Manual GCP VM + SSH |
| **Scaling** | Auto-scaling (Vercel) | Single VM (fixed size) |
| **Cost** | $20-50/mo | $5-12/mo (e2-small) |
| **State** | Database-backed | Filesystem-backed |

---

## 🚀 Missing Implementation Roadmap

### Phase 1: GCP Infrastructure (Week 1)
```
❌ Create GCP project
❌ Enable Compute Engine API
❌ Create e2-small VM (Debian 12)
❌ Install Docker on VM
❌ Clone OpenClaw repository
❌ Create persistent directories
```

### Phase 2: OpenClaw Gateway (Week 2)
```
❌ Create OpenClaw-specific .env
❌ Configure docker-compose.yml for gateway
❌ Create Dockerfile with OpenClaw binaries
❌ Build image with gog, goplaces, wacli
❌ Deploy gateway container
❌ Configure allowed origins
```

### Phase 3: Integration (Week 3)
```
❌ Set up messaging channels (Telegram, WhatsApp, Discord)
❌ Configure node pairing
❌ Connect to model providers
❌ Test skill execution
❌ Verify persistence
```

### Phase 4: Production Hardening (Week 4)
```
❌ Service account setup
❌ Firewall configuration
❌ Backup strategy
❌ Monitoring setup
❌ Update procedure documentation
```

---

## 💡 Strategic Approach

### Option A: Parallel Deployment (Recommended)
Keep Agentbot on Vercel (serverless) + Deploy OpenClaw on GCP (VM)
- **Pros:** Both platforms coexist, no disruption, clear separation
- **Cons:** Dual infrastructure to maintain
- **Cost:** ~$20-50/mo (Vercel) + $5-12/mo (GCP) = $25-62/mo

### Option B: Migrate to GCP-only
Move entire Agentbot stack to GCP VMs
- **Pros:** Single infrastructure, lower cost, full control
- **Cons:** Major migration, need DevOps expertise, lose Vercel's CDN
- **Cost:** ~$15-50/mo (depending on machine types)

### Option C: Hybrid
Agentbot frontend on Vercel + OpenClaw Gateway on GCP + Shared database
- **Pros:** Best of both worlds, serverless UI + persistent backend
- **Cons:** Network latency between Vercel and GCP, cross-region complexity
- **Cost:** ~$25-60/mo + database hosting

---

## ✅ Recommendation

**Use Option A (Parallel Deployment) for Phase 1:**

1. Keep current Agentbot on Vercel (working, proven)
2. Deploy OpenClaw Gateway on GCP e2-small VM
3. Establish clear integration points
4. Plan migration to Option B or C after stabilization

**Timeline:**
- Phase 1: 5 days (GCP setup)
- Phase 2: 7 days (OpenClaw Gateway)
- Phase 3: 5 days (Integration)
- Phase 4: 5 days (Hardening)
- **Total:** ~3 weeks to production-ready OpenClaw

---

## 🎯 First Steps

1. **Create GCP Project:**
   ```bash
   gcloud projects create agentbot-openclaw --name="Agentbot OpenClaw"
   gcloud config set project agentbot-openclaw
   gcloud services enable compute.googleapis.com
   ```

2. **Create VM:**
   ```bash
   gcloud compute instances create openclaw-gateway \
     --zone=us-central1-a \
     --machine-type=e2-small \
     --boot-disk-size=20GB \
     --image-family=debian-12 \
     --image-project=debian-cloud
   ```

3. **SSH into VM:**
   ```bash
   gcloud compute ssh openclaw-gateway --zone=us-central1-a
   ```

4. **Install Docker & Clone:**
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   git clone https://github.com/openclaw/openclaw.git
   cd openclaw
   ```

5. **Create Environment:**
   ```bash
   mkdir -p ~/.openclaw ~/.openclaw/workspace
   cat > .env << EOF
   OPENCLAW_IMAGE=openclaw:latest
   OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
   OPENCLAW_GATEWAY_BIND=lan
   OPENCLAW_GATEWAY_PORT=18789
   OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
   OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace
   GOG_KEYRING_PASSWORD=$(openssl rand -hex 32)
   XDG_CONFIG_HOME=/home/node/.openclaw
   EOF
   ```

---

## 📊 Status Summary

| Category | Completeness | Action |
|----------|--------------|--------|
| Infrastructure | 0% | Deploy GCP VM |
| Runtime Setup | 60% | Adapt to GCP |
| Configuration | 40% | Add OpenClaw vars |
| Binaries | 0% | Bake into Docker |
| Gateway | 0% | Deploy on port 18789 |
| Integration | 0% | Connect messaging |
| Testing | 0% | Verify workflow |

**Overall: 14% Complete → Need 86% more work for full OpenClaw deployment**

---

**Next Action:** Decide between Option A (Parallel), Option B (Migrate), or Option C (Hybrid), then begin Phase 1 GCP setup.

