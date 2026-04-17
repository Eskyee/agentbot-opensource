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
import { isOperatorModeEnabled } from '@/app/lib/feature-flags'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  if (!isOperatorModeEnabled()) {
    return NextResponse.json({ error: 'Operator Mode is not enabled' }, { status: 403 })
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params
  const template = getTemplateByKey(key)
  if (!template) {
    return NextResponse.json({ error: `Template "${key}" not found` }, { status: 404 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const agentName = (body.agentName as string) || `${template.name} Agent`

    // Create workflow using existing Workflow model
    const workflow = await prisma.workflow.create({
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
    const agent = await prisma.agent.create({
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
    await prisma.templateLaunch.create({
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
