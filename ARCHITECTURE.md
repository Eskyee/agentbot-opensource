# StartClaw Architecture

## Overview

StartClaw is a managed hosting platform for deploying and managing AI agents. The platform consists of multiple services working together to provide a seamless deployment experience.

```
┌─────────────────────────────────────────────────────┐
│         Frontend (Next.js)                          │
│         startclaw.com                               │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌─────────┐
    │  API   │ │ Worker │ │  Redis  │
    │ :3001  │ │Service │ │  Queue  │
    └────────┘ └────────┘ └─────────┘
        │          │          │
        └──────────┼──────────┘
                   ▼
           ┌──────────────┐
           │ PostgreSQL   │
           │  Database    │
           └──────────────┘

    Deployed Agents: *.agents.startclaw.com
```

## Components

### 1. Frontend (`/web`)
- **Technology**: Next.js 14 with React 18
- **Purpose**: User dashboard, agent management interface
- **Features**:
  - Homepage with product information
  - Onboarding flow for new users
  - Agent management dashboard
  - Deployment interface
  - Real-time status monitoring

### 2. Backend API (`/agentbot-backend`)
- **Technology**: Express.js with TypeScript
- **Port**: 3001
- **Purpose**: REST API for agent management
- **Endpoints**:
  - `GET /health` - Health check
  - `GET /api/agents` - List all agents
  - `POST /api/agents` - Create new agent
  - `GET /api/agents/:id` - Get agent details
  - `PUT /api/agents/:id` - Update agent
  - `DELETE /api/agents/:id` - Delete agent
  - `POST /api/deployments` - Create deployment

### 3. Deployment Worker (`/agentbot-worker`)
- **Technology**: Bull queue processor with TypeScript
- **Purpose**: Asynchronous deployment processing
- **Responsibilities**:
  - Build Docker images for agents
  - Deploy containers
  - Configure DNS/routing
  - Health monitoring
  - Status updates

### 4. OpenClaw Provisioning API (`/api`)
- **Technology**: Node.js with Express
- **Port**: 3000
- **Purpose**: Existing API for OpenClaw container management
- **Integration**: Works alongside the new agentbot architecture

### 5. Data Layer

#### PostgreSQL
- Stores agent metadata
- User accounts and authentication
- Deployment history
- API keys

#### Redis
- Job queue for deployments
- Session storage
- Caching layer

### 6. Nginx Reverse Proxy
- Routes traffic to appropriate services
- Handles wildcard subdomains for deployed agents
- SSL/TLS termination

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### Quick Start

1. **Clone repository**
```bash
git clone https://github.com/Eskyee/startclaw.git
cd startclaw
```

2. **Copy environment file**
```bash
cp .env.local .env
```

3. **Start all services**
```bash
docker compose up -d
```

4. **Access services**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Nginx: http://startclaw.localhost

5. **View logs**
```bash
docker compose logs -f
```

6. **Stop services**
```bash
docker compose down
```

### Development Workflow

**Making changes:**

1. Edit files in respective directories
2. Services auto-reload with hot reloading
3. For backend/worker: `docker compose restart <service>`

**Rebuilding:**
```bash
docker compose up -d --build <service>
```

**Clean slate:**
```bash
docker compose down -v
docker compose up --build
```

## Production Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Backend & Worker (Docker)
1. Build images: `docker compose -f docker-compose.prod.yml build`
2. Push to registry
3. Deploy on server with production compose file

### Database & Redis
Use managed services:
- PostgreSQL: AWS RDS, DigitalOcean, or similar
- Redis: AWS ElastiCache, Redis Cloud, or similar

### DNS Configuration
1. Main domain: `startclaw.com` → Vercel
2. API domain: `api.startclaw.com` → Your server
3. Wildcard: `*.agents.startclaw.com` → Your server

## Environment Variables

See `.env.local` for development and `.env.production` for production settings.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Worker**: Bull, Redis
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Proxy**: Nginx
- **Container**: Docker, Docker Compose
- **AI Runtime**: OpenClaw containers

## Architecture Decisions

### Why separate API and Worker?
- **Scalability**: Can scale each independently
- **Reliability**: Deployment failures don't affect API
- **Performance**: Non-blocking deployments

### Why PostgreSQL?
- Relational data (users, agents, deployments)
- ACID compliance
- Strong ecosystem

### Why Redis?
- Fast job queue with Bull
- Session storage
- Caching layer

### Why Next.js?
- Modern React framework
- Built-in routing
- SSR/SSG support
- Great developer experience

## Security Considerations

- API authentication with bearer tokens
- Environment-based secrets
- Database password encryption
- Container isolation
- Network segmentation

## Monitoring

- Health endpoints for all services
- Docker stats for resource usage
- Application logs via Docker logs
- PostgreSQL query monitoring
- Redis memory usage tracking

## Future Enhancements

- [ ] User authentication and signup
- [ ] Payment integration
- [ ] Advanced monitoring dashboard
- [ ] Automatic scaling
- [ ] Backup automation
- [ ] Multi-region support
- [ ] Advanced analytics
