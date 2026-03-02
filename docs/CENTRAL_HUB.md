# Team Agentbot - Central Hub

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CENTRAL POINT OF TRUTH                          │
│                        agentbot.raveculture.xyz                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │  LOCAL   │    │ GITHUB   │    │ DOCKER   │    │ VERCEL   │  │
│   │ Mac mini │    │          │    │   HUB    │    │          │  │
│   ├──────────┤    ├──────────┤    ├──────────┤    ├──────────┤  │
│   │ Atlas    │◄──►│ Copilot  │◄──►│ Gordon   │◄──►│ Platform │  │
│   │ OpenClaw │    │ Actions  │    │ Containers│    │ Web App  │  │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│        │               │                │                │          │
│        ▼               ▼                ▼                ▼          │
│   127.0.0.1      github.com      docker.io         vercel.app    │
│   :18789         /Eskyee         /openclaw        /agentbot      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Service Connections

### Local (Atlas - Mac mini)
- **URL**: `ws://127.0.0.1:18789`
- **Token**: Stored in `~/.openclaw/openclaw.json`
- **Tailscale**: `https://ravecultures-mac-mini.tailb3bbed.ts.net`
- **Access**: SSH, Telegram, WebChat

### GitHub (Copilot)
- **Repo**: `github.com/Eskyee/agentbot`
- **Workflows**: 
  - `deployment-test.yml` - Health checks
  - `daily-blog.yml` - Auto blog
  - `copilot-review.yml` - AI code review
- **Secrets**: OPENROUTER_API_KEY, etc.

### Docker Hub (Gordon)
- **Image**: `ghcr.io/openclaw/openclaw`
- **Latest**: `ghcr.io/openclaw/openclaw:2026.2.26`
- **Auto-update**: Daily via GitHub Actions

### Vercel (Agentbot)
- **URL**: `https://agentbot.raveculture.xyz`
- **Dashboard**: `https://vercel.com/dashboard`
- **API**: `https://agentbot.raveculture.xyz/api`

## Quick Commands

```bash
# Local - Atlas
openclaw status           # Check Atlas health
openclaw gateway          # Restart Atlas

# GitHub - Copilot  
gh run list               # Check workflows
gh workflow run daily-blog.yml  # Trigger blog

# Docker - Gordon
docker pull ghcr.io/openclaw/openclaw:2026.2.26

# Vercel - Agentbot
vercel logs               # Check logs
vercel --prod            # Deploy
```

## Environment Variables

| Service | Key Variables |
|---------|--------------|
| Local | GEMINI_API_KEY, OPENCLAW_TOKEN |
| GitHub | OPENROUTER_API_KEY, GITHUB_TOKEN |
| Vercel | DATABASE_URL, STRIPE_SECRET_KEY, NEXTAUTH_SECRET |
| Docker | OPENCLAW_CONFIG_B64, TELEGRAM_BOT_TOKEN |

## Status Dashboard

All services should report healthy:
- ✅ Atlas: `openclaw status`
- ✅ GitHub: `gh run list`
- ✅ Vercel: `curl agentbot.raveculture.xyz/api/health`

## Update Flow

```
1. Local dev (Atlas)     → Test changes
2. Push to GitHub        → Copilot reviews
3. GitHub Actions        → Auto deploy to Vercel
4. Vercel                → Live at agentbot.raveculture.xyz
5. Users connect         → Docker containers spawn (Gordon)
```

## Emergency Contacts

| Service | Dashboard |
|---------|-----------|
| Atlas (Local) | http://127.0.0.1:18789 |
| GitHub | https://github.com/Eskyee/agentbot/actions |
| Docker Hub | https://hub.docker.com/u/openclaw |
| Vercel | https://vercel.com/dashboard |
| Neon (DB) | https://console.neon.tech |
| Railway | https://railway.app/dashboard |
