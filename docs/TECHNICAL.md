# Agentbot - Technical Documentation

## Overview

Agentbot is a hosted OpenClaw platform where users sign up, choose a plan, and deploy their AI agent. Built for the underground culture.

## Quick Links

- **Dashboard**: https://agentbot.raveculture.xyz/dashboard
- **Login**: https://agentbot.raveculture.xyz/login
- **Marketplace**: https://agentbot.raveculture.xyz/marketplace
- **DJ Stream**: https://agentbot.raveculture.xyz/dashboard/dj-stream

## Features

### Wallet Login (SIWE)
- Connect MetaMask, Coinbase Wallet, or any injected wallet
- Sign-In with Ethereum (SIWE) for passwordless auth
- Auto-creates account for new users

### Multi-Channel Support
- **Telegram** - `/api/webhooks/telegram`
- **Discord** - `/api/webhooks/discord`
- **WhatsApp** - `/api/webhooks/whatsapp`

### Skills System
- `/api/skills` - List available skills
- Skills: DJ Streaming, Guestlist, USDC Payments, Calendar, Email, Webhooks, Browser Automation

### DJ Streaming (baseFM)
- RAVE token gating (5,000 RAVE required)
- Mux RTMP streaming
- `/api/basefm/live` - List active streams
- `/api/basefm/streams` - Create new stream

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |

### Agents
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent?action=health` | GET | Health status |
| `/api/agent?action=sessions` | GET | List sessions |
| `/api/agent?action=skills` | GET | Available skills |
| `/api/agent?action=credentials` | GET | Configured credentials |

### Features
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/skills` | GET | List skills |
| `/api/basefm/live` | GET | Live DJs |
| `/api/basefm/streams` | POST | Create stream |
| `/api/guestlist` | GET/POST | Event management |
| `/api/calendar` | GET/POST | Google Calendar |
| `/api/billing` | GET/POST | Subscription |

### Webhooks
| Endpoint | Description |
|----------|-------------|
| `/api/webhooks/mux` | Mux stream events |
| `/api/webhooks/discord` | Discord bot |
| `/api/webhooks/whatsapp` | WhatsApp messages |

## Tech Stack

- **Frontend**: Next.js 16 (Vercel)
- **Backend**: Node.js Express
- **Database**: Neon (PostgreSQL)
- **Payments**: Stripe (subscription)
- **Auth**: NextAuth (GitHub, Google, Email, Wallet)
- **AI Models**: OpenRouter default (Kimi K2.5)
- **Wallet**: wagmi + injected connector
- **Streaming**: Mux

## Environment Variables

```
# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://agentbot.raveculture.xyz

# OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_SIGNING_SECRET=

# Onchain
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Database
DATABASE_URL=
```

## Pricing (5 Plans)

| Plan | Price | RAM | CPU |
|------|-------|-----|-----|
| Starter | £19/mo | 2GB | 1 |
| Pro | £39/mo | 4GB | 2 |
| Scale | £79/mo | 8GB | 4 |
| Enterprise | £149/mo | 16GB | 4 |
| White Glove | £199/mo | 32GB | 8 |

## OpenClaw Versions

### 1. Personal OpenClaw (Mac mini local) - "Atlas"
- NOT in Docker - runs directly on Mac mini via `openclaw` CLI
- NOT exposed publicly - local only
- Updated via: `openclaw update` CLI
- Version: 2026.3.1 (latest)

### 2. Agentbot OpenClaw (Docker containers)
- Runs in Docker via agentbot-backend
- New deployments use: `ghcr.io/openclaw/openclaw:2026.3.1`

### 3. Gordon - Production Docker
- Self-managing Docker production
- Handles web code
- Updates independently

## Deployment

```bash
# Build
cd web && npm run build

# Deploy (push to main triggers Vercel)
git push upstream main
```

## Skills Installation

```bash
# Install skill from ClawHub
npx clawhub install <skill-name> --dir skills

# List installed skills
npx clawhub list

# Search skills
npx clawhub search wallet base
```

## Marketplace Templates

- rave-event - Rave Event Agent
- sound-system - Sound System Agent  
- crusty-punk - Crusty Punk Agent
- warehouse - Warehouse Party Agent
- community-treasury - Treasury Agent
- basefmbot - Onchain Radio Agent
- chain - Crypto Wallet Agent
- studio-one - Dancehall Dub Agent
- clawdbotdj - Underground DJ Agent
- techno-industrial - Techno Industrial Agent
- breakcore - Breakcore Agent
- ambient-drone - Ambient Drone Agent
- grime-sink - Grime Agent
- vinyl-collective - Vinyl Collective Agent

## Commands

```bash
# Check OpenClaw version
openclaw --version

# Update OpenClaw
openclaw update

# Check status
openclaw status
```
