import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'


export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId } = await params

  const job = await prisma.m2MJob.findUnique({ where: { id: jobId } })
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.state !== 'delivered') {
    return NextResponse.json({ error: `Job must be in delivered state, currently: ${job.state}` }, { status: 409 })
  }

  const updated = await prisma.m2MJob.update({
    where: { id: jobId },
    data: {
      state: 'approved',
      approvedAt: new Date(),
    },
  })

  return NextResponse.json({ job: updated })
}
