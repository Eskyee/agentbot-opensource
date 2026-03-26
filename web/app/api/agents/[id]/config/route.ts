import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

/**
 * Verify the authenticated user owns the agent. Returns null if unauthorized.
 */
async function verifyAgentOwnership(agentId: string) {
  const session = await getAuthSession()
  if (!session?.user?.id) return null
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: session.user.id }
  })
  return agent
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params

    const agent = await verifyAgentOwnership(agentId)
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const API_URL = getBackendApiUrl()
    const API_KEY = getInternalApiKey()
    const response = await fetch(`${API_URL}/api/agents/${agentId}/config`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent configuration not found' },
          { status: 404 }
        )
      }
      throw new Error(`Backend returned ${response.status}`)
    }

    const config = await response.json()

    return NextResponse.json({
      config,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch agent config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params

    const agent = await verifyAgentOwnership(agentId)
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const API_URL = getBackendApiUrl()
    const API_KEY = getInternalApiKey()
    const body = await request.json()

    const response = await fetch(`${API_URL}/api/agents/${agentId}/config`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const config = await response.json()

    return NextResponse.json({
      config,
      status: 'updated',
    })
  } catch (error) {
    console.error('Failed to update agent config:', error)
    return NextResponse.json(
      { error: 'Failed to update agent configuration' },
      { status: 500 }
    )
  }
}


export const dynamic = 'force-dynamic';