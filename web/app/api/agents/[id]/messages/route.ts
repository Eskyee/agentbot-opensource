import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params

    // Ownership check
    const ownedAgent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id }
    })
    if (!ownedAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Mock messages - replace with real messages from backend
    const messages = Array.from({ length: Math.min(limit, 100) }).map((_, i) => ({
      id: `msg-${offset + i}`,
      agentId,
      sender: i % 2 === 0 ? 'user' : 'agent',
      content: i % 2 === 0
        ? `User message ${offset + i + 1}`
        : `Agent response to message ${offset + i}`,
      timestamp: new Date(Date.now() - (offset + i) * 60000).toISOString(),
      platform: ['telegram', 'discord', 'whatsapp'][i % 3],
    }))

    return NextResponse.json({
      messages,
      total: offset + messages.length,
      limit,
      offset,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', messages: [] },
      { status: 500 }
    )
  }
}
