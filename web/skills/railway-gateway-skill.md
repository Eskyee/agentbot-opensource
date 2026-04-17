---
name: railway-gateway
description: |
  Deploy, fix, and monitor the OpenClaw gateway on Railway. Use when working with the openclaw-gateway service, deploying OpenClaw to Railway, fixing gateway 502 or "Invalid --bind" errors, changing gateway config, or checking gateway health. Triggers on keywords such as gateway, openclaw-gateway, railway gateway, 502, bind, control-ui, healthz.
---

# Railway Gateway Skill

Manage the OpenClaw Control UI gateway on Railway.

## Service Info

- **URL:** https://YOUR_SERVICE_URL
- **Project:** OpenClaw-Agentbot (proj_cxA5FUU5aqWoH6Wz6zpyTE9)
- **Service:** openclaw-gateway (def185af-8af6-412c-9f8f-ed50e531a331)
- **Region:** us-west1
- **Image:** ghcr.io/openclaw/openclaw:latest (wrapped by gateway/Dockerfile)
- **Gateway Token:** f0dc61a4b42057275eab13e0eb7ede8f17f0709ae06ae9984a5b019850370710

## Architecture

```
Dockerfile → wraps ghcr.io/openclaw/openclaw:latest
entrypoint.sh → writes config → exec openclaw gateway
railway.json → healthcheck at /healthz
```

Config is written fresh on EVERY container start. No volumes, no env var overrides.

## Rules (NEVER BREAK)

1. **Source must be "GitHub Repo"** (NOT "Docker Image")
2. **Never change env vars on a live gateway** — use entrypoint.sh
3. **Never set OPENCLAW_CONFIG env var** — overrides the config file
4. **Never use `--bind 0.0.0.0`** — legacy, rejected by newer versions
5. **Read `docs/gateway-recovery-checkpoint.md` FIRST** before debugging
6. **Only required env var:** `OPENROUTER_API_KEY`

## Valid Bind Modes

| Mode | Use |
|------|-----|
| `lan` | All interfaces — use for Railway/cloud |
| `loopback` | Localhost — default, local dev only |
| `tailnet` | Tailscale network |
| `auto` | Auto-detect |
| `custom` | Manual |

⚠️ `0.0.0.0` is LEGACY. `lan` is the correct value.

## Health Check

```bash
curl -s https://YOUR_SERVICE_URL/health
```

Expected: `{"ok":true,"status":"live"}`
Not: `{"status":"error","code":502,...}`

## Recovery (502 or Invalid --bind)

**FIRST: Run the SOS script:**
```bash
./scripts/gateway-sos.sh
```

If SOS fails, then:

1. Railway dashboard → openclaw-gateway → Settings → Source
2. Verify it says **"GitHub Repo"** (not "Docker Image")
3. Dockerfile Path: `gateway/Dockerfile`
4. Healthcheck Path: `/healthz`
5. Variables: ONLY `OPENROUTER_API_KEY` — delete all OPENCLAW_* and OC_BOOT vars
6. Deploy
7. Wait 60s, check `/healthz`

## Config Written by entrypoint.sh

```json
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "auth": { "mode": "token", "token": "<OPENROUTER_API_KEY>" },
    "trustedProxies": ["127.0.0.1", "10.0.0.0/8", "100.64.0.0/10", "172.16.0.0/12", "192.168.0.0/16"],
    "controlUi": {
      "allowedOrigins": ["*"],
      "dangerouslyDisableDeviceAuth": true,
      "dangerouslyAllowHostHeaderOriginFallback": true
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "openrouter/xiaomi/mimo-v2-pro" }
    }
  }
}
```

## Files

| File | Purpose |
|------|---------|
| `gateway/Dockerfile` | Wraps official image with custom entrypoint |
| `gateway/entrypoint.sh` | Writes config, starts gateway |
| `gateway/railway.json` | Healthcheck config |
| `docs/openclaw-railway-deployment.md` | Full deployment guide |
| `docs/gateway-recovery-checkpoint.md` | Recovery checklist |
