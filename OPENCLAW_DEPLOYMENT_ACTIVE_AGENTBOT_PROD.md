# OPENCLAW GATEWAY DEPLOYMENT STRATEGY
## With Active agentbot-prod (Non-Destructive Approach)

**Date:** March 9, 2026  
**Status:** 🟢 **STRATEGIC PLAN - SAFE DEPLOYMENT**  
**Goal:** Deploy OpenClaw Gateway WITHOUT disrupting active agentbot-prod

---

## 📊 YOUR CURRENT INFRASTRUCTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  VERCEL (Serverless CDN)                                    │
│  ├─ https://agentbot.raveculture.xyz ✅ LIVE               │
│  ├─ 122 pages deployed                                      │
│  ├─ 50+ APIs operational                                    │
│  └─ Auto-scaling, HTTPS, CDN                                │
│                                                              │
│  GCP PROJECT: raveculture-youtube-api                       │
│  └─ VM: agentbot-prod                                       │
│     ├─ IP: 34.170.109.115 (external)                       │
│     ├─ Zone: us-central1-a                                  │
│     ├─ Status: ACTIVE ⚠️ DO NOT MODIFY                     │
│     └─ Running: [TBD - what services?]                     │
│                                                              │
│  LOCAL DOCKER (Development)                                 │
│  ├─ PostgreSQL (healthy)                                    │
│  ├─ Redis (healthy)                                         │
│  ├─ API (3001)                                              │
│  ├─ Frontend (3000)                                         │
│  └─ Worker (running)                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 STRATEGIC OPTIONS FOR OPENCLAW

### **OPTION 1: Create NEW VM in Same Project (RECOMMENDED)**

**Pros:**
- ✅ Keeps agentbot-prod untouched (safe)
- ✅ Uses existing GCP project (less overhead)
- ✅ Both can share PostgreSQL database (if desired)
- ✅ Same zone, same network
- ✅ Clear separation of concerns

**Cons:**
- ❌ Two VMs in same project (small overhead)
- ❌ Slight cost increase (~$12/mo more)

**Implementation:**
```bash
# Create new VM for OpenClaw
gcloud compute instances create openclaw-gateway \
  --project=raveculture-youtube-api \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --tags=openclaw

# Result: Two VMs in same project, same zone
agentbot-prod      34.170.109.115  ACTIVE ✅
openclaw-gateway   [NEW IP]        READY  ✅
```

---

### **OPTION 2: Create NEW Project (Most Isolated)**

**Pros:**
- ✅ Complete isolation from agentbot-prod
- ✅ Fresh quotas for OpenClaw
- ✅ Independent scaling
- ✅ No cross-project dependencies

**Cons:**
- ❌ Separate GCP project to manage
- ❌ More complex architecture
- ❌ Harder to share resources

**Implementation:**
```bash
# Create new project
gcloud projects create agentbot-openclaw-prod \
  --name="Agentbot OpenClaw Gateway" \
  --set-as-default

# Set billing, enable APIs, create VM in new project
# (Same as Phase 1 guide, but in new project)
```

---

### **OPTION 3: Add OpenClaw to agentbot-prod (RISKY)**

**Pros:**
- ✅ Single VM management
- ✅ Shared resources
- ✅ Lowest cost

**Cons:**
- ❌ Risk of disrupting active service
- ❌ Resource contention
- ❌ Harder to debug issues
- ❌ NOT RECOMMENDED while active

**Decision: ❌ Skip this option (too risky)**

---

## 🏆 RECOMMENDATION: OPTION 1

**Create new VM in same project as agentbot-prod**

**Reasons:**
1. agentbot-prod stays untouched (safe)
2. Uses existing project (less overhead)
3. Same zone (low latency between them)
4. Clear separation
5. Can share database if needed

**Architecture Result:**
```
GCP Project: raveculture-youtube-api
├─ VM 1: agentbot-prod (34.170.109.115) ✅ ACTIVE
│  └─ Running: [your existing services]
│
├─ VM 2: openclaw-gateway (NEW IP) 🚀 NEW
│  └─ Running: OpenClaw Gateway
│
└─ Shared Resources:
   ├─ PostgreSQL (both can connect)
   ├─ Firewall rules
   ├─ VPC network
   └─ Static IPs
```

---

## 📋 MODIFIED PHASE 1: OPTION 1 IMPLEMENTATION

### Prerequisites
- ✅ GCP project exists: raveculture-youtube-api
- ✅ gcloud CLI configured
- ✅ agentbot-prod is active (leave alone)

### Day 1: Create OpenClaw VM in Same Project

