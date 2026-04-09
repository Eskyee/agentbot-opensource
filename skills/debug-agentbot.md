---
name: debug-agentbot
description: Debug Agentbot issues. Use when agentbot is not working - no response, errors, build failures, deployment issues. Triggers on "debug agentbot", "agentbot not working", "fix agentbot", "agentbot error".
---

# Debug Agentbot

Systematically diagnose and fix Agentbot issues.

## 1. Check Services Running

```bash
# Frontend
curl -s http://localhost:3000 | head -5

# Backend  
curl -s http://localhost:3001/health
```

## 2. Check Docker Containers

```bash
docker ps -a
docker logs <container_name>
```

## 3. Check Environment Variables

```bash
# Backend .env
cat agentbot-backend/.env | grep -v "^#" | grep "="

# Frontend .env  
cat web/.env | grep -v "^#" | grep "="
```

## 4. Common Issues

### No response from agent
- Verify API key is set and valid
- Check Telegram/Discord bot token
- Check agent is running: `curl http://localhost:3001/api/agents`

### Build errors
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node --version` (need 18+)
- Run with verbose: `npm run build 2>&1`

### Port already in use
```bash
lsof -i :3000
lsof -i :3001
kill -9 <PID>
```

### Database connection errors
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- For local: `psql -U postgres -l`

### Docker issues
```bash
docker system prune -a
docker volume ls
docker logs openclaw-data-<agentId>
```

## 5. Logs Location

- Frontend: Browser console + `web/.next/server/*.log`
- Backend: `agentbot-backend/logs/`
- Docker: `docker logs <container_name>`

## 6. Health Checks

```bash
# Backend API
curl http://localhost:3001/api/health

# OpenClaw agent
curl http://localhost:19000/health

# Database
psql -U postgres -h localhost -d agentbot -c "SELECT 1"
```

## 7. Reset Everything

```bash
# Stop all
pkill -f "npm run dev"
docker stop $(docker ps -aq)

# Clear data
docker volume rm $(docker volume ls -q | grep openclaw)

# Fresh start
cd agentbot-backend && npm run dev &
cd web && npm run dev &
```
