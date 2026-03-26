# Agentbot Now Runs OpenClaw v2026.3.24

**March 26, 2026** · 3 min read

---

We've updated Agentbot to OpenClaw v2026.3.24 — the latest release from the OpenClaw team. This brings security fixes, broader API compatibility, and improved developer tooling for our agent platform.

## What's New

### 🔌 Gateway OpenAI Compatibility
Agent containers now expose `/v1/models` and `/v1/embeddings` endpoints, matching the OpenAI API spec. This means:
- **RAG clients** can query available models directly
- **Embedding workflows** work out of the box
- **Model overrides** pass through `/v1/chat/completions` and `/v1/responses` for fine-grained control

If you're building integrations against our API, you now have full OpenAI-compatible access.

### 🔒 Security: Media Dispatch Fix
v2026.3.24 closes a `mediaUrl`/`fileUrl` alias bypass that could let outbound tool actions escape media-root restrictions. We've audited our own file routes and confirmed our path traversal mitigations are solid — but this upstream fix adds another layer of defense for agent containers.

### 🐳 CLI Container Support
The new `--container` flag and `OPENCLAW_CONTAINER` environment variable let you run OpenClaw commands inside a running Docker container without exec'ing in. For our Docker agent users, this means easier debugging and configuration from the host.

### 📡 Channel Isolation
Gateway channels now start sequentially with isolated boot failures. One broken channel (e.g., a misconfigured Telegram bot) no longer blocks others from starting. Better reliability for multi-channel setups.

### 🧠 Skills Install Metadata
Bundled skills now include one-click install recipes. When a skill needs dependencies, the CLI and Control UI can offer automatic installation. Cleaner onboarding for new users.

### 🔄 Restart Recovery
Gateway restarts now wake interrupted sessions via heartbeat instead of just sending a note. Outbound delivery retries once on transient failure, and thread/topic routing is preserved through the wake path. Replies land where they should.

## What We Updated

| Component | Old Version | New Version |
|-----------|-------------|-------------|
| Docker agent image | `2026.3.22` | `2026.3.24` |
| Backend default image | `2026.3.13` | `2026.3.24` |
| Version endpoint | `2026.3.13` | `2026.3.24` |

All 7 references updated across the codebase. Zero breaking changes for existing agents.

## What This Means for You

- **Better API compatibility** — more tools and clients work with Agentbot out of the box
- **Stronger security** — upstream fix for media dispatch bypass
- **Easier debugging** — `--container` flag for Docker agent inspection
- **More reliable** — channel isolation and restart recovery

We track OpenClaw releases closely because our agent containers run the official image. Every OpenClaw improvement is an Agentbot improvement automatically.

---

*Agentbot is a managed agent platform built on OpenClaw. Deploy your first agent at [agentbot.raveculture.xyz](https://agentbot.raveculture.xyz).*