```bash
# 1. Set project context
gcloud config set project raveculture-youtube-api
gcloud config set compute/zone us-central1-a

# 2. Create new VM for OpenClaw
gcloud compute instances create openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=openclaw

# 3. Verify creation
gcloud compute instances list
# Should show:
# agentbot-prod      us-central1-a  e2-?      RUNNING
# openclaw-gateway   us-central1-a  e2-small  RUNNING

# 4. Get new VM IP
gcloud compute instances describe openclaw-gateway \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### Days 2-5: Follow Standard Phase 1 (Same Steps)

- SSH into openclaw-gateway (new VM)
- Update system
- Install Docker
- Clone OpenClaw
- Configure .env

**Result:** Two independent VMs, both running, no conflicts

---

## ⚠️ CRITICAL: DO NOT TOUCH agentbot-prod

**Before proceeding with OpenClaw:**

```bash
# ✅ DO monitor it
gcloud compute instances describe agentbot-prod
gcloud compute ssh agentbot-prod --command="uptime"

# ❌ DO NOT stop it
gcloud compute instances stop agentbot-prod

# ❌ DO NOT modify it
# (Only SSH if absolutely necessary for investigation)

# ❌ DO NOT delete it
gcloud compute instances delete agentbot-prod
```

---

## 🔄 PARALLEL DEPLOYMENT ARCHITECTURE

After OpenClaw deployment completes:

```
┌──────────────────────────────────────────────────────────────┐
│              COMPLETE ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  VERCEL (User-Facing Frontend)                               │
│  └─ https://agentbot.raveculture.xyz                         │
│     ├─ Next.js UI                                            │
│     ├─ 50+ APIs                                              │
│     └─ Token gating ($RAVE)                                  │
│                                                               │
│  GCP PROJECT: raveculture-youtube-api                        │
│  ├─ agentbot-prod (34.170.109.115) - ACTIVE                │
│  │  └─ [Existing services]                                  │
│  │                                                            │
│  ├─ openclaw-gateway (NEW IP) - OpenClaw              🚀     │
│  │  ├─ Gateway: ws://IP:18789                               │
│  │  ├─ OpenClaw binaries (gog, goplaces, wacli)             │
│  │  └─ Persistent storage (~/.openclaw/)                    │
│  │                                                            │
│  └─ Shared Resources                                         │
│     ├─ PostgreSQL (shared user/agent data)                  │
│     ├─ Redis (shared cache/sessions)                        │
│     ├─ VPC network (private connection)                     │
│     └─ Firewall rules                                        │
│                                                               │
│  LOCAL DOCKER (Development)                                  │
│  ├─ PostgreSQL (dev copy)                                    │
│  ├─ Redis (dev cache)                                        │
│  ├─ API (3001)                                               │
│  ├─ Frontend (3000)                                          │
│  └─ Worker (task queue)                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 COST ANALYSIS

### Current Cost
```
Vercel Agentbot:    ~$20-50/month (depends on usage)
agentbot-prod VM:   ~$12-27/month (depends on machine type)
Local Docker:       Free (your laptop)
─────────────────────────────────
TOTAL:              ~$32-77/month
```

### After OpenClaw (Option 1)
```
Vercel Agentbot:    ~$20-50/month
agentbot-prod VM:   ~$12-27/month (unchanged)
openclaw-gateway:   ~$12/month (e2-small, NEW)
Local Docker:       Free
─────────────────────────────────
TOTAL:              ~$44-89/month
```

### Cost Optimization
```
If agentbot-prod is redundant:
  Stop it: -$12-27/month
  Cost drops to: ~$32-62/month

If switching to dedicated projects:
  Two e2-small VMs: ~$24/month
  Cost drops to: ~$44-74/month
```

---

## 🎯 IMMEDIATE ACTION PLAN

### Step 1: Verify agentbot-prod (2 minutes)
```bash
gcloud compute ssh agentbot-prod --zone=us-central1-a --command="
  echo '=== Running Services ==='
  docker ps
  echo ''
  echo '=== System Info ==='
  uptime
  echo ''
  echo '=== Disk Space ==='
  df -h /
"
```

### Step 2: Decide on Strategy (5 minutes)
Tell me:
- [ ] "Use OPTION 1: Create new VM in same project"
- [ ] "Use OPTION 2: Create new dedicated project"
- [ ] "Use OPTION 3: Something else"

### Step 3: Execute Modified Phase 1 (1-2 hours)
- Create openclaw-gateway VM in chosen project
- Run Days 2-5 of Phase 1 on new VM
- Keep agentbot-prod completely untouched

### Step 4: Deploy OpenClaw (Phase 2, 1 week)
- Build Dockerfile
- Deploy containers
- Configure gateway
- Test integration

---

## ✅ SUCCESS CRITERIA

After completing this plan:

✅ agentbot-prod still active and untouched  
✅ openclaw-gateway VM created and running  
✅ Docker installed on openclaw-gateway  
✅ OpenClaw code cloned  
✅ Persistent storage ready  
✅ SSH access working  
✅ Firewall rules configured  
✅ Both VMs in same GCP project  
✅ No service disruptions  

**Timeline:** 1-2 days (Days 1-2 of Phase 1)

---

## 🚀 READY TO PROCEED?

**Next Step:** Tell me which option you prefer:

1. **OPTION 1 (Recommended):** New VM in same project
2. **OPTION 2 (Isolated):** New dedicated project
3. **OPTION 3 (Custom):** Tell me what you prefer

Once you decide, we execute the modified Phase 1 specific to your infrastructure!

