import { NextRequest, NextResponse } from 'next/server'
import { proxyBitcoinRequest } from '@/app/api/bitcoin/lib/backend'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  return proxyBitcoinRequest('/api/underground/bitcoin/wallets')
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json()
  const agentId = typeof payload?.agentId === 'string' ? payload.agentId : ''

  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
  }

  const ownedAgent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      userId: session.user.id,
    },
    select: { id: true },
  })

  if (!ownedAgent) {
    return NextResponse.json({ error: 'Agent not found or not owned by you' }, { status: 403 })
  }

  return proxyBitcoinRequest('/api/underground/bitcoin/wallets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
