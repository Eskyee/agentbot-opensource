# StartClaw 🦞

**Deploy and manage AI agents in 60 seconds. No servers, no terminal, no BS.**

StartClaw is a complete platform for deploying, managing, and scaling AI agents — built on [OpenClaw](https://openclaw.ai), the open-source personal AI assistant. We handle all the infrastructure so you can focus on building great AI experiences.

## Features

- ⚡ **60-second deployment** — Sign up, configure your agent, deploy
- 🔒 **Secure by default** — Isolated containers, encrypted backups
- 📊 **Agent management** — Dashboard to monitor and manage all your agents
- 🌐 **Custom subdomains** — Each agent gets its own subdomain
- 💰 **Flexible pricing** — Starting at ₹199/mo
- 🔄 **Daily backups** — Never lose your AI's memory
- 🆓 **Free trial** — 7 days, no card required
- 🧩 **Skills via ClawHub** — Discover and pull skills from [clawhub.ai](https://clawhub.ai)

## Quick Start

For customer onboarding steps, see [User Guide](docs/USER_GUIDE.md).
For production launch/testing, see [Production Release Checklist](docs/PRODUCTION_RELEASE_CHECKLIST.md).

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/Eskyee/startclaw.git
cd startclaw

# 2. Copy environment
cp .env.local .env

# 3. Start all services
docker compose up -d

# 4. Services are running:
# - Frontend: http://localhost:3000
# - API: http://localhost:3001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Nginx: http://startclaw.localhost
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Architecture

StartClaw consists of multiple services:

- **Frontend**: Next.js React dashboard
- **Backend API**: Express.js agent management API
- **Worker**: Bull queue for deployments
- **Database**: PostgreSQL for agent metadata
- **Cache**: Redis for job queue
- **Proxy**: Nginx for routing

```
Frontend → API → Worker → Docker Containers
              ↓      ↓
         PostgreSQL + Redis
```

## How It Works

1. **Sign up** at [startclaw.com](https://startclaw.com)
2. **Create your agent** with our easy setup wizard
3. **Deploy** — We handle container orchestration
4. **Manage** — Monitor and scale from your dashboard
5. **Done!** Your agent is live on a custom subdomain

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Trial | Free (7 days) | 1 agent, shared resources |
| Starter | £19/mo | 3 agents, BYOK support |
| Pro | £49/mo | 10 agents, dedicated resources |
| Power | £99/mo | Unlimited agents, priority support |

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Backend:** Express.js, TypeScript
- **Worker:** Bull, Redis Queue
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Container Orchestration:** Docker, Docker Compose
- **Reverse Proxy:** Nginx (local), Caddy (production)
- **AI Runtime:** OpenClaw containers

## Development

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Project Structure

```
startclaw/
├── web/                    # Next.js frontend
├── agentbot-backend/       # Express API
├── agentbot-worker/        # Deployment worker
├── api/                    # Legacy OpenClaw API
├── infra/                  # Infrastructure scripts
├── docs/                   # Documentation
├── docker-compose.yml      # Local development
├── nginx.conf              # Nginx configuration
└── init-db.sql             # Database schema
```

### Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Restart a service
docker compose restart api

# Rebuild and restart
docker compose up -d --build api

# Stop all services
docker compose down

# Clean slate (removes volumes)
docker compose down -v
```

## Deployment

### Frontend (Vercel)
- Push to GitHub
- Connect to Vercel
- Auto-deploy on push

### Backend (Docker)
- Build images
- Push to registry
- Deploy with docker-compose

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed deployment guides.
Use [Production Release Checklist](docs/PRODUCTION_RELEASE_CHECKLIST.md) before each release.

## Self-Hosting

Want to run this yourself? 

1. Clone the repository
2. Set up environment variables
3. Configure your domain
4. Run `docker compose up`

See [docs/SETUP.md](docs/SETUP.md) for detailed instructions.

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

---

Built with 🦞 by [Mohana](https://github.com/mohanagsk)
