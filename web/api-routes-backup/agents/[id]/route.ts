export const dynamic = "force-static"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

const API_URL = getBackendApiUrl()

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

    // Ownership check: verify the requesting user owns this agent
    const ownedAgent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id }
    })
    if (!ownedAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const API_KEY = getInternalApiKey()

    const response = await fetch(`${API_URL}/api/agents/${agentId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        )
      }
      throw new Error(`Backend returned ${response.status}`)
    }

    const agent = await response.json()

    return NextResponse.json({
      agent,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}
