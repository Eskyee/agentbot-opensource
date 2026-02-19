# StartClaw Production Handoff (2026-02-19)

## Why this exists
This is a memory sheet for the production recovery and setup work completed together.
Use this as the single source of truth for:
- What was changed
- What is currently live
- How to re-run setup
- How to troubleshoot quickly next time

---

## Final working state
- Production frontend route `POST /api/provision` is working again.
- Verified successful end-to-end response through Vercel:
  - `https://agentbot.raveculture.xyz/api/provision`
  - HTTP `200` with `success: true`
- Backend VM is live at:
  - `34.71.189.81`
- Backend health verified publicly:
  - `GET http://34.71.189.81:3000/health` -> `200`

---

## Infrastructure used
- Cloud provider: Google Cloud (GCP)
- Project: `raveculture-youtube-api`
- VM:
  - Name: `startclaw-api-vm`
  - Zone: `us-central1-a`
  - Machine: `e2-small`
  - External IP: `34.71.189.81`
- Firewall rule:
  - Name: `startclaw-api-3000`
  - Allows ingress `tcp:3000`
  - Target tag: `startclaw-api`

---

## App architecture (as currently running)
- Frontend/API gateway: Vercel (Next.js app)
- Provision route file:
  - `web/app/api/provision/route.ts`
- Backend API service on VM:
  - `api/server.js`
  - Systemd unit: `/etc/systemd/system/startclaw-api.service`

---

## Critical code behavior added in provision route
In `web/app/api/provision/route.ts`:

1. Added backend fallback URL support:
   - `BACKEND_API_FALLBACK_URL`

2. Added legacy secret support:
   - `BACKEND_API_SECRET`
   - Fallback chain: `BACKEND_API_SECRET || API_SECRET || INTERNAL_API_KEY`

3. Added endpoint compatibility/failover:
   - Try modern endpoint first: `POST /api/deployments` with Bearer auth
   - If unavailable (404/405/unreachable), try legacy endpoint: `POST /provision` with `x-api-key`

4. Added safer error behavior:
   - User-facing errors are generic `502`
   - Sensitive backend details are not leaked to client

---

## Production env variables that matter
Set in Vercel production:

- `BACKEND_API_URL`
  - Primary backend base URL (may be old or modern backend)

- `BACKEND_API_FALLBACK_URL`
  - Current live fallback: `http://34.71.189.81:3000`

- `INTERNAL_API_KEY`
  - Used for modern `/api/deployments` auth

- `BACKEND_API_SECRET`
  - Used for legacy `/provision` auth
  - Must match VM `API_SECRET`

On VM systemd service:
- `API_SECRET=bcfcc5a807197d32598a87570011faf360b3697c6e2e4d48`
- `PORT=3000`

---

## VM service setup summary
Installed on VM:
- Node.js 20
- Docker
- Caddy

Backend code path:
- `/opt/startclaw/api`

Systemd service:
- Name: `startclaw-api`
- ExecStart: `/usr/bin/node /opt/startclaw/api/server.js`

Useful VM commands:

```bash
sudo systemctl status startclaw-api --no-pager -l
sudo journalctl -u startclaw-api -n 200 --no-pager
curl -s http://localhost:3000/health
curl -s -H 'x-api-key: YOUR_SECRET' http://localhost:3000/instances
```

---

## Key troubleshooting lessons (important)
1. Cloud Shell host vs VM context matters
- `localhost` in Cloud Shell is NOT the VM.
- VM service checks (`journalctl`, `docker ps`, `curl localhost:3000`) must run inside SSH session to VM.

2. GCP IAM/scope confusion
- Running `gcloud` inside VM can fail with service account scope errors.
- Project/firewall/tag changes should be run from Cloud Shell user account (`eskyjunglelab@gmail.com`).

3. Billing blocker
- Compute API cannot be enabled without an OPEN billing account.
- A closed billing account caused initial provisioning failures.

4. Firewall blocker
- Even with service healthy on VM, external access failed until `tcp:3000` ingress rule was created and VM tag matched.

5. Vercel deploy context
- Running deploy from wrong directory caused path mismatch (`.../web/web`).
- Deploy from repo root when Vercel rootDirectory already points to `web`.

---

## Recovery runbook (quick)
If provisioning breaks again:

1. Check frontend production endpoint:
```bash
curl -i -X POST https://agentbot.raveculture.xyz/api/provision \
  -H 'content-type: application/json' \
  --data '{"userId":"probe","telegramToken":"123:abc"}'
```

2. Check backend reachability from internet:
```bash
curl -i http://34.71.189.81:3000/health
curl -i -H 'x-api-key: YOUR_SECRET' http://34.71.189.81:3000/instances
```

3. If unreachable, verify firewall/tag from Cloud Shell:
```bash
gcloud config set project raveculture-youtube-api
gcloud compute firewall-rules list --filter="name=startclaw-api-3000"
gcloud compute instances add-tags startclaw-api-vm --zone=us-central1-a --tags=startclaw-api
```

4. If reachable but provision fails, debug on VM:
```bash
gcloud compute ssh startclaw-api-vm --zone=us-central1-a
sudo systemctl status startclaw-api --no-pager -l
sudo journalctl -u startclaw-api -n 200 --no-pager
curl -i -X POST http://localhost:3000/provision \
  -H 'x-api-key: YOUR_SECRET' \
  -H 'content-type: application/json' \
  --data '{"userId":"probe-local","telegramToken":"123:abc"}'
```

5. Confirm Vercel env values:
- `BACKEND_API_FALLBACK_URL=http://34.71.189.81:3000`
- `BACKEND_API_SECRET` matches VM `API_SECRET`

6. Redeploy web after env changes:
```bash
cd /Users/raveculture/Documents/GitHub/startclaw
npx vercel --prod --yes
```

---

## What to keep unchanged (for now)
- Keep compatibility logic in `web/app/api/provision/route.ts` (modern + legacy fallback).
- Keep VM fallback URL active until old backend ownership/access is fully resolved.
- Keep secrets consistent between Vercel `BACKEND_API_SECRET` and VM `API_SECRET`.

---

## Optional cleanup after tests
If you want to remove probe test instances:

```bash
curl -i -X DELETE http://34.71.189.81:3000/instances/probe-direct-002 \
  -H 'x-api-key: YOUR_SECRET'

# Example random generated id from e2e run:
curl -i -X DELETE http://34.71.189.81:3000/instances/7510283b86fe138e \
  -H 'x-api-key: YOUR_SECRET'
```

You can list all instances first:

```bash
curl -s -H 'x-api-key: YOUR_SECRET' http://34.71.189.81:3000/instances
```

---

## Server maintenance SOP

### Daily (2-5 minutes)
Run from your local machine:

```bash
curl -sS http://34.71.189.81:3000/health
curl -sS -H 'x-api-key: YOUR_SECRET' http://34.71.189.81:3000/instances
curl -sS -o /dev/null -w '%{http_code}\n' https://agentbot.raveculture.xyz/api/health
```

What good looks like:
- Backend health returns JSON with `"status":"ok"`
- `/instances` returns HTTP `200`
- Frontend health returns HTTP `200`

### Weekly (10-20 minutes)
SSH into VM and run:

```bash
gcloud compute ssh startclaw-api-vm --zone=us-central1-a
sudo systemctl status startclaw-api --no-pager -l
sudo journalctl -u startclaw-api -n 200 --no-pager
sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
df -h
free -h
```

Then clean up unused Docker artifacts:

```bash
sudo docker image prune -f
sudo docker container prune -f
```

### Monthly (30-60 minutes)
1. Rotate secrets:
- Generate a new API secret.
- Update VM service `API_SECRET`.
- Update Vercel `BACKEND_API_SECRET` to same value.
- Restart backend + redeploy frontend.

2. Patch system packages:

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo systemctl restart startclaw-api
```

3. Verify firewall and tags still correct:

```bash
gcloud compute firewall-rules list --filter="name=startclaw-api-3000"
gcloud compute instances describe startclaw-api-vm --zone=us-central1-a --format='get(tags.items)'
```

### Safe deploy flow (backend)
When updating backend code:

```bash
gcloud compute ssh startclaw-api-vm --zone=us-central1-a
cd /opt/startclaw
git pull
cd /opt/startclaw/api
npm install --omit=dev
sudo systemctl restart startclaw-api
sudo systemctl status startclaw-api --no-pager -l
curl -s http://localhost:3000/health
```

### Safe deploy flow (frontend)
From repo root:

```bash
cd /Users/raveculture/Documents/GitHub/startclaw
npx vercel --prod --yes
```

After deploy:

```bash
curl -i -X POST https://agentbot.raveculture.xyz/api/provision \
  -H 'content-type: application/json' \
  --data '{"userId":"post-deploy-check","telegramToken":"123:abc"}'
```

### Incident quick-response checklist
1. Check if backend is reachable externally (`/health`).
2. Check if frontend route returns `200` or `502`.
3. If backend unreachable: inspect firewall rule + VM tags from Cloud Shell.
4. If backend reachable but failing: inspect `startclaw-api` systemd status + journal on VM.
5. If secrets mismatch suspected: sync VM `API_SECRET` and Vercel `BACKEND_API_SECRET`.

---

## Notes for future hardening
- Move backend behind HTTPS + fixed domain (not raw IP) for long-term reliability.
- Rotate API secrets periodically and store in a secret manager.
- Add structured logs and alerting for `/api/provision` 5xx rates.
- Consider migrating fully to modern `/api/deployments` backend path once legacy is retired.
