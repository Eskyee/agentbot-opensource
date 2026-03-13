# Universal AI Provider Integration - Ollama + OpenRouter

## Overview

AgentBot now supports **BOTH Ollama (local) and OpenRouter (cloud)** giving users maximum choice and flexibility.

```
┌─────────────────────────────────────────────────────────────────┐
│                      AgentBot AI Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Universal API Endpoints (/api/ai/*)                            │
│  - /health          → Check both providers                      │
│  - /models          → List all models from all providers        │
│  - /chat            → Chat endpoint (auto-selects provider)     │
│  - /models/select   → Smart model selection                     │
│  - /estimate-cost   → Calculate token costs                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ollama Backend              │  OpenRouter Backend              │
│  (Local/Self-Hosted)         │  (Cloud/Commercial)             │
│                              │                                 │
│  • mistral                   │  • gpt-4                        │
│  • llama2                    │  • claude-3.5-sonnet            │
│  • codellama                 │  • gemini-2.0-flash             │
│  • neural-chat               │  • llama-3.1-70b                │
│  • phi                       │  • deepseek-r1                  │
│  • custom models             │  • 100+ more models             │
│                              │                                 │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Health Check
```bash
GET /api/ai/health

Response:
{
  "status": "healthy",
  "providers": {
    "ollama": true,
    "openrouter": true
  },
  "timestamp": "2026-03-11T..."
}
```

### 2. List All Available Models
```bash
GET /api/ai/models

Response:
{
  "models": [
    {
      "id": "mistral",
      "name": "Mistral 7B",
      "provider": "ollama",
      "description": "Local Ollama Model: mistral",
      "tags": ["local", "free", "open-source"],
      "available": true
    },
    {
      "id": "openai/gpt-4",
      "name": "GPT-4",
      "provider": "openrouter",
      "description": "OpenAI GPT-4",
      "tags": ["cloud", "commercial"],
      "inputCost": 0.03,
      "outputCost": 0.06,
      "contextWindow": 8192,
      "available": true
    }
  ],
  "count": 150,
  "ollama": 8,
  "openrouter": 142
}
```

### 3. Get Models by Provider
```bash
GET /api/ai/models/ollama
GET /api/ai/models/openrouter

Response:
{
  "provider": "ollama",
  "models": [...],
  "count": 8
}
```

### 4. Smart Model Selection
```bash
POST /api/ai/models/select
Content-Type: application/json

{
  "taskType": "coding",        // coding|analysis|creative|quick|long|general
  "preferLocal": true          // true = prefer Ollama, false = prefer OpenRouter
}

Response:
{
  "model": {
    "id": "codellama",
    "name": "CodeLlama",
    "provider": "ollama",
    ...
  },
  "taskType": "coding",
  "preferLocal": true
}
```

### 5. Universal Chat Endpoint
```bash
POST /api/ai/chat
Content-Type: application/json

{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Write a Python function to sort an array"}
  ],
  "model": "codellama",         // Optional - auto-selects if not provided
  "taskType": "coding",         // Used if model not specified
  "preferLocal": true,
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 1000
}

Response:
{
  "id": "ollama-1234567890",
  "model": "codellama",
  "provider": "ollama",
  "message": {
    "role": "assistant",
    "content": "def sort_array(arr):\n    return sorted(arr)"
  },
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 15,
    "total_tokens": 60
  },
  "timestamp": "2026-03-11T..."
}
```

### 6. Cost Estimation
```bash
POST /api/ai/estimate-cost
Content-Type: application/json

{
  "model": "openai/gpt-4",
  "inputTokens": 1000,
  "outputTokens": 500
}

Response:
{
  "model": "openai/gpt-4",
  "inputTokens": 1000,
  "outputTokens": 500,
  "estimatedCost": 0.045,
  "currency": "USD",
  "timestamp": "2026-03-11T..."
}
```

## Environment Variables

```bash
# Ollama Configuration
OLLAMA_URL=http://localhost:11434        # Local development
OLLAMA_URL=http://agentbot-ollama:11434  # Docker Compose
OLLAMA_URL=https://ollama.yourdomain.com # Production

# OpenRouter Configuration
OPENROUTER_API_KEY=your-api-key-here     # Get from https://openrouter.ai

