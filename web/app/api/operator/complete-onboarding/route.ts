/**
 * POST /api/operator/complete-onboarding
 *
 * Marks the user's operator onboarding as complete.
 * Uses existing auth/session model.
 */
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { completeOnboarding } from '@/app/lib/operator-routing'
import { isOperatorModeEnabledForUser } from '@/app/lib/feature-flags'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOperatorModeEnabledForUser(session.user.email)) {
    return NextResponse.json({ error: 'Operator Mode is not enabled' }, { status: 403 })
  }

  await completeOnboarding(session.user.id)

  return NextResponse.json({ success: true, message: 'Onboarding complete!' })
}
