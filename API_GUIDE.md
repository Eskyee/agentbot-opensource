# Agentbot API Guide

## Base URLs
- **API:** `https://agentbot-api.onrender.com`
- **Web:** `https://agentbot-web.onrender.com`

---

## 1. Provision Agent

**Create a new AI agent with streaming capabilities.**

```
POST /api/provision
```

### Request
```json
{
  "telegramToken": "YOUR_TELEGRAM_BOT_TOKEN",
  "plan": "solo",
  "email": "user@example.com",
  "aiProvider": "openrouter",
  "apiKey": "sk-your-key"
}
```

### Plans
| Plan | Agents | Price |
|------|--------|-------|
| `label` | 1 | £29/mo |
| `solo` | 3 | £79/mo |
| `collective` | 10 | £199/mo |
| `network` | 100 | £499/mo |

### Response
```json
{
  "success": true,
  "userId": "abc123",
  "agentId": "abc123",
  "plan": "solo",
  "streamKey": "real-mux-stream-key",
  "liveStreamId": "mux-stream-id",
  "rtmpServer": "rtmps://live.mux.com/app",
  "playbackUrl": "https://image.mux.com/PLAYBACK_ID/playlist.m3u8",
  "subdomain": "dj-abc123.agentbot.raveculture.xyz",
  "status": "active"
}
```

### Example (curl)
```bash
curl -X POST https://agentbot-api.onrender.com/api/provision \
  -H "Content-Type: application/json" \
  -d '{"telegramToken":"123:ABC","plan":"solo"}'
```

---

## 2. Health Check

**Check if API is running.**

```
GET /health
```

### Response
```json
{ "status": "ok", "version": "1.0.0" }
```

---

## 3. Streaming (Mux)

**Every agent gets a real Mux live stream.**

### OBS Settings
- **Server:** `rtmps://live.mux.com/app`
- **Stream Key:** From provision response
- **Playback:** `https://image.mux.com/PLAYBACK_ID/playlist.m3u8`

### Start Streaming
```bash
ffmpeg -f lavfi -i "testsrc=size=1280x720:rate=30" \
  -f lavfi -i "sine=frequency=440:duration=60" \
  -c:v libx264 -preset veryfast -b:v 2500k \
  -c:a aac -b:a 128k \
  -f flv "rtmps://live.mux.com/app/YOUR_STREAM_KEY"
```

---

## 4. Authentication

**Admin users bypass Stripe payment.**

Admin emails (set in `ADMIN_EMAILS` env var):
- `YOUR_ADMIN_EMAIL_1`
- `YOUR_ADMIN_EMAIL_5`

### Header
```
X-User-Email: YOUR_ADMIN_EMAIL_1
```

---

## 5. Plans & Limits

| Feature | Label | Solo | Collective | Network |
|---------|-------|------|------------|---------|
| Agents | 1 | 3 | 10 | 100 |
| Skills | All | All | All | All |
| Streaming | ✅ | ✅ | ✅ | ✅ |
| Priority | Low | Medium | High | VIP |
| Price | £29 | £79 | £199 | £499 |

---

## 6. Environment Variables

Set these on Render for each service:

### API Service
```
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPENROUTER_API_KEY=sk-...
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
ADMIN_EMAILS=YOUR_ADMIN_EMAIL_1
```

### Web Service
```
NODE_ENV=production
BACKEND_API_URL=https://agentbot-api.onrender.com
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
```

---

## 7. Dashboard

**https://agentbot-web.onrender.com/dashboard**

- View deployed agents
- Monitor stream status
- Check credits
- Heartbeat settings

---

## 8. Error Codes

| Code | Meaning |
|------|---------|
| `PAYMENT_REQUIRED` | Need Stripe or admin email |
| `INVALID_PLAN` | Plan must be: label, solo, collective, network |
| `MISSING_TOKEN` | Telegram token required |
| `MUX_ERROR` | Stream creation failed |

---

## 9. Rate Limits

- **Provision:** 10 requests/minute
- **Health:** Unlimited
- **Streaming:** Per Mux limits

---

## 10. Webhooks

**Coming soon** — Agent will notify your server on events:
- Agent started
- Stream started
- Error occurred
- Payment received

---

## Quick Start

1. Get Telegram bot token from @BotFather
2. Call `/api/provision` with token and plan
3. Use returned stream key in OBS
4. Start streaming!

```bash
# Full example
curl -X POST https://agentbot-api.onrender.com/api/provision \
  -H "Content-Type: application/json" \
  -H "X-User-Email: YOUR_ADMIN_EMAIL_1" \
  -d '{
    "telegramToken": "8298208379:AAG76NatBBuVLG6HAxeQkYLRgqwIUQuVy74",
    "plan": "solo"
  }'
```
