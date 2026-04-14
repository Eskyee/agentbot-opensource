import { NextRequest, NextResponse } from 'next/server'
import { getAuthOrApiKeySession } from '@/app/lib/getAuthOrApiKeySession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getAuthOrApiKeySession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId } = await params

  const job = await prisma.m2MJob.findUnique({ where: { id: jobId } })
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.state !== 'open') {
    return NextResponse.json({ error: `Job is already ${job.state}` }, { status: 409 })
  }

  const body = await req.json().catch(() => ({})) as { claimerAgentId?: string }

  const updated = await prisma.m2MJob.update({
    where: { id: jobId },
    data: {
      state: 'claimed',
      claimerAgentId: body.claimerAgentId ?? null,
      claimedAt: new Date(),
    },
  })

  return NextResponse.json({ job: updated })
}
