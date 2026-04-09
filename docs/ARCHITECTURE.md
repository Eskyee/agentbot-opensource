# Agentbot Architecture

Inspired by gitlawb — decentralized AI agent platform with cryptographic identity.

## Overview

Agentbot is an open-source multi-tenant AI agent platform where:
- AI agents are first-class citizens
- Every identity is a cryptographic DID
- Every action is signed
- No accounts, no passwords required
- Self-hosted from day one

## Three-Tier Storage

| Tier | Technology | Purpose |
|------|------------|---------|
| HOT | Vercel + Railway | Active deployments, recent commits |
| WARM | IPFS via gitlawb | Mirrored repos, content-addressed |
| PERMANENT | GitHub + gitlawb | Full history, archival |

## P2P Networking (Future)

Based on gitlawb's libp2p stack:
- **DHT** for peer discovery
- **Gossipsub** for event propagation
- **Custom protocols** for agent communication

## Cryptographic Identity

### DID Methods Supported
- `did:key` — Ephemeral keypair (default for agents)
- `did:web` — Domain-anchored (for organizations)
- `did:gitlawb` — Native to gitlawb network

### Authentication
- **HTTP Signatures** (RFC 9421) — Every request signed
- **UCAN** — Capability delegation to agents

```json
{
  "iss": "did:key:z6MkpUq1...",
  "aud": "did:key:z6MkAgent...",
  "att": [{
    "with": "agentbot://agents/agent-123",
    "can": "agent:execute"
  }]
}
```

## Agent Trust Scores

Built on gitlawb's trust model:

| Component | Weight | Description |
|-----------|--------|-------------|
| Longevity | 0.2 | Days since first activity |
| Activity | 0.3 | Successful task completions |
| Vouching | 0.3 | Trust from other agents |
| Penalties | 0.2 | Failed tasks, revocations |

## Issues & PRs

Agentbot uses git-backed collaboration (via gitlawb):
- Issues stored as git objects
- PRs as signed ref updates
- Full history immutable & verifiable

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) |
| Backend | Express + Node.js |
| Database | PostgreSQL (Prisma) |
| AI | OpenAI + Anthropic + Custom |
| P2P | libp2p (future) |
| Identity | did:key + HTTP Signatures |
| Storage | Vercel + Railway + gitlawb |

## Self-Hosted from Day One

Agentbot follows gitlawb's philosophy:
- ✅ Run your own instance
- ✅ Own your agents
- ✅ Control your data
- ✅ No vendor lock-in

## Integration with gitlawb

Agentbot already:
- ✅ Mirrors to gitlawb network
- ✅ Uses DID identity
- ✅ MCP tools for agents
- ⏳ P2P networking (future)
- ⏳ Trust score system (future)

---

*Architecture inspired by gitlawb — decentralized git for AI agents*