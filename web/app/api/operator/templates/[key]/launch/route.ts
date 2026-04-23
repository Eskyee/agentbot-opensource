/**
 * POST /api/operator/templates/:key/launch
 *
 * DISABLED (501) — this endpoint currently creates Agent + Workflow records
 * but does NOT trigger actual runtime provisioning (Railway / OpenClaw Gateway).
 * Users would see "launched!" but get a dead pending agent.
 *
 * Follow-up PR will extract a provisionManagedAgent() helper from
 * /api/agents/provision/route.ts and wire it in here so launched agents
 * actually deploy. Until then, return 501 to prevent dead-row creation.
 *
 * The rest of the Operator Mode UI (onboarding, templates gallery, tutorials,
 * activity feed) still works — users just can't launch yet.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getTemplateByKey } from '@/app/lib/operator-templates'
import { isOperatorModeEnabledForUser } from '@/app/lib/feature-flags'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOperatorModeEnabledForUser(session.user.email)) {
    return NextResponse.json({ error: 'Operator Mode is not enabled' }, { status: 403 })
  }

  const { key } = await params
  const template = getTemplateByKey(key)
  if (!template) {
    return NextResponse.json({ error: `Template "${key}" not found` }, { status: 404 })
  }

  // Template launch is disabled until runtime provisioning is wired in.
  // See: /api/agents/provision/route.ts for the full provisioning flow
  // that needs to be extracted into a shared helper.
  return NextResponse.json(
    {
      error: 'Template launch is not yet available — provisioning integration coming soon.',
      template: template.key,
      hint: 'Use /dashboard to create and provision agents via the advanced flow.',
    },
    { status: 501 },
  )
}
