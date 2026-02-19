# AI Providers for Agentbot

## Recommended Free Providers

### Tier 1 — Most Reliable

| Provider | Model | Free Tier | Rate Limit | Quality | Reliability |
|----------|-------|-----------|------------|---------|-------------|
| **Groq** | Llama 3.3 70B | ✅ Yes | 30 req/min | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Google AI Studio** | Gemini 2.0 Flash | ✅ Yes | 15 req/min | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Anthropic** | Claude Sonnet | $5 free credit | Until exhausted | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Tier 2 — Good Alternatives

| Provider | Model | Free Tier | Notes |
|----------|-------|-----------|-------|
| **OpenRouter** | Various | Limited free | Aggregator, can route to free models |
| **Together AI** | Llama, Mistral | $25 credit | Good for testing |
| **Cerebras** | Llama 3.3 | Free | Very fast inference, rate limited |
| **Fireworks AI** | Various | Free tier | Good selection |

### Tier 3 — Paid (BYOK)

| Provider | Model | Starting Price | Best For |
|----------|-------|----------------|----------|
| **Anthropic** | Claude Opus/Sonnet | $3/$15 per 1M tokens | Best quality |
| **OpenAI** | GPT-4o | $5/15 per 1M tokens | Good all-rounder |
| **DeepSeek** | DeepSeek V3 | $0.14/0.28 per 1M | Budget option |

---

## Provider Setup Instructions

### Groq (Recommended Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google/GitHub
3. Go to API Keys → Create API Key
4. Copy the key (starts with `gsk_`)

**OpenClaw Config:**
```json
{
  "providers": {
    "groq": {
      "apiKey": "gsk_xxx..."
    }
  }
}
```

### Google AI Studio

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a project if needed
4. Copy the key

**OpenClaw Config:**
```json
{
  "providers": {
    "google": {
      "apiKey": "AIza..."
    }
  }
}
```

### Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up (requires phone verification)
3. Add payment method (get $5 free credit)
4. Go to API Keys → Create Key
5. Copy the key (starts with `sk-ant-`)

**OpenClaw Config:**
```json
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-xxx..."
    }
  }
}
```

---

## Agentbot Default Provider

For free tier users, Agentbot uses **Groq** by default:
- Model: `llama-3.3-70b-versatile`
- Rate limit: 30 requests/minute (shared across free users)
- Quality: Very good for most tasks

Users can upgrade to BYOK (Bring Your Own Key) for:
- Higher rate limits
- Better models (Claude, GPT-4)
- No sharing with other users

---

## Fallback Chain

Agentbot implements automatic fallback:

```
1. User's own key (if provided)
   ↓ (if fails or not set)
2. Groq free tier
   ↓ (if rate limited)
3. Google AI Studio
   ↓ (if rate limited)
4. OpenRouter free models
```

This ensures users always get a response, even if one provider is down.

---

## Cost Estimation

For BYOK users, typical monthly costs:

| Usage | Anthropic | OpenAI | Groq |
|-------|-----------|--------|------|
| Light (100 msgs/day) | $2-5 | $3-7 | Free |
| Medium (500 msgs/day) | $10-20 | $15-30 | Free* |
| Heavy (2000 msgs/day) | $40-80 | $60-120 | Free* |

*Groq may rate limit heavy users; recommend BYOK for heavy usage.
