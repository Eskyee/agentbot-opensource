import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'
import { deleteRailwayService, resolveRailwayService } from '@/app/lib/railway-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const API_URL = getBackendApiUrl()
  const API_KEY = getInternalApiKey()
  try {
    const session = await getAuthSession()
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

    // Strip sensitive fields before returning to client
    if (agent?.config) {
      const { authToken, ...safeConfig } = agent.config
      agent.config = safeConfig
    }
    if (agent?.authToken) {
      delete agent.authToken
    }

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

/**
 * PATCH /api/agents/:id
 * Rename an agent (updates name in Prisma + notifies backend if reachable)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params
    const body = await request.json()
    const newName = (body.name || '').trim()

    if (!newName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (newName.length > 64) {
      return NextResponse.json({ error: 'Name too long (max 64 chars)' }, { status: 400 })
    }

    // Ownership check
    const existing = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Update in Prisma
    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: { name: newName },
      select: { id: true, name: true, status: true, updatedAt: true }
    })

    // Best-effort: notify backend of name change (non-fatal if unreachable)
    try {
      const API_URL = getBackendApiUrl()
      const API_KEY = getInternalApiKey()
      if (API_URL && API_KEY) {
        await fetch(`${API_URL}/api/agents/${agentId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
          signal: AbortSignal.timeout(4000),
        })
      }
    } catch {
      // Non-fatal — Prisma is the source of truth for name
    }

    return NextResponse.json({ success: true, agent: updated })
  } catch (error) {
    console.error('Failed to rename agent:', error)
    return NextResponse.json({ error: 'Failed to rename agent' }, { status: 500 })
  }
}

/**
 * DELETE /api/agents/:id
 * Stops and removes the Docker container, deletes backend metadata, and
 * removes the Prisma Agent record (cascades to AgentMemory, AgentFile, etc.)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params

    // Ownership check — Agent table row OR openclawInstanceId on User
    const ownedAgent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })
    const userOwnsViaInstanceId = !ownedAgent && await prisma.user.findFirst({
      where: { id: session.user.id, openclawInstanceId: agentId },
      select: { id: true },
    })
    if (!ownedAgent && !userOwnsViaInstanceId) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Best-effort: delete the Railway service (stops and removes the container permanently)
    try {
      const openclawUrl = ownedAgent
        ? (ownedAgent as { openclawUrl?: string | null }).openclawUrl ?? undefined
        : (await prisma.user.findUnique({ where: { id: session.user.id }, select: { openclawUrl: true } }))?.openclawUrl ?? undefined
      const railwayService = await resolveRailwayService({ agentId, openclawUrl })
      await deleteRailwayService(railwayService.id)
    } catch {
      // Non-fatal — Railway service may not exist; proceed with DB cleanup
    }

    // Delete Agent row if it exists (cascades to memory, files, skills, etc.)
    if (ownedAgent) {
      await prisma.agent.delete({ where: { id: agentId } })
    }

    // Always clear openclaw fields on User so they can re-provision
    await prisma.user.update({
      where: { id: session.user.id },
      data: { openclawInstanceId: null, openclawUrl: null },
    })

    return NextResponse.json({ success: true, deleted: agentId })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic';