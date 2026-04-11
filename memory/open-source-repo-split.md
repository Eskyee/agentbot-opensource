# Agentbot Open Source Strategy — Repo Split
_Captured: 2026-04-11 04:23 GMT — Eskyee_

## Two-Repo Model

### 1. agentbot-opensource (Public Ecosystem Layer)
- SDK
- Agent spec
- Example agents
- Plugin interface
- Docs
- Local dev runner
- Contribution guide

### 2. agentbot (Private — Monetization & Infrastructure)
- Hosted deployment orchestration
- Billing
- Auth
- Secrets management
- Production infra
- Tenancy controls
- Internal admin tools
- Managed runtime features

---

## What Goes Where

### Public
- Agent definition format
- CLI / SDK
- Plugin API
- Sample tools
- Local Docker compose
- Self-host docs
- Example workflows
- Marketplace submission format

### Private
- Hosted control plane
- Internal deployment scheduler
- Production observability
- Billing and subscription logic
- Abuse prevention
- Premium hosted features
- Private integrations
- Internal analytics

---

## Framing
> Agentbot is open-source infrastructure for AI workers.
> Agentbot Cloud is the managed deployment platform.

Clean. No token/product/infra mixing in one sentence.

---

## Ecosystem Model

### Open-Source Layer (Goal: get developers building agents and plugins)
Packages/repos:
- `agentbot-sdk`
- `agentbot-agents`
- `agentbot-plugins`
- `agentbot-examples`

### Commercial Layer (Goal: make deployment easy enough that people pay)
Paid value:
- One-click deploy
- Hosted memory
- Dashboards
- Logs
- Team workspaces
- Secret storage
- Production uptime
- Premium model routing

Classic open-core motion.

---

## The Moat
NOT "the code is private" — that's a losing moat.

Moat should be:
- Best hosted experience
- Fastest deployment path
- Best agent UX
- Best docs
- Strongest community agent ecosystem

If moat = secrecy → you lose
If moat = execution + distribution → you win

---

## Build Order (Developer Ecosystem)

### 1. Public Agent Spec
Dead-simple standard:
```
agent.md
agent.json or agent.yaml
tool permissions
model config
memory config
```

### 2. CLI
```
npx agentbot init
npx agentbot dev
npx agentbot deploy
```

### 3. Plugin Contract
Make it obvious how someone adds:
- Telegram, Discord, X
- Notion, email, browser automation

### 4. Example Agents (3 canonical)
- Research agent
- Outreach agent
- Social/content agent

### 5. Hosted Upgrade Path
Every public workflow naturally points toward:
- Self-host free
- Hosted for scale

---

## Mistake to Avoid
Do NOT open-source random pieces without a clean boundary.
If public repo feels like half-exposed internal app → developers confused, contributors stay away.

Public repo needs:
- Stable interfaces
- Clear boundaries
- Contributor-owned extension points

---

## What ChatGPT Needs Next
To map the exact split, paste one of:
- Private repo folder tree
- Main README
- package.json
- docker-compose.yml
- Root-level file list
- Architecture notes

Then ChatGPT gives:
- What to move public
- What to keep private
- What to rename
- What packages/repos to create first

**→ DONE: Repo tree already saved at `memory/repo-tree-for-chatgpt.md`**
