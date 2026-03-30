# Architecture

## Overview

Agentbot is a multi-tenant AI agent platform built with Next.js, Express, and Docker. Each user gets an isolated AI agent running in its own Docker container with configurable channels, AI providers, and resource limits.

## System Components

### Frontend (Next.js 15)
- **App Router** with React Server Components
- **shadcn/ui** components with custom design system
- **Tailwind CSS** for styling (dark-only, monospace aesthetic)
- Pages: Dashboard, Onboarding, Agent Management, Marketplace

### Backend API (Express.js)
- **REST API** with Bearer token authentication
- **Rate limiting** per endpoint category
- **Docker orchestration** for agent lifecycle management
- **File-based port allocation** with lock-based concurrency

### Database (PostgreSQL + Prisma)
- User management and authentication
- Agent configuration and metadata
- Scheduled tasks, skills, workflows
- Referral system and API keys

### Agent Runtime (Docker)
- Each agent runs in an isolated container
- Resource limits (memory, CPU) based on plan tier
- Volume-mounted workspace and configuration
- Per-agent gateway token for secure communication

## Data Flow

```
User → Frontend → API → Docker Container (Agent)
                  ↓
              PostgreSQL (state)
```

1. User provisions agent via frontend
2. API creates Docker container with resource limits
3. Agent connects to configured channels (Telegram, Discord, etc.)
4. Agent processes messages using configured AI provider
5. State persists in PostgreSQL

## Plan Tiers

| Plan | Memory | CPUs | Agents |
|------|--------|------|--------|
| Solo | 2GB | 1 | 1 |
| Collective | 4GB | 2 | 3 |
| Label | 8GB | 4 | 10 |
| Network | 16GB | 4 | Unlimited |

## Security

- **Authentication**: Bearer token with timing-safe comparison
- **Authorization**: Per-agent ownership checks
- **Rate limiting**: Express-rate-limit with per-IP windows
- **Container isolation**: Docker resource limits, no shared state
- **Input validation**: Sanitized agent IDs, validated Docker image names
- **Secrets**: Environment variables only, never in code or logs

## Key Design Decisions

1. **Docker over serverless** — agents need persistent connections for channel plugins
2. **File-based port allocation** — simple, works without external coordination
3. **Prisma over raw SQL** — type safety, migration management
4. **shadcn/ui** — accessible, customizable, dark-native components