# Optional
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # Default
```

## How It Works

### Provider Detection
Models are automatically routed to the correct provider:
- **Ollama models**: Simple names (mistral, llama2, codellama)
- **OpenRouter models**: Include "/" (openai/gpt-4, anthropic/claude-3-sonnet)

### Smart Model Selection
```typescript
// Task Type → Preferred Provider
coding        → OpenRouter (CodeLlama, GPT-4)
analysis      → Ollama or OpenRouter (balanced)
creative      → OpenRouter (Claude, GPT-4)
quick         → Ollama (fast local models)
long          → OpenRouter (longer context windows)
general       → User preference (preferLocal flag)
```

### Cost Calculation
- **Ollama**: FREE (local execution)
- **OpenRouter**: Transparent per-token pricing
  - Input: $0.03/1M tokens (example)
  - Output: $0.06/1M tokens (example)

## Usage Examples

### Example 1: Use Ollama (Local, Free)
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'mistral'  // Local, free
  })
});
```

### Example 2: Use OpenRouter (Cloud, Commercial)
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Write code...' }],
    model: 'openai/gpt-4'  // Cloud, paid
  })
});
```

### Example 3: Smart Auto-Selection
```javascript
// Let the system choose the best model for the task
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Help me code...' }],
    taskType: 'coding',      // Auto-selects best model
    preferLocal: false       // Prefer cloud models for coding
  })
});
```

### Example 4: Cost Estimation
```javascript
// Check cost before sending
const cost = await fetch('/api/ai/estimate-cost', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'openai/gpt-4',
    inputTokens: 1000,
    outputTokens: 500
  })
});
const { estimatedCost } = await cost.json();
console.log(`Estimated cost: $${estimatedCost}`);
```

## User Choice & Control

### Frontend Model Selector
```javascript
// Get all models for user to choose from
const models = await fetch('/api/ai/models').then(r => r.json());

// Group by provider
const ollamaModels = models.filter(m => m.provider === 'ollama');
const openrouterModels = models.filter(m => m.provider === 'openrouter');

// Show UI with model categories
// - Local Free Models (Ollama)
// - Cloud Models (OpenRouter)
// - Estimated Costs shown for each
```

### User Preferences
```javascript
// Option 1: "I prefer free local models"
preferLocal: true

// Option 2: "I prefer the best models (cloud)"
preferLocal: false

// Option 3: "Give me choices"
// Return both ollama and openrouter options
```

## Pricing Model for Users

### Starter Plan (£19/mo)
- ✅ Unlimited local Ollama models (free)
- ✅ Limited OpenRouter quota
- ✅ Smart model recommendations

### Pro Plan (£39/mo)
- ✅ Unlimited Ollama (free)
- ✅ $20/month OpenRouter credit
- ✅ Priority model selection

### Scale Plan (£79/mo)
- ✅ Unlimited Ollama (free)
- ✅ $100/month OpenRouter credit
- ✅ Custom model preferences

### Enterprise (£149+/mo)
- ✅ Unlimited Ollama (free)
- ✅ Unlimited OpenRouter (included)
- ✅ Dedicated support

## Configuration

### Local Development
```bash
# .env
OLLAMA_URL=http://localhost:11434
# OpenRouter optional for dev

# Run local Ollama
docker-compose --profile ollama up -d
```

### Production Render
```bash
# Render Environment Variables
OLLAMA_URL=http://agentbot-ollama:11434
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
```

### Monitoring

```bash
# Check provider availability
curl https://agentbot-api.onrender.com/api/ai/health

# List all models
curl https://agentbot-api.onrender.com/api/ai/models | jq '.count'

# Check specific provider
curl https://agentbot-api.onrender.com/api/ai/models/ollama | jq '.count'
```

## Benefits for Users

✅ **Maximum Choice**: 150+ models to choose from  
✅ **Cost Control**: Free local models or paid cloud models  
✅ **Transparency**: See costs before using cloud models  
✅ **Reliability**: Fallback from cloud to local if needed  
✅ **Flexibility**: Switch providers anytime  
✅ **Privacy**: Local models for sensitive data  
✅ **Performance**: Fast local models when available  

## Next Steps

1. Set `OPENROUTER_API_KEY` in Render environment
2. Frontend displays both Ollama and OpenRouter models
3. Users select provider/model
4. System routes to correct backend
5. Costs tracked for billing

