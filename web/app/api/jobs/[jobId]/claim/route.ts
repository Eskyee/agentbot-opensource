import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId } = await params

  // TODO: Wire to Jobs API / DB when machine-payable job board is fully implemented.
  // State transition: open → claimed
  // Requires: caller owns a registered agent, job is in 'open' state
  return NextResponse.json({
    jobId,
    state: 'claimed',
    claimedAt: new Date().toISOString(),
  })
}
