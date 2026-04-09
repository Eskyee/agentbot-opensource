/**
 * Permission API — Dashboard endpoint for permission requests
 *
 * GET  /api/permissions — List pending requests for user
 * POST /api/permissions — Submit decision (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Fetch from permission handler via gateway
  // const requests = await getPendingRequests(session.user.id)
  
  return NextResponse.json({
    pending: [],
    message: 'Permission system initialized. Pending requests will appear here.',
  })
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { requestId, decision, feedback, modifiedInput } = body

  if (!requestId || !decision) {
    return NextResponse.json(
      { error: 'Missing requestId or decision' },
      { status: 400 }
    )
  }

  if (!['approve', 'reject', 'approve_always'].includes(decision)) {
    return NextResponse.json(
      { error: 'Invalid decision. Must be: approve, reject, or approve_always' },
      { status: 400 }
    )
  }

  // TODO: Process decision via permission handler
  // const result = processDecision({ requestId, decision, feedback, modifiedInput })

  return NextResponse.json({
    success: true,
    requestId,
    decision,
  })
}
