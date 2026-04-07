# Agentbot Roadmap

**Last Updated:** April 7, 2026

## Core Principle: **User Choice Always**

> Our users love having options. Everything we build should give them choices — never lock them in.

### Choice in Practice
- **AI Providers** — BYOK: OpenRouter, Anthropic, OpenAI, Gemini, Groq, DeepSeek (user picks)
- **Hosting** — Managed (Railway/Vercel) OR self-host (MIT licensed)
- **Skills** — Install any from marketplace OR create custom
- **Storage** — Centralized (our default) OR decentralized (gitlawb option)
- **Payment** — USDC on Base OR traditional

---

## Current Features

### Core Platform
- [x] Multi-tenant agent deployment
- [x] Docker isolation per agent
- [x] Multi-channel (Telegram, Discord, WhatsApp)
- [x] BYOK AI (OpenRouter, Anthropic, OpenAI, etc.) - user chooses
- [x] USDC wallets on Base
- [x] Skill marketplace (40+ skills) - install any or build own
- [x] x402 micropayments
- [x] OpenClaw v2026.4.5 support
- [x] Video generation UI (coming soon)
- [x] Music generation UI

### User Choice Options
| Feature | Option A | Option B |
|---------|----------|----------|
| **AI Provider** | OpenRouter | Bring your own key |
| **Hosting** | Managed (Railway) | Self-host (MIT) |
| **Storage** | Centralized (default) | Decentralized (gitlawb) |
| **Skills** | Marketplace | Build custom |
| **Payment** | USDC on Base | Traditional Stripe |
| **Auth** | Clerk (email/passkeys) | Custom (later) |
| **Channels** | Telegram/Discord/WhatsApp | Add your own |
| **Code** | Keep on platform | Push to gitlawb |

### Platform Stats
- [x] Jobs Board (beta)
- [x] Blog (SEO optimized)
- [x] Social sharing
- [x] Open source (MIT licensed)

---

## Future / Research

### Decentralized Infrastructure

#### gitlawb Integration
**Status:** Testing locally (installed v0.3.8, identity created)

gitlawb is a decentralized git network where AI agents have DID identities and can own repos. Installed locally to test.

**Local setup (April 7, 2026):**
- DID: `did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY`
- Node: `https://node.gitlawb.com`
- First repo: `my-first-repo`

**Features available:**
- `gl mcp` — MCP server for LLM agents (25 tools!)
- `gl agent` — List registered agents
- `gl task` — Agent task delegation
- `gl mirror` — Mirror GitHub repos
- `gl name` — Register names on Base L2
- `gl bounty` — Token-powered bounties
- `gl pr` / `gl issue` — Full git workflow

**Potential integration with Agentbot:**
1. Mirror Agentbot skills to gitlawb
2. Agents get DID identities alongside existing auth
3. MCP tools available to LLM agents
4. Task delegation between agents
5. Decentralized skill discovery

**Next steps:**
- [x] Run gitlawb test locally ✓ (v0.3.8 installed, identity created)
- [x] Explore MCP tools (`gl mcp` command)
- [x] Test mirroring a repo ✓ (agentbot-opensource mirrored!)
- [ ] Document integration requirements
- [ ] Prototype skill publishing to gitlawb

**Links:**
- https://gitlawb.com
- Network stats: 3 nodes, 1732 repos, 1460 agents

---

### Feature Backlog

| Priority | Feature | Description |
|----------|---------|-------------|
| High | Video generation API | Connect to xAI, Runway, Wan |
| High | Music generation API | Connect to Lyria, MiniMax |
| Medium | Agent-to-agent file sharing | A2A file transfers |
| Medium | Skill versioning | Git-like history for skills |
| Low | Voice agents | Voice-first agent interactions |
| Low | Custom model fine-tuning | Fine-tune models per agent |

---

### Infrastructure Improvements

| Priority | Item | Notes |
|----------|------|-------|
| Medium | Upstash upgrade | Move to Pro for guaranteed Redis |
| Low | Self-hosted Redis option | For users who want full control |
| Low | Backup automation | Automated DB snapshots |

---

### Community

| Priority | Item | Notes |
|----------|------|-------|
| High | OpenClaw contributor engagement | Following 102 contributors |
| Medium | Developer docs | Improve mintlify documentation |
| Low | Discord community | Grow the community |

---

## Completed This Week

- [x] OpenClaw v2026.4.5 support (video, music, new providers)
- [x] Skill search functionality
- [x] GitHub stats badge + banner on README
- [x] Blog posts: Jobs Board, Open Source Architecture, gitlawb
- [x] Video/Music generation UI pages
- [x] Social posts prepared for X + LinkedIn