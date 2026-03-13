# 🚀 Quick Reference - Local Docker Development

## Start Everything (1 command)

```bash
docker-compose up -d
```

Services start at:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Database: postgres:5432
- Redis: localhost:6379
- Ollama: http://localhost:11434

---

## Test Everything Works

```bash
# Quick test
curl http://localhost:3001/health | jq

# Test MCP
curl http://localhost:3001/api/render-mcp/health | jq

# Test AI models
curl http://localhost:3001/api/ai/models | jq '.count'
```

---

## Common Commands

```bash
# View all services
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View API logs only
docker-compose logs -f api

# Stop everything
docker-compose down

# Stop + remove volumes (full reset)
docker-compose down -v

# Restart API
docker-compose restart api

# Rebuild API image
docker-compose build api --no-cache

# Access database CLI
docker-compose exec postgres psql -U agentbot -d agentbot_db

# Access redis cli
docker-compose exec redis redis-cli

# SSH into API container
docker-compose exec api sh
```

---

## VS Code Setup

```bash
# Open workspace
code agentbot.code-workspace

# Run tasks (Ctrl+Shift+B)
- Docker: Up (Full Stack)
- Docker: Down
- Backend: Build
- Backend: Test
```

---

## Development Workflow

1. **Edit code** in VS Code
2. **Save** (auto-format)
3. **Docker rebuilds** automatically
4. **Refresh browser** to see changes
5. **Breakpoints work** automatically

---

## Debug Locally

```bash
# In VS Code Debug panel (Ctrl+Shift+D)
1. Select "Backend - Debug npm start"
2. Click green play button
3. Set breakpoints by clicking line numbers
4. Code execution pauses at breakpoints
```

---

## Push to Production

```bash
# 1. Test locally ✅
curl http://localhost:3001/health

# 2. Commit changes
git add .
git commit -m "your message"

# 3. Push (Render auto-deploys)
git push origin main

# 4. Verify production
curl https://agentbot-api.onrender.com/health
./verify-deployment.sh
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3001 in use | `lsof -i :3001` → `kill -9 <PID>` |
| Service unhealthy | `docker-compose logs postgres` (check which) |
| Docker not running | Start Docker Desktop |
| Hot reload not working | `docker-compose restart api` |
| Need fresh start | `docker-compose down -v && docker-compose up -d` |

---

## Environment Variables

Edit `.env` to add:

```env
# Optional - Cloud AI models
OPENROUTER_API_KEY=sk-or-your-key

# Optional - Render integration
RENDER_API_KEY=rnd_your-key

# Local dev defaults (in .env.local)
DATABASE_URL=postgresql://agentbot:devpassword@postgres:5432/agentbot_db
REDIS_URL=redis://redis:6379
OLLAMA_URL=http://ollama:11434
```

---

## File Locations

| Service | Port | Host | URL |
|---------|------|------|-----|
| Frontend | 3000 | localhost | http://localhost:3000 |
| API | 3001 | localhost | http://localhost:3001 |
| Database | 5432 | postgres | `postgresql://...` |
| Redis | 6379 | redis | redis://redis:6379 |
| Ollama | 11434 | ollama | http://ollama:11434 |

---

## Key Files

```
agentbot/
├── docker-compose.yml       ← Service definitions
├── .env.local               ← Default env vars
├── agentbot.code-workspace  ← VS Code config
├── LOCAL_DOCKER_SETUP.md    ← Full guide (you are here)
├── LOCAL_DEVELOPMENT.md     ← Backend-only setup
├── agentbot-backend/        ← API code
├── agentbot-worker/         ← Worker code  
└── web/                     ← Frontend code
```

---

## Next Steps

1. `docker-compose up -d` - Start services
2. `code agentbot.code-workspace` - Open in VS Code
3. Make changes to code
4. Changes rebuild automatically
5. Test in browser: http://localhost:3001
6. `git push` - Deploy to Render

---

**For detailed info:** See `LOCAL_DOCKER_SETUP.md`
