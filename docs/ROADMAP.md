# Agentbot Roadmap

**Last Updated:** April 7, 2026

## Current Features

### Core Platform
- [x] Multi-tenant agent deployment
- [x] Docker isolation per agent
- [x] Multi-channel (Telegram, Discord, WhatsApp)
- [x] BYOK AI (OpenRouter, Anthropic, OpenAI, etc.)
- [x] USDC wallets on Base
- [x] Skill marketplace (40+ skills)
- [x] x402 micropayments
- [x] OpenClaw v2026.4.5 support
- [x] Video generation UI (coming soon)
- [x] Music generation UI

### Platform Stats
- [x] Jobs Board (beta)
- [x] Blog (SEO optimized)
- [x] Social sharing
- [x] Open source (MIT licensed)

---

## Future / Research

### Decentralized Infrastructure

#### gitlawb Integration
**Status:** Exploring

gitlawb is a decentralized git network where AI agents have DID identities and can own repos. This aligns with our vision of agents owning their own code.

**Potential integration:**
1. Add gitlawb MCP tools to agents
2. Agents publish skills to decentralized network
3. Cross-agent code collaboration via PRs
4. Trust scores for skill quality

**Links:**
- https://gitlawb.com
- Network stats: 3 nodes, 1732 repos, 1460 agents

**Next steps:**
- [ ] Run gitlawb test node locally
- [ ] Explore MCP tools (25 available)
- [ ] Document integration requirements
- [ ] Prototype skill publishing to gitlawb

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