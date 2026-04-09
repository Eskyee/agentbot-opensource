# Agentbot Internal SOS Guide

**CONFIDENTIAL — Internal Use Only**  
Last Updated: April 7, 2026

---

## Quick Diagnostics

| Symptom | Run This |
|---------|----------|
| Agent not responding | `curl https://[agent-subdomain].up.railway.app/health` |
| Gateway down | `curl https://openclaw-production-a09d.up.railway.app/health` |
| WebSocket fails | Check browser console for "origin not allowed" |
| Skills won't install | Verify agent is online first |

---

## Common Issues & Fixes

### 1. "origin not allowed" in OpenClaw Control UI

**Cause:** WebSocket origin mismatch on Railway.

**Fix for user:**
1. Go to Dashboard → Copy Gateway Token
2. Open agent's OpenClaw URL → Settings
3. Paste token in "Gateway Token" field
4. Save and refresh

**Root cause:** The gateway config already has `allowedOrigins: ["*"]` but some browsers/proxies strip the origin header. Railway doesn't forward Origin header by default.

---

### 2. Skills Won't Install

**Error:** "Agent offline. Install your agent first, then retry installing skills."

**Cause:** Gateway unreachable or agent not running.

**Fix:**
1. Verify agent is running: `/dashboard` shows "running" status
2. If offline → redeploy agent first
3. If online but skills still fail → skill is saved to DB, will auto-sync on next agent sync
4. Manual retry: Refresh dashboard, try installing skill again

**Background:** Skills are saved to Prisma first, then deployed to gateway. If gateway is down, skill stays in DB and syncs automatically when agent reconnects.

---

### 3. Auto-Pairing Not Working

**Symptom:** "No valid gateway token detected" warning in dashboard.

**Fix:**
1. Click "Refresh token" button in dashboard OpenClaw Controls section
2. If still fails → manual pair:
   - Copy token from dashboard
   - Open agent's OpenClaw URL
   - Settings → Paste token
3. Restart agent if needed

---

### 4. Gateway 502 Bad Gateway

**Cause:** Gateway container crashed or didn't start properly.

**Fix:**
1. Check Railway dashboard → openclaw-gateway → Logs
2. If "Invalid --bind" error:
   - Verify `gateway/Dockerfile` uses `bind: "lan"` NOT `0.0.0.0`
   - Source must be "GitHub Repo" not "Docker Image"
3. Redeploy if needed

**Reference:** `skills/railway-gateway-skill.md`

---

### 5. Jobs Board Not Loading

**Check:**
1. `/api/jobs/board` returns data?
2. External jobs: `curl https://www.thegitcity.com/api/jobs` reachable?
3. Database: `prisma.jobListing` has records?

---

### 6. x402 Payments Not Working

**Verify:**
1. Bankr API key set in user settings
2. User has USDC balance
3. Base network connectivity
4. x402 endpoint reachable

---

## Emergency Contacts

| Issue | Escalation |
|-------|------------|
| Complete outage | Check Railway status, Vercel status |
| Database issues | Check Neon dashboard |
| Gateway token problems | Review `lib/gateway-token.ts` |
| Provisioning failures | Check `agentbot-backend` logs |

---

## Useful Commands

```bash
# Check gateway health
curl https://openclaw-production-a09d.up.railway.app/health

# Check specific agent
curl https://[subdomain].up.railway.app/api/status

# Database query (via prisma)
npx prisma db execute --sql="SELECT COUNT(*) FROM Agent"

# View recent errors
grep -r "ERROR" agentbot-backend/logs/
```

---

## Don't Do

- ❌ Delete users' installed skills
- ❌ Reset gateway token for all users (breaks existing pairings)
- ❌ Clear Prisma tables without backup
- ❌ Push to stable-v1 without testing

---

## Version Info

- OpenClaw: `2026.4.1`
- Node: Check `package.json`
- Gateway: `ghcr.io/openclaw/openclaw:latest`
- Main repo commit: `8adbc45d`
- Docs submodule: `2f36af2`