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

## Core Design Principles: Fact-Based Backend

Agentbot has shifted from legacy "Web 2.0" patterns (shared secrets and mutable state) to a **Fact-Based Architecture**. This ensures the platform is decentralized, verifiable, and resilient.

### 1. Identity as a Fact (Signature Layer)
Authentication is no longer based on leakable API keys or session cookies. Instead, it is a **cryptographic fact**.
- **DID-Native:** Every request from an agent or the frontend must be signed by an Ethereum-compatible private key.
- **SignatureGuard:** The backend verifies these signatures (`x-agent-signature`, `x-agent-address`) using `ethers.verifyMessage`.
- **Stateless Trust:** The server doesn't need to "log you in"—it simply verifies that the holder of a specific identity authorized the action.

### 2. Execution as a Fact (Durable Workflow Layer)
Long-running orchestration (like provisioning containers on Railway) is no longer a stateless Express route. It is a **verifiable execution log**.
- **Durable Workflows:** Using Vercel Workflow DevKit, complex tasks are broken into replayable steps.
- **Resilience:** If a serverless function times out or the backend restarts, the workflow automatically resumes from its last successful "Fact" of execution.
- **Single Source of Truth:** The workflow run history *is* the state, removing reliance on "pending/running" columns in a database.

### 3. State as a Fact (Gitlawb Mirror Layer)
The PostgreSQL database is used for "Hot Storage" (UI speed), but the **Gitlawb** node is the "Warm Storage" tier for **Immutable Truth**.
- **State Mirroring:** Every time an agent's configuration is updated, the backend mirrors that change as a signed JSON commit to a Git repository.
- **Verifiable Audit Trail:** Any agent or external auditor can clone the `gitlawb` repo to prove exactly what an agent did and when, backed by content-addressing.

---

## Infrastructure: Railway-Only

Agentbot is 100% unified on **Railway** for its managed runtime layer. 
- **GraphQL Provisioning:** The backend orchestrates agent containers directly via the Railway GraphQL API.
- **Zero Render usage:** Legacy "Render" infrastructure has been removed to simplify the networking profile and reduce latency.

---

*Architecture inspired by gitlawb — decentralized git for AI agents*