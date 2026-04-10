import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { createGovernanceProposal } from '@/app/lib/communityProgram'

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const summary = typeof body?.summary === 'string' ? body.summary.trim() : ''
  const details = typeof body?.details === 'string' ? body.details.trim() : ''
  const endsAt = typeof body?.endsAt === 'string' ? body.endsAt.trim() : ''

  if (!title || !summary) {
    return NextResponse.json({ error: 'Title and summary are required' }, { status: 400 })
  }

  const proposal = await createGovernanceProposal({
    title: title.slice(0, 120),
    summary: summary.slice(0, 280),
    details: details.slice(0, 4000) || null,
    endsAt: endsAt || null,
    createdBy: session.user.id,
  })

  return NextResponse.json({ success: true, proposal })
}

export const dynamic = 'force-dynamic'
