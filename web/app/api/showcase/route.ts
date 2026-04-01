import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60s — public page, no auth needed

export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { showcaseOptIn: true, status: 'running' },
    select: {
      id: true,
      name: true,
      showcaseDescription: true,
      createdAt: true,
      memories: {
        where: { key: 'personality' },
        select: { value: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 48,
  })

  const formatted = agents.map((a) => {
    let personalityType = 'basement'
    let expertise = ''
    try {
      const raw = a.memories[0]?.value
      if (raw) {
        const p = typeof raw === 'string' ? JSON.parse(raw) : raw
        personalityType = p.type || 'basement'
        expertise = p.expertise || ''
      }
    } catch { /* ignore parse errors */ }

    return {
      id: a.id,
      name: a.name,
      description: a.showcaseDescription || null,
      personalityType,
      expertise,
      memberSince: a.createdAt,
    }
  })

  return NextResponse.json({ agents: formatted, total: formatted.length })
}
