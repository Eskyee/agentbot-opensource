# Token Mismatch Post-Mortem

**Date:** April 7, 2026  
**Severity:** High  
**Duration:** ~4 hours  
**Status:** Resolved

## Problem

Users couldn't connect to their OpenClaw Control UI. When they clicked "Open OpenClaw" from the dashboard, they saw:

```
unauthorized: gateway token mismatch
```

The Connect form asked for WebSocket URL and Gateway Token, but even pasting the token didn't work.

## Symptoms

1. Dashboard showed "Auto Pairing" as "ready" but connection failed
2. Users saw "origin not allowed" error
3. Then "gateway token mismatch" error
4. REPAIR AGENT button showed "Action failed"

## Root Cause

**The dashboard was giving users the SHARED platform token instead of their UNIQUE user token.**

### The Architecture

Each user gets:
- Their own Railway service: `agentbot-agent-{userId}YOUR_SERVICE_URL`
- Their own unique gateway token stored in `agent_registrations.gateway_token`

The platform has a MAIN gateway (for platform operations):
- `YOUR_SERVICE_URL`
- Token: `4uwv8kylbj99wphk5zl1kyz7g8tvhcdb`

### What Went Wrong

1. **Dashboard code** (`/api/user/openclaw`) was reading `OPENCLAW_GATEWAY_TOKEN` env var - the SHARED token
2. **Provisioning code** was using the SHARED token when creating user agents
3. Each user's Railway agent had a DIFFERENT token than what the dashboard gave them
4. Result: Token mismatch on every connection

## Why It Worked Before

Previously, all users shared the same gateway (or the token didn't matter for some reason). When we switched to per-user agents with unique tokens, this bug surfaced.

## The Fix

### 1. Web App - Fetch user's unique token from DB

```typescript
// web/app/api/user/openclaw/route.ts
// BEFORE: const getGatewayToken = () => readSharedGatewayToken()
// AFTER:
const tokenResult = await getOrCreateUserGatewayToken(session.user.id)
const userGatewayToken = tokenResult?.token || null
```

### 2. Control UI URL - Use user's gateway, not platform default

```typescript
// web/app/lib/openclaw-control.ts
// BEFORE: const base = `${DEFAULT_OPENCLAW_CONTROL_UI_BASE}/${view}`
// AFTER: const userGatewayBase = gatewayUrl ? new URL(gatewayUrl).origin : ...
```

### 3. Repair Button - Use user's token from DB, not env var

```typescript
// web/app/api/instance/[userId]/repair/route.ts
// Get user's token from database
const registration = await prisma.$queryRaw`
  SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId}
`
const userGatewayToken = registration[0]?.gateway_token
```

### 4. Agent Provisioning - Generate unique token per agent

```typescript
// agentbot-backend/src/routes/railway-provision.ts
// BEFORE: const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || ''
// AFTER: const gatewayToken = crypto.randomBytes(32).toString('hex')
```

## Files Changed

| File | Change |
|------|--------|
| `web/app/api/user/openclaw/route.ts` | Fetch user's unique token from DB |
| `web/app/lib/openclaw-control.ts` | Use user's gateway URL as base |
| `web/app/api/instance/[userId]/repair/route.ts` | Repair uses user's token from DB |
| `agentbot-backend/src/routes/railway-provision.ts` | Generate unique token per agent |
| `agentbot-backend/src/lib/container-manager.ts` | Generate unique token per agent |

## Lesson Learned

**ALWAYS check `agent_registrations` table first, not env vars.**

The database is the source of truth for user-specific data. Environment variables are for platform-wide configuration.

When troubleshooting token issues:
1. Query `SELECT gateway_token FROM agent_registrations WHERE user_id = ?`
2. Check what's stored in the user's record
3. Compare with what their Railway agent has configured

## Verification

After the fix:
- Dashboard shows user's unique token (e.g., `a843232...`)
- Different from platform token (`4uwv8kyl...`)
- Clicking "Open OpenClaw" auto-connects
- REPAIR AGENT now works

## For New Developers

If you see "token mismatch" errors:
1. Check `agent_registrations.gateway_token` in database
2. Check Railway service env var `OPENCLAW_GATEWAY_TOKEN`
3. They MUST match
4. If not, click REPAIR AGENT or redeploy the agent