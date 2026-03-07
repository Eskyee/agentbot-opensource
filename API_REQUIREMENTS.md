# AgentBot API Requirements & Implementation Status

## Frontend API Endpoints Used (from Dashboard & Components)

### Core Instance Management
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/instance/{userId}` | GET | ✅ Working | Get instance details, status, subdomain |
| `/api/instance/{userId}/stats` | GET | ✅ Working | CPU, memory, uptime, messages, errors |
| `/api/instance/{userId}/start` | POST | ✅ Implemented | Start agent container |
| `/api/instance/{userId}/stop` | POST | ✅ Implemented | Stop agent container |
| `/api/instance/{userId}/restart` | POST | ✅ Implemented | Restart agent container |
| `/api/instance/{userId}/update` | POST | ✅ Implemented | Update OpenClaw runtime version |
| `/api/instance/{userId}/repair` | POST | ✅ Implemented | Full reconfigure/repair agent |
| `/api/instance/{userId}/reset-memory` | POST | ✅ Implemented | Wipe memory and conversation history |
| `/api/instance/{userId}/token` | GET | ✅ Implemented | Get gateway token |

### Authentication & User
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | ✅ Working | NextAuth authentication flow |
| `/api/register` | POST | ✅ Ready | User registration |
| `/api/invite` | POST | ✅ Ready | Invite/setup users |

### Credits & Billing  
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/credits` | GET | ⚠️ Stub | Get user credit balance |
| `/api/stripe/checkout` | POST | ✅ Ready | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | ✅ Ready | Stripe webhook (payment updates) |

### Agent Verification (Verified Human Badge)
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/agents/{id}/verification` | GET | ✅ Implemented | Get verification status |
| `/api/agents/{id}/verify` | POST | ✅ Implemented | Mark agent as verified |
| `/api/agents/{id}/verify` | DELETE | ✅ Implemented | Remove verification |

### Agent Management
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/agents` | GET | ✅ Ready | List all agents |
| `/api/agents` | POST | ⚠️ Stub | Create new agent |
| `/api/agents/{id}` | GET | ✅ Ready | Get agent details |
| `/api/agents/{id}` | PUT | ⚠️ Stub | Update agent config |
| `/api/agents/{id}` | DELETE | ⚠️ Stub | Delete agent |

### Skills, Files, Settings (UI placeholders - not used yet)
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/skills` | GET | ⚠️ Stub | List available skills |
| `/api/files` | GET/POST | ⚠️ Stub | File management |
| `/api/settings` | GET/POST | ⚠️ Stub | User settings |

### Features NOT Yet in Dashboard (but in backend)
| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/deployments` | POST | ✅ Ready | Deploy new agent (used in onboarding) |
| `/api/agents/{id}/logs` | GET | ✅ Ready | Get agent logs |
| `/api/agents/{id}/messages` | GET | ✅ Ready | Get agent messages |
| `/api/agents/{id}/config` | GET | ✅ Ready | Get agent configuration |

## Backend Implementation Details

### Working Controllers (in `agentbot-backend/src/index.ts`)
- ✅ Health check endpoints
- ✅ Docker container management (start/stop/restart/update)
- ✅ Agent deployment & provisioning
- ✅ Instance stats collection
- ✅ Verification system
- ✅ Gateway token generation
- ✅ Model healing (legacy model migration)
- ✅ Auto-update system

### Frontend Proxies (in `web/app/api/`)
- ✅ `/api/agents/*` → proxies to backend `/api/agents/*`
- ✅ `/api/instance/*` → proxies to backend `/api/deployments` or container queries
- ✅ `/api/deployments` → proxies to backend
- ✅ Auth endpoints (credentials + OAuth)
- ✅ Stripe integration (checkout, webhook)
- ✅ Wallet integration (Coinbase CDP)

## What's Missing / TODO

### High Priority (Blocking Features)
1. **Credits System** 
   - Endpoint: `GET /api/credits` - needs database integration
   - Show user credit balance on dashboard
   - Deduct credits from tasks/operations

2. **Skills Management** 
   - Endpoint: `GET /api/skills` - list available skills
   - Endpoint: `POST /api/skills` - enable/disable skills
   - Currently UI shows hardcoded skills

3. **File Uploads**
   - Endpoint: `POST /api/files` - upload files for agent
   - Endpoint: `GET /api/files` - list uploaded files
   - Currently stubbed in UI

### Medium Priority (Nice to Have)
1. **Agent Creation** (`POST /api/agents`)
2. **Settings Panel** (`GET/POST /api/settings`)
3. **Tasks/Activity Log** (store & retrieve task history)
4. **Heartbeat System** (persistence for frequency/schedule)
5. **Referral Links** (track referrals, rewards)

### Low Priority (Future)
1. **Marketplace** (`GET /api/marketplace`)
2. **Swarms** (multi-agent management)
3. **Workflows** (automation builder)
4. **Chat History** (`GET /api/agents/{id}/messages`)
5. **Analytics** (`GET /api/agents/{id}/stats`)

## Environment Variables Needed

```bash
# Backend (already configured)
BACKEND_API_URL=http://agentbot-api:3001
INTERNAL_API_KEY=your-secret-key

# Stripe (already configured)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Auth (already configured)
NEXTAUTH_SECRET=your-secret

# To Add:
# - Credits system database connection
# - File storage (S3/local)
# - Analytics service
```

## Quick Implementation Checklist

- [ ] Link `/api/credits` to database (count user transactions)
- [ ] Create `/api/skills` endpoints with database
- [ ] Create `/api/files` upload/download endpoints  
- [ ] Persist heartbeat settings in database
- [ ] Persist task history in database
- [ ] Add referral tracking to database
- [ ] Create task execution engine
- [ ] Add real marketplace data

## Current Working Flow

1. User logs in → NextAuth session
2. User deploys agent → `/api/deployments` (backend creates container)
3. Dashboard fetches `/api/instance/{userId}` → proxies to backend `/api/agents/{id}`
4. User performs actions (restart, stop, update) → proxies to backend
5. Stripe webhook → updates user plan in database
6. Agent verification → stored in metadata files

**Everything for MVP is either working or ready. Just need database layer for credits/skills/files.**
