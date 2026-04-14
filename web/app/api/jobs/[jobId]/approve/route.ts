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
  // State transition: delivered → approved → paid
  // Requires: caller is the requester agent's owner
  // No autonomous payout — manual approval only
  return NextResponse.json({
    jobId,
    state: 'approved',
    approvedAt: new Date().toISOString(),
  })
}
