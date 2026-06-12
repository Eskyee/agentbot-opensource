# Agentbot Agent-Infrastructure Roadmap

What to steal from Morph's "Infrastructure matters more than framework choice"
thesis, mapped to what Agentbot actually runs (OpenClaw runtime, OpenClaude
app/coding agent, the OpenAI-compatible gateway, the agent bus + negotiation +
wallet services).

Morph's argument, paraphrased: the framework is the thinnest layer. The moat is
the **execution infrastructure underneath** — fast edits, fast search, sandboxed
execution, context compaction, and model routing. Agentbot already owns the
gateway and runtime, so these primitives are ours to build, not rent.

---

## Ranked recommendations

### 1. Fast Apply — edit files without rewriting them  ✓ SHIPPED + wired
**Status:** `POST /v1/apply` live (auth + AI rate-limit), backed by
`lib/fast-apply.ts`. Wired into the Playground/OpenClaude follow-up path:
iterations send lazy edits that the fast model merges, with safe fallback to a
full regeneration. Initial builds keep the streaming preview.
**What:** A cheap "apply model" merges a terse AI-generated edit into a file at
thousands of tok/s, instead of the big model re-emitting the whole file.
**Why it's #1 for us:** the Playground and coding-agent currently regenerate
entire files on every change. That's slow, expensive, and the main reason
iteration feels heavy. Morph clocks 10,500 tok/s on apply; even a modest version
cuts edit latency and token cost by an order of magnitude.
**How on our stack:** add `POST /v1/apply` to the gateway — input `{ file, edit }`,
route to a small fast model (MiMo Flash) with an apply-merge system prompt, return
the merged file. Playground's iteration path and OpenClaude both call it instead
of full regeneration. Pairs perfectly with the streaming work already shipped.
**Effort:** medium. **Moat:** high — this is the single biggest UX/cost lever.

### 2. Context Compaction — keep 24/7 agents alive cheaply  ✓ SHIPPED
**What:** Compress old conversation turns (verbatim-preserving the important bits)
to reclaim context window space on long-running agents.
**Why it fits:** Agentbot's whole pitch is "always on." An OpenClaw agent running
for days fills its context and either degrades or gets expensive. Compaction is
the difference between an agent that runs for an hour and one that runs for a week.
**How on our stack:** a gateway-side `compact()` step (summarize-and-pin) that the
OpenClaw runtime calls when context crosses a threshold; store compacted memory in
the existing DB-backed memory service. Bill it as a cheap MiMo Flash call.
**Effort:** medium. **Moat:** high — directly powers the "never sleeps" claim.

### 3. model:auto smart routing  ✓ SHIPPED today
Already live: cost-scored ladder, failover, `x-gateway-served-model`, route hint.
Morph sells this as a standalone product ("Model Router") — validates it's a real
category. Next step: feed real per-model success/latency stats back into the
ladder so routing improves from production data.

### 4. A2A Agent Cards — make the agent bus interoperable  ✓ SHIPPED (discovery + inbound tasks)
**Status:** discovery cards (`/.well-known/agent.json`, `/api/agents/:id/card`)
plus the inbound task endpoint `/api/agents/:id/a2a` (JSON-RPC `message/send`):
a discovered agent runs the task through the gateway as itself and replies with
an A2A Message. Agents with a wallet require an x402 `payment-signature` (402
otherwise) — discovery + hire + pay, end to end. Next: verify x402 settlement
on-chain and route long tasks through the bus async instead of synchronously.
**What:** A2A (Google's protocol, now the Linux Foundation standard that absorbed
IBM's ACP) describes each agent with a JSON "Agent Card": identity, capabilities,
skills, auth. Any agent can discover any other by reading its card.
**Why it fits uniquely:** Agentbot already has the rare pieces — an agent **bus**,
**negotiation**, and per-agent **USDC wallets**. Adopting Agent Cards turns that
into a discoverable, interoperable agent economy: external A2A agents can find an
Agentbot agent, negotiate, and pay it. Nobody else pairs A2A discovery with native
on-chain settlement.
**How on our stack:** emit an Agent Card per provisioned agent at
`/.well-known/agent.json` (or `/api/agents/:id/card`), generated from its skills +
channels; accept inbound A2A task requests through the bus (which already has SSRF
protection). Keep MCP for tools, add A2A for agent-to-agent.
**Effort:** medium-high. **Moat:** very high — this is a genuine differentiator.

### 5. Fast codebase search for coding-agent  ★ quick-ish win
**What:** Sub-second semantic search across a repo; Morph runs 8 parallel queries
in <6s. Cognition's data: coding agents spend ~60% of their time searching, not
generating.
**Why:** the coding-agent and OpenClaude waste tokens grepping. A dedicated search
subagent/tool makes them faster and cheaper immediately.
**How on our stack:** a `search` MCP tool backed by embeddings over the user's
connected repo (GitLawb/GitHub), exposed to OpenClaude. Start with ripgrep + a
re-rank pass; add embeddings later.
**Effort:** low-medium. **Moat:** medium.

### 6. Subagent orchestration with a lead planner  ★ quality multiplier
**What:** A planner agent fans work out to specialized sub-agents (search,
generate, review), each with its own context.
**Why:** Anthropic's own research found multi-agent + lead planner beats
single-agent by up to 90% on hard tasks. Subagents are the *cheapest* multi-agent
pattern (one call per delegation) vs. debate/crew patterns.
**How on our stack:** OpenClaw likely has the hooks already (skills + heartbeat);
formalize a planner→subagent delegation primitive and expose it. Reuse the
gateway's `model:auto` so each subagent gets the cheapest capable model.
**Effort:** medium. **Moat:** medium-high.

---

## What NOT to chase
- **Don't adopt a heavy external framework** (LangGraph/CrewAI/AutoGen). Agentbot
  already owns the runtime + gateway; bolting on an orchestration framework adds an
  abstraction layer and vendor weight for capability we can build leaner.
- **Don't pay for Morph** if we're building the gateway anyway — implement the
  *patterns* (apply, compact, route, search) as gateway endpoints we control and
  bill through our own credit system. Morph is the proof the category matters.
- **Don't over-invest in debate/group-chat** multi-agent — 20+ LLM calls per turn,
  wrong cost profile for an "always on, cheap" product.

## Suggested sequence
1. Fast Apply endpoint → wire Playground + coding-agent to it (biggest felt win)
2. Context Compaction → unlocks genuinely long-running OpenClaw agents
3. A2A Agent Cards → the strategic differentiator (discovery + wallet + negotiation)
4. Search tool + subagent planner → quality/speed multipliers

Each is a gateway or runtime primitive we own end-to-end, billed through the
existing per-token credit system — turning "Agentbot has an agent platform" into
"Agentbot has the fastest, cheapest agent execution layer."
