# Public vs Private Classification
_Created: 2026-04-11 04:29 GMT — Atlas_

## ✅ PUBLIC (Extract for SDK)

### Agent Runtime Contract
| File | Why Public |
|------|-----------|
| `agent-definition.ts` | Generic AgentDefinition interface (name, description, model, tools, permissions, instruction). Clean markdown+YAML frontmatter parser. |
| `agent-definition.test.ts` | Tests for the parser — shows public devs how it works |
| `definitions/coder.md` | Canonical example: full-stack coding agent |
| `definitions/researcher.md` | Canonical example: research agent |
| `definitions/writer.md` | Canonical example: content writer agent |
| `index.ts` | Clean exports for the agent module |

### Orchestration Engine
| File | Why Public |
|------|-----------|
| `tool-classifier.ts` | Generic tool concurrency classification (readonly vs mutating). Based on Claude Code pattern. |
| `batch-partitioner.ts` | Groups tools into parallel/serial batches. Generic algorithm. |
| `concurrent-executor.ts` | Executes batches (Promise.all for parallel, serial for writes). Generic. |
| `orchestration.test.ts` | Tests showing how orchestration works |
| `index.ts` | Clean module exports |

### Hooks (Generic Parts)
| File | Why Public |
|------|-----------|
| `agent-template.yaml` | Generic agent config template. Shows permission hooks integration. |
| `pre-tool-use.sh` | Generic hook script pattern for permission checks |

### Skills (Generic Channel Plugins — as examples)
| File | Why Public |
|------|-----------|
| `add-discord.md` | Generic Discord integration guide — good plugin example |
| `add-telegram.md` | Generic Telegram integration guide |
| `add-whatsapp.md` | Generic WhatsApp integration guide |
| `add-botid.md` | Generic bot ID integration |

---

## 🔒 PRIVATE (Stays in agentbot-cloud)

### Agent Definitions (Internal Roles)
| File | Why Private |
|------|------------|
| `agentbot-ceo.md` | Internal org role — proprietary |
| `agentbot-cfo.md` | Internal org role — proprietary |
| `agentbot-cto.md` | Internal org role — proprietary |
| `agentbot-cmo.md` | Internal org role — proprietary |
| `agentbot-cxo.md` | Internal org role — proprietary |
| `agentbot-docs.md` | Internal docs agent — proprietary |

### Skills (Platform-Specific)
| File | Why Private |
|------|------------|
| `moltx.md` (44KB) | Proprietary social platform integration — THE SAUCE |
| `engage-moltx.md` | Proprietary social engagement strategy |
| `basefm-dj-streaming.js` | Adjacent product (baseFM) — not Agentbot ecosystem |
| `basefm-dj-streaming.md` | Adjacent product |
| `bankr.md` | Platform-specific wallet integration |
| `agentbot-docs.md` | Internal docs |
| `chat-sdk.md` | Internal SDK integration |
| `code-review.md` | Internal code review process |
| `stateful-agents.md` | Internal stateful agent architecture |
| `sentry-cli.md` | Internal monitoring |
| `docker-containers.md` | Internal Docker management |
| `deploy-cli.md` | Internal deployment |
| `setup-agentbot.md` | Internal setup |
| `monetize-service.md` | Internal monetization strategy |
| `readiness-assessment.md` | Internal readiness checks |
| `debug-agentbot.md` | Internal debugging |

### Hooks (Proprietary Integration)
| File | Why Private |
|------|------------|
| `ws-handler.ts` | Proprietary WebSocket integration with Agentbot backend |
| `index.ts` | References proprietary API endpoints |

### Orchestration (Implementation Details)
| File | Why Private |
|------|------------|
| `tool-executor.ts` | May contain backend-specific API calls — review before deciding |
| `tool-executor.test.ts` | Tests for above |

---

## 📋 Extraction Checklist

### Phase 1: Public SDK Foundation
- [ ] Extract AgentDefinition interface → `packages/sdk/src/agent/definition.ts`
- [ ] Extract markdown+YAML parser → `packages/sdk/src/agent/parser.ts`
- [ ] Extract agent definitions as examples → `examples/`
- [ ] Extract orchestration core → `packages/sdk/src/orchestration/`
- [ ] Extract hook template pattern → `packages/sdk/src/hooks/`

### Phase 2: Public CLI
- [ ] Create `packages/cli/` with init/dev/test/bundle commands

### Phase 3: Public Plugins
- [ ] Extract channel integration patterns → `packages/plugins/discord/`, etc.

### Phase 4: Docs
- [ ] Write getting-started guide
- [ ] Write agent spec documentation
- [ ] Write tool interface documentation
- [ ] Write deployment guide (self-host + Agentbot Cloud)

---

## ⚠️ Review Needed
- `tool-executor.ts` — read full source before classifying
- `permission-handler.ts` — likely tenancy-specific, probably private
- `tiered-classifier.ts` — likely tenancy-specific, probably private
- Skills symlinked from `.agents/skills/` — those are OpenClaw ecosystem, not ours
