---
name: chat-sdk
description: Build multi-platform chat bots with Chat SDK. Use when agents need to connect to Slack, Teams, Google Chat, Discord, GitHub, or Linear. Triggers on "chat sdk", "chat bot", "multi-platform bot", "unified messaging".
---

# Chat SDK — Unified Multi-Platform Chat Bots

Build chat bots that work across Slack, Teams, Google Chat, Discord, GitHub, and Linear using a single TypeScript SDK. Write bot logic once, deploy everywhere.

## When to Use

- Agent needs to respond on multiple chat platforms simultaneously
- Building slash commands, reactions, interactive cards, or modals
- Streaming AI responses to chat platforms in real-time
- Setting up webhook handlers for chat platforms

## Quick Start

```bash
npm install chat @chat-adapter/slack @chat-adapter/discord @chat-adapter/state-redis
```

```typescript
import { Chat } from 'chat'
import { createSlackAdapter } from '@chat-adapter/slack'
import { createDiscordAdapter } from '@chat-adapter/discord'
import { createRedisState } from '@chat-adapter/state-redis'

const bot = new Chat({
  userName: 'my-agent',
  adapters: {
    slack: createSlackAdapter({
      botToken: process.env.SLACK_BOT_TOKEN!,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
    }),
    discord: createDiscordAdapter({
      token: process.env.DISCORD_BOT_TOKEN!,
      applicationId: process.env.DISCORD_APP_ID!,
    }),
  },
  state: createRedisState({ url: process.env.REDIS_URL! }),
})

bot.onNewMention(async thread => {
  await thread.subscribe()
  await thread.post("Hello! I'm listening to this thread.")
})

bot.onSubscribedMessage(async (thread, message) => {
  await thread.post(`You said: ${message.text}`)
})
```

## Event Handlers

| Handler | Trigger |
|---------|---------|
| `onNewMention` | Bot @-mentioned in unsubscribed thread |
| `onSubscribedMessage` | Any message in subscribed thread |
| `onNewMessage(regex)` | Messages matching pattern |
| `onSlashCommand("/cmd")` | Slash command invocations |
| `onReaction(emojis)` | Emoji reactions added/removed |
| `onAction(actionId)` | Button clicks and dropdown selections |

## AI Streaming

```typescript
import { ToolLoopAgent } from 'ai'
const agent = new ToolLoopAgent({ model: 'anthropic/claude-4.5-sonnet' })

bot.onNewMention(async (thread, message) => {
  const result = await agent.stream({ prompt: message.text })
  await thread.post(result.textStream)
})
```

## Interactive Cards (JSX)

Set `jsxImportSource: "chat"` in tsconfig:

```tsx
await thread.post(
  <Card>
    <CardText>Your order has been received!</CardText>
    <Actions>
      <Button actionId="approve">Approve</Button>
      <Button actionId="reject">Reject</Button>
    </Actions>
  </Card>
)
```

## Packages

| Package | Purpose |
|---------|---------|
| `chat` | Core SDK |
| `@chat-adapter/slack` | Slack |
| `@chat-adapter/teams` | Microsoft Teams |
| `@chat-adapter/gchat` | Google Chat |
| `@chat-adapter/discord` | Discord |
| `@chat-adapter/github` | GitHub Issues |
| `@chat-adapter/linear` | Linear Issues |
| `@chat-adapter/state-redis` | Redis state (production) |
| `@chat-adapter/state-memory` | In-memory state (development) |

## Webhook Setup (Next.js API Route)

```typescript
// app/api/chat/slack/route.ts
import { bot } from '@/lib/chat-bot'

export async function POST(req: Request) {
  return bot.webhooks.slack(req)
}
```

## Agentbot Integration

Wire the Chat SDK into an OpenClaw agent container:
1. Install packages in the agent's Docker image
2. Set platform tokens as environment variables via the agent config
3. Expose webhook routes through the agent's HTTP server
4. Use Redis state adapter for persistence across container restarts

_Adapted from [Kilo-Org/cloud](https://github.com/Kilo-Org/cloud/tree/main/.agents/skills/chat-sdk) for Agentbot._
