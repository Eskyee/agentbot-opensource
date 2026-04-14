# Agentbot 🤖
<p align="center">
  <img src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje" alt="Agentbot" width="500" />
</p>
<p align="center">
  <a href="https://github.com/sponsors/Eskyee">
    <img src="https://img.shields.io/github/sponsors/Eskyee?style=social" alt="GitHub Sponsors">
  </a>
  <a href="https://x.com/i/communities/2031495203002134740">
  <img src="https://img.shields.io/badge/X-Community-blue?style=social&logo=x" alt="X Community">
</a>
</p>
<p align="center">
  <a href="https://github.com/OpenClaw/openclaw">
    <img src="https://img.shields.io/badge/runtime-OpenClaw_2026.4.10-blue" alt="Runtime">
  </a>
  <a href="https://agentbot.sh">
    <img src="https://img.shields.io/badge/site-agentbot.sh-black" alt="Website">
  </a>
  <a href="https://docs.agentbot.raveculture.xyz">
    <img src="https://img.shields.io/badge/docs-live-0ea5e9" alt="Docs">
  </a>
  <a href="https://discord.gg/vTPG4vdV6D">
    <img src="https://img.shields.io/badge/Discord-Join%20chat-5865F2?logo=discord&logoColor=white" alt="Discord">
  </a>
</p>
<p align="center">
  <a href="https://agentbot.sh"><strong>Website</strong></a> · 
  <a href="https://docs.agentbot.raveculture.xyz"><strong>Docs</strong></a> · 
  <a href="https://discord.gg/vTPG4vdV6D"><strong>Discord</strong></a> · 
  <a href="https://github.com/Eskyee/agentbot-opensource"><strong>Open Source Repo</strong></a>
</p>
<br>

The Contract Address is: 9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump

Agentbot originated from a project open-sourced by developer Esky33 after 5,013 contributions in the past year, and is associated with the pumpfun GitHub sponsorship mechanism. 
The token aims to support open-source projects, with its logo featuring a red robot wearing headphones symbolizing the collaborative spirit of the open-source community.



## 🎯 The Problem We're Solving

Open source powers the world. Millions use it. Few contribute back. Developers burn out. Projects die.

**Agentbot changes the equation:**
- Build useful AI agent infrastructure
- Tokenize the protocol
- Usage funds development sustainably
- Community owns the future

---

## 🎛️ Co-DJ / B2B Live Shows — *Coming to baseFM*

> **The world's first AI-coordinated back-to-back DJ show infrastructure.**

Two DJs. Two locations. One seamless pirate radio session.

- **Host DJ** streams RTMP from their setup (OBS, DJ software, CDJs)
- **Co-DJ** joins via invite link, connects when it's their turn
- **Mux reconnect window** holds the stream open for handoffs — no interruption
- **WebRTC audio monitoring** so DJs can hear each other in-browser
- **Live chat** — DJ private channel + listener public channel, same window
- **Underground branded** — built for the rave, sound system, and underground music community

This is infrastructure for the culture. Pirate radio, pioneer style.

---

## 🤖 Agent-to-Agent (A2A) Protocol

Single agents are powerful. But the real leverage comes when agents coordinate.

A booking agent shouldn't need to email a human to confirm a DJ set fee — it should negotiate directly with the venue agent, agree on terms, and settle in USDC on Base. All in seconds.

### How It Works

```
Agent A (Booking)
→ signs message with Ed25519 identity key
→ delivers via SSRF-protected webhook bus
Agent B (Venue)
→ verifies signature, processes task
→ returns real-time update or counter-offer
Settlement
→ USDC transfer on Base (Coinbase CDP wallet)
→ logged on-chain, outcome recorded in platform_outcomes
```

The first autonomous agent-to-agent payment on Agentbot settled at **block 9,556,940 on Base mainnet**.

### A2A vs MCP

| Protocol | Connects | Use For |
|----------|----------|---------|
| **A2A** | Agent ↔ Agent | Negotiation, delegation, settlement |
| **MCP** | Agent ↔ Tool/API | Calling external services, databases, APIs |

### Dynamic Pricing by Agent Fitness

The x402 micropayment gateway applies pricing based on agent reliability score:

| Tier | Score | Price | Discount |
|------|-------|-------|---------|
| New | 0–59 | $0.010/req | — |
| Standard | 60–79 | $0.009/req | 10% |
| Premium | 80–100 | $0.008/req | 20% |

A2A messaging available on **Collective plan and above**.

---

## 🌐 Underground Network — baseFM + Agentbot

