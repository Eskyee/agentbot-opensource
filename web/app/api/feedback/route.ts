import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

// Feedback loop: users correct agent behavior, agent learns
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agentId, type, message, correction, category } = await req.json()

    if (!message || !correction) {
      return NextResponse.json({ error: 'message and correction required' }, { status: 400 })
    }

    // Store feedback as user setting (memory entry)
    const feedback = {
      timestamp: new Date().toISOString(),
      type: type || 'correction',
      original: message,
      correction,
      category: category || 'general',
      userId: session.user.id,
      agentId: agentId || 'default',
    }

    // Save to user settings as a feedback entry
    await prisma.userSetting.create({
      data: {
        userId: session.user.id,
        key: `feedback:${Date.now()}`,
        value: JSON.stringify(feedback),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded. Agent will learn from this correction.',
      feedback,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Feedback error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const feedbacks = await prisma.userSetting.findMany({
    where: {
      userId: session.user.id,
      key: { startsWith: 'feedback:' },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    feedbacks: feedbacks.map(f => {
      try {
        return JSON.parse(f.value)
      } catch {
        return { raw: f.value }
      }
    }),
  })
}
