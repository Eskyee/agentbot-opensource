# OpenClaw Token Architecture

## Current State (April 7, 2026)

### How It Works

Each user gets their OWN agent on Railway with its OWN unique gateway token:
- Service: `agentbot-agent-{userId}-production.up.railway.app`
- Token: Generated per-user, stored in `agent_registrations.gateway_token`

### Token Flow

1. **User registers** → Backend creates Railway service with unique token
2. **Token stored** in `agent_registrations` table (per user)
3. **Dashboard fetches** user's token from `agent_registrations`
4. **User connects** to their own agent's OpenClaw Control UI

### Key Endpoints

| Endpoint | Returns |
|----------|---------|
| `/api/user/openclaw` | User's unique gateway token |
| `/api/dashboard/bootstrap` | User's token + instance info |
| `/api/instance/{userId}` | User's agent URL |

### Environment Variables (Do NOT Use)

These are DEPRECATED - do NOT use for user agents:
- `OPENCLAW_GATEWAY_TOKEN` - shared platform token (old way)
- `NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN` - same as above

### Files That Handle Tokens

**Web (Next.js):**
- `web/app/api/user/openclaw/route.ts` - returns user's unique token
- `web/app/lib/token-manager.ts` - generates/retrieves per-user tokens
- `web/app/api/dashboard/bootstrap/route.ts` - fetches token from DB
- `web/app/lib/openclaw-control.ts` - builds control UI URLs

**Backend (Express/Railway):**
- `agentbot-backend/src/routes/railway-provision.ts` - creates agents with unique tokens
- `agentbot-backend/src/lib/container-manager.ts` - provisions containers
- `agentbot-backend/src/routes/registration.ts` - stores tokens in DB

### For Existing Users

If users have token mismatch errors:
1. Click **REPAIR AGENT** in dashboard - regenerates token from DB
2. Or redeploy their agent

### Gateway URL Structure

- User's agent: `https://agentbot-agent-{userId}-production.up.railway.app`
- Control UI: `https://agentbot-agent-{userId}-production.up.railway.app/chat`
- WebSocket: `wss://agentbot-agent-{userId}-production.up.railway.app/chat`

The dashboard automatically builds the correct URL using user's `openclawUrl` from database.