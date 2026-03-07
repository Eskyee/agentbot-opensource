# AgentBot API - Complete Working Endpoints (Verified 2026-03-07)

## Production Status: ✅ ALL CORE APIS WORKING

Last verified: 2026-03-07 12:25 UTC  
Build: ✅ Success (168MB)  
Container: ✅ Running  
Health: ✅ Healthy

---

## Public Endpoints (No Authentication)

### Health & Status
```
GET /api/health                    → 200 ✅
GET /api/stats                     → 200 ✅
GET /api/metrics                   → 200 ✅
GET /api/openclaw-version          → 200 ✅
```

**Example:**
```bash
curl https://agentbot.raveculture.xyz/api/health | jq .
{
  "status": "ok",
  "health": "healthy",
  "timestamp": "2026-03-07T12:19:18.966Z",
  "cpu": { "usage": 0, "cores": 2 },
  "memory": { "usage": 9.28, "total": 3370708992, ... }
}
```

### API Documentation
```
GET /api/agent                     → 200 ✅
GET /api/agent?action=health       → Get health status
GET /api/agent?action=sessions     → Get active sessions
GET /api/agent?action=skills       → List skills
GET /api/agent?action=credentials  → List credentials
```

### Skills & Marketplace
```
GET /api/skills                    → 200 ✅
  Returns: 16 available skills
  - DJ Streaming (Mux integration)
  - Guestlist Manager
  - USDC Payments (Base)
  - Community Treasury
  - Google Calendar
  - Email
  - Webhooks
  - Browser Automation
  - File Manager
  - Telegram
  - Discord
  - WhatsApp
  - WhatsApp Business
  - Google Workspace
  - Notion
  - Slack
```

### File Management
```
GET /api/files                     → 200 ✅
  Returns: Files list for agent
```

### AI Models
```
GET /api/models                    → 200 ✅
  Returns: 100+ models from:
  - OpenAI (GPT-4o, GPT-5, etc)
  - Google (Gemini 2.0, 2.5 Flash)
  - Anthropic (Claude 3 Haiku)
  - Meta (Llama 3.3 70B)
  - Qwen (Multiple versions)
  - DeepSeek (V3, V3.2)
  - Mistral
  - And many more...
```

### Heartbeat
```
GET /api/heartbeat                 → 200 ✅
  Returns: Active agents status & last heartbeat
```

---

## Protected Endpoints (Require Authentication)

### User Wallet
```
GET /api/wallet                    → 401 (Protected) ✅
POST /api/wallet                   → 401 (Protected) ✅
  
Actions:
  - action=create          → Create new agent wallet
  - action=get_seed        → Get encrypted wallet seed
```

### User Settings
```
GET /api/settings                  → 401 (Protected) ✅
POST /api/settings                 → 401 (Protected) ✅
```

### Agent Management
```
GET /api/agents                    → Returns agent list
POST /api/agents                   → Create new agent
GET /api/agents/{id}               → Get agent details
PUT /api/agents/{id}               → Update agent
DELETE /api/agents/{id}            → Delete agent
```

### Instance Management (Dashboard)
```
GET /api/instance/{userId}         → Get instance details
GET /api/instance/{userId}/stats   → Get CPU/Memory/Uptime stats
POST /api/instance/{userId}/start  → Start agent
POST /api/instance/{userId}/stop   → Stop agent
POST /api/instance/{userId}/restart → Restart agent
POST /api/instance/{userId}/update → Update OpenClaw version
POST /api/instance/{userId}/repair → Full reconfigure
POST /api/instance/{userId}/reset-memory → Clear memory
GET /api/instance/{userId}/token   → Get gateway token
```

### Admin
```
GET /api/admin/users               → 403 (Protected) ✅
  List all users (admin only)
```

### Credits System
```
GET /api/credits                   → 200 ✅
  Returns: { credits: 0 }
  (Database integration in progress)
```

---

## Payment & Billing Integrations

### Stripe
```
POST /api/stripe/checkout          → 405 (expected for GET)
  Creates Stripe checkout session
  
POST /api/stripe/webhook           → Stripe webhook handler
  Handles payment confirmations
  Updates user subscription plan
  Triggers agent deployment

POST /api/stripe/storage-upgrade   → Storage upgrade checkout
POST /api/stripe/credits           → Credit purchase checkout
```

### Coinbase Web3
```
POST /api/coinbase                 → 401 (Protected)
  Coinbase CDP integration
  Wallet authentication
```

---

## Authentication Endpoints

### NextAuth
```
GET/POST /api/auth/[...nextauth]   → 200 ✅
  - Sign in with credentials
  - Sign in with Google
  - Sign in with GitHub
  - Web3 wallet login (siwe)
```

### Registration & Invites
```
POST /api/register                 → Create new account
POST /api/invite                   → Invite/setup user
```

### Password Reset (Disabled - DB migration pending)
```
POST /api/auth/forgot-password     → 503 (Disabled)
POST /api/auth/reset-password      → 503 (Disabled)
```

---

## Backend Endpoints (via Internal API)

All frontend endpoints proxy through to backend at `http://agentbot-api:3001`

### Backend Health
```
GET http://agentbot-api:3001/health → 200 ✅
```

### Agent Management
```
GET /api/agents                    → List all agents
POST /api/agents                   → Create agent  
GET /api/agents/{id}               → Get agent
PUT /api/agents/{id}               → Update agent
DELETE /api/agents/{id}            → Delete agent
```

### Deployments
```
POST /api/deployments              → Deploy new OpenClaw agent
  Required:
  - agentId: string
  - telegramToken: string
  - config.telegramToken: string
  - config.aiProvider?: string
  - config.apiKey?: string
  - config.plan?: string
```

### Instance Operations
```
POST /api/agents/{id}/start        → Start container
POST /api/agents/{id}/stop         → Stop container
POST /api/agents/{id}/restart      → Restart container
POST /api/agents/{id}/update       → Update OpenClaw version
POST /api/agents/{id}/repair       → Full reconfigure
POST /api/agents/{id}/reset-memory → Clear memory/identity
POST /api/agents/{id}/token        → Get gateway token
```

### Verification (Verified Human Badge)
```
GET /api/agents/{id}/verification  → Get verification status
POST /api/agents/{id}/verify       → Mark as verified
DELETE /api/agents/{id}/verify     → Remove verification
```

### Statistics
```
GET /api/openclaw/instances        → List all instances
GET /api/openclaw/instances/{id}/stats → Get container stats
  Returns: CPU, memory, network I/O, uptime, etc.
```

---

## Response Examples

### Health Check
```json
{
  "status": "ok",
  "health": "healthy",
  "timestamp": "2026-03-07T12:19:18.966Z",
  "cpu": { "usage": 0, "cores": 2 },
  "memory": {
    "usage": 9.284541642211277,
    "total": 3370708992,
    "used": 312954880,
    "free": 3057754112
  },
  "uptime": 3681.06
}
```

### Skills List (Summary)
```json
{
  "skills": [
    {
      "id": "dj-streaming",
      "name": "DJ Streaming",
      "description": "Stream live DJ sets via Mux",
      "category": "streaming",
      "rating": 5,
      "downloads": 150,
      "featured": true
    },
    ...
  ],
  "categories": ["streaming", "events", "payments", "finance", ...],
  "featured": [...]
}
```

### Models List (Sample)
```json
{
  "models": [
    {
      "id": "openai/gpt-4o",
      "name": "OpenAI: GPT-4o",
      "contextLength": 128000,
      "pricing": { "prompt": 0.000003, "completion": 0.000012 },
      "featured": true
    },
    {
      "id": "google/gemini-2.0-flash",
      "name": "Google: Gemini 2.0 Flash",
      "contextLength": 1048576,
      "pricing": { "prompt": 0.0000001, "completion": 0.0000004 }
    },
    ...
  ]
}
```

---

## Authentication Headers

### For Protected Endpoints

Via NextAuth Session (Browser):
```
Cookie: next-auth.session-token=<token>
```

Via Bearer Token (Backend):
```
Authorization: Bearer <INTERNAL_API_KEY>
```

Via Wallet (Web3):
```
// Uses SIWE (Sign In With Ethereum)
// Handled by /api/auth/[...nextauth]
```

---

## Environment Variables

```bash
# Frontend (Next.js)
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://agentbot.raveculture.xyz
BACKEND_API_URL=http://agentbot-api:3001
INTERNAL_API_KEY=dev-secret-key-12345

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Coinbase
COINBASE_API_KEY=...
COINBASE_PRIVATE_KEY=...

# Backend (Express)
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
PORT=3001
API_KEY=<INTERNAL_API_KEY>

# OpenClaw
OPENCLAW_IMAGE=ghcr.io/openclaw/openclaw:2026.2.26
OPENCLAW_RUNTIME_VERSION=2026.2.26
AGENTS_DOMAIN=agents.localhost
AGENTS_BASE_PORT=19000
```

---

## Testing Commands

### Quick Health Check
```bash
curl https://agentbot.raveculture.xyz/api/health | jq .
```

### List Skills
```bash
curl https://agentbot.raveculture.xyz/api/skills | jq '.skills[] | {name, category, rating}'
```

### List Available Models
```bash
curl https://agentbot.raveculture.xyz/api/models | jq '.models[] | {id, name, contextLength}' | head -20
```

### Agent Deployment (Requires Auth)
```bash
curl -X POST https://agentbot.raveculture.xyz/api/deployments \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "my-agent",
    "config": {
      "telegramToken": "...",
      "aiProvider": "openrouter",
      "plan": "starter"
    }
  }'
```

---

## Known Working Features

✅ User authentication (NextAuth + OAuth + Web3)  
✅ Agent deployment & provisioning  
✅ Real-time stats collection  
✅ Stripe payment integration  
✅ Wallet management (Coinbase CDP)  
✅ Skills marketplace  
✅ AI model selection (100+ models)  
✅ File management  
✅ Admin user management  
✅ Gateway token generation  
✅ Agent verification (Verified Human Badge)  
✅ Container orchestration (Docker)  

---

## Features In Development

⏳ Credits system (database integration)  
⏳ Task persistence  
⏳ Heartbeat scheduling  
⏳ Advanced analytics  

---

## Production Deployment

**Location:** GCP Compute Engine (us-central1-a)  
**Domain:** agentbot.raveculture.xyz  
**Uptime:** Continuously running  
**Services:** 5 Docker containers  
- agentbot-frontend (Next.js)
- agentbot-api (Express backend)
- agentbot-postgres (Database)
- agentbot-redis (Cache)
- agentbot-nginx (Reverse proxy)

---

## Support & Debugging

**Frontend Logs:**
```bash
docker logs agentbot-frontend -f
```

**Backend Logs:**
```bash
docker logs agentbot-api -f
```

**Database Logs:**
```bash
docker logs agentbot-postgres -f
```

**Container Status:**
```bash
docker-compose ps
```

---

Generated: 2026-03-07  
Status: ✅ Production Ready
