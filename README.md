# Agentbot 🤖

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

Deploy autonomous AI agents in 60 seconds.

**[Website](https://agentbot.raveculture.xyz)** · **[Documentation](https://raveculture.mintlify.app)** · **[Talent App](https://talent.app/~/projects/26f977bb-d436-4e28-830e-184757f20f95)** · **[Discord](https://discord.gg/eskyee)** · **[GitHub](https://github.com/raveculture/agentbot)**

</div>

## Why Agentbot?

- 🚀 **Deploy in 60 seconds** - From signup to chatting with your agent
- 🔌 **Multiple Channels** - Telegram, Discord, WhatsApp
- 🧠 **Bring Your Own Key** - Use OpenRouter, Anthropic, OpenAI, Gemini, Groq
- 🐳 **Docker-powered** - Isolated containers per agent
- 💰 **Pay what you use** - No markup on API keys

## Quick Start

```bash
git clone https://github.com/raveculture/agentbot.git
cd agentbot
cp .env.example .env
# Edit .env with your API keys

# Frontend
cd web && npm install && npm run dev

# Backend (new terminal)
cd agentbot-backend && npm install && npm run dev
```

Visit http://localhost:3000

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER                                   │
│                  (Telegram / Discord / WhatsApp)             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AGENTBOT PLATFORM                         │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Web UI   │    │  Dashboard │    │   Onboarding Flow   │  │
│  │ (Next.js)  │    │  (Next.js) │    │     (Next.js)      │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
│         │                   │                      │             │
│         └──────────────────┼──────────────────────┘             │
│                            │                                    │
│                    ┌───────▼───────┐                          │
│                    │  REST API    │                          │
│                    │ (Express.js)  │                          │
│                    └───────┬───────┘                          │
└────────────────────────────┼──────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  PostgreSQL     │ │    OpenClaw    │ │   Skills &     │
│   (Neon)       │ │  Container     │ │   Tools        │
│                 │ │  (Docker)      │ │   Registry     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Agent Provisioning Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User clicks │────▶│  Validate    │────▶│  Create      │────▶│  Pull       │
│  "Deploy"    │     │  Telegram    │     │  Docker      │     │  OpenClaw   │
│              │     │  Token       │     │  Container   │     │  Image      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                        │
                                                                        ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User chats  │◀────│  Webhook    │◀────│  Agent       │◀────│  Configure  │
│  with Agent  │     │  Receives   │     │  Running     │     │  AI Model   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Message Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Telegram │────▶│   Webhook   │────▶│   OpenClaw  │────▶│    AI       │
│  User   │     │   Handler   │     │   Container │     │   Provider  │
└─────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                         │                    │
                                         ▼                    ▼
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Telegram │◀────│   Format   │◀────│   Process   │<────│   Response │
│  Bot    │     │   Response │     │   Tool Use  │     │   (LLM)    │
└─────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DOCKER CONTAINER                          │
│                   (Per Agent)                              │
│                                                             │
│  ┌───────────────────────────────────────────────────┐   │
│  │                  OPENCLAW                          │   │
│  │                                                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │   │
│  │  │ Message │  │  Agent  │  │    Skills      │  │   │
│  │  │ Handler │─▶│  Core   │─▶│  (web-search,  │  │   │
│  │  └─────────┘  └────┬────┘  │   file-handler, │  │   │
│  │                    │        │   code-runner)   │  │   │
│  │                    ▼        └─────────────────┘  │   │
│  │              ┌─────────┐                        │   │
│  │              │   AI    │◀─────── API Keys      │   │
│  │              │ Provider│                        │   │
│  │              └─────────┘                        │   │
│  └────────────────────────────────────────────────┘   │
│                                                             │
│  Mounted Volume: /home/node/.openclaw                     │
│  - agents/       (agent configs)                         │
│  - workspace/    (files)                                  │
│  - logs/         (runtime logs)                           │
└─────────────────────────────────────────────────────────────┘
```

### Supported Channels

```
┌─────────────────────────────────────────────────────────────┐
│                    CHANNELS                               │
├──────────────┬──────────────┬──────────────┬──────────────┤
│   📱         │    🎮       │    💬       │    🌐        │
│  Telegram    │   Discord   │  WhatsApp   │   Webhooks   │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ @BotFather  │ Dev Portal  │  Business   │   REST      │
│  Bot Token  │  Bot Token  │    API      │   API       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### AI Providers

```
┌─────────────────────────────────────────────────────────────┐
│                    AI PROVIDERS                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │  OpenRouter │  │  Anthropic  │  │   OpenAI    │   │
│   │  (Default)  │  │  (Claude)   │  │   (GPT-4)   │   │
│   └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │   Google    │  │    Groq     │  │   Local    │   │
│   │   Gemini    │  │   (Fast)    │  │   Ollama    │   │
│   └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                          │
│   BYOK: Bring Your Own API Key                         │
└──────────────────────────────────────────────────────────┘
```

## Marketplace Agents

Agentbot includes Gordon-Approved production agents tuned for high-performance crew operations.

### Core Agents

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MARKETPLACE AGENTS                                     │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────────┤
│  THE-STRATEGIST │  CREW-MANAGER   │  SOUND-SYSTEM   │  THE-DEVELOPER             │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐  │  ┌───────────────────┐    │
│  │ 🤖 Mission│  │  │ 💰 Ops &  │  │  │ 🔊 Auto   │  │  │ 💻 Logic &        │    │
│  │ Planning  │  │  │ Finance   │  │  │ Feedback  │  │  │ Scripting         │    │
│  └─────┬─────┘  │  └─────┬─────┘  │  └─────┬─────┘  │  └─────────┬─────────┘    │
│        │         │        │         │        │         │           │             │
│  Brain:       │  Brain:       │  Brain:       │  Brain:               │             │
│  DeepSeek R1  │  Llama 3.3    │  Mistral 7B   │  Qwen 2.5             │             │
│        │         │        │         │        │         │           │             │
│  Tier:        │  Tier:        │  Tier:        │  Tier:                 │             │
│  LABEL ●      │  UNDERGROUND ●│  FREE ●       │  COLLECTIVE ●          │             │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────────┘

SKILLS:
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MUSIC SKILLS                        │ EVENT SKILLS                               │
├─────────────────────────────────────┼────────────────────────────────────────────┤
│ 🎨 Visual Synthesizer               │ 🎫 Event Ticketing (x402 USDC)            │
│    Generate artwork w/ Stable Diff  │    Sell tickets with Base payments         │
│                                     │                                            │
│ 🔍 Track Archaeologist               │ 📅 Event Scheduler                        │
│    Deep catalog, sample clearing   │    Multi-channel (TG, DC, WA, Email)     │
│                                     │                                            │
│ 🎧 Setlist Oracle                   │ 🏠 Venue Finder                           │
│    BPM/Key analysis, Camelot mix   │    Global venue booking                   │
│                                     │                                            │
│ 👥 Groupie Manager                  │ 🎪 Festival Finder                       │
│    Fan segmentation, merch drops    │    Global festival discovery               │
│                                     │                                            │
│ 💰 Royalty Tracker                  │                                            │
│    Streaming royalties, splits     │                                            │
│                                     │                                            │
│ 📩 Demo Submitter                   │                                            │
│    AI-curated demo submissions      │                                            │
└─────────────────────────────────────┴────────────────────────────────────────────┘
```

### Agent Interaction Flow

```
                    ┌─────────────────┐
                    │   User Message  │
                    │ (Telegram/Discord/
                    │  WhatsApp/Web)  │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │    Message Router           │
              │  (Channel → Agent Mapping)  │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌───────────┐  ┌───────────┐  ┌───────────┐
       │ STRATEGIST│  │  CREW-    │  │  SOUND-  │
       │ (Mission) │  │ MANAGER   │  │  SYSTEM  │
       └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │    Skills Executor           │
              │                             │
              │  ┌────────┐ ┌────────┐ ┌───┐ │
              │  │ Music │ │ Events │ │ A │ │
              │  │Skills │ │Skills  │ │I  │ │
              │  └────────┘ └────────┘ └───┘ │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │    AI Provider (LLM)         │
              │   OpenRouter / Anthropic /   │
              │   OpenAI / Gemini / Groq     │
              └──────────────┬──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Response to    │
                    │  User Channel  │
                    └─────────────────┘
```

## Features

- Multiple AI providers (OpenRouter, Anthropic, OpenAI, Gemini, Groq)
- Telegram, Discord, WhatsApp channels
- Web search, file handling, code execution
- Real-time dashboard

## Deployment

**Vercel:**
```bash
cd web && vercel --prod
```

**Docker:**
```bash
docker-compose up -d
```

## For Developers & AI Agents

Agentbot is built for extensibility. Developers and AI agents (Claude Code, Codex, OpenClaw) can contribute:

### Building New Skills

```typescript
// skills/my-skill.ts
export const skill = {
  name: 'my-skill',
  description: 'What my skill does',
  parameters: {
    input: z.string(),
    options: z.object({}).optional()
  },
  execute: async (input, options, context) => {
    // Your logic here
    return { result: '...' }
  }
}
```

### Adding New Agents

```typescript
// Define agent configuration
const agent = {
  name: 'my-agent',
  brain: 'llama-3.3-70b',
  skills: ['web-search', 'my-skill'],
  systemPrompt: 'You are a helpful agent...'
}
```

### Claude Code Integration

```bash
# Use Claude Code skills for local development
claude --prompt "Help me build a new skill for Agentbot"
```

### OpenClaw Builders

```bash
# Clone and extend OpenClaw
git clone https://github.com/raveculture/openclaw.git
cd openclaw
# Add your custom tools
# Deploy as Agentbot agent
```

## Project Structure

```
agentbot/
├── web/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/       # React components  
│   └── lib/              # Utilities
├── agentbot-backend/      # Express API server
│   └── src/
│       ├── routes/       # API endpoints
│       └── services/     # Business logic
└── skills/               # Claude Code skills
```

## License

MIT - see [LICENSE](LICENSE)
