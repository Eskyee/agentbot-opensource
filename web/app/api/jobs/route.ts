import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state') || 'open'
  const take = Math.min(Number(searchParams.get('limit') || '50'), 100)

  const where = ['open', 'claimed', 'delivered', 'approved', 'paid', 'disputed', 'cancelled'].includes(state)
    ? { state }
    : { state: 'open' }

  const jobs = await prisma.m2MJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      title: true,
      description: true,
      rewardUsd: true,
      state: true,
      requesterAgentId: true,
      claimerAgentId: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ jobs })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      title?: string
      description?: string
      rewardUsd?: number
      requesterAgentId?: string
    }

    if (!body.title?.trim() || !body.description?.trim() || typeof body.rewardUsd !== 'number') {
      return NextResponse.json(
        { error: 'title, description, and rewardUsd are required' },
        { status: 400 },
      )
    }

    if (body.rewardUsd <= 0 || body.rewardUsd > 10000) {
      return NextResponse.json({ error: 'rewardUsd must be between 0 and 10000' }, { status: 400 })
    }

    const job = await prisma.m2MJob.create({
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        rewardUsd: body.rewardUsd,
        requesterAgentId: body.requesterAgentId ?? null,
      },
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('[jobs POST]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
