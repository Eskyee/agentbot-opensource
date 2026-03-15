import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

const TASK_POOL = [
  { type: 'tool_call',  label: 'fetch_calendar_events', agent: 'Atlas',      status: 'success' },
  { type: 'inference',  label: 'summarise_messages',    agent: 'Atlas',      status: 'success' },
  { type: 'monitor',    label: 'health_check',          agent: 'Watchtower', status: 'success' },
  { type: 'tool_call',  label: 'search_track_metadata', agent: 'DJ Bot',     status: 'success' },
  { type: 'inference',  label: 'generate_setlist',      agent: 'DJ Bot',     status: 'success' },
  { type: 'tool_call',  label: 'send_whatsapp_reply',   agent: 'Atlas',      status: 'success' },
  { type: 'tool_call',  label: 'query_database',        agent: 'Swarm-2',    status: 'success' },
  { type: 'inference',  label: 'classify_intent',       agent: 'Swarm-2',    status: 'success' },
  { type: 'monitor',    label: 'uptime_ping',           agent: 'Watchtower', status: 'success' },
  { type: 'tool_call',  label: 'update_memory',         agent: 'Atlas',      status: 'running' },
]

// Return a live-looking trace feed by randomising recency
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const tasks = TASK_POOL.map((t, i) => ({
    id: `trace-${now}-${i}`,
    ...t,
    duration: `${(50 + Math.random() * 400).toFixed(0)}ms`,
    startedAt: new Date(now - i * 4_000 - Math.random() * 2_000).toISOString(),
    tokens: t.type === 'inference' ? Math.floor(200 + Math.random() * 800) : null,
  }))

  return NextResponse.json(tasks)
}
