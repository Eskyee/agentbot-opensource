/**
 * POST /api/operator/templates/:key/launch
 *
 * Launches a template by creating a Workflow + Agent using existing primitives.
 * Reuses existing workflow creation and agent provisioning — no parallel system.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getTemplateByKey } from '@/app/lib/operator-templates'
import { isOperatorModeEnabledForUser } from '@/app/lib/feature-flags'
import { assertUserCanProvisionAgent } from '@/app/lib/agent-provision-guards'

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

  // Enforce the same subscription + plan limits as /api/agents/provision.
  // Without this, users could bypass plan caps by launching templates (Codex P1).
  const guard = await assertUserCanProvisionAgent(session.user.id, session.user.email)
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.error, current: guard.current, limit: guard.limit },
      { status: guard.status },
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const agentName = (body.agentName as string) || `${template.name} Agent`

    // All three records created atomically — no orphan Workflows or Agents on partial failure
    const { workflow, agent } = await prisma.$transaction(async (tx) => {
      // Create workflow using existing Workflow model
      const workflow = await tx.workflow.create({
        data: {
          userId: session.user.id,
          name: `${template.name} Workflow`,
          description: template.description,
          enabled: true,
          nodes: {
            create: template.nodes.map((node) => ({
              type: node.type,
              config: JSON.stringify(node.config),
              position: node.position,
            })),
          },
        },
      })

      // Create agent using existing Agent model
      const agent = await tx.agent.create({
        data: {
          userId: session.user.id,
          name: agentName,
          model: template.agentDefaults.model,
          status: 'pending',
          config: {
            templateKey: template.key,
            skills: template.agentDefaults.skills,
            agentType: template.agentDefaults.agentType,
          },
        },
      })

      // Record the template launch
      await tx.templateLaunch.create({
        data: {
          userId: session.user.id,
          templateKey: template.key,
          workflowId: workflow.id,
          agentId: agent.id,
          status: 'pending',
          config: {
            agentName,
            model: template.agentDefaults.model,
            skills: template.agentDefaults.skills,
          },
        },
      })

      return { workflow, agent }
    })

    return NextResponse.json({
      success: true,
      workflowId: workflow.id,
      agentId: agent.id,
      message: template.successMessage,
      nextStep: '/dashboard', // User goes to advanced dashboard to finish setup
    })
  } catch (error) {
    console.error('[operator/templates/launch] Error:', error)
    return NextResponse.json({ error: 'Failed to launch template' }, { status: 500 })
  }
}
