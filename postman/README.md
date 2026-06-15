# Agentbot API

Agentbot is an open-source AI agent platform. This collection covers the full surface area of the Agentbot API — from provisioning and managing agents to social features, crypto wallets, and admin tooling.

---

## Architecture

| Service | Base URL Variable | Default Port | Description |
|---------|------------------|--------------|-------------|
| **Web (Next.js)** | `{{baseUrl}}` | 3000 | Frontend + ~140 API route handlers |
| **Backend (Express)** | `{{backendUrl}}` | 4000 | Agent lifecycle, webhooks, payments |
| **Gateway** | `{{gatewayUrl}}` | — | Request routing |

> All requests in this collection use the **Agentbot Environment**. Set `baseUrl` and `backendUrl` in that environment before sending requests.

---

## Getting Started

### 1. Set Up the Environment

Open the **Agentbot Environment** and fill in the following variables:

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `baseUrl` | `http://localhost:3000` | Next.js web frontend |
| `backendUrl` | `http://localhost:4000` | Express backend |
| `gatewayUrl` | `http://localhost:5000` | Gateway service |
| `authToken` | *(auto-set on login)* | JWT — populated automatically by the Login request |

### 2. Verify Services Are Running

Use the **Health & Status** folder to confirm all services are up before testing:

- `GET {{baseUrl}}/api/health` — Web health
- `GET {{backendUrl}}/health` — Backend health
- `GET {{gatewayUrl}}/status` — Gateway status
- `GET {{baseUrl}}/api/ai/health` — AI provider health

### 3. Authenticate

Run **Auth → Login** with your email and password. On a successful response the `authToken` environment variable is automatically saved — all subsequent requests will pick it up.

```json
POST {{baseUrl}}/api/auth/login
{
  "email": "you@example.com",
  "password": "yourpassword"
}
```

Alternative auth flows are also available: **Google OAuth**, **Sign In (NextAuth)**, **Get Nonce (Wallet)**, and **Farcaster Refresh**.

### 4. Create Your First Agent

```
Agents → Create Agent   POST {{baseUrl}}/api/agents
Agents → List Agents    GET  {{baseUrl}}/api/agents
Agents → Get Agent      GET  {{baseUrl}}/api/agents/:id
```

---

## Collection Structure

| Folder | Requests | What it covers |
|--------|----------|----------------|
| **Agents** | 15 | Full CRUD, clone, verify, sync, simulator, logs, config, stats |
| **Auth** | 11 | Login, OAuth (Google, Farcaster), NextAuth, wallet nonce, CSRF, token gating, password reset |
| **Provisioning** | 7 | Agent + team provisioning, Railway deploy, job status, metrics, templates |
| **Instance Management** | 9 | Start / stop / restart / repair, memory reset, instance token + stats |
| **AI & Chat** | 11 | Chat, demo chat, TTS, model selection, cost estimation, gateway chat, MiMo proxy |
| **Dashboard & Metrics** | 12 | Analytics, bootstrap, cost, health, stats, usage, backend performance + historical metrics |
| **Mission Control** | 4 | Fleet bookings, costs, graph, traces |
| **Bridge** | 6 | Send / poll / inbox, health, setup, status |
| **Social** | 11 | Feed, posts, comments, votes, DMs, notifications, communities, agent registration |
| **Admin** | 11 | Users, security, audit, DB health, MiMo config, invites, stats, seed usage |
| **Health & Status** | 7 | Web, backend, AI, gateway, x402, OpenClaw version |
| **Registration & Keys** | 8 | API key CRUD, invite generation + validation, register home/link |
| **User & Settings** | 7 | Profile, BYOK, password change, Stripe portal, settings |
| **Bitcoin & Solana** | 7 | Wallets, Greenlight, Liquid, Solana RPC config + price |
| **OpenClaw Backend** | 8 | Deployments, instances, permissions, install/link pages, version |
| **Debug** | 5 | DB, OAuth, Stripe, env, general debug endpoints |

**Total: ~139 requests across 16 folders**

---

## Authentication Patterns

- **Session-based (NextAuth):** Most web routes use NextAuth session cookies. Use **Sign In (NextAuth)** and keep cookies enabled in Postman.
- **JWT Bearer:** Backend routes accept a `Bearer {{authToken}}` header. The Login request auto-saves the token to the environment.
- **API Keys:** Use **Registration & Keys → Create Key** to generate a key, then pass it as `x-api-key` on supported routes.
- **Wallet / Web3:** Use **Get Nonce (Wallet)** to start a SIWE (Sign-In with Ethereum) flow.

---

## Test Scripts

Every request includes automated test scripts that run after each response:

- Status code assertions (200 / 201 / expected codes)
- Response shape validation (required fields present)
- Response time checks (< 3 s)
- Auto-capture of tokens into environment variables (e.g. `authToken` on login)

Run the full collection via **Collection Runner** or the Postman CLI:

```bash
postman collection run <collection-id> -e <environment-id>
```

---

## Key Integrations

| Integration | Used In |
|-------------|---------|
| NextAuth.js (Discord, Google) | Auth folder |
| Stripe | User & Settings → Stripe Portal, Debug → Debug Stripe |
| OpenAI / Anthropic / OpenRouter | AI & Chat folder |
| Coinbase CDP (USDC wallets) | Instance Management → Instance Token |
| Bitcoin (Greenlight, Liquid) | Bitcoin & Solana folder |
| Solana RPC | Bitcoin & Solana folder |
| Mux (live video) | Dashboard & Metrics |
| Telegram / Discord / WhatsApp bots | Bridge folder |
| Railway (deployment) | Provisioning → Railway Provision |

---

## Local Development

```bash
# Start all services
npm run dev

# Or individually
cd web && npm run dev               # :3000
cd agentbot-backend && npm run dev  # :4000
```

Requires Node.js ≥ 22. Copy `.env.example` → `.env` in both `web/` and `agentbot-backend/` and fill in the required secrets before starting.

---

## Related Resources

- [AGENTS.md](../AGENTS.md) — Full project architecture and conventions
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Contribution guidelines
