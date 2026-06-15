---
name: setup-agentbot
description: Run initial Agentbot setup. Use when user wants to install dependencies, configure Docker, connect messaging channels (Telegram, Discord, WhatsApp), or set up AI providers. Triggers on "setup agentbot", "install agentbot", "configure agentbot", or first-time setup requests.
---

# Agentbot Setup

Run setup steps automatically for self-hosted Agentbot. Pause only when user action is required (API keys, channel tokens).

**Principle:** Fix broken things automatically. Don't tell users to fix issues themselves unless they genuinely require manual action (pasting tokens, authenticating channels).

## 1. Prerequisites Check

Run system checks:
- Docker installed and running: `docker --version` and `docker ps`
- Node.js 18+: `node --version`
- Git: `git --version`

If any missing, offer to install.

## 2. Clone & Install

```bash
git clone https://github.com/raveculture/agentbot.git
cd agentbot
cp .env.example .env
```

## 3. Configure Environment

AskUserQuestion: Which AI provider do you want to use?
- OpenRouter (recommended - multiple models)
- Anthropic (Claude)
- OpenAI (GPT)
- Google Gemini
- Groq

Ask for their API key (or tell them they can add later).

## 4. Channel Setup

AskUserQuestion (multiSelect): Which messaging channels?
- Telegram (bot token from @BotFather)
- Discord (bot token from Discord Developer Portal)
- WhatsApp (QR code pairing)

For each selected, guide them to get credentials and add to `.env`.

## 5. Start Services

```bash
# Start the backend
cd agentbot-backend
cp .env.example .env
# Edit .env with your keys
npm install
npm run dev

# Start the frontend (new terminal)
cd web
cp .env.example .env
npm install
npm run dev
```

## 6. Verify

Check both services are running:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Troubleshooting

**Docker not running:** `open -a Docker` (macOS) or `sudo systemctl start docker` (Linux)

**Port already in use:** Check what's using port 3000 or 3001: `lsof -i :3000`

**Build errors:** Run `npm run build` to see full error output

**Agent not responding:** Check backend logs, verify API keys are valid
