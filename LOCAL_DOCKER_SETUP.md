# 🐳 Docker + VS Code Local Development Setup

**Goal:** Complete local development environment → push to production → deploy on Render

---

## 📋 Prerequisites

- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- VS Code installed (https://code.visualstudio.com)
- Git installed
- Node.js 18+ (for local CLI tools, Docker has its own)

---

## 🚀 Quick Start (5 minutes)

### 1. Open Project in VS Code

```bash
cd agentbot
code agentbot.code-workspace
```

VS Code will open with 3 folders loaded:
- `agentbot-backend` - Node.js API server
- `agentbot-worker` - Job processing worker
- `web` - Next.js frontend

### 2. Start Docker Services

Open VS Code terminal (Ctrl+`) and run:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Ollama LLM (port 11434)
- Backend API (port 3001)
- Worker (background processing)
- Frontend (port 3000)

### 3. Verify Everything Running

```bash
docker-compose ps
```

Expected output: All services showing `Up (healthy)`

### 4. Test Endpoints

```bash
# From VS Code terminal
curl http://localhost:3001/health
curl http://localhost:3001/api/render-mcp/health
curl http://localhost:3000
```

Or use the **Rest Client** extension in VS Code to test interactively.

---

## 📂 Project Structure

```
agentbot/
├── agentbot-backend/          # Node.js Express API
│   ├── src/
│   │   ├── index.ts          # Main app
│   │   ├── routes/
│   │   │   ├── render-mcp.ts
│   │   │   ├── ai.ts
│   │   │   └── ...
│   │   └── services/
│   ├── Dockerfile            # Docker build config
│   ├── package.json
│   └── tsconfig.json
├── agentbot-worker/           # Job worker service
├── web/                       # Next.js frontend
├── docker-compose.yml         # Services orchestration
├── .env.local                 # Local env vars (CREATE THIS)
├── agentbot.code-workspace    # VS Code workspace config
└── ...
```

---

## 🛠️ VS Code Setup

### 1. Open Workspace

```bash
code agentbot.code-workspace
```

### 2. Install Recommended Extensions

VS Code will prompt you. Click "Install All" for:
- TypeScript support
- ESLint / Prettier (code formatting)
- Docker extension
- Rest Client (API testing)
- PostgreSQL Client
- Redis Client
- GitLens

### 3. VS Code Tasks (Ctrl+Shift+B)

Pre-configured tasks available:

```
- Docker: Up (Full Stack)      → Start all services
- Docker: Down                 → Stop all services
- Docker: Logs (API)           → Stream API logs
- Backend: Build               → npm run build
- Backend: Test                → npm run test
- Verify Endpoints             → Run test script
```

### 4. Debug Backend

1. Click the Debug icon (left sidebar)
2. Select "Backend - Debug npm start"
3. Click the green play button or F5

Breakpoints will work automatically.

---

## 📝 Environment Setup

### 1. Create `.env` file

```bash
cp .env.local .env
```

### 2. Edit `.env` (Optional - defaults work for local dev)

For local dev, defaults are fine. To enable advanced features:

```bash
# For OpenRouter cloud models (get from https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-your-key

# For Render integration (get from https://dashboard.render.com/account/api-tokens)
RENDER_API_KEY=rnd_your-key

# For local CDP wallet (leave empty for local dev)
CDP_API_KEY_NAME=your-key-id
CDP_PRIVATE_KEY=your-private-key
CDP_WALLET_SECRET=your-wallet-secret
```

### 3. Reload services

```bash
docker-compose restart api worker
```

---

## 🧪 Testing Locally

### Option 1: Browser

```
Frontend:  http://localhost:3000
API Docs:  http://localhost:3001/api/render-mcp/info
```

### Option 2: VS Code Rest Client

Create `test.http` in project root:

```http
### Health Check
GET http://localhost:3001/health

### MCP Info
GET http://localhost:3001/api/render-mcp/info

### AI Models
GET http://localhost:3001/api/ai/models

### MCP Setup
GET http://localhost:3001/api/render-mcp/setup

### Validate Config
POST http://localhost:3001/api/render-mcp/validate-config
Content-Type: application/json

{
  "api_key": "rnd_test123456"
}
```

Click "Send Request" above each request to test.

### Option 3: Curl in Terminal

```bash
curl http://localhost:3001/api/render-mcp/health | jq
curl http://localhost:3001/api/ai/models | jq '.count'
```

---

## 🔄 Development Workflow

### Making Changes

1. **Edit code** in VS Code
2. **Save file** (auto-format with Prettier)
3. **Backend rebuilds automatically** (docker-compose watches src/)
4. **Refresh browser** to see changes

### Hot Reload Details

Docker-compose is configured with:

```yaml
develop:
  watch:
    - path: ./agentbot-backend/src
      action: rebuild
```

This means:
- Changes to `src/` files trigger rebuild
- TypeScript recompiles
- Server restarts automatically
- No manual `npm start` needed!

### Debugging

1. Set breakpoint by clicking line number
2. Open browser DevTools or use VS Code debugger
3. Code execution pauses at breakpoint
4. Inspect variables, step through code

---

## 📊 Common Tasks

### View Service Logs

```bash
# All services
docker-compose logs -f

# Just API
docker-compose logs -f api

# Just Database
docker-compose logs -f postgres

# Follow in real-time
docker-compose logs -f --tail=50
```

### Access Database

In VS Code:
1. Install "PostgreSQL Client" extension
2. Connection settings already configured
3. Browse tables, run queries

Or via CLI:

```bash
docker-compose exec postgres psql -U agentbot -d agentbot_db
```

### Access Redis

In VS Code:
1. Install "Redis Client" extension
2. Should auto-detect localhost:6379
3. Browse keys, view values

Or via CLI:

```bash
docker-compose exec redis redis-cli
```

### Pull Ollama Model

```bash
# Inside container
docker-compose exec ollama ollama pull mistral

# Or from terminal
curl -X POST http://localhost:11434/api/pull -d '{"name":"llama2"}'
```

### Rebuild Everything

```bash
docker-compose down -v          # Remove all volumes
docker-compose build --no-cache # Force rebuild
docker-compose up -d            # Start fresh
```

---

## 🚀 Deploy to Production

Once working locally:

### 1. Commit Changes

```bash
git add .
git commit -m "feat: Add features tested locally"
```

### 2. Push to GitHub

```bash
git push origin main
```

### 3. Render Auto-Deploys

- Render watches your repo
- Detects push to main
- Auto-builds and deploys
- Monitors dashboard: https://dashboard.render.com

### 4. Verify Production

```bash
./verify-deployment.sh
# Tests production URLs
```

---

## ⚙️ Configuration Files Explained

### `docker-compose.yml`

Defines all services, volumes, networks, health checks.

Key features:
- `depends_on` - Service startup order
- `healthcheck` - Ensures service is ready
- `volumes` - Persist data between restarts
- `environment` - Inject env vars into containers
- `ports` - Expose ports to host
- `develop.watch` - Enable hot reload

### `.env.local`

Local development secrets and config.

- `.env` added to `.gitignore` (never commit!)
- `docker-compose.yml` loads from `.env`
- Can override any env var in `.env`

### `agentbot.code-workspace`

VS Code workspace configuration.

- `folders` - Maps project directories
- `settings` - Editor defaults, formatting
- `extensions.recommendations` - Required VS Code extensions
- `launch` - Debug configurations
- `tasks` - Pre-configured npm tasks

---

## 🐛 Troubleshooting

### "Port already in use"

```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or change port in docker-compose.yml
```

### "Service unhealthy"

```bash
# Check logs
docker-compose logs postgres  # or redis, api, etc

# Restart service
docker-compose restart postgres
```

### "Cannot connect to Docker daemon"

```bash
# Make sure Docker Desktop is running
# On Mac: Click Docker icon in menu bar
# On Linux: systemctl start docker
# On Windows: Start Docker Desktop from Start menu
```

### "npm ERR! code EACCES"

```bash
# Permission issue, rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### "Hot reload not working"

```bash
# Restart docker-compose
docker-compose restart api

# Or rebuild everything
docker-compose up -d --build
```

---

## 🎯 Next Steps

### For Development

1. ✅ Docker running locally
2. ✅ VS Code workspace opened
3. ✅ Code changes auto-rebuild
4. ✅ Test endpoints working
5. Next: Make changes, test, commit

### For Production

1. ✅ Code tested locally
2. ✅ All tests passing
3. ✅ Commits pushed to GitHub
4. ✅ Render auto-deploying
5. Next: Verify production endpoints

---

## 📚 Documentation

- **LOCAL_DEVELOPMENT.md** - Running backend only (no Docker)
- **RENDER_MCP_QUICKSTART.md** - IDE setup (Cursor, Claude, VS Code)
- **RENDER_MCP_SETUP_GUIDE.md** - Complete MCP reference
- **LOCAL_DOCKER_SETUP.md** - This file (Docker + VS Code)

---

## ✅ Verification Checklist

- [ ] Docker Desktop installed and running
- [ ] VS Code installed
- [ ] Workspace opened: `code agentbot.code-workspace`
- [ ] Extensions installed (VS Code prompted)
- [ ] `.env` file created from `.env.local`
- [ ] `docker-compose up -d` runs successfully
- [ ] `docker-compose ps` shows all services "Up"
- [ ] `curl http://localhost:3001/health` returns JSON
- [ ] `curl http://localhost:3001/api/render-mcp/health` returns JSON
- [ ] Browser can reach `http://localhost:3000` (frontend)
- [ ] Browser can reach `http://localhost:3001/api/render-mcp/info` (API)
- [ ] Database accessible in VS Code PostgreSQL extension
- [ ] Redis accessible in VS Code Redis extension
- [ ] Backend logs showing "Server listening on port 3001"

Once all checked, you're ready to develop! 🚀

---

## 🔗 Quick Links

- Docker Desktop: https://www.docker.com/products/docker-desktop
- VS Code: https://code.visualstudio.com
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Redis Docs: https://redis.io/docs/
- Ollama: https://ollama.ai/

