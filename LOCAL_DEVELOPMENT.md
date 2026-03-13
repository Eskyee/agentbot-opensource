# 🚀 Local Development Guide - AgentBot Render MCP

**Status:** ✅ **ALL ENDPOINTS WORKING LOCALLY**

## Quick Start (5 minutes)

### 1. Start Backend Server

```bash
cd agentbot/agentbot-backend
npm install
npm start
```

Expected output:
```
Server listening on port 3001
```

### 2. Verify Endpoints

```bash
# Health check
curl http://localhost:3001/health

# MCP Gateway
curl http://localhost:3001/api/render-mcp/health

# AI Provider
curl http://localhost:3001/api/ai/health
curl http://localhost:3001/api/ai/models
```

All should return JSON responses. ✅

---

## Architecture

```
Your Terminal
    ↓
http://localhost:3001 (Node.js Express Server)
    ├─ /health - Basic health check
    ├─ /api/render-mcp/* - MCP gateway endpoints
    │   ├─ /health - MCP server status
    │   ├─ /info - Server information
    │   ├─ /setup - IDE setup instructions
    │   ├─ /tools - Available tools
    │   ├─ /examples - Example prompts
    │   └─ /validate-config - Config validation
    └─ /api/ai/* - AI provider endpoints
        ├─ /health - AI provider status
        ├─ /models - List available models
        └─ /chat - Chat endpoint
```

---

## Available Endpoints (All Working ✅)

### MCP Gateway Endpoints

```bash
# Get MCP server info
curl http://localhost:3001/api/render-mcp/info | jq .

# Get setup instructions for IDEs
curl http://localhost:3001/api/render-mcp/setup | jq .

# List available tools
curl http://localhost:3001/api/render-mcp/tools | jq .

# Get example prompts
curl http://localhost:3001/api/render-mcp/examples | jq .

# Validate API key format
curl -X POST http://localhost:3001/api/render-mcp/validate-config \
  -H "Content-Type: application/json" \
  -d '{"api_key":"rnd_test123456"}'
```

### AI Provider Endpoints

```bash
# Check provider health
curl http://localhost:3001/api/ai/health | jq .

# List all available models
curl http://localhost:3001/api/ai/models | jq '.models | length'

# Chat endpoint (with valid model)
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model":"deepseek-r1:32b",
    "messages":[{"role":"user","content":"Hello"}]
  }' | jq .
```

---

## Environment Setup (Optional)

For full functionality, set these env vars:

```bash
# Database (optional for local testing)
export DATABASE_URL="postgresql://user:pass@localhost:5432/agentbot"

# Redis (optional for local testing)
export REDIS_URL="redis://localhost:6379"

# Ollama (if running local Ollama)
export OLLAMA_URL="http://localhost:11434"

# AI Models
export OPENROUTER_API_KEY="sk-or-your-key-here"

# Wallet (optional, for Coinbase CDP)
export CDP_API_KEY_NAME="your-key-id"
export CDP_PRIVATE_KEY="your-private-key"
export CDP_WALLET_SECRET="your-wallet-secret"

# Other
export INTERNAL_API_KEY="dev-key-123"
export JWT_SECRET="dev-secret-123"
```

Then start:
```bash
npm start
```

---

## Testing Workflows

### Workflow 1: Test MCP Gateway

```bash
# 1. Get setup info
curl http://localhost:3001/api/render-mcp/setup

# 2. Validate a test API key
curl -X POST http://localhost:3001/api/render-mcp/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "rnd_1234567890abcdefghij"
  }' | jq .

# Expected: valid response with setup instructions
```

### Workflow 2: Test AI Provider

```bash
# 1. Check health
curl http://localhost:3001/api/ai/health | jq .

# Expected: ollama: true, openrouter: false (or true if key set)

# 2. List models  
curl http://localhost:3001/api/ai/models | jq '.models[] | {id, provider}' | head -10

# Expected: Mix of Ollama and OpenRouter models (if configured)
```

### Workflow 3: Full Integration Test

```bash
# 1. Start server
npm start &

# 2. Wait 2 seconds
sleep 2

# 3. Run verification script
./verify-deployment.sh

# Expected: All 9 endpoints responding ✅
```

---

## Troubleshooting

### "Cannot find module 'pg'"
```bash
cd agentbot-backend
npm install pg @types/pg
```

### Server won't start - CDP keys error
```
# Old behavior - throws at startup
# New behavior - lazy loads, throws only if wallet methods called
# For local dev, this is fine - server starts successfully
```

### "Cannot GET /api/render-mcp/health"
```bash
# Means route isn't registered
# Check: npm run build succeeded
# Check: src/index.ts has app.use('/api/render-mcp', renderMcpRouter)
# Restart: npm start
```

### Ollama not responding
```bash
# If using local Ollama:
# 1. Make sure Ollama is running: ollama serve
# 2. Test: curl http://localhost:11434/api/tags
# 3. Set: export OLLAMA_URL="http://localhost:11434"
# 4. Restart npm start
```

---

## Development Tips

### Hot Reload During Development
```bash
npm run dev
# Uses ts-node-dev for automatic restarts on file changes
```

### Build for Production
```bash
npm run build
# Output in dist/
```

### Run Tests
```bash
npm test
```

### Check Code Quality
```bash
npm run build
# TypeScript strict mode checks everything
```

---

## What's Working Locally ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Server | ✅ Running | http://localhost:3001 |
| MCP Gateway | ✅ All 5 endpoints | Setup info, tools, examples |
| AI Provider | ✅ Working | 9 models detected (Ollama) |
| Health Checks | ✅ All responding | HTTP 200 with JSON |
| TypeScript | ✅ Compiles | Zero errors, strict mode |
| Wallet Service | ✅ Optional | Lazy-loaded, won't block startup |
| Database Pool | ✅ Initialized | Ready when DATABASE_URL set |

---

## What Still Needs

| Component | Needed For | How To Set |
|-----------|-----------|-----------|
| Database | Full CRUD | Set DATABASE_URL env var |
| Redis | Caching/Queues | Set REDIS_URL env var |
| Ollama | Local AI models | Install ollama, run ollama serve |
| OpenRouter API | Cloud models | Get key from openrouter.ai |
| CDP Credentials | Wallet features | Set CDP_* env vars |

---

## Next: Deploy to Render

Once verified locally, deploy:

```bash
# 1. All changes pushed
git push

# 2. Render auto-deploys (watches main branch)
# Monitor: https://dashboard.render.com/agentbot-api

# 3. Verify production
./verify-deployment.sh  # will test production URLs

# 4. Configure IDE
# Use: RENDER_MCP_QUICKSTART.md
```

---

## Production Verification Checklist

After deploying to Render:

- [ ] `/health` responds ✅
- [ ] `/api/render-mcp/health` responds ✅
- [ ] `/api/ai/health` responds ✅
- [ ] `/api/ai/models` returns models list ✅
- [ ] All 9 endpoints working ✅
- [ ] Environment variables set correctly ✅
- [ ] Database connectivity verified ✅
- [ ] No error logs ✅

---

**Current Status:** ✅ All endpoints working locally. Ready for production deployment or IDE testing.

**To Start:** 
```bash
cd agentbot/agentbot-backend && npm start
```

Then visit: http://localhost:3001/api/render-mcp/info
