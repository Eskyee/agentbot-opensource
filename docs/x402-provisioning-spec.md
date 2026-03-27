# Agentbot x402 Tempo Integration — Full Spec

**Date:** 2026-03-22
**Status:** Active — Phase 1 Complete
**Priority:** Critical — v2 differentiator
**Reference:** [tempo-x402](https://github.com/compusophy/tempo-x402) v3.0.0 (crates.io, MIT)
**Live Node:** https://YOUR_SERVICE_URL

## What We're Integrating

A production Rust workspace implementing x402 (HTTP 402 Payment Required) on Tempo blockchain. The full stack includes:

| Crate | Purpose | Our Integration |
|-------|---------|-----------------|
| `tempo-x402` | Core types, EIP-712 signing, TIP-20, WASM wallet | Client SDK for browser payments |
| `tempo-x402-gateway` | Payment gateway + embedded facilitator | Standalone service gating Agentbot API |
| `tempo-x402-identity` | Agent identity, wallet gen, faucet, ERC-8004 | Agent provisioning identity layer |
| `tempo-x402-soul` | Cognitive architecture, plans, colony, self-repair | Agent intelligence layer |
| `tempo-x402-model` | 284K-param transformer for plan prediction | Agent plan generation (no LLM) |
| `tempo-x402-node` | Self-deploying node + clone orchestration | Reference architecture |

## Chain Details (Shared with Our MPP)

```
Chain:       Tempo Moderato (ID 42431)
Token:       pathUSD (0x20c0000000000000000000000000000000000000)
Decimals:    6
Scheme:      tempo-tip20
RPC:         https://rpc.moderato.tempo.xyz
Explorer:    https://explore.moderato.tempo.xyz
```

Our existing MPP already uses this chain. Zero new infrastructure needed.

## Architecture: Three-Party Model

```
Client (WASM wallet) --> Gateway (x402-gateway:4023) --> Facilitator (embedded) --> Tempo Chain (42431)
```

1. **Client** — Signs EIP-712 payment authorization in browser (WASM)
2. **Gateway** — Validates payment, gates endpoints, proxies to upstream
3. **Facilitator** — Verifies signature, settles on-chain via `transferFrom()`

## What Phase 1 Built (Done ✅)

- `web/lib/x402-tempo.ts` — Tempo-specific x402 client, EIP-712 signing
- `web/app/api/agents/clone/route.ts` — Clone endpoint with payment verification
- `web/app/components/shared/CloneButton.tsx` — Clone UI component
- `web/app/dashboard/colony/page.tsx` — Colony dashboard (empty state)
- Fleet page integration — Clone button on every agent card

## Phase 2: Gateway Service (This Sprint)

Deploy `tempo-x402-gateway` as a standalone service.

### Why Rust Gateway vs Node.js Middleware?

| | Node.js (current) | Rust Gateway |
|---|---|---|
| Payment verification | Manual EIP-712 in JS | Native alloy crate |
| Settlement | Manual `transferFrom` | Embedded facilitator |
| SSRF protection | DIY | Built-in (DNS validation) |
| Rate limiting | Express middleware | actix-governor |
| Metrics | Custom | Prometheus built-in |
| Performance | ~50ms overhead | ~2ms overhead |

### Deployment

```yaml
# Render.com service
x402-gateway:
  runtime: docker
  image: compusophy/tempo-x402-gateway:3.0.0
  # or build from: github.com/compusophy/tempo-x402
  envVars:
    - TEMPO_CHAIN_ID=42431
    - TEMPO_RPC_URL=https://rpc.moderato.tempo.xyz
    - FACILITATOR_PRIVATE_KEY=<from_vault>
    - PLATFORM_REGISTRATION_FEE=1.0
    - PLATFORM_WALLET=0xYOUR_WALLET_ADDRESS_HERE
    - DATABASE_URL=sqlite:///data/x402.db
  disk:
    mountPath: /data
    sizeGB: 1
  ports:
    - 4023
```

### Gateway Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| ANY | `/g/:slug/*` | PAYMENT-SIGNATURE | Proxy to target endpoint |
| POST | `/register` | Bearer token | Register new endpoint with price |
| GET | `/health` | Free | Health check + build SHA |
| GET | `/metrics` | Bearer token | Prometheus metrics |

### Endpoint Registration Flow

```
Agentbot API registers endpoints on gateway:

POST /register
{
  "slug": "clone-agent-123",
  "target_url": "http://agentbot-api:3000/api/agents/clone",
  "price": "1.00",
  "description": "Clone agent with x402 payment"
}

Gateway responds:
{
  "slug": "clone-agent-123",
  "callable_url": "https://gateway.agentbot.raveculture.xyz/g/clone-agent-123"
}
```

## Phase 3: Soul Integration (Next Sprint)

This is where it gets interesting. The `tempo-x402-soul` crate gives agents:

### Cognitive Architecture

Seven systems unified under Free Energy Principle:
- **Brain** — Neural classifier: "will this step succeed?"
- **Cortex** — Predictive world model with curiosity engine + dream consolidation
- **Genesis** — Evolutionary plan templates (crossover, mutation, selection)
- **Hivemind** — Stigmergic swarm intelligence (pheromone trails)
- **Synthesis** — Metacognitive self-awareness (4-system voting)
- **Autonomy** — LLM-free plan compilation from templates
- **Evaluation** — Brier scores, calibration, colony benefit

### Integration Points for Agentbot

```typescript
// Soul status for each agent
interface AgentSoul {
  fitness: {
    total: number;        // 0-1 composite score
    prediction: number;   // Plan success prediction accuracy
    execution: number;    // Step completion rate
    coordination: number; // Colony cooperation score
    economic: number;     // Revenue generation
    evolution: number;    // Template diversity
    introspection: number; // Self-awareness
    trend: number;        // Fitness trajectory
  };
  active_plan: {
    id: string;
    current_step: number;
    total_steps: number;
    status: 'active' | 'completed' | 'failed';
  };
  beliefs: Belief[];      // Agent's knowledge base
  goals: Goal[];          // Active goals
  mode: 'observe' | 'plan' | 'execute' | 'dream';
}
```

### Agent Marketplace with Fitness

Instead of flat $1 clones, dynamic pricing:

```
clone_price = base_price * (1 + fitness.total * 2)
// Fitness 0.3 → $1.60
// Fitness 0.8 → $2.60
// Fitness 0.95 → $2.90
```

Fitter agents are worth more. Market dynamics.

## Phase 4: Transformer Model (Future)

The 284K-param transformer generates plans WITHOUT an LLM after 50+ training steps. For Agentbot:

1. Each agent trains its own transformer on its plan outcomes
2. Federated weight sharing between agents in same colony
3. Plan prediction becomes local + fast (no API calls)
4. Agents that predict better → higher fitness → more clones

### Federated Learning Protocol

```
Every 5 cycles:
1. Agent exports: /soul/model/transformer/weights
2. Peers merge:   POST /soul/model/transformer/merge
3. Fitter peers get 2x merge weight, weaker get 0.1x
4. Colony converges on best strategies
```

## Files Inventory

### Committed to GitHub ✅
| File | Status | Purpose |
|------|--------|---------|
| `web/lib/x402-tempo.ts` | ✅ Pushed | Tempo x402 client, EIP-712 signing |
| `web/app/api/agents/clone/route.ts` | ✅ Pushed | Clone endpoint |
| `web/app/components/shared/CloneButton.tsx` | ✅ Pushed | Clone UI component |
| `web/app/dashboard/colony/page.tsx` | ✅ Pushed | Colony dashboard |
| `web/app/dashboard/fleet/page.tsx` | ✅ Pushed | Fleet + clone integration |

### In Local Workspace (this spec)
| File | Purpose |
|------|---------|
| `docs/x402-provisioning-spec.md` | This document |

## Current Status

- [x] Phase 1: Clone endpoint + x402 client — **DONE**
- [ ] Phase 2: Gateway service deployment — **NEXT**
- [ ] Phase 3: Soul cognitive integration — **PLANNED**
- [ ] Phase 4: Transformer model — **FUTURE**

## Open Questions

1. Gateway as separate Render service or sidecar in API container?
2. Soul integration: embed Rust via FFI/NAPI or call via HTTP to x402-node?
3. Colony fitness: should Agentbot's fitness metrics feed into tempo-x402's colony?
4. Cross-colony: can our agents join Borg-0's colony?
5. Pricing: flat $1 or dynamic by fitness?