Agentbot powers [baseFM](https://basefm.space) — a 24/7 autonomous radio station for the underground music scene.

**The network includes:**
- 🎵 **DJs, artists, sound systems** streaming live from anywhere
- 🎙️ **Podcasts** from the rave/underground culture scene
- 🎛️ **B2B Co-DJ shows** — two DJs, two cities, one session
- 🤖 **AI agents** broadcasting, coordinating, and promoting autonomously
- ⛓️ **On-chain tipping** — listeners tip DJs in USDC on Base
- 🎫 **Token-gated shows** — exclusive sets for community members

**Community token:** `$AGENTBOT` on Solana — `9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump`

---

## 🚀 What is Agentbot?

Agentbot is a modular framework for deploying autonomous AI agents:

```
┌─────────────────────────────────────────┐
│           Agent Interface Layer          │
│  (CLI, API, Web UI, Discord Bot)        │
├─────────────────────────────────────────┤
│           Agent Runtime                  │
│  (Decision Engine, Memory, State)       │
├─────────────────────────────────────────┤
│           Skill Registry                 │
│  (Trading, Research, Analysis, etc.)    │
├─────────────────────────────────────────┤
│           Bridge Protocol                │
│  (Cross-chain, Agent-to-Agent)          │
└─────────────────────────────────────────┘
```

### Key Features

- ⚡ **Modular Skills** — Add capabilities via plugins
- 🧠 **Persistent Memory** — Agents learn and remember
- 🔗 **Multi-chain** — Solana, Base, and more
- 💰 **DeFi Integration** — Trade, stake, automate
- 🌉 **Agent Bridge** — Agents talk to each other

---

## 💎 The $AGENT Token

| Metric | Value |
|--------|-------|
| **Symbol** | $AGENT |
| **Chain** | Solana (SPL) |
| **Market Cap** | ~$3,400 |
| **Liquidity** | $4,500 (locked) |
| **Contract** | [View on Solscan](https://solscan.io) |

### Why $AGENT?

1. **Governance** — Vote on protocol upgrades
2. **Staking** — Earn rewards + secure the network
3. **Fee Sharing** — Get a cut of protocol revenue
4. **Access** — Premium features and priority compute

📄 **[Read the Full Litepaper](./AGENTBOT_LITEPAPER.md)** · 📄 **[Read the Whitepaper](./AGENTBOT_WHITEPAPER.md)**

---

## 🛠️ Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run the agent
npm run start
```

### Basic Usage

```javascript
import { Agent } from 'agentbot';

const agent = new Agent({
  name: 'MyFirstAgent',
  skills: ['trading', 'research'],
  memory: true
});

await agent.initialize();
await agent.run('Analyze ETH price and alert if it drops 5%');
```

---

## 📚 Documentation

- [Litepaper](./AGENTBOT_LITEPAPER.md) — 1-page summary
- [Full Whitepaper](./AGENTBOT_WHITEPAPER.md) — Complete details
- [Examples](./examples/) — Sample agents

---

## 🤝 Contributing

We welcome contributions of all kinds:

- 🐛 **Bug Reports** — Open an issue
- 💡 **Feature Requests** — Start a discussion
- 🔧 **Code** — Submit a PR
- 📖 **Docs** — Improve our guides
- 🎨 **Design** — Help with UI/UX

---

## 💖 Support the Project

Agentbot is built by [Eskyee](https://github.com/Eskyee) with **5,013+ contributions** this year. This is a labor of love that needs community support.

**🎉 GitHub Sponsors is now enabled!** Click the ❤️ Sponsor button at the top of this repo to support directly.

### Ways to Help

| Action | Impact |
|--------|--------|
| ⭐ **Star this repo** | Helps us trend on GitHub |
| 🧑‍💻 **[Sponsor on GitHub](https://github.com/sponsors/Eskyee)** | Directly funds development |
| 💰 **Buy $AGENT** | Supports the ecosystem |
| 📢 **Share on Twitter** | Grows our community |
| 🔧 **Contribute code** | Build the future with us |

---

## 🗺️ Roadmap

- [x] **Phase 1: Foundation** — Token launch, open source repo
- [ ] **Phase 2: Growth** — Skill marketplace, staking, 1K holders
- [ ] **Phase 3: Expansion** — Cross-chain, DAO governance
- [ ] **Phase 4: Maturity** — Agent swarms, self-sustaining treasury

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Eskyee/agentbot-opensource&type=date&legend=bottom-right)](https://www.star-history.com/?repos=Eskyee%2Fagentbot-opensource&type=date&legend=bottom-right)

---

## 🔗 Connect With Us

| Platform | Link |
|----------|------|
| **Twitter/X** | [@agentbot_ai](https://twitter.com/agentbot_ai) |
| **Discord** | [discord.gg/agentbot](https://discord.gg/agentbot) |
| **GitHub Sponsors** | [github.com/sponsors/Eskyee](https://github.com/sponsors/Eskyee) |
| **Token** | [pump.fun](https://pump.fun) |

---

## 📄 License

MIT License — See [LICENSE](./LICENSE) for details.

---

<p align="center">
  <b>Built with ❤️ by the community, for the community.</b><br>
  <sub>© 2025 Agentbot DAO</sub>
</p>
