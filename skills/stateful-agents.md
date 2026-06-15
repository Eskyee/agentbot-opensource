---
name: stateful-agents
description: Build stateful agent coordination patterns. Use when agents need persistent state, real-time coordination, scheduled tasks, or multi-agent collaboration. Triggers on "stateful agent", "agent state", "coordination", "agent-to-agent", "scheduled tasks", "persistent agent".
---

# Stateful Agents — Coordination & Persistence Patterns

Build agents that maintain state across restarts, coordinate with other agents, and run scheduled background tasks.

## When to Use

| Need | Example |
|------|---------|
| Persistent memory | Agent remembers conversation history across restarts |
| Coordination | Multiple agents collaborating on a task |
| Strong consistency | Booking systems, inventory, deal negotiation |
| Scheduled work | Recurring reports, subscription renewals, content scheduling |
| Real-time sync | Agent fleet status updates, live dashboards |

## State Management with Prisma

```typescript
import { prisma } from '@/app/lib/prisma'

// Store agent state (survives container restarts)
async function saveAgentState(agentId: string, key: string, value: any) {
  await prisma.agentState.upsert({
    where: { agentId_key: { agentId, key } },
    update: { value: JSON.stringify(value), updatedAt: new Date() },
    create: { agentId, key, value: JSON.stringify(value) },
  })
}

// Retrieve agent state
async function getAgentState(agentId: string, key: string) {
  const row = await prisma.agentState.findUnique({
    where: { agentId_key: { agentId, key } },
  })
  return row ? JSON.parse(row.value) : null
}
```

## Agent-to-Agent Messaging (Bus)

The agent bus enables SSRF-protected webhook delivery between agents:

```typescript
// Send message to another agent
await fetch(`${BACKEND_URL}/api/bus/send`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${AGENT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'agent-456',
    type: 'negotiation.offer',
    payload: { amount: 500, currency: 'USDC', terms: '50/50 split' },
  }),
})
```

## Scheduled Tasks

Use cron-style scheduling for recurring agent work:

```typescript
// In agent container — schedule with node-cron
import cron from 'node-cron'

// Daily report at 9am
cron.schedule('0 9 * * *', async () => {
  const stats = await gatherDailyStats(agentId)
  await postToChannel(stats)
})

// Every 5 minutes — health ping
cron.schedule('*/5 * * * *', async () => {
  await reportHealth(agentId)
})
```

## Coordination Patterns

### Leader Election
```typescript
// Use DB-backed locking for leader election
const lock = await prisma.agentLock.upsert({
  where: { taskId: 'daily-report' },
  update: { agentId, expiresAt: new Date(Date.now() + 60_000) },
  create: { taskId: 'daily-report', agentId, expiresAt: new Date(Date.now() + 60_000) },
})
if (lock.agentId === agentId) {
  // I'm the leader — execute the task
}
```

### Deal Negotiation
```typescript
// Agent-to-agent negotiation via the negotiation service
const deal = await negotiationService.propose({
  from: agentA,
  to: agentB,
  terms: { split: '60/40', amount: 1000, currency: 'USDC' },
})
// agentB receives via bus, can accept/counter/reject
```

## Anti-Patterns

| Anti-Pattern | Why | Fix |
|-------------|-----|-----|
| In-memory state only | Lost on restart | Use Prisma/PostgreSQL |
| Direct HTTP between agents | SSRF risk, no auth | Use the agent bus |
| Global mutable variables | Race conditions | DB-backed atomic operations |
| Polling for state changes | Wasteful | Use webhooks or bus events |
| No TTL on locks | Deadlocks if agent crashes | Always set `expiresAt` |

## SQLite + Drizzle ORM (Per-Agent Local DB)

For agents that need fast local storage with schema migrations:

```typescript
// src/db/sqlite-schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadId: text('thread_id').notNull(),
  message: text('message').notNull(),
  role: text('role').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/sqlite-schema.ts',
  out: './drizzle',
})
```

```bash
# Generate migration
pnpm drizzle-kit generate

# Migrations auto-apply on agent startup via blockConcurrencyWhile
```

Migrations apply per-agent on first access after deploy. Each agent has its own isolated SQLite database.

_Adapted from [Kilo-Org/cloud](https://github.com/Kilo-Org/cloud/tree/main/.agents/skills/durable-objects) Durable Objects and [do-sqlite-drizzle](https://github.com/Kilo-Org/cloud/blob/main/docs/do-sqlite-drizzle.md) for Agentbot._
