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
    { id: 'atlas',      name: 'Atlas',      role: 'orchestrator', status: 'active',  x: 400, y: 300, load: 72, memory: 58 },
    { id: 'watchtower', name: 'Watchtower', role: 'monitor',     status: 'active',  x: 200, y: 150, load: 18, memory: 22 },
    { id: 'djbot',      name: 'DJ Bot',     role: 'specialist',  status: 'active',  x: 600, y: 150, load: 44, memory: 61 },
    { id: 'swarm1',     name: 'Swarm-1',   role: 'worker',      status: 'idle',    x: 200, y: 450, load:  3, memory: 12 },
    { id: 'swarm2',     name: 'Swarm-2',   role: 'worker',      status: 'active',  x: 600, y: 450, load: 55, memory: 38 },
  ]

  const edges = [
    { id: 'e1', from: 'atlas',      to: 'watchtower', strength: 0.8 },
    { id: 'e2', from: 'atlas',      to: 'djbot',      strength: 0.7 },
    { id: 'e3', from: 'atlas',      to: 'swarm1',     strength: 0.5 },
    { id: 'e4', from: 'atlas',      to: 'swarm2',     strength: 0.6 },
    { id: 'e5', from: 'watchtower', to: 'swarm1',     strength: 0.4 },
    { id: 'e6', from: 'watchtower', to: 'swarm2',     strength: 0.5 },
  ]

  return NextResponse.json({
    nodes,
    edges,
    timestamp: new Date().toISOString(),
  })
}
