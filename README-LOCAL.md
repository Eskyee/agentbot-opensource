# Agentbot - Local Development Setup

## Quick Start

### 1. Start All Services
```bash
cd ~/agentbot-local
docker-compose up -d
```

### 2. Check Status
```bash
docker-compose ps
```

### 3. View Logs
```bash
docker-compose logs -f api
```

### 4. Test API
```bash
curl http://localhost:3001/
curl http://localhost:3001/api/health
```

### 5. Test Agent Creation
```bash
curl -X POST http://localhost:3001/api/provision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 9f44230308f0b6d9ff5d2e402918ddeb1d4d5e410da2ceeec981af23a9b647e5" \
  -d '{"telegramToken":"test","plan":"underground"}'
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3001 | Backend API |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache/Queue |

## Database Access

```bash
# Connect to PostgreSQL
docker exec -it agentbot-postgres psql -U agentbot -d agentbot

# Or use local psql
psql postgres://agentbot:localdev@localhost:5432/agentbot
```

## Stopping Services

```bash
docker-compose down          # Stop and remove containers
docker-compose down -v       # Stop and remove containers + data volumes
```

## Development Mode (Hot Reload)

The API service runs with `npm run dev` which includes hot reload. Changes to the code will automatically restart the server.

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill process or change port in docker-compose.yml
```

### Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Rebuild After Code Changes
```bash
docker-compose build --no-cache api
docker-compose up -d api
```

## Environment Variables

Edit `.env` file to customize:
- Database credentials
- API keys
- Render API credentials (for agent deployment)

## Production Deployment

This local setup is for development only. For production, use the Render Blueprint workflow documented in `DEPLOYMENT_WORKFLOW.md`.

## Files

- `docker-compose.yml` - Service definitions
- `.env` - Environment variables
- `agentbot-backend/` - Backend API code (cloned from GitHub)
