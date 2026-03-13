# ✅ Complete Setup Checklist - Local Docker + VS Code

## Prerequisites (Install Once)

- [ ] Docker Desktop installed: https://www.docker.com/products/docker-desktop
- [ ] VS Code installed: https://code.visualstudio.com
- [ ] Git installed: https://git-scm.com
- [ ] Node.js 18+ installed (optional, Docker has it)

---

## Setup Steps (First Time Only)

### 1. Clone & Navigate
```bash
[ ] git clone https://github.com/Eskyee/agentbot.git
[ ] cd agentbot
```

### 2. Create Environment File
```bash
[ ] cp .env.example .env
[ ] (Optional) Edit .env for advanced features
```

### 3. Start Docker Services
```bash
[ ] docker-compose up -d
[ ] Wait 2-3 minutes for services to be ready
[ ] docker-compose ps (verify all "Up")
```

### 4. Open in VS Code
```bash
[ ] code agentbot.code-workspace
[ ] Wait for extensions to be discovered
[ ] Click "Install All" for recommended extensions
```

### 5. Verify Everything Works
```bash
[ ] curl http://localhost:3001/health
[ ] curl http://localhost:3001/api/render-mcp/health
[ ] curl http://localhost:3001/api/ai/models
[ ] Open http://localhost:3000 in browser (frontend)
[ ] Open http://localhost:3001/api/render-mcp/info in browser
```

---

## Daily Development Workflow

### Morning: Start Fresh
```bash
[ ] cd agentbot
[ ] docker-compose up -d
[ ] code agentbot.code-workspace
[ ] Wait for "status: healthy" in docker-compose ps
```

### During Work: Make Changes
```bash
[ ] Edit code in VS Code
[ ] Save file (auto-format with Prettier)
[ ] Docker rebuilds automatically
[ ] Refresh browser to see changes
[ ] Set breakpoints in VS Code for debugging
```

### Before Committing: Test
```bash
[ ] Run: curl http://localhost:3001/health
[ ] Run: docker-compose logs api (check for errors)
[ ] Test in browser: http://localhost:3000
[ ] Run tests: npm test (in VS Code terminal)
```

### Deploy: Push to GitHub
```bash
[ ] git add .
[ ] git commit -m "your message"
[ ] git push origin main
[ ] Monitor: https://dashboard.render.com
[ ] Test production: ./verify-deployment.sh
```

---

## VS Code Features Enabled

### Debugging
```
[ ] Click Debug icon (left sidebar)
[ ] Select "Backend - Debug npm start"
[ ] Click green play button or press F5
[ ] Set breakpoints by clicking line numbers
[ ] Code pauses at breakpoints, inspect variables
```

### Tasks (Ctrl+Shift+B)
```
[ ] Docker: Up (Full Stack) - Start all services
[ ] Docker: Down - Stop all services
[ ] Docker: Logs (API) - Stream API logs
[ ] Backend: Build - npm run build
[ ] Backend: Test - npm run test
[ ] Verify Endpoints - Run test script
```

### Extensions Auto-Installed
```
[ ] TypeScript (ms-vscode.vscode-typescript-next)
[ ] ESLint (dbaeumer.vscode-eslint)
[ ] Prettier (esbenp.prettier-vscode)
[ ] Docker (ms-azuretools.vscode-docker)
[ ] PostgreSQL Client (cweijan.vscode-postgresql-client2)
[ ] Redis Client (cweijan.vscode-redis-client)
[ ] Rest Client (humao.rest-client)
[ ] GitLens (eamodio.gitlens)
[ ] GitHub Copilot (GitHub.copilot)
```

---

## Services Running

| Service | Port | Status Check | Notes |
|---------|------|--------------|-------|
| Frontend | 3000 | http://localhost:3000 | Next.js app |
| API | 3001 | http://localhost:3001/health | Node.js Express |
| Database | 5432 | In VS Code PostgreSQL extension | postgres:15 |
| Redis | 6379 | In VS Code Redis extension | redis:7 |
| Ollama | 11434 | http://localhost:11434/api/tags | Local LLM |
| Worker | N/A | docker-compose logs worker | Background jobs |

---

## Common Tasks During Development

### View Logs
```bash
[ ] All services: docker-compose logs -f
[ ] Just API: docker-compose logs -f api
[ ] Just Database: docker-compose logs -f postgres
[ ] Just Redis: docker-compose logs -f redis
```

### Restart a Service
```bash
[ ] Restart API: docker-compose restart api
[ ] Restart database: docker-compose restart postgres
[ ] Full restart: docker-compose down && docker-compose up -d
```

### Access Services Directly
```bash
[ ] Database: docker-compose exec postgres psql -U agentbot -d agentbot_db
[ ] Redis CLI: docker-compose exec redis redis-cli
[ ] API Container: docker-compose exec api sh
```

### Run Commands in Container
```bash
[ ] npm test: docker-compose exec api npm test
[ ] npm build: docker-compose exec api npm run build
[ ] Any command: docker-compose exec api <command>
```

---

## Troubleshooting Checklist

### Port Already in Use (3001)
```bash
[ ] Find process: lsof -i :3001
[ ] Kill process: kill -9 <PID>
[ ] Or change port in docker-compose.yml
[ ] Restart: docker-compose restart api
```

### Service Unhealthy
```bash
[ ] Check logs: docker-compose logs <service>
[ ] Verify port is available
[ ] Restart service: docker-compose restart <service>
[ ] Full reset: docker-compose down -v && docker-compose up -d
```

### Docker Not Running
```bash
[ ] Start Docker Desktop (Mac/Windows)
[ ] For Linux: sudo systemctl start docker
[ ] Verify: docker ps
```

### Hot Reload Not Working
```bash
[ ] Check volumes: docker-compose config | grep volumes
[ ] Restart: docker-compose restart api
[ ] Rebuild: docker-compose build api --no-cache
```

### Cannot Connect to Database
```bash
[ ] Check postgres status: docker-compose ps postgres
[ ] Check logs: docker-compose logs postgres
[ ] Verify DATABASE_URL in .env
[ ] Ensure postgres is healthy before API starts
```

---

## File Structure Reference

```
agentbot/
├── agentbot-backend/          [ ] Backend API (Node.js Express)
│   ├── src/
│   │   ├── index.ts           [ ] Main entry point
│   │   ├── routes/
│   │   │   ├── render-mcp.ts [ ] MCP gateway
│   │   │   ├── ai.ts         [ ] AI provider
│   │   │   └── ...
│   │   └── services/
│   ├── Dockerfile            [ ] Container build config
│   └── package.json
├── agentbot-worker/           [ ] Job worker (Node.js)
├── web/                       [ ] Frontend (Next.js)
├── docker-compose.yml        [ ] Service orchestration
├── .env                      [ ] Local env vars (CREATE from .env.example)
├── .env.example              [ ] Template (DON'T EDIT - use as template)
├── agentbot.code-workspace   [ ] VS Code configuration
├── LOCAL_DOCKER_SETUP.md     [ ] Comprehensive Docker guide
└── QUICK_REFERENCE.md        [ ] Quick commands
```

---

## Testing & Verification

### Manual API Tests
```bash
[ ] curl http://localhost:3001/health | jq .
[ ] curl http://localhost:3001/api/render-mcp/health | jq .
[ ] curl http://localhost:3001/api/ai/health | jq .
[ ] curl http://localhost:3001/api/ai/models | jq '.count'
```

### Browser Tests
```
[ ] Frontend: http://localhost:3000
[ ] API Info: http://localhost:3001/api/render-mcp/info
[ ] API Setup: http://localhost:3001/api/render-mcp/setup
[ ] API Models: http://localhost:3001/api/ai/models
```

### Automated Tests
```bash
[ ] Run: ./verify-deployment.sh (tests production URLs)
[ ] Docker: docker-compose exec api npm test
[ ] Build: docker-compose exec api npm run build
```

---

## Before Deploying to Production

### Code Quality
- [ ] No console.errors in docker logs
- [ ] No TypeScript errors (npm run build passes)
- [ ] Tests passing (npm test passes)
- [ ] No security warnings (npm audit)

### Testing
- [ ] Tested in Firefox, Chrome, Safari
- [ ] Database queries working
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Breakpoints work in debugger

### Documentation
- [ ] Code commented where needed
- [ ] Changes documented in commit message
- [ ] README updated if needed

### Git
- [ ] All changes staged: git add .
- [ ] Commit message clear: git commit -m "..."
- [ ] Push to main: git push origin main
- [ ] Monitor Render: https://dashboard.render.com

---

## Production Verification (After Deploying)

```bash
[ ] Check Render status: https://dashboard.render.com/agentbot-api
[ ] Verify logs: Look for "Server listening" message
[ ] Test health: curl https://agentbot-api.onrender.com/health
[ ] Test MCP: curl https://agentbot-api.onrender.com/api/render-mcp/health
[ ] Run full test: ./verify-deployment.sh
```

---

## Quick Commands Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View status
docker-compose ps

# View logs
docker-compose logs -f api

# Restart
docker-compose restart api

# Full rebuild
docker-compose build --no-cache api && docker-compose up -d

# Access database
docker-compose exec postgres psql -U agentbot -d agentbot_db

# VS Code
code agentbot.code-workspace

# Git workflow
git add . && git commit -m "message" && git push
```

---

## Documentation Files

- [ ] Read: `LOCAL_DOCKER_SETUP.md` (comprehensive, 10KB)
- [ ] Read: `QUICK_REFERENCE.md` (quick commands)
- [ ] Read: `LOCAL_DEVELOPMENT.md` (backend-only alternative)
- [ ] Reference: `RENDER_MCP_QUICKSTART.md` (IDE setup)

---

## Final Checklist: Ready for Development?

- [ ] Docker running
- [ ] VS Code opened with workspace
- [ ] All services healthy (docker-compose ps)
- [ ] API responding (curl localhost:3001/health)
- [ ] Frontend loading (http://localhost:3000)
- [ ] Breakpoints working in debugger
- [ ] Code changes trigger hot reload
- [ ] .env configured (if using advanced features)
- [ ] Ready to commit and push

---

**Status:** ✅ Ready for local development

**Start:**
```bash
cp .env.example .env
docker-compose up -d
code agentbot.code-workspace
```

**Next:** Make changes → Test locally → Commit → Push → Render auto-deploys

