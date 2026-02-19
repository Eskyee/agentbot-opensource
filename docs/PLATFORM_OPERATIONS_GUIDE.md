# Platform Operations Guide

Last updated: 2026-02-19

This guide is your long-term operating reference across:
- Vercel
- Google Cloud (VM backend)
- GitHub
- VS Code / local tooling
- Docker + Docker Hub

For incident copy-paste commands, use `OPS_QUICK_REF.md` in repo root.

---

## 1) Current production map

- Frontend domain: `https://agentbot.raveculture.xyz`
- Frontend platform: Vercel project `agentbot`
- Backend VM: `startclaw-api-vm` (`34.71.189.81`, zone `us-central1-a`)
- Backend API: `http://34.71.189.81:3000`
- Firewall rule: `startclaw-api-3000` (tcp/3000, tag `startclaw-api`)
- Main recovery handoff: `docs/PRODUCTION_HANDOFF_2026-02-19.md`

---

## 2) Vercel operations

### Required env vars (production)
- `BACKEND_API_URL`
- `BACKEND_API_FALLBACK_URL` (currently `http://34.71.189.81:3000`)
- `INTERNAL_API_KEY`
- `BACKEND_API_SECRET` (must match VM `API_SECRET`)

### Core commands
```bash
# Who is logged in
npx vercel whoami

# List env vars
npx vercel env ls production

# Add/update env var (remove + add pattern)
npx vercel env rm BACKEND_API_SECRET production --yes
printf 'NEW_SECRET\n' | npx vercel env add BACKEND_API_SECRET production

# Deploy production
cd /Users/raveculture/Documents/GitHub/startclaw
npx vercel --prod --yes
```

### Common failure modes
- Deploy path mismatch (`.../web/web`): deploy from repo root if Vercel rootDirectory is already `web`.
- 502 on `/api/provision`: usually backend unreachable or auth mismatch.

---

## 3) Google Cloud operations (VM backend)

### Context rule (critical)
- Run project/network/firewall commands in Cloud Shell user context.
- Do not run those from inside VM shell.

### Core commands
```bash
# Select project
gcloud config set project raveculture-youtube-api

# Check VM
gcloud compute instances list --filter="name=startclaw-api-vm"

# SSH into VM
gcloud compute ssh startclaw-api-vm --zone=us-central1-a

# Check firewall
gcloud compute firewall-rules list --filter="name=startclaw-api-3000"

# Ensure VM has required tag
gcloud compute instances add-tags startclaw-api-vm --zone=us-central1-a --tags=startclaw-api
```

### Billing
- Compute APIs require an OPEN billing account.
- If APIs fail to enable, check billing status first.

---

## 4) VM service operations (inside VM)

### Backend service
- service name: `startclaw-api`
- systemd unit: `/etc/systemd/system/startclaw-api.service`
- app path: `/opt/startclaw/api`

### Core commands
```bash
# Service health
sudo systemctl status startclaw-api --no-pager -l
sudo journalctl -u startclaw-api -n 200 --no-pager

# App health
curl -s http://localhost:3000/health
curl -s -H 'x-api-key: YOUR_SECRET' http://localhost:3000/instances

# Restart backend
sudo systemctl restart startclaw-api
```

### Update backend code safely
```bash
cd /opt/startclaw
git pull
cd /opt/startclaw/api
npm install --omit=dev
sudo systemctl restart startclaw-api
```

---

## 5) GitHub operations

### Branching and PR hygiene
- Keep operational docs updates in the same branch as infra changes.
- Open PR with:
  - What changed
  - Why it changed
  - Validation evidence (health/provision checks)

### Suggested labels (manual)
- `infra`
- `production`
- `docs`
- `incident`

### What to store in repo docs
- Recovery procedures
- Known-good architecture map
- Secret locations (by system, never values)

---

## 6) VS Code + local operations

### Recommended local checks
```bash
# repo root
pwd

# web deps
npm --prefix web install

# quick web dev run
npm --prefix web run dev
```

### Tooling gotchas
- `gcloud` may not be installed locally; use Cloud Shell for cloud operations.
- Keep terminal context visible (`pwd`) before running production commands.

---

## 7) Docker + Docker Hub operations

### On VM (Docker runtime)
```bash
sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
sudo docker images | head -n 30
sudo docker image prune -f
sudo docker container prune -f
```

### Docker Hub (if you later publish images)
Track these explicitly:
- Docker Hub org/user
- Repositories used
- Tagging strategy (`latest` vs semver)
- Rollback tag policy

Recommended policy:
- Never deploy `latest` alone for critical rollback paths.
- Push immutable tags (example: `startclaw-api:2026-02-19.1`).

---

## 8) Security + access checklist

Maintain at least 2 maintainers with access to:
- Vercel project and env management
- GCP project + billing account
- GitHub repo admin
- Domain/DNS provider

Rotate periodically:
- `BACKEND_API_SECRET` / VM `API_SECRET`
- Any internal API keys used in provisioning path

Never commit:
- `.env` files
- Raw secret values

---

## 9) Monitoring checklist

Minimum checks to automate later:
- `GET /health` on backend every 1-5 min
- `POST /api/provision` synthetic check every 10-30 min
- Alert on non-200 or high latency
- Track 5xx rate on Vercel route `/api/provision`

---

## 10) Backup + rollback strategy

### Backup
- Keep VM bootstrap/service commands in docs (already done).
- Keep a copy of systemd unit contents in repo docs.
- Keep env var key list (without secret values).

### Rollback
- Frontend rollback: use previous Vercel deployment from dashboard.
- Backend rollback: `git checkout <known-good-tag-or-commit>` on VM + restart service.

---

## 11) “If I forget everything” flow

1. Read `docs/PRODUCTION_HANDOFF_2026-02-19.md`
2. Run `OPS_QUICK_REF.md` checks top to bottom
3. Verify backend direct health (`34.71.189.81:3000`)
4. Verify frontend provision route (`agentbot.raveculture.xyz/api/provision`)
5. If backend direct works but frontend fails: verify Vercel env and redeploy
