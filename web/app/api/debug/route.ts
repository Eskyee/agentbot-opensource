import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

const ALLOWED_COMMANDS = [
  'gateway.restart',
  'openclaw.doctor',
  'openclaw.logs.tail',
  'openclaw.status',
  'openclaw.config.show',
  'openclaw.memory.stats',
  'openclaw.skills.list',
  'openclaw.channels.status',
  'openclaw.cron.list',
  'openclaw.version',
] as const

type CommandName = (typeof ALLOWED_COMMANDS)[number]

const SIMULATED_RESPONSES: Record<CommandName, string> = {
  'gateway.restart': `[gateway] Stopping agent gateway...
[gateway] PID 18432 terminated
[gateway] Waiting for port 8080 to release...
[gateway] Starting agent gateway v2026.3.23
[gateway] Gateway listening on 0.0.0.0:8080
[gateway] Health check passed
[gateway] Gateway restarted successfully`,

  'openclaw.doctor': `OpenClaw Health Diagnostic — v2026.3.23
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Node.js runtime          v25.8.1
✓ Gateway connection       OK (12ms)
✓ Database                 connected (3ms)
✓ Redis                    connected (1ms)
✓ Memory heap              142MB / 512MB
✓ Active channels          3/3
✓ Cron scheduler           running
✓ Last heartbeat           2m ago
✓ Token budget             23,400 / 100,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All systems operational. No issues detected.`,

  'openclaw.logs.tail': `2026-03-27T15:28:01Z [INFO] Gateway heartbeat OK
2026-03-27T15:28:12Z [INFO] Telegram channel: message received
2026-03-27T15:28:12Z [INFO] Processing message from user:raveculture
2026-03-27T15:28:13Z [INFO] Model call: openrouter/auto (342 tokens)
2026-03-27T15:28:14Z [INFO] Response sent via telegram (1.2s)
2026-03-27T15:28:30Z [INFO] Cron: daily-brief triggered
2026-03-27T15:28:31Z [INFO] Cron: daily-brief completed (890ms)
2026-03-27T15:29:01Z [INFO] Gateway heartbeat OK
2026-03-27T15:29:15Z [WARN] Rate limit approaching: 82% of daily token budget
2026-03-27T15:29:30Z [INFO] Websocket client connected: device-7f3a
2026-03-27T15:29:45Z [INFO] Memory: compaction completed (freed 12MB)
2026-03-27T15:30:01Z [INFO] Gateway heartbeat OK`,

  'openclaw.status': `OpenClaw Agent Status
━━━━━━━━━━━━━━━━━━━━━━
Version:     2026.3.23
Uptime:      3d 14h 22m
Status:      ACTIVE
Model:       openrouter/auto
Fallback:    openrouter/anthropic/claude-3.5-sonnet
Channels:    telegram ✓ | discord ✗ | webchat ✓
Memory:      847 / 1000 entries
Token budget: 23,400 / 100,000 (23.4%)
Heartbeat:   every 30m (next in 2m)
Cron jobs:   4 active
Skills:      12 installed`,

  'openclaw.config.show': `{
  "version": "2026.3.23",
  "model": {
    "default": "openrouter/auto",
    "fallbacks": ["openrouter/anthropic/claude-3.5-sonnet"]
  },
  "channels": {
    "telegram": { "enabled": true },
    "discord": { "enabled": false },
    "webchat": { "enabled": true }
  },
  "memory": { "maxEntries": 1000, "ttlDays": 90 },
  "cron": { "heartbeatIntervalMinutes": 30 },
  "safety": { "maxTokensPerDay": 100000, "allowedDomains": [] }
}`,

  'openclaw.memory.stats': `Memory Store Statistics
━━━━━━━━━━━━━━━━━━━━━━
Total entries:     847 / 1,000
Oldest entry:      2026-01-15 (71 days ago)
Newest entry:      2026-03-27T15:29:45Z
TTL:               90 days
Expired (pending):  23 entries
Size on disk:      4.2 MB
Avg entry size:    5.1 KB

Namespaces:
  basefm       → 312 entries
  agentbot     → 398 entries
  raveculture  → 114 entries
  (global)     → 23 entries`,

  'openclaw.skills.list': `Installed Skills (12)
━━━━━━━━━━━━━━━━━━━━━
  ✓ apple-notes        v1.2.0   — Read/write Apple Notes
  ✓ apple-reminders    v1.1.0   — Manage Apple Reminders
  ✓ bear-notes          v1.0.0   — Bear note integration
  ✓ clawhub             v2.0.0   — OpenClaw skill registry
  ✓ github              v1.5.0   — GitHub API operations
  ✓ healthcheck         v1.0.0   — System health checks
  ✓ himalaya            v1.3.0   — Email via CLI
  ✓ imsg                v2.1.0   — iMessage integration
  ✓ things-mac          v1.1.0   — Things 3 task manager
  ✓ weather             v1.0.0   — Weather forecasts
  ✓ xurl                v1.0.0   — X/Twitter operations
  ✓ gifgrep             v1.0.0   — GIF search & send`,

  'openclaw.channels.status': `Channel Connection Status
━━━━━━━━━━━━━━━━━━━━━━━━
telegram   ✓ CONNECTED    Bot: @AgentBotHQ
           Last msg: 2m ago | Uptime: 3d 14h
           Sent today: 47 | Received: 38

discord    ✗ DISABLED     Not configured

webchat    ✓ CONNECTED    Endpoint: /chat
           Last msg: 5m ago | Uptime: 3d 14h
           Sessions active: 2

imsg       ✓ CONNECTED    iMessage relay active
           Last msg: 1h ago | Uptime: 3d 14h`,

  'openclaw.cron.list': `Scheduled Cron Jobs (4 active)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAME                  SCHEDULE       LAST RUN          STATUS
daily-brief           0 8 * * *     2026-03-27 08:00  ✓ OK
heartbeat             */30 * * * *  2026-03-27 15:30  ✓ OK
memory-cleanup        0 3 * * *     2026-03-27 03:00  ✓ OK (freed 12MB)
token-budget-reset    0 0 * * *     2026-03-27 00:00  ✓ OK`,

  'openclaw.version': `OpenClaw — Agent Runtime
━━━━━━━━━━━━━━━━━━━━━━
Version:     2026.3.23
Build:       20260323-1
Node:        v25.8.1
Platform:    darwin arm64
Docker:      ghcr.io/openclaw/openclaw:2026.3.13-1
API:         v2
Gateway:     v2026.3.23
Skills:      v2 manifest

Components:
  Core:      2026.3.23
  Gateway:   2026.3.23
  Scheduler: 2026.3.23
  Memory:    2026.3.23
  Channels:  2026.3.23`,
}

export async function POST(req: Request) {
  // Admin-only — same guard as debug-db and debug-oauth
  const session = await getAuthSession()
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { command, agentId } = body

    if (!command || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields: command, agentId' },
        { status: 400 }
      )
    }

    if (!ALLOWED_COMMANDS.includes(command as CommandName)) {
      return NextResponse.json(
        { error: `Command "${command}" is not in the allowlist` },
        { status: 400 }
      )
    }

    // Simulate execution delay (200–800ms)
    const duration = Math.floor(Math.random() * 600) + 200
    await new Promise(resolve => setTimeout(resolve, duration))

    const output = SIMULATED_RESPONSES[command as CommandName]

    return NextResponse.json({
      command,
      output,
      exitCode: 0,
      duration,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
