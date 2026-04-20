/**
 * GET  /api/operator/tutorials/:key — Get tutorial progress
 * POST /api/operator/tutorials/:key — Update tutorial progress
 *
 * Persists in TutorialProgress table. Uses existing auth model.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getTutorialByKey } from '@/app/lib/operator-tutorials'
import { isOperatorModeEnabled } from '@/app/lib/feature-flags'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  if (!isOperatorModeEnabled()) {
    return NextResponse.json({ error: 'Operator Mode is not enabled' }, { status: 403 })
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params
  const tutorial = getTutorialByKey(key)
  if (!tutorial) {
    return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 })
  }

  const progress = await prisma.tutorialProgress.findUnique({
    where: { userId_tutorialKey: { userId: session.user.id, tutorialKey: key } },
  })

  return NextResponse.json({
    tutorial,
    progress: progress ?? { status: 'not_started', stepIndex: 0 },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  if (!isOperatorModeEnabled()) {
    return NextResponse.json({ error: 'Operator Mode is not enabled' }, { status: 403 })
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params
  const tutorial = getTutorialByKey(key)
  if (!tutorial) {
    return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 })
  }

  try {
    const { stepIndex, status } = await req.json()
    const isComplete = status === 'completed' || stepIndex >= tutorial.steps.length

    const progress = await prisma.tutorialProgress.upsert({
      where: { userId_tutorialKey: { userId: session.user.id, tutorialKey: key } },
      create: {
        userId: session.user.id,
        tutorialKey: key,
        status: isComplete ? 'completed' : 'in_progress',
        stepIndex: stepIndex ?? 0,
        completedAt: isComplete ? new Date() : null,
      },
      update: {
        status: isComplete ? 'completed' : 'in_progress',
        stepIndex: stepIndex ?? 0,
        completedAt: isComplete ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, progress })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
