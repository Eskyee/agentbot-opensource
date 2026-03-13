# AgentBot Ollama Integration - Render Deployment

## Overview

This guide integrates Ollama (local/self-hosted LLM) into AgentBot running on Render.

## Architecture

```
User → Vercel Frontend (agentbot.raveculture.xyz)
     ↓
     → Render API (agentbot-api.onrender.com)
     ↓
     → Ollama Router Service
     ↓
     → Local Ollama Models (mistral, llama2, codellama, etc.)
```

## Setup Options

### Option 1: Local Ollama (Development/Testing)

Start Ollama locally on your machine:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# In another terminal, pull models
ollama pull mistral
ollama pull llama2
ollama pull codellama
```

Access at: `http://localhost:11434`

### Option 2: Docker-based Ollama (Recommended for Local Dev)

```bash
# Add to docker-compose.yml (already included with profile)
docker-compose --profile ollama up -d

# Pull models
docker exec agentbot-ollama ollama pull mistral
docker exec agentbot-ollama ollama pull llama2
```

### Option 3: Self-Hosted Ollama (Production)

Deploy Ollama on a separate VM/server with enough GPU/CPU.

## Environment Configuration

### Local Development (.env)

```bash
OLLAMA_URL=http://localhost:11434
OLLAMA_ENABLED=true
DEFAULT_OLLAMA_MODEL=mistral
```

### Render Production (.env.production)

```bash
OLLAMA_URL=https://ollama.yourdomain.com
OLLAMA_ENABLED=true
DEFAULT_OLLAMA_MODEL=mistral
```

## API Endpoints

### Health Check
```bash
GET /api/ollama/health
```

### List Models
```bash
GET /api/ollama/models
```

### Chat Endpoint
```bash
POST /api/ollama/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "What is Docker?"}
  ],
  "model": "mistral",
  "taskType": "general"
}
```

### Generate Endpoint
```bash
POST /api/ollama/generate
Content-Type: application/json

{
  "prompt": "Write hello world in Python",
  "model": "codellama"
}
```

## Available Models

- **Mistral** (7B) - Fast, good quality
- **Llama2** (13B) - General purpose
- **CodeLlama** (34B) - Code generation
- **Neural-Chat** (7B) - Conversation optimized

## Render Production Deployment

### Add to render.yaml

```yaml
services:
  - type: web
    name: agentbot-api
    runtime: docker
    dockerfilePath: agentbot-backend/Dockerfile.prod
    autoDeploy: true
    envVars:
      - key: OLLAMA_URL
        value: http://your-ollama-server:11434
```

## Next Steps

1. Deploy Ollama (local or external)
2. Configure OLLAMA_URL in Render
3. Test API endpoints
4. Integrate frontend with Ollama chat

