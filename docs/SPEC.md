# Agentbot Technical Specification

## Platform Overview

**Agentbot** is a managed AI agent deployment platform that enables users to deploy OpenClaw-based AI agents with Telegram/WhatsApp integrations in under 60 seconds.

- **Website:** https://agentbot.raveculture.xyz
- **API:** https://api.agentbot.raveculture.xyz
- **Status:** Production (v2.0)

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js with Google/GitHub OAuth
- **Payments:** Stripe (checkout, webhooks, credits)
- **Email:** Resend API

### Backend
- **Runtime:** Node.js (Express in Docker)
- **Database:** PostgreSQL (Prisma ORM)
- **Cache/Queue:** Redis
- **Container Runtime:** Docker

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** GCP VM (Docker)
- **DNS/CDN:** Cloudflare
- **AI Routing:** OpenRouter API

---

## API Endpoints

### Public
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/stripe/checkout` | GET | Create checkout session |
| `/api/stripe/credits` | GET | Buy credits |
| `/api/stripe/webhook` | POST | Stripe webhooks |

### Authenticated
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/register` | POST | User registration |
| `/api/instance/[userId]` | GET | Get instance status |
| `/api/instance/[userId]/stats` | GET | Get instance stats |
| `/api/instance/[userId]/start` | POST | Start instance |
| `/api/instance/[userId]/stop` | POST | Stop instance |
| `/api/instance/[userId]/restart` | POST | Restart instance |
| `/api/instance/[userId]/update` | POST | Update OpenClaw version |
| `/api/provision` | POST | Provision new agent |

### Internal (Backend)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Backend health |
| `/provision` | POST | Provision agent container |
| `/api/agents` | * | CRUD agents |

---

## Database Schema

### User (via NextAuth/Prisma)
```prisma
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String?  @unique
  image         String?
  password      String?
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
}
```

---

## Environment Variables

### Frontend (Vercel)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://agentbot.raveculture.xyz
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
GITHUB_ID=***
GITHUB_SECRET=***
STRIPE_SECRET_KEY=sk_***
STRIPE_WEBHOOK_SECRET=whsec_***
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=price_***
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_***
NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE=price_***
RESEND_API_KEY=re_***
```

### Backend (Docker)
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://...
REDIS_URL=redis://...
INTERNAL_API_KEY=***
ALLOWED_ORIGINS=https://agentbot.raveculture.xyz
OPENCLAW_IMAGE=ghcr.io/openclaw/openclaw:latest
```

---

## Supported AI Models

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4 |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku |
| Google | Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 1.0 Pro |
| Meta | Llama 3.1 405B, Llama 3.1 70B, Llama 3.1 8B |
| Mistral | Mistral Large, Mistral Medium, Mistral Small |
| Cohere | Command R+ |
| Azure | Azure OpenAI |

---

## Token Pricing (GBP)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | £0.0022/1k | £0.0088/1k |
| GPT-4o Mini | £0.0003/1k | £0.0012/1k |
| Claude 3.5 Sonnet | £0.0020/1k | £0.0080/1k |
| Claude 3 Haiku | £0.0002/1k | £0.0010/1k |
| Gemini 1.5 Flash | £0.0001/1k | £0.0005/1k |
| Gemini 1.5 Pro | £0.0013/1k | £0.0050/1k |
| Llama 3.1 70B | £0.0004/1k | £0.0004/1k |
| Mistral Large | £0.0015/1k | £0.0060/1k |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           Cloudflare (DNS + CDN)            │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐    ┌───────────────┐
│   Vercel      │    │   GCP VM      │
│  (Frontend)   │    │  (Backend)    │
│   :3000       │    │   :3001       │
└───────────────┘    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │PostgreSQL│  │  Redis   │  │ Docker   │
       │  :5432   │  │  :6379   │  │  Engine  │
       └──────────┘  └──────────┘  └────┬─────┘
                                       │
                                       ▼
                               ┌──────────────┐
                               │  OpenClaw   │
                               │  Containers │
                               └──────────────┘
```

---

## Security

- All API routes use NextAuth session validation
- Backend endpoints require Bearer token auth
- Stripe webhooks verified via signature
- Input validation on all user inputs
- Security headers via Next.js middleware
- Prisma singleton for DB connections

---

## Stripe Integration

### Price IDs (Production)
- Starter: `price_***`
- Pro: `price_***`
- Pro Plus: `price_***`
- Scale: `price_***`
- Credits 1000: `price_***`
- Credits 2500: `price_***`
- Credits 5000: `price_***`
- Credits 10000: `price_***`

### Webhook Events
- `checkout.session.completed` - Payment success
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Plan change
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_failed` - Failed payment

---

## CI/CD Pipeline

1. **Development** → Push to `main`
2. **Vercel** → Auto-deploys frontend
3. **Docker** → Manual rebuild on GCP
4. **Health Checks** → Post-deployment validation

---

## Monitoring

- **Frontend:** Vercel Analytics
- **Backend:** Custom health endpoints
- **Logs:** Docker logs + GCP logging
- **Alerts:** Uptime monitoring via Cloudflare

---

## Known Limitations & Roadmap

### In Progress
- Custom domains - Use your own domain for agents
- Web Dashboard Metrics - Real-time analytics & usage graphs  
- API Access - REST API for programmatic control

### Coming Soon
- WhatsApp Channel - Deploy agents to WhatsApp
- Agent Builder UI - Visual drag-and-drop agent creation
- Voice Agents - Voice-powered AI agents
- Passkeys - Passwordless login via WebAuthn (NextAuth v5)

### Known Issues
- No persistent storage for user files (stateless agents)
- 2FA not yet implemented

---

*Last Updated: February 2026*
