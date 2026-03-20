export const dynamic = "force-static"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

// Mock fleet graph — replace with real backend query when openclaw backend is live
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nodes = [
    { id: 'atlas',      name: 'Atlas',      type: 'coordinator', status: 'active',  x: 400, y: 300, load: 72, memory: 58 },
    { id: 'watchtower', name: 'Watchtower', type: 'monitor',     status: 'active',  x: 200, y: 150, load: 18, memory: 22 },
    { id: 'djbot',      name: 'DJ Bot',     type: 'specialist',  status: 'active',  x: 600, y: 150, load: 44, memory: 61 },
    { id: 'swarm1',     name: 'Swarm-1',   type: 'worker',      status: 'idle',    x: 200, y: 450, load:  3, memory: 12 },
    { id: 'swarm2',     name: 'Swarm-2',   type: 'worker',      status: 'active',  x: 600, y: 450, load: 55, memory: 38 },
  ]

  const edges = [
    { id: 'e1', source: 'atlas',      target: 'watchtower', type: 'monitors' },
    { id: 'e2', source: 'atlas',      target: 'djbot',      type: 'delegates' },
    { id: 'e3', source: 'atlas',      target: 'swarm1',     type: 'delegates' },
    { id: 'e4', source: 'atlas',      target: 'swarm2',     type: 'delegates' },
    { id: 'e5', source: 'watchtower', target: 'swarm1',     type: 'monitors' },
    { id: 'e6', source: 'watchtower', target: 'swarm2',     type: 'monitors' },
  ]

  return NextResponse.json({
    nodes,
    edges,
    timestamp: new Date().toISOString(),
  })
}
