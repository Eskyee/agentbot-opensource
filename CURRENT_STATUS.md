# Agentbot Current Status

**Last Updated:** Mar 10 2026

## Production Deployment

| Service | URL | Status |
|---------|-----|--------|
| Web App | https://agentbot-two.vercel.app | ✅ Live |
| Custom Domain | https://agentbot.raveculture.xyz | ✅ Live |
| Agents | https://agents.raveculture.xyz | ✅ Live |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL (Web)                            │
│                  Next.js 16 (Proxy)                         │
│                  - Frontend UI                              │
│                  - API Routes (75+)                         │
│                  - NextAuth (GitHub, Google, Email)          │
└──────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      RENDER (Backend)                        │
│  ┌─────────────────┐    ┌────────────────────────────────┐  │
│  │ agentbot-api    │    │ agentbot-worker                │  │
│  │ (Docker)        │    │ (Docker)                       │  │
│  │ - Express.js   │    │ - Docker provisioning          │  │
│  │ - Agent mgmt    │    │ - User containers              │  │
│  └─────────────────┘    └────────────────────────────────┘  │
│  ┌─────────────────┐                                       │
│  │ agentbot-postgres│                                      │
│  │ (PostgreSQL)    │                                      │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 16.1.6 |
| Backend | Node.js + Express | 20.x |
| Database | Neon PostgreSQL | 15 |
| Auth | NextAuth | v5 |
| Payments | Stripe | - |
| AI | OpenRouter | - |
| Hosting | Vercel + Render | - |

## Security Status: A+ ✅

| Category | Grade | Notes |
|----------|-------|-------|
| Authorization | A+ | Session-based, user ID checks |
| Input Validation | A+ | SecurityMiddleware + Zod |
| Secrets Management | A+ | All via environment variables |
| Production Hardening | A+ | Debug routes blocked in prod |
| Dependency Security | A | elliptic (no fix) |

### Security Fixes Applied (Mar 2026)
- ✅ Instance API authorization (session.user.id must match)
- ✅ Middleware → proxy.ts (Next.js 16 requirement)
- ✅ Admin emails via ADMIN_EMAILS env var
- ✅ Dashboard error boundary
- ✅ Deployments route protected
- ✅ Debug routes blocked in production

### Known Limitations
- **elliptic**: Used by ethers.js, no upstream fix (not exploitable)
- **Prisma**: Kept at 5.22.0 (avoid breaking changes)

## Environment Variables Required

### Vercel (Frontend)
```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
ADMIN_EMAILS=raveculture@icloud.com
INTERNAL_API_KEY
```

### Render (Backend)
```
DATABASE_URL
REDIS_URL
STRIPE_SECRET_KEY
INTERNAL_API_KEY
```

## API Endpoints (75+)

### Public (no auth)
- `/api/health` - Health check
- `/api/stripe/webhook` - Stripe callbacks
- `/api/auth/*` - Authentication (forgot-password, reset-password, farcaster verify)

### Protected (session auth)
- `/api/agents/*` - Agent management
- `/api/instance/*` - User instances
- `/api/settings/*` - User settings
- `/api/keys/*` - API keys
- `/api/chat/*` - Chat history
- `/api/memory/*` - Agent memory
- `/api/swarms/*` - Multi-agent

### Admin Only
- `/api/admin/users` - User management
- `/api/admin/stats` - Platform stats
- `/api/admin/security` - Security settings
- `/api/deployments` - Deployment logs

### Blocked in Production
- `/api/debug-*` - Debug endpoints
- `/api/test-*` - Test endpoints

## Development Commands

```bash
# Local development
npm run dev           # Starts all services via docker-compose
npm run dev:frontend  # Frontend only
npm run dev:api       # Backend only

# Deploy
vercel --prod         # Deploy to Vercel

# Database
cd web && npx prisma studio  # Open Prisma GUI
```

## Important Files

| File | Purpose |
|------|---------|
| `web/proxy.ts` | Route guards, blocks debug routes in prod |
| `web/app/api/instance/[userId]/route.ts` | Instance API with auth check |
| `web/app/api/admin/users/route.ts` | Admin API (uses ADMIN_EMAILS) |
| `web/app/api/lib/api-keys.ts` | Internal API key validation |
| `agentbot-backend/src/index.ts` | Docker provisioning |
| `render.yaml` | Render deployment config |

## npm audit

```
found 0 vulnerabilities
(16 low severity - elliptic - no fix available)
```

## Git Branches

- `main` - Production branch
- `production` - Legacy production
- `dev` - Development

---

For questions, check:
- `AGENTS.md` - Full context
- `SECURITY.md` - Security details
- `CLAUDE.md` - Developer instructions
