# Ollama Integration - Quick Start

## Start Local Ollama with AgentBot

### With Ollama (Optional)

```bash
cd ./agentbot

# Start all services including Ollama
docker-compose --profile ollama up -d

# Pull models
docker exec agentbot-ollama ollama pull mistral
docker exec agentbot-ollama ollama pull llama2

# Test Ollama health
curl http://localhost:11434/api/tags

# Test through AgentBot API
curl http://localhost:3001/api/ollama/health
```

### Without Ollama (Default)

```bash
cd ./agentbot
docker-compose up -d

# API runs normally, Ollama endpoints will return 503 if not configured
```

## Verify Everything Works

```bash
# 1. All services running
docker-compose ps

# 2. List Ollama models
curl http://localhost:3001/api/ollama/models

# 3. Test chat
curl -X POST http://localhost:3001/api/ollama/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"Hello!"}],
    "model":"mistral"
  }'
```

## For Render Production

Set environment variable in Render dashboard:

```
OLLAMA_URL=https://ollama.yourdomain.com
```

Then test:

```bash
curl https://agentbot-api.onrender.com/api/ollama/health
```

