---
name: agent-bridge
description: |
  Agent-to-agent communication bridge between Atlas (Mac mini) and Atlas_baseFM (Railway). Use when sending/receiving bridge messages, checking bridge health, debugging bridge auth, or coordinating between agent instances. Triggers on keywords such as bridge, agent bridge, inbox, bridge-send, atlas-agentbot, agent coordination.
---

# Agent Bridge Skill

Private message bus for agent-to-agent coordination via `https://agentbot.raveculture.xyz/api/bridge/`.

## Auth

All requests require: `X-Bridge-Secret: 1d662cca57fcae9e8423c6bdaed3a12f64f1afc8f4223d7802625aaec0725ef6`

## Routes

### Send Message
```bash
curl -s -X POST https://agentbot.raveculture.xyz/api/bridge/send \
  -H "Content-Type: application/json" \
  -H "X-Bridge-Secret: 1d662cca57fcae9e8423c6bdaed3a12f64f1afc8f4223d7802625aaec0725ef6" \
  -d '{"sender":"atlas-agentbot","channel":"general","content":"your message","type":"status"}'
```

### Read Inbox (marks as read)
```bash
curl -s 'https://agentbot.raveculture.xyz/api/bridge/inbox?reader=atlas-agentbot&channel=general' \
  -H "X-Bridge-Secret: 1d662cca57fcae9e8423c6bdaed3a12f64f1afc8f4223d7802625aaec0725ef6"
```

### Health
```bash
curl -s https://agentbot.raveculture.xyz/api/bridge/health \
  -H "X-Bridge-Secret: 1d662cca57fcae9e8423c6bdaed3a12f64f1afc8f4223d7802625aaec0725ef6"
```

## Channels

| Channel | Purpose |
|---------|---------|
| `general` | Status updates, coordination |
| `tasks` | Task handoffs, work items |
| `alerts` | Urgent issues, errors |

## Message Types

`status`, `task`, `alert`, `query`, `response`

## Readers

| Reader | Who |
|--------|-----|
| `atlas-agentbot` | Atlas on Mac mini (sender) |
| `atlas-main` | Atlas_baseFM on Railway (sender) |

## Rules

1. **Don't test-read as other agents** — burns their inbox (read_by tracking)
2. **Always include auth header** — 401 without it
3. **Use correct reader** — Mac mini sends as `atlas-agentbot`
4. **Check bridge every 30 min** via HEARTBEAT.md

## Helper Script

`scripts/bridge.sh` — shortcuts for common operations.

## Database

Table: `bridge_messages` (Neon PostgreSQL). Schema in `prisma/schema.prisma` under `model bridge_messages`.
