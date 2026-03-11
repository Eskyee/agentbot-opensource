# AgentBot + Ollama Integration Guide

**Based on:** Official Ollama Documentation (https://docs.ollama.com)  
**Status:** Production-Ready Implementation  
**Date:** March 10, 2026

---

## 🦙 Overview

[Ollama](https://ollama.com) is the easiest way to run large language models locally or in the cloud. AgentBot integrates Ollama to provide users with:

- ✅ **Hosted Ollama** - Managed by AgentBot (included in subscription)
- ✅ **Self-Hosted Ollama** - User's own server
- ✅ **Cloud Models** - Larger models with better performance
- ✅ **Zero Lock-in** - Switch between providers anytime
- ✅ **Transparent Pricing** - See exact costs upfront

---

## 📥 Ollama Installation

### For AgentBot Users (Self-Hosted Option)

**macOS:**
```bash
# Download from official site
# https://ollama.com/download

# Or use Homebrew
brew install ollama

# Start Ollama
ollama serve
```

**Windows:**
```bash
# Download installer
# https://ollama.com/download/windows

# Run installer and follow prompts
# Ollama will start automatically
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve
```

---

## 🚀 Quickstart - AgentBot + Ollama

### Step 1: Sign Up to AgentBot
1. Go to https://agentbot.raveculture.xyz
2. Create account (free trial)
3. Choose Starter plan or above

### Step 2: Connect Ollama
**Option A: Use AgentBot's Hosted Ollama (Easiest)**
```
Settings → AI Providers → Select "Hosted Ollama"
✓ No installation needed
✓ Free for Starter tier
✓ All models included
```

**Option B: Use Your Own Ollama**
```
Settings → AI Providers → Add "Self-Hosted Ollama"
Enter: http://localhost:11434
Test Connection → Ready!
```

### Step 3: Pull Models
```bash
# Popular models for different tasks
ollama pull mistral         # Fast general purpose
ollama pull llama2          # Long context
ollama pull codellama       # Coding assistance
ollama pull neural-chat     # Conversational
```

### Step 4: Start Chatting
- Open AgentBot dashboard
- Create new agent
- Select your Ollama model
- Start deploying!

---

## 📚 Available Models

### Recommended for AgentBot

| Model | Best For | Size | Speed | Quality |
|-------|----------|------|-------|---------|
| **mistral** | General purpose | 7B | Fast | High |
| **llama2** | Long context | 7B | Medium | High |
| **codellama** | Programming | 7B | Fast | Excellent |
| **neural-chat** | Conversations | 7B | Medium | Good |
| **orca-mini** | Quick responses | 3B | Very Fast | Good |
| **dolphin-mixtral** | Advanced reasoning | 8x7B | Medium | Excellent |

### More Models Available
```bash
# View all available models
ollama list

# Search for models
ollama pull <model-name>

# Examples:
ollama pull phi              # Microsoft model
ollama pull openchat         # Chat model
ollama pull starling-lm      # Reasoning model
ollama pull solar            # Solar model
ollama pull tinyllama        # Tiny/mobile
```

**Complete list:** https://ollama.com/library

---

## 🔌 API Integration (For Developers)

### Official Ollama JavaScript Library

```typescript
import { Ollama } from 'ollama'

const ollama = new Ollama({ 
  host: 'http://localhost:11434' 
})

// Generate response
const response = await ollama.generate({
  model: 'mistral',
  prompt: 'Why is the sky blue?',
  stream: false
})

console.log(response.response)
```

### Official Ollama Python Library

```python
import ollama

response = ollama.generate(
  model='mistral',
  prompt='Why is the sky blue?'
)

print(response['response'])
```

### Ollama REST API

```bash
# Health check
curl http://localhost:11434/api/tags

# Generate response
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "Why is the sky blue?",
  "stream": false
}'

# Streaming response
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "Tell me a story",
  "stream": true
}'
```

---

## 🎯 AgentBot Integration Architecture

```typescript
// agentbot/services/ollama.service.ts

import { Ollama } from 'ollama'

class OllamaService {
  private ollama: Ollama
  
  constructor(endpoint: string = 'http://localhost:11434') {
    this.ollama = new Ollama({ host: endpoint })
  }
  
  // Check connection
  async health(): Promise<boolean> {
    try {
      const response = await this.ollama.list()
      return response.models.length > 0
    } catch {
      return false
    }
  }
  
  // Generate response
  async generate(
    model: string,
    prompt: string,
    options?: {
      temperature?: number
      top_p?: number
      top_k?: number
    }
  ) {
    const response = await this.ollama.generate({
      model,
      prompt,
      stream: false,
      ...options
    })
    
    return response.response
  }
  
  // Streaming response
  async *generateStream(model: string, prompt: string) {
    const response = await this.ollama.generate({
      model,
      prompt,
      stream: true
    })
    
    for await (const chunk of response) {
      yield chunk.response
    }
  }
  
  // List available models
  async listModels() {
    const response = await this.ollama.list()
    return response.models.map(m => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at
    }))
  }
  
  // Pull new model
  async pullModel(model: string) {
    try {
      await this.ollama.pull({ model })
      return { success: true, message: `Model ${model} pulled successfully` }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

export default OllamaService
```

---

## 💰 AgentBot + Ollama Pricing

### Hosted Ollama (AgentBot Managed)

```
Starter Tier (£19/mo):
  ✓ 100 Ollama calls/day
  ✓ 2-3 models available
  ✓ Standard processing

Pro Tier (£39/mo):
  ✓ Unlimited Ollama calls
  ✓ All 10+ models available
  ✓ Priority processing

Scale Tier (£79/mo):
  ✓ Unlimited Ollama calls
  ✓ All models + custom fine-tuning
  ✓ Priority/GPU processing

Enterprise (£149/mo):
  ✓ Unlimited everything
  ✓ GPU acceleration
  ✓ Custom models
  ✓ Dedicated server
```

### Self-Hosted Ollama (User's Server)

```
Free Option:
  ✓ Install on your server
  ✓ No AgentBot fees for Ollama
  ✓ Only pay subscription for AgentBot features
  ✓ Full control and privacy
  ✓ Unlimited usage (hardware dependent)
```

---

## 🔧 Advanced Configuration

### Custom Model Parameters

```typescript
// Fine-tune model behavior
const response = await ollama.generate({
  model: 'mistral',
  prompt: 'Generate a creative story',
  
  // Ollama parameters
  temperature: 0.7,      // 0-1: creativity (higher = more creative)
  top_p: 0.9,           // 0-1: diversity
  top_k: 40,            // number of tokens to consider
  
  // Advanced
  repeat_penalty: 1.1,   // penalize repetition
  num_predict: 128,      // max tokens to generate
  tfs_z: 1.0,           // tail free sampling
  repeat_last_n: 64      // context for repeat penalty
})
```

### Model Optimization for AgentBot

```typescript
// Optimize based on tier
const getTierOptimizations = (tier: string) => {
  const optimizations = {
    starter: {
      temperature: 0.7,
      num_predict: 256,    // Limit output
      timeout: 30000       // 30 second timeout
    },
    pro: {
      temperature: 0.7,
      num_predict: 512,
      timeout: 60000       // 60 second timeout
    },
    scale: {
      temperature: 0.8,
      num_predict: 1024,
      timeout: 120000      // 120 second timeout
    },
    enterprise: {
      temperature: 0.8,
      num_predict: 2048,
      timeout: 300000,     // 5 minute timeout
      gpu: true            // Enable GPU
    }
  }
  
  return optimizations[tier] || optimizations.starter
}
```

---

## 📊 Monitoring & Limits

### Usage Tracking

```typescript
class OllamaUsageTracker {
  async trackUsage(userId: string, model: string, tokens: number) {
    const key = `ollama:${userId}:${getDate()}`
    
    // Increment counter
    await redis.incrby(key, 1)
    await redis.expire(key, 86400)
    
    // Log details
    await database.logOllamaUsage({
      userId,
      model,
      tokens,
      timestamp: new Date(),
      tier: await getUserTier(userId)
    })
  }
  
  async checkQuota(userId: string): Promise<boolean> {
    const subscription = await getUserSubscription(userId)
    const key = `ollama:${userId}:${getDate()}`
    const used = await redis.get(key)
    
    const limits = {
      starter: 100,
      pro: 1000,
      scale: 10000,
      enterprise: -1  // unlimited
    }
    
    const limit = limits[subscription.tier]
    return limit === -1 || parseInt(used || '0') < limit
  }
}
```

### Performance Metrics

```typescript
class OllamaMetrics {
  async getPerformance(model: string) {
    const metrics = await database.query(`
      SELECT 
        AVG(response_time) as avg_response_time,
        MAX(response_time) as max_response_time,
        MIN(response_time) as min_response_time,
        COUNT(*) as total_requests,
        AVG(tokens_generated) as avg_tokens
      FROM ollama_usage
      WHERE model = $1
      AND created_at > NOW() - INTERVAL '24 hours'
    `, [model])
    
    return metrics[0]
  }
  
  async recommendModel(taskType: string) {
    // Recommend fastest/cheapest model for task
    const bestModels = {
      quick: 'orca-mini',      // Fastest
      coding: 'codellama',     // Best for code
      analysis: 'llama2',      // Best context
      creative: 'mistral'      // Balanced
    }
    
    return bestModels[taskType] || 'mistral'
  }
}
```

---

## 🌐 Cloud Models (AgentBot Enterprise)

For larger models, Ollama offers cloud models:

```typescript
// Enterprise users can use cloud models
const cloudModels = {
  'ollama-13b': {
    name: 'Ollama 13B (Cloud)',
    performance: 'excellent',
    price: 'premium'
  },
  'ollama-mixtral': {
    name: 'Mixtral 8x7B (Cloud)',
    performance: 'excellent',
    price: 'premium'
  }
}

// Automatically route to cloud if:
// - Model size > local capacity
// - Performance required = high
// - User tier = enterprise
```

---

## 📚 Official Resources

### Documentation
- **Quickstart:** https://docs.ollama.com/quickstart
- **API Reference:** https://docs.ollama.com/api
- **Models Library:** https://ollama.com/library
- **Cloud Models:** https://docs.ollama.com/cloud

### Libraries
- **JavaScript:** https://github.com/ollama/ollama-js
- **Python:** https://github.com/ollama/ollama-python
- **Community Libraries:** https://github.com/ollama/ollama#libraries

### Community
- **Discord:** https://discord.gg/ollama
- **Reddit:** https://reddit.com/r/ollama
- **GitHub:** https://github.com/ollama/ollama

---

## 🚀 AgentBot + Ollama Deployment

### For AgentBot Users (Hosted)
```bash
# 1. Sign up to AgentBot
# 2. Select Ollama provider
# 3. Start using immediately
# No installation needed!
```

### For AgentBot Users (Self-Hosted)
```bash
# 1. Install Ollama locally
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull models
ollama pull mistral
ollama pull llama2

# 3. Connect to AgentBot
# Settings → Ollama → http://localhost:11434

# 4. Start using!
```

### For AgentBot Infrastructure
```bash
# 1. Deploy Ollama on Render
# 2. Scale with GPU acceleration
# 3. Manage quotas by tier
# 4. Monitor performance

# See: AGENTBOT_PLATFORM_COMPLETE.md
```

---

## ✅ Verification Checklist

```
Ollama Setup:
  ☐ Ollama installed or using hosted
  ☐ Models pulled (mistral, llama2)
  ☐ API responding on localhost:11434
  ☐ Can list models: curl http://localhost:11434/api/tags

AgentBot Integration:
  ☐ Ollama connected in settings
  ☐ Can select models in dashboard
  ☐ Can send first prompt
  ☐ Response received correctly

Monitoring:
  ☐ Usage tracked in database
  ☐ Quotas enforced per tier
  ☐ Performance metrics logged
  ☐ Models optimized per tier
```

---

## 🎯 Next Steps

1. **Install Ollama** (5 minutes)
   - https://ollama.com/download

2. **Pull First Model** (depends on size)
   ```bash
   ollama pull mistral
   ```

3. **Connect to AgentBot** (2 minutes)
   - Settings → AI Providers → Add Ollama

4. **Create Agent** (1 minute)
   - Start using Ollama models

5. **Monitor Usage** (ongoing)
   - Check dashboard for usage & costs

---

## 📞 Support

**Ollama Issues:**
- Discord: https://discord.gg/ollama
- GitHub Issues: https://github.com/ollama/ollama/issues
- Documentation: https://docs.ollama.com

**AgentBot + Ollama:**
- Email: support@agentbot.raveculture.xyz
- Discord: discord.gg/agentbot
- Live Chat: On dashboard

---

**AgentBot + Ollama = Transparent, Private, Powerful AI** 🚀

