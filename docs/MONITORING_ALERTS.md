# Monitoring & Alerts Guide

**Updated:** April 7, 2026

## Current Alert System

Agentbot uses `SUPPORT_WEBHOOK_URL` environment variable for critical alerts:
- Gateway token failures
- Low wallet balances  
- Agent crashes
- Maintenance events

## New Provider Monitoring (v2026.4.5)

### Providers to Monitor
| Provider | Risk | Alert Trigger |
|----------|------|---------------|
| Qwen | High | API errors, rate limits |
| Fireworks AI | High | Timeout, quota exceeded |
| Bedrock Mantle | Medium | Auth failures |
| MiniMax (TTS/Search) | Medium | API errors |
| Video Generation | High | Generation failures |
| Music Generation | High | Async task failures |

### Setting Up Provider Alerts

1. **Environment Variables:**
```bash
# Add to Railway/environment
SUPPORT_WEBHOOK_URL=https://your-slack-webhook
QWEN_WEBHOOK_URL=https://...
FIREWORKS_WEBHOOK_URL=https://...
```

2. **Provider Health Checks:**
```bash
# Check provider status
openclaw status --verbose
```

3. **Video/Music Generation Tracking:**
```bash
# View async tasks
openclaw tasks list

# Check task status
openclaw tasks status <task-id>
```

### Alert Types for New Providers

- **Provider Down** — Provider API returns 5xx errors
- **Rate Limited** — 429 responses from provider
- **Auth Failed** — Invalid API keys (Bedrock Mantle)
- **Generation Failed** — Video/music generation errors
- **Async Pending** — Tasks stuck for >5 minutes

### Integration with Existing System

The existing `support-alert.ts` can be extended:

```typescript
import { sendSupportAlert } from '@/app/lib/support-alert'

export async function alertProviderFailure(provider: string, error: string) {
  await sendSupportAlert({
    title: `Provider Alert: ${provider}`,
    message: error,
    metadata: { provider, timestamp: new Date().toISOString() }
  })
}
```

### Dashboard Integration

Add to `/dashboard/system-pulse`:
- Provider uptime % for Qwen, Fireworks, Bedrock
- Video/music generation success rate
- Async task queue depth

## Runbook

1. **Alert fires** → Check `openclaw status --verbose`
2. **Provider down** → Check provider status page
3. **Fix or fallback** → Switch to backup provider or notify users
4. **Document** → Add to incident log