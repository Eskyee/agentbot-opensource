# Docker Agent Integration Plan — Agentbot Platform

**Date:** 2026-03-25
**Status:** Scoped, ready for implementation
**Source:** Official Docker Agent docs (github.com/docker/docker-agent)
**Target:** Post-March 31 launch

---

## Executive Summary

Replace our custom team provisioning system (11 hardcoded TS templates, manual Render service per agent) with **Docker Agent** as the runtime. Agents are defined in YAML, coordinated via A2A protocol, and share tools via MCP Gateway. We handle billing, provisioning, and infra — Docker Agent handles agent orchestration.

---

## Architecture

### Current (Custom)
```
User → Onboard → provisionTeam() → N × createContainer(Render) → each agent = separate Render service
```
- 11 hardcoded TS templates
- No inter-agent protocol (just separate services)
- Custom YAML generator (not portable)
- No sharing mechanism

### Target (Docker Agent)
```
User → Onboard → generate YAML → docker agent serve a2a team.yaml → single container, N agents inside
```
- User-defined YAML configs (or from template library)
- A2A protocol for inter-agent calls (JSON-RPC 2.0)
- MCP Gateway for external tool access
- OCI artifact sharing (`docker agent share push/pull`)
- Agent cards auto-published for marketplace discovery

---

## Integration Points

### 1. Runtime Layer

**Each agent deployment = one Docker container running `docker agent serve a2a`**

```
┌─────────────────────────────────────┐
│  Agentbot Container (Render)        │
│  ┌─────────────────────────────┐    │
│  │  docker agent serve a2a     │    │
│  │  team.yaml --port 8080      │    │
│  │                             │    │
│  │  ┌───────┐  ┌───────┐      │    │
│  │  │ root  │→ │helper │      │    │
│  │  │ agent │  │ agent │      │    │
│  │  └───────┘  └───────┘      │    │
│  │                             │    │
│  │  /.well-known/agent-card    │    │
│  │  /invoke (JSON-RPC 2.0)     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

- Solo: 1 agent in YAML (root only)
- Collective: 3 agents (root + 2 sub_agents)
- Label: 5+ agents (full team with MCP toolsets)
- Network: unlimited agents + custom MCP servers

### 2. Provisioning Flow

```typescript
// New provisioning flow
async function provisionAgent(userId, plan, yamlConfig) {
  // 1. Validate YAML against plan limits
  const agentCount = countAgents(yamlConfig)
  assertAgentLimit(agentCount, plan)

  // 2. Render Docker container with docker-agent installed
  const service = await createRenderService({
    type: 'docker',
    dockerfilePath: 'Dockerfile.agent', // includes docker-agent binary
    envVars: {
      AGENTBOT_YAML: yamlConfig,           // agent team config
      ANTHROPIC_API_KEY: getUserKey(userId, 'anthropic') || sharedKey,
      OPENAI_API_KEY: getUserKey(userId, 'openai') || sharedKey,
      A2A_PORT: '8080',
      ...getPlanEnvVars(plan),
    },
  })

  // 3. Container starts → runs `docker agent serve a2a /app/agent.yaml`
  // 4. Agent card auto-published at /.well-known/agent-card
  // 5. Register in marketplace index

  return {
    serviceId: service.id,
    url: `https://${service.slug}.up.railway.app`,
    agentCard: `https://${service.slug}.up.railway.app/.well-known/agent-card`,
    invokeEndpoint: `https://${service.slug}.up.railway.app/invoke`,
  }
}
```

### 3. YAML Config Format (Official Spec)

All agent configs follow the Docker Agent YAML spec exactly. No custom extensions.

```yaml
agents:              # Required — agent definitions
  root:
    model: openrouter/xiaomi/mimo-v2-pro     # Required
    description: Brief role summary           # Optional
    instruction: |                            # Required
      Detailed behavior instructions...
    sub_agents: [engineer, qa]               # Task delegation (hierarchical)
    handoffs: [specialist]                    # Conversation transfer (peer)
    toolsets:                                 # Available tools
      - type: filesystem
      - type: shell
      - type: mcp
        ref: docker:duckduckgo
    commands:                                 # Named prompts (/command_name)
      status: "Check project status"
    structured_output:                        # JSON schema constraint
      name: analysis
      strict: true
      schema: { ... }
    rag: [docs]                               # RAG source references
    max_iterations: 50                        # Tool call loop limit
    num_history_items: 20                     # Conversation history limit
    add_date: true                            # Include current date
    add_environment_info: true                # Include OS, dir, git info

  engineer:
    model: openrouter/xiaomi/mimo-v2-pro
    description: Implements features
    instruction: Write clean, tested code.
    toolsets:
      - type: filesystem
      - type: shell

models:              # Optional — custom model configs
  gpt:
    provider: openai
    model: gpt-5
  claude:
    provider: anthropic
    model: claude-sonnet-4-5
    max_tokens: 64000
    thinking_budget: 8192
    provider_opts:
      interleaved_thinking: true
  local:
    provider: dmr                             # Docker Model Runner (Ollama)
    model: ai/qwen3
    base_url: http://localhost:12434/engines/llama.cpp/v1

rag:                 # Optional — knowledge bases
  docs:
    docs: [./documents, "**/README.md"]
    strategies:
      - type: chunked-embeddings
        embedding_model: openai/text-embedding-3-small
        vector_dimensions: 1536
        database: ./embeddings.db
        limit: 10
      - type: bm25
        database: ./bm25.db
        limit: 10
    results:
      fusion:
        strategy: rrf
        k: 60
        limit: 5
      reranking:
        model: openai/gpt-5-mini
        top_k: 10

metadata:            # Optional — sharing info
  author: Your Name
  license: MIT
  readme: |
    Description and usage instructions
```

**Key features to note:**
- **Alloy models:** `model: anthropic/claude-sonnet-4-5,openai/gpt-5` (rotation)
- **DMR (local models):** `provider: dmr` — works with Ollama
- **Sub_agents vs Handoffs:** Task delegation (parent→child) vs conversation transfer (peer→peer)
- **Commands:** Named prompts invoked via `/command_name`
- **Structured output:** JSON schema enforcement (OpenAI/Gemini)
- **RAG:** Hybrid retrieval (embeddings + BM25) with optional reranking
- **Code-aware chunking:** AST-based for source code RAG

### 4. Toolsets (Official Spec)

Three types of toolsets available:

**Built-in:**
| Toolset | Description | Plan Gate |
|---|---|---|
| `filesystem` | Read/write/edit files, search, list dirs | All |
| `shell` | Execute commands in system shell | All |
| `think` | Reasoning scratchpad | All |
| `todo` | Task tracking (basic) | All |
| `tasks` | Advanced task mgmt (priorities, dependencies, persistence) | Collective+ |
| `memory` | Persistent memory across sessions (SQLite) | All |
| `fetch` | HTTP/HTTPS content retrieval | All |
| `user_prompt` | Ask user questions during execution | All |
| `lsp` | Language Server Protocol (code intelligence) | Label+ |

**MCP (external tools):**
| Type | Description | Plan Gate |
|---|---|---|
| `mcp` local (stdio) | Process-based MCP servers | Collective+ |
| `mcp` remote (SSE) | HTTP/SSE MCP servers | Collective+ |
| `mcp` Docker Gateway | `ref: docker:duckduckgo` etc. | All (count-limited) |

**Custom:**
| Type | Description | Plan Gate |
|---|---|---|
| `script` | Shell commands with typed parameters | Label+ |
| `api` | HTTP API endpoints as tools | Label+ |

**Common options (all toolsets):**
- `instruction` — usage guidance for the agent
- `tools` — whitelist specific tool names
- `env` — environment variables
- `toon` — compress JSON outputs (regex match on tool names)
- `defer` — lazy-load tools into context (`true` = all, `[names]` = specific)
- `version` — pin/auto-install binary via aqua registry

**Auto-installation:** MCP/LSP binaries auto-install from aqua registry if not in PATH. Stored at `~/.cagent/tools/bin/`.

**Automatic tools (auto-added based on config):**
- `transfer_task` — available when `sub_agents` configured
- `handoff` — available when `handoffs` configured

**Plan gating (updated):**

| Feature | Solo (£29) | Collective (£69) | Label (£149) | Network (£499) |
|---|---|---|---|---|
| Agents | 1 (root only) | 3 (root + 2 subs) | 10 | Unlimited |
| sub_agents | ❌ | ✅ | ✅ | ✅ |
| handoffs | ❌ | ❌ | ✅ | ✅ |
| Built-in tools | filesystem, shell, think, todo, memory, fetch | + tasks, user_prompt | + lsp | All |
| MCP servers | 2 (built-in gateway only) | 5 | 10 | Unlimited |
| MCP custom (local/remote) | ❌ | ✅ | ✅ | ✅ |
| A2A toolsets | ❌ | ❌ | ✅ | ✅ |
| RAG | ❌ | Basic (1 source) | Full (hybrid+rerank) | Full |
| DMR (local models) | ❌ | ❌ | ✅ | ✅ |
| Alloy models | ❌ | ❌ | ✅ | ✅ |
| Custom YAML | ❌ | ❌ | ✅ | ✅ |
| OCI sharing | ❌ | ❌ | ❌ | ✅ |
| structured_output | ❌ | ✅ | ✅ | ✅ |
| script toolsets | ❌ | ❌ | ✅ | ✅ |
| api toolsets | ❌ | ❌ | ✅ | ✅ |
| commands | 3 | 10 | 25 | Unlimited |
| max_iterations | 20 | 50 | 100 | Unlimited |

**Platform-specific `api` toolset idea:** Expose Agentbot platform features as tools:
```yaml
toolsets:
  - type: api
    api_config:
      name: check_balance
      endpoint: https://agentbot.raveculture.xyz/api/wallet/balance
      method: GET
      instruction: Check your agent wallet balance
      headers:
        Authorization: Bearer ${AGENT_TOKEN}
      args:
        address:
          type: string
          description: Wallet address
          required: [address]
```

**Enforcement:** YAML validation rejects over-limit configs with specific error messages before provisioning.

### 4. A2A Inter-Agent Communication

Replace our custom `AgentBusService` with Docker Agent's native A2A:

```yaml
# Agents call each other via A2A toolsets
agents:
  root:
    toolsets:
      - type: a2a
        url: http://localhost:8081  # specialist agent
        name: code-reviewer
        remote:
          headers:
            Authorization: Bearer ${AGENT_TOKEN}
```

**What we can deprecate:**
- `AgentBusService` (custom message dispatch)
- `AgentMessage` interface (custom protocol)
- `/bus/send` endpoint (custom delivery)

**What we keep:**
- A2A payment settlement (x402 gateway for paid agent-to-agent calls)
- Agent discovery via marketplace index
- Rate limiting and anti-scam guard

### 5. MCP Tool Access

Replace custom tool injection with MCP Gateway:

```yaml
agents:
  root:
    toolsets:
      - type: mcp
        ref: docker:duckduckgo      # web search
      - type: mcp
        ref: docker:github           # repo access
      - type: mcp
        ref: docker:postgres         # DB queries
      - type: mcp
        url: http://localhost:3001   # custom Agentbot MCP server
```

**Plan-gated MCP access:**
| Plan | MCP servers allowed |
|---|---|
| Solo | 2 (built-in only) |
| Collective | 5 (built-in + custom) |
| Label | 10 (all) |
| Network | Unlimited |

### 6. OCI Artifact Sharing

```bash
# User saves their team config
docker agent share push ./my-team.yaml eskyee/legal-team

# Others discover it on marketplace
docker agent share pull eskyee/legal-team

# Versioned
docker agent share push ./my-team.yaml eskyee/legal-team:v2
```

**Marketplace integration:**
- Agent cards indexed from `/.well-known/agent-card`
- OCI refs stored alongside agent metadata
- Clone = pull OCI artifact + provision new instance

### 7. Marketplace Discovery

Docker Agent's agent card format maps directly to our marketplace:

```json
{
  "name": "legal-team",
  "description": "Legal Advisor + Contract Drafter + Compliance Officer",
  "skills": [
    { "id": "advisor", "name": "Legal Advisor", "tags": ["legal", "contracts"] },
    { "id": "drafter", "name": "Contract Drafter", "tags": ["legal", "drafting"] }
  ],
  "url": "https://agent-xyz.up.railway.app/invoke",
  "capabilities": { "streaming": true }
}
```

Our marketplace endpoint (`/gateway/marketplace`) queries agent cards from running agents.

---

## CLI Commands (Platform-Relevant)

Official Docker Agent commands we use in provisioning/runtime:

| Command | Use Case | Platform Integration |
|---|---|---|
| `serve a2a agent.yaml --port 8080` | Run agent as A2A server | Primary runtime — each deployment |
| `serve api agent.yaml --listen :8080` | HTTP API with session DB | Alternative for REST clients |
| `serve mcp agent.yaml` | Expose as MCP tools | User connects to Claude Desktop etc. |
| `serve acp agent.yaml` | Editor integration (stdio) | Label+ users with IDE setup |
| `exec agent.yaml "message"` | Single-shot execution | API-triggered agent calls |
| `build agent.yaml image:tag` | Build Docker image | Pre-built images for faster cold starts |
| `share push agent.yaml ref` | Push to OCI registry | Marketplace publishing |
| `share pull ref` | Pull from OCI registry | Clone / template install |
| `eval agent.yaml ./evals` | Run eval tests | Agent quality scoring for marketplace |
| `debug config agent.yaml` | Show resolved config | YAML validation before provisioning |
| `debug toolsets agent.yaml` | List tools | Plan limit enforcement |
| `run agent.yaml --model provider/model` | Interactive TUI | Local testing by users |

**Provisioning flow (updated):**
```bash
# 1. Validate config
docker agent debug config agent.yaml
docker agent debug toolsets agent.yaml

# 2. Build image (optional, faster cold starts)
docker agent build agent.yaml agentbot/agent-${userId}:latest --push

# 3. Serve
docker agent serve a2a agent.yaml --port 8080
# or
docker agent serve api agent.yaml --listen :8080 --session-db /data/sessions.db
```

**Model overrides:** Platform injects `--model` flag to enforce plan limits:
```bash
# Solo user forced to allowed models
docker agent serve a2a agent.yaml --port 8080 --model openrouter/xiaomi/mimo-v2-pro

# Collective user picks from approved set
docker agent serve a2a agent.yaml --port 8080 --model root=openrouter/xiaomi/mimo-v2-pro
```

**Platform-injected env vars:**
- `CAGENT_MODELS_GATEWAY` — our model routing gateway
- `TELEMETRY_ENABLED=false` — disable telemetry on user agents
- `CAGENT_HIDE_TELEMETRY_BANNER=1` — clean output
- `--env-from-file` — load user's API keys from encrypted env file

**Auto-pull for OCI agents:** `--pull-interval 10` auto-updates from registry every 10 min — useful for Network tier shared agents.

## RAG (Retrieval-Augmented Generation)

Official Docker Agent RAG system. Auto-adds a search tool to agents when configured.

**Three retrieval strategies:**

| Strategy | Best For | API Cost | Speed |
|---|---|---|---|
| `chunked-embeddings` | Semantic search — docs, conceptual queries | Embedding calls | Fast |
| `bm25` | Keyword search — function names, API endpoints, identifiers | None (local) | Fastest |
| `semantic-embeddings` | LLM-enhanced — search by code behavior, not name | Chat + embedding | Slow |

**Hybrid retrieval (recommended for production):**
```yaml
rag:
  knowledge:
    docs: [./documentation, ./src]
    strategies:
      - type: chunked-embeddings
        embedding_model: openai/text-embedding-3-small
        vector_dimensions: 1536
        database: ./vector.db
        limit: 20
      - type: bm25
        database: ./bm25.db
        limit: 15
    results:
      fusion:
        strategy: rrf        # Reciprocal Rank Fusion (recommended)
        k: 60
        deduplicate: true
        limit: 5
      reranking:
        model: openai/gpt-5-mini
        threshold: 0.3
        criteria: |
          Prioritize official docs over community content.
          Prefer recent information over outdated material.
