# Agentbot-Only Migration Checklist (Zero Downtime)

This checklist moves operations to **agentbot-only naming and ownership** across GitHub, Vercel, Docker, and GCP.

## Important reality check

Renaming resources does **not** fix the current timeout incident by itself.
Current outage symptoms (`/api/provision` timeout, backend health timeout) are a backend reachability/service issue and must be fixed in parallel.

Use this checklist to remove old `startclaw` coupling safely while keeping services online.

---

## 0) Freeze and baseline (5 minutes)

- Freeze non-critical infra changes while migrating naming.
- Capture current state:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
curl -i --max-time 12 http://35.193.69.87:3000/health
curl -i --max-time 25 -X POST https://agentbot.raveculture.xyz/api/provision \
  -H 'content-type: application/json' \
  --data '{"userId":"baseline-check","telegramToken":"123:abc","aiProvider":"gemini"}'
```

Success criteria:
- You have a baseline before naming changes.

---

## 1) GitHub migration to agentbot remote (zero downtime)

Goal: local repo and CI target your new agentbot repository only.

1. Create new repository (example): `https://github.com/<org-or-user>/agentbot.git`
2. Point local remote:

```bash
git remote add origin https://github.com/<org-or-user>/agentbot.git
# If origin already exists, use:
# git remote set-url origin https://github.com/<org-or-user>/agentbot.git
git remote -v
```

3. Push active branch:

```bash
git push -u origin copilot/deploy-agent-with-frontend
```

4. Open PR in new repo (`main` base).

Success criteria:
- No dependency on old GitHub repo URL.
- CI/PR activity happens in `agentbot` repo only.

---

## 2) Vercel project hardening (agentbot only)

Goal: ensure only Vercel `agentbot` project deploys production.

1. Confirm linkage from workspace:

```bash
cat .vercel/project.json
cat web/.vercel/project.json
```

2. Confirm production env keys:

```bash
cd web
npx vercel env pull .env.prodcheck --environment production --yes >/tmp/vercel-pull.log
grep -E '^(BACKEND_API_URL|BACKEND_API_FALLBACK_URL|BACKEND_API_SECRET)=' .env.prodcheck
```

3. In Vercel UI:
- Keep `agentbot` as active production project.
- Remove any old Git integration/project that is not `agentbot`.
- Set one production branch only.

Success criteria:
- Deploys go only to `raveculture-projects/agentbot`.
- No accidental deploy path from retired projects.

---

## 3) Docker naming migration with no downtime

Goal: move to `agentbot-*` image names safely.

### Phase A (now): dual-tag images, keep running containers unchanged

```bash
docker tag startclaw-api:latest agentbot-api:latest || true
docker tag startclaw-worker:latest agentbot-worker:latest || true
docker tag startclaw-frontend:latest agentbot-frontend:latest || true
docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}' | grep -E 'startclaw|agentbot'
```

This is zero downtime because running containers are not replaced.

### Phase B (planned cutover): rename container/service names

Container/service renames require recreation (brief restart window). To keep risk low:
- Do this in a maintenance window.
- Change compose `container_name`, network name, and service labels together.
- `docker compose up -d --no-deps --build <service>` one service at a time.

Success criteria:
- Immediate: `agentbot-*` image tags exist.
- Later window: containers moved to `agentbot-*` names.

---

## 4) GCP naming without downtime

Goal: stop operational dependency on old names before any heavy infra rename.

### Phase A (zero downtime): standardize labels and DNS

Use labels/tags and docs to make runtime identity `agentbot` while VM names remain stable.

Recommended label plan:
- `app=agentbot`
- `env=production`
- `owner=raveculture`

If DNS is used, point friendly names first:
- `api.agentbot.<domain>` -> current VM/public LB

### Phase B (optional infra rename)

True GCP resource renames are often recreate/migrate operations.
Do only after service is stable and monitored.

Success criteria:
- Team operates by `agentbot` labels and DNS, not legacy resource names.

---

## 5) Incident fix track (must run in parallel)

Because current errors are timeout-related, run this track in parallel:

Cloud Shell checks:

```bash
gcloud compute ssh startclaw-api-vm --zone=us-central1-a --project=raveculture-youtube-api \
  --command "sudo systemctl status startclaw-api --no-pager -l; echo '---'; sudo ss -ltnp | grep :3000 || true; echo '---'; sudo journalctl -u startclaw-api -n 120 --no-pager"

gcloud compute firewall-rules describe startclaw-api-3000 --project=raveculture-youtube-api
gcloud compute instances describe startclaw-api-vm --zone=us-central1-a --project=raveculture-youtube-api \
  --format='get(tags.items,networkInterfaces[0].accessConfigs[0].natIP)'
```

Success criteria:
- `http://<public-ip>:3000/health` returns quickly.
- `https://agentbot.raveculture.xyz/api/provision` returns without timeout.

---

## 6) Final go/no-go

Go only when all are true:
- GitHub remote and PR flow are on `agentbot` repo.
- Vercel production project is `agentbot` only.
- Docker images have `agentbot-*` tags (minimum now).
- Backend health and provision endpoints are both green.

No-go conditions:
- Any timeout on backend health or provision endpoint.
