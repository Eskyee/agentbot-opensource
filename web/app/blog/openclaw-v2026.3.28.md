# Agentbot Now Runs OpenClaw v2026.3.28

**March 29, 2026** · 4 min read

---

We've updated Agentbot to OpenClaw v2026.3.28 — the largest release since 3.24. This brings tool approval gates, xAI web search, MiniMax image generation, ACP channel binds, and over 60 fixes across every major platform integration.

## What's New

### 🔐 Tool Approval Gates
Plugins can now attach `requireApproval` to `before_tool_call` hooks, pausing agent tool execution until the user approves via the exec overlay, Telegram buttons, Discord interactions, or the `/approve` command. Agents ask before they act.

### 🔍 xAI Web Search + Grok
Grok now has first-class `x_search` web search built in. The bundled xAI provider moves to the Responses API, and `x_search` setup is offered automatically during onboarding — including a model picker with the shared xAI key.

### 🎨 MiniMax Image Generation
The `image-01` model is now available for generate and image-to-image editing with aspect ratio control. The MiniMax model catalog is trimmed to M2.7 — legacy M2, M2.1, M2.5, and VL-01 are removed.

### 📡 ACP Channel Binds
Discord, BlueBubbles, and iMessage now support current-conversation ACP binds. Run `/acp spawn codex --bind here` to turn any active chat into a Codex-backed workspace — no child thread needed.

### 📎 Slack File Uploads
New explicit `upload-file` action routes file uploads through the Slack upload transport with optional filename, title, and comment overrides. Microsoft Teams and Google Chat get the same unified file-send action.

### 🐳 Podman Rootless Support
Container setup simplified around the current rootless user. Launch helper installs to `~/.local/bin` and the `openclaw --container <name>` host-CLI workflow is now documented.

## Breaking Changes

- **Qwen portal auth removed.** The deprecated `qwen-portal-auth` OAuth integration is gone. Migrate: `openclaw onboard --auth-choice modelstudio-api-key`
- **Old config migrations dropped.** Automatic migrations older than two months are removed. Very old legacy keys now fail validation — run `openclaw doctor` to fix.

## What We Updated

| Component | Old Version | New Version |
|-----------|-------------|-------------|
| Docker agent image | `2026.3.24` | `2026.3.28` |
| Backend default image | `2026.3.24` | `2026.3.28` |
| Version endpoint | `2026.3.24` | `2026.3.28` |
| Footer version | `2026.3.23` | `2026.3.28` |

## Key Fixes

- **Rate-limit cooldowns** scoped per model — one 429 no longer blocks every model on the same auth profile
- **WhatsApp echo loop** fixed — bot replies no longer re-enter as inbound messages in self-chat DM mode
- **Discord reconnect loop** fixed — stale gateway sockets drained before fresh reconnects
- **Gemini 3.1** pro, flash, and flash-lite models resolved correctly across all Google provider aliases
- **Anthropic stop reasons** like `sensitive` now return structured errors instead of crashing the agent run
- 60+ additional fixes across Telegram, Feishu, Mattermost, Teams, iMessage, ACP, and plugins

Every OpenClaw improvement rolls out automatically to all Agentbot agents. No action needed — your agents are already on v2026.3.28.

---

*Agentbot is a managed agent platform built on OpenClaw. Deploy your first agent at [agentbot.raveculture.xyz](https://agentbot.raveculture.xyz).*