```

**Chunking config:**
- `size` — chunk size in characters (not tokens)
- `overlap` — context preserved at boundaries
- `respect_word_boundaries` — don't cut words (prose)
- `code_aware` — AST-based splitting (keeps functions intact)

**Plan gating:**

| Feature | Solo | Collective | Label | Network |
|---|---|---|---|---|
| RAG enabled | ❌ | ✅ | ✅ | ✅ |
| Strategies | — | bm25 only (1 source) | All 3 + hybrid | All 3 + hybrid |
| Reranking | — | ❌ | ✅ | ✅ |
| Sources | — | 1 | 5 | Unlimited |
| Code-aware chunking | — | ❌ | ✅ | ✅ |
| Embedding model | — | Platform default | BYO or default | BYO or default |
| Index storage | — | 100MB | 1GB | Unlimited |

**Platform defaults:**
- Embedding: `openai/text-embedding-3-small` (1536 dims) — included in plan price
- Reranking: `openai/gpt-5-mini` — Label+ only
- Database: SQLite per agent, stored in container volume
- Auto-reindex: on file changes, incremental

**Why RAG is Label+ for full features:**
- Embedding API calls cost money per chunk indexed
- Solo agents have small context windows — RAG adds overhead
- Collective gets basic BM25 (no API cost, local SQLite)
- Label+ gets full semantic search + reranking (premium feature)

## Docker Image Build

Each agent container:
```dockerfile
FROM docker:27-cli
COPY --from=docker-agent:latest /usr/local/bin/docker-agent /usr/local/bin/
COPY agent.yaml /app/agent.yaml
ENTRYPOINT ["docker", "agent", "serve", "a2a", "/app/agent.yaml"]
CMD ["--port", "8080"]
```

**Benefits:**
- Faster cold start (no YAML transfer at runtime)
- Versioned agent deployments
- Rollback to previous image tag
- OCI image = OCI agent config (both in registry)

---

## Implementation Phases

### Pre-Launch (Launch Day — March 31)
- [x] YAML template library created (`docker/templates/library.yaml`)
- [x] Integration plan fully scoped (`memory/docker-agent-integration-plan.md`)
- [x] Reference example saved (`memory/docker-agent-reference-example.yaml`)
- [ ] Feature flag added to container-manager (post-launch, Day 1)

### Post-Launch Day 1: Feature Flag + Staging
- [ ] Add `USE_DOCKER_AGENT` env var to container-manager.ts
- [ ] Add `createDockerAgentContainer()` alongside existing `createContainer()`
- [ ] Create staging Render service (branch: `feat/docker-agent`)
- [ ] Install `docker-agent` binary in Dockerfile
- [ ] Test: test user provisions agent via Docker Agent on staging
- [ ] Verify: `/.well-known/agent-card` returns 200
- [ ] Verify: `/invoke` responds to JSON-RPC

### Post-Launch Week 1: Docker Agent Runtime
- [ ] Solo agent (root only) provisions and works end-to-end on staging
- [ ] Collective team (root + 2 subs) provisions and coordinates
- [ ] Model injection via `--model` flag works
- [ ] Plan limit validation (YAML rejected if over limit)
- [ ] Canary: new Solo signups use Docker Agent (feature flag)
- [ ] Monitor: error rates, cold start times, agent response quality

### Post-Launch Week 2: A2A + MCP
- [ ] Agent cards indexed in marketplace
- [ ] Inter-agent A2A calls work on staging
- [ ] MCP Gateway configured with plan-tier profiles
- [ ] Canary: new Collective signups use Docker Agent

### Post-Launch Week 3: Sandboxes + OCI
- [ ] Docker Sandboxes for Label tier on staging
- [ ] OCI push/pull for team configs
- [ ] Canary: new Label/Network signups use Docker Agent
- [ ] Migrate existing users (opt-in, gradual)

### Rollback Plan
If Docker Agent path fails:
1. Set `USE_DOCKER_AGENT=false` → all provisioning reverts to legacy
2. No data loss — legacy path is unchanged
3. Existing agents continue running (they're already provisioned)
4. Debug on staging, re-enable when fixed

---

## File Changes Required

### New Files
- `agentbot-backend/docker/templates/*.yaml` — YAML template library
- `agentbot-backend/docker/Dockerfile.agent` — updated with docker-agent binary
- `agentbot-backend/src/lib/yaml-generator.ts` — replaces team-provisioning.ts
- `agentbot-backend/src/lib/docker-agent.ts` — docker-agent CLI wrapper

### Modified Files
- `agentbot-backend/src/lib/container-manager.ts` — inject YAML, start docker-agent
- `agentbot-backend/src/routes/provision.ts` — accept YAML config
- `web/app/onboard/page.tsx` — YAML editor (replaces template picker for Label)
- `web/app/dashboard/team/[teamId]/page.tsx` — agent card display

### Deprecated Files
- `agentbot-backend/src/lib/team-provisioning.ts` — replaced by YAML templates
- `agentbot-backend/src/routes/team-provision.ts` — merged into provision.ts
- `agentbot-backend/src/services/bus.ts` — replaced by A2A protocol
- `web/app/api/agents/clone/route.ts` — replaced by OCI pull + provision

---

## Billing Integration

See "Plan Feature Gating" table in toolsets section. Enforcement happens at YAML validation time before provisioning.

Summary:
| Plan | Price | Agents | Built-in Tools | MCP | RAG | Custom YAML | OCI | LSP/script/api |
|---|---|---|---|---|---|---|---|---|
| Solo | £29 | 1 | 7 basic | 2 gateway | ❌ | ❌ | ❌ | ❌ |
| Collective | £69 | 3 | 9 (+tasks, user_prompt) | 5 | Basic | ❌ | ❌ | ❌ |
| Label | £149 | 10 | 10 (+lsp) | 10 | Full | ✅ | ❌ | ✅ |
| Network | £499 | ∞ | All | ∞ | Full | ✅ | ✅ | ✅ |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| docker-agent binary size | Large container image | Multi-stage build, binary only in final stage |
| A2A latency between agents | Slow team responses | Same-container deployment (agents share localhost) |
| YAML validation complexity | Invalid configs deployed | Pre-deploy validation with `docker agent serve --validate` |
| MCP Gateway availability | Tool access fails | Fallback to direct tool configs, health monitoring |
| OCI registry costs | Storage grows | Cleanup policy, per-user quotas |

---

## Success Criteria

- [ ] User creates team from YAML template in < 30 seconds
- [ ] Agent card auto-published at `/.well-known/agent-card`
- [ ] Inter-agent A2A calls work (root delegates to sub-agent)
- [ ] MCP tools accessible (duckduckgo search works)
- [ ] OCI push/pull works (save and share team config)
- [ ] Marketplace discovers agents via agent cards
- [ ] Plan limits enforced (agent count, MCP servers, A2A calls)

---

## Reference

- Docker Agent repo: https://github.com/docker/docker-agent
- A2A protocol: `docker agent serve a2a`
- MCP mode: `docker agent serve mcp`
- OCI sharing: `docker agent share push/pull`
- Config reference: https://github.com/docker/docker-agent#configuration-reference
- Examples: https://github.com/docker/docker-agent/tree/main/examples
- Docker Sandboxes: `docker sandbox` (isolation layer for coding agents)
- Model Runner: `docker model` (local LLM inference, OpenAI-compatible API)
- MCP Catalog: `docker mcp` (manage external tool connections)
- Gordon: `docker ai` (Docker built-in assistant — not for our platform)

## Docker AI Ecosystem (Our Integration Points)

| Docker Tool | Our Use | Plan Gate |
|---|---|---|
| `docker agent` | Agent runtime — YAML configs, A2A, MCP, toolsets | All plans |
| `docker sandbox` | Isolation layer — microVM per agent | Label+ |
| `docker model` | Local model inference (DMR provider) | Label+ |
| `docker mcp` | MCP server catalog and toolkit | Collective+ |
| `docker agent share` | OCI artifact push/pull for team configs | Network |

## Best Practices (From Official Docs)

### Model Selection Per Agent Role
Use larger models for coordination/reasoning, smaller for validation/tasks:
```yaml
agents:
  root:
    model: anthropic/claude-sonnet-4-5    # Complex coordination
  writer:
    model: anthropic/claude-sonnet-4-5    # Creative content
  reviewer:
    model: anthropic/claude-haiku-4-5     # Just runs validation
```
**Platform implication:** Solo gets small models only. Collective+ can mix model sizes per agent role. This is a cost optimization — use expensive models only where reasoning matters.

### Handle Large Command Outputs
Redirect shell output to files, not context. Read files with filesystem tool (auto-truncates to 2000 lines).
```yaml
instruction: |
  Run validation and save output:
  `npm test > test-results.log 2>&1`
  Read test-results.log to check for errors.
```
**Platform implication:** All templates should include this pattern in shell-heavy agent instructions.

### RAG Optimization
- Narrow scope (index only relevant dirs, not entire codebase)
- Use `batch_size: 50` + `max_embedding_concurrency: 10` for speed
- BM25 for exact term matching (function names, identifiers)
- Hybrid retrieval (embeddings + BM25) for production quality

### Coordinator Pattern
Root agent delegates to specialists. Each specialist focuses on one thing. Root maintains control and coordinates. Use `handoffs` (not `sub_agents`) when agents should transfer conversation control as peers.

### MCP Gateway Architecture
- Runs as Docker container, managed by Gateway
- Isolated — servers run with restricted privileges, network, resources
- Profiles organize servers into named collections
- Built-in logging and call-tracing
- Platform injects Gateway config per plan tier

### Model Runner Details
- Engines: llama.cpp (default, all platforms), vLLM (NVIDIA GPUs), Diffusers (image gen)
- APIs: OpenAI-compatible + Ollama-compatible
- Formats: GGUF (quantized), Safetensors
- Pull from Docker Hub, OCI registries, or Hugging Face
- Context size configurable per model
- Platform implication: Label+ agents get local model option via `provider: dmr`

### Compose Models Integration
```yaml
services:
  agent:
    image: agentbot/agent-${USER_ID}
    models:
      llm:
        endpoint_var: AI_MODEL_URL
        model_var: AI_MODEL_NAME
      embedding:
        endpoint_var: EMBEDDING_URL
        model_var: EMBEDDING_NAME
models:
  llm:
    model: ai/smollm2
    context_size: 4096
  embedding:
    model: ai/all-minilm
    runtime_flags: ["--embeddings"]
```
- Auto-injected env vars (`AI_MODEL_URL`, `AI_MODEL_NAME`)
- Same Compose works with DMR (local) or cloud providers
- Platform portability built in
