# Agentbot Quick Reference

## Quick Commands

### Start/Stop
```bash
make start          # Start all services
make stop           # Stop all services
make restart        # Restart all services
./start-dev.sh      # Start with health checks
```

### Logs
```bash
make logs           # All service logs
make logs-api       # API logs only
make logs-worker    # Worker logs only
make logs-frontend  # Frontend logs only
docker compose logs -f <service>  # Specific service
```

### Development
```bash
make build          # Build all services
make rebuild        # Rebuild and restart
make clean          # Remove everything
```

### Database
```bash
make db-shell       # Open PostgreSQL shell
make redis-cli      # Open Redis CLI
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | User dashboard |
| API | http://localhost:3001 | Backend API |
| Health Check | http://localhost:3001/health | API health |
| Nginx | http://agentbot.localhost | Reverse proxy |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache/Queue |

## API Endpoints

### Health
```bash
GET /health
```

### Agents
```bash
GET    /api/agents           # List all agents
POST   /api/agents           # Create agent
GET    /api/agents/:id       # Get agent
PUT    /api/agents/:id       # Update agent
DELETE /api/agents/:id       # Delete agent
```

### Deployments
```bash
POST   /api/deployments      # Create deployment
```

### Authentication
All API endpoints (except /health) require Bearer token:
```bash
curl -H "Authorization: Bearer dev-secret-key-12345" \
     http://localhost:3001/api/agents
```

## Environment Variables

### Development (.env.local)
- `INTERNAL_API_KEY=dev-secret-key-12345`
- `DATABASE_URL=postgres://agentbot:devpassword@localhost:5432/agentbot_db`
- `REDIS_URL=redis://localhost:6379`

### Production (.env.production)
Update with real credentials and domains.

## Project Structure

```
agentbot/
├── web/                    # Next.js frontend
│   ├── app/                # Pages and components
│   ├── public/             # Static assets
│   └── Dockerfile
├── agentbot-backend/       # Express API
│   ├── src/
│   │   └── index.ts        # Main API server
│   ├── package.json
│   └── Dockerfile
├── agentbot-worker/        # Deployment worker
│   ├── src/
│   │   └── worker.ts       # Queue processor
│   ├── package.json
│   └── Dockerfile
├── api/                    # Legacy OpenClaw API
│   ├── server.js
│   └── package.json
├── docker-compose.yml      # All services
├── nginx.conf              # Reverse proxy
├── init-db.sql             # Database schema
└── Makefile                # Shortcuts
```

## Common Tasks

### Add a new API endpoint
1. Edit `agentbot-backend/src/index.ts`
2. Restart: `docker compose restart api`

### Update frontend
1. Edit files in `web/app/`
2. Changes auto-reload with Next.js

### Process deployments
1. Worker automatically processes jobs from Redis queue
2. Monitor: `make logs-worker`

### Database changes
1. Edit `init-db.sql`
2. Recreate: `docker compose down -v && docker compose up -d`

### Test API locally
```bash
# Health check
curl http://localhost:3001/health

# List agents (with auth)
curl -H "Authorization: Bearer dev-secret-key-12345" \
     http://localhost:3001/api/agents

# Create agent
curl -X POST \
     -H "Authorization: Bearer dev-secret-key-12345" \
     -H "Content-Type: application/json" \
     -d '{"name":"test-agent","config":{}}' \
     http://localhost:3001/api/agents
```

## Troubleshooting

### Services won't start
```bash
docker compose logs <service>  # Check logs
docker compose down -v         # Clean slate
docker compose up --build      # Rebuild
```

### Port already in use
```bash
lsof -i :3000  # Check what's using port
lsof -i :3001
lsof -i :5432
```

### Database connection failed
```bash
docker compose ps postgres     # Check if running
docker compose logs postgres   # Check logs
make db-shell                  # Try connecting
```

### Redis connection failed
```bash
docker compose ps redis        # Check if running
docker compose logs redis      # Check logs
make redis-cli                 # Try connecting
```

### Frontend not loading
```bash
docker compose logs frontend   # Check logs
docker compose restart frontend # Restart
```

### API not responding
```bash
docker compose logs api        # Check logs
curl http://localhost:3001/health  # Test health
docker compose restart api     # Restart
```

## Development Workflow

1. **Start services**: `make start`
2. **Make changes** to code
3. **View logs**: `make logs`
4. **Restart if needed**: `make restart`
5. **Test changes** in browser/API
6. **Commit and push**

## Production Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Vercel auto-deploys
3. Set environment variables in Vercel

### Backend (Docker)
1. Build: `docker compose build api worker`
2. Tag: `docker tag agentbot-api:latest registry/agentbot-api:v1.0`
3. Push: `docker push registry/agentbot-api:v1.0`
4. Deploy on server

### DNS
- `agentbot.com` → Vercel
- `api.agentbot.com` → Your server
- `*.agents.agentbot.com` → Your server

## Resources

- [Architecture Guide](ARCHITECTURE.md)
- [README](README.md)
- [OpenClaw Docs](https://openclaw.ai)
