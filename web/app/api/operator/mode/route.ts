/**
 * GET  /api/operator/mode — Get user's current mode
 * POST /api/operator/mode — Switch mode (operator ↔ advanced)
 *
 * Uses existing auth/session model. Persists preference in UserPreference table.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { resolveUserMode, setUserMode, UserMode } from '@/app/lib/operator-routing'
import { isOperatorModeEnabled } from '@/app/lib/feature-flags'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = await resolveUserMode(session.user.id)
  const operatorEnabled = isOperatorModeEnabled()

  return NextResponse.json({ mode, operatorEnabled })
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { mode } = await req.json()
    if (mode !== 'operator' && mode !== 'advanced') {
      return NextResponse.json({ error: 'Mode must be "operator" or "advanced"' }, { status: 400 })
    }

    await setUserMode(session.user.id, mode as UserMode)

    return NextResponse.json({ success: true, mode })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
