# Agentbot 🤖

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

Deploy autonomous AI agents in 60 seconds. Open source platform for building, deploying, and scaling AI agents.

**[Website](https://agentbot.raveculture.xyz)** · **[Documentation](https://raveculture.mintlify.app)** · **[Discord](https://discord.gg/eskyee)** · **[GitHub](https://github.com/raveculture/agentbot)**

</div>

## Why Agentbot?

- 🚀 **Deploy in 60 seconds** - From signup to chatting with your agent
- 🔌 **Multiple Channels** - Telegram, Discord, WhatsApp
- 🧠 **Bring Your Own Key** - Use OpenRouter, Anthropic, OpenAI, Gemini, Groq
- 🐳 **Docker-powered** - Isolated containers per agent
- 💰 **Pay what you use** - No markup on API keys

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/raveculture/agentbot.git
cd agentbot
```

### 2. Set up environment

```bash
# Copy example env
cp .env.example .env

# Edit with your API keys
nano .env
```

### 3. Start locally

```bash
# Frontend
cd web && npm install && npm run dev

# Backend (new terminal)
cd agentbot-backend && npm install && npm run dev
```

Visit http://localhost:3000

### 4. Deploy your first agent

1. Go to http://localhost:3000/onboard
2. Connect Telegram bot (get token from @BotFather)
3. Add your OpenRouter API key (free at openrouter.ai)
4. Click Deploy!

## Features

### 🤖 AI Agents
- Multiple AI providers (OpenRouter, Anthropic, OpenAI, Gemini, Groq)
- Custom system prompts
- Conversation memory
- Tool execution

### 💬 Channels
- **Telegram** - Bot tokens from @BotFather
- **Discord** - Bot tokens from Discord Developer Portal
- **WhatsApp** - Business API credentials

### 🛠️ Skills
- Web search
- File handling
- Code execution
- Image analysis
- API calls

### 📊 Dashboard
- Real-time agent status
- Usage analytics
- Conversation history
- API key management

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Telegram  │     │   Agentbot API   │     │   OpenClaw  │
│  Discord    │────▶│   (Next.js)     │────▶│  Container   │
│  WhatsApp   │     │   (Express)      │     │   (Docker)   │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  PostgreSQL │
                    │    Neon     │
                    └─────────────┘
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Auth secret (generate with `openssl rand -base64 32`) | Yes |
| `OPENROUTER_API_KEY` | Your OpenRouter key for AI | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | No |
| `DISCORD_BOT_TOKEN` | Discord bot token | No |

See `.env.example` for full list.

## Deployment

### Vercel (Recommended)

```bash
cd web
vercel --prod
```

### Docker

```bash
docker-compose up -d
```

### Render / Railway

1. Push to GitHub
2. Connect repo to Render/Railway
3. Set environment variables
4. Deploy

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

```bash
# Fork the repo
# Create a feature branch
# Make your changes
# Submit a PR
```

## Community

- [Discord](https://discord.gg/eskyee) - Get help and connect with other users
- [GitHub Issues](https://github.com/raveculture/agentbot/issues) - Report bugs and request features
- [Documentation](https://raveculture.mintlify.app) - Full docs

## Roadmap

- [ ] Agent swarms (multiple agents working together)
- [ ] Voice channels (Discord voice, Telegram voice)
- [ ] More skill integrations
- [ ] Web dashboard for agent configuration
- [ ] Team collaboration features

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [OpenClaw](https://github.com/openclaw/agentbot) - The core agent framework
- [Next.js](https://nextjs.org) - Frontend framework
- [Docker](https://docker.com) - Container runtime

---

<div align="center">

Built with ⚡ on [Base](https://base.org)

</div>
