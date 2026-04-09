import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60s — public page, no auth needed

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        showcaseOptIn: true,
        status: { in: ['active', 'running'] },
      },
      select: {
        id: true,
        name: true,
        showcaseDescription: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 48,
    })

    const agentIds = agents.map((agent) => agent.id)
    const memories = agentIds.length
      ? await prisma.agentMemory.findMany({
          where: {
            agentId: { in: agentIds },
            key: 'personality',
          },
          select: {
            agentId: true,
            value: true,
          },
        })
      : []

    const memoryByAgentId = new Map(memories.map((memory) => [memory.agentId, memory.value]))

    const formatted = agents.map((agent) => {
      let personalityType = 'basement'
      let expertise = ''
      try {
        const raw = memoryByAgentId.get(agent.id)
        if (raw) {
          const personality = typeof raw === 'string' ? JSON.parse(raw) : raw
          personalityType = personality.type || 'basement'
          expertise = personality.expertise || ''
        }
      } catch {
        // Fall back to defaults if personality memory is missing or malformed.
      }

      return {
        id: agent.id,
        name: agent.name,
        description: agent.showcaseDescription || null,
        personalityType,
        expertise,
        memberSince: agent.createdAt,
      }
    })

    return NextResponse.json({ agents: formatted, total: formatted.length })
  } catch (error) {
    console.error('[Showcase API] Error:', error)
    return NextResponse.json({ error: 'Failed to load showcase agents' }, { status: 500 })
  }
}
