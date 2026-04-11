# Agentbot Repo Extraction Plan
_Captured: 2026-04-11 04:26 GMT — ChatGPT analysis via Eskyee_

## ChatGPT's Diagnosis

Current private repo is acting like a "company brain dump + production monolith" — 4 layers mixed together:

1. **Core Agentbot product** — web, agentbot-backend, gateway, memory, skills, docs
2. **Internal/operator tooling** — scripts, data, SESSION_NOTES, TASKS, .claude/.factory/.omx/.agents/.kiro/.mux/.trae
3. **Commercial/hosted infrastructure** — billing, auth, orchestration, deployments, permissions, keys, sessions, metrics
4. **Side projects / experiments** — btcpay-configurator, chrome-extension, gitlawb-mcp, x402-services, x402-tempo

**Core conclusion:** Do NOT open-source this repo directly. Extract a public developer platform FROM it.

---

## What Stays Private

### Hosted platform & control plane
- web/app/api/billing, checkout, credits, stripe, deployments, provision, permissions, keys, sessions, security, admin, metrics, cron, jobs

### Internal ops
- .claude, .factory, .agents, .kiro, .mux, .trae, .omx
- SESSION_NOTES.md, TASKS.md, CODE_REVIEW.md
- memory/ folders, internal guides

### Product-specific / experimental
- btcpay-configurator, chrome-extension, gitlawb-mcp
- x402-services, x402-tempo
- Specialized dashboard and API routes

### Secrets / tenancy / abuse / user data
- auth, wallets, payment flows, admin tools, managed deployment logic, internal orchestration policies

---

## What Goes Public (Extract)

### 1. Agent Runtime Contract
Source: `agentbot-backend/src/lib/agents`, `orchestration`, `hooks`, `permissions` (if generic)

Publicize:
- Agent definition format
- Task lifecycle
- Tool interface
- Hook system
- Workflow spec

### 2. SDK / Local Dev Experience
Public package that makes agents feel buildable:
- Create agent
- Run agent locally
- Register tools
- Compose workflows
- Test locally

### 3. Example Agents
Derived from existing skills/agents:
- Research agent
- Outreach agent
- Community/content agent
- Memory-enabled assistant

### 4. Plugin System
Publicize the extension surface:
- Tool API
- Plugin manifest
- Event hooks
- Capability permissions

### 5. Docs
- Build your first agent
- Add a tool
- Compose a workflow
- Run locally
- Deploy to Agentbot Cloud later

---

## Recommended Public Repo Structure

### Option A: One repo first (RECOMMENDED)
```
agentbot/
├── packages/
│   ├── sdk/          # Core TypeScript SDK
│   │   └── src/
│   │       ├── agent/
│   │       ├── tools/
│   │       ├── workflows/
│   │       ├── memory/
│   │       └── types/
│   ├── cli/          # Developer CLI
│   │   └── src/
│   └── plugins/      # Official integrations
│       └── src/
│           ├── discord/
│           ├── telegram/
│           ├── browser/
│           └── email/
├── examples/
│   ├── research-agent/
│   ├── outreach-agent/
│   ├── content-agent/
│   └── multi-agent-workflow/
├── docs/
│   ├── getting-started/
│   ├── agents/
│   ├── tools/
│   ├── workflows/
│   └── deployment/
├── CONTRIBUTING.md
└── README.md
```

### Option B: Split repos later (when it grows)
- agentbot-sdk
- agentbot-agents
- agentbot-plugins
- agentbot-cli
- agentbot-docs

### Private repo (mentally rename to `agentbot-cloud`)
```
agentbot-cloud/
├── web/              # Dashboard + frontend
├── agentbot-backend/ # API + services
├── gateway/          # OpenClaw gateway
├── memory/           # Agent memory
├── scripts/          # Ops scripts
├── infra/            # Infrastructure
├── internal/         # Internal tools
└── experiments/      # Experimental features
```

---

## Extraction Order

1. **First:** `agentbot-backend/src/lib/agents` — most platform-like
2. **Second:** `agentbot-backend/src/lib/orchestration` — generic workflow engine
3. **Third:** `skills/` — reusable agent capabilities
4. **Fourth:** Memory/tool hooks — if generic

**DO NOT start with the web app** — drags into UI complexity, auth assumptions, hosted-product baggage.

---

## What NOT to Expose Yet
- Giant web/app/api/* surface
- Admin dashboards
- Deployment internals
- Billing logic
- Private orchestration endpoints
- Half-finished experimental routes
- Token-specific mechanics

External devs don't want the whole app. They want a small, reliable contract.

---

## Public Narrative
> Agentbot is an open developer platform for building deployable AI workers.
> Build agents locally, connect tools, compose workflows, and deploy them to your own stack or Agentbot Cloud.

> Agentbot Cloud is the managed deployment layer for production agents.

---

## Product Risk: Surface-Area Sprawl
Current state: lots of routes, dashboards, adjacent concepts, mixed naming, overlapping backend/web structure.

For internal speed → survivable
For ecosystem adoption → deadly

Developers need: one clear SDK, one clear CLI, a few examples, stable extension points. Not 120 routes.

---

## First Three Tasks

1. **Define the public boundary** — shortlist of files/dirs that are truly generic (agent runtime, orchestration core, tool interface, examples)
2. **Build the public starter repo** — create FRESH repo, copy only ecosystem-worthy pieces. Don't sanitize monorepo in place.
3. **Write the public promise** — first README answers: what is an Agentbot agent, how do I build one, how do I run it locally, how do I extend it

---

## Next Steps (ChatGPT wants these to do file-by-file extraction)
- [ ] package.json
- [ ] agentbot-backend/package.json
- [ ] web/package.json
- [ ] README.md
- [ ] agentbot-backend/src/lib/agents tree
- [ ] agentbot-backend/src/lib/orchestration tree
- [ ] skills tree
