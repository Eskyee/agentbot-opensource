/**
 * POST /api/operator/preview
 *
 * Preview what a template launch would create — without actually creating anything.
 * Uses existing model/runtime stack for the preview.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getTemplateByKey } from '@/app/lib/operator-templates'
import { isOperatorModeEnabled } from '@/app/lib/feature-flags'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isOperatorModeEnabled()) {
    return NextResponse.json({ error: 'Operator Mode is not enabled' }, { status: 403 })
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { templateKey } = await req.json()
    const template = getTemplateByKey(templateKey)

    if (!template) {
      return NextResponse.json({ error: `Template "${templateKey}" not found` }, { status: 404 })
    }

    return NextResponse.json({
      template: {
        key: template.key,
        name: template.name,
        description: template.description,
        category: template.category,
        setupMinutes: template.setupMinutes,
      },
      willCreate: {
        workflow: {
          name: `${template.name} Workflow`,
          nodeCount: template.nodes.length,
          nodeTypes: template.nodes.map(n => n.type),
        },
        agent: {
          model: template.agentDefaults.model,
          skills: template.agentDefaults.skills,
          type: template.agentDefaults.agentType,
        },
      },
      note: 'This is a preview — nothing has been created yet. Launch the template to create the workflow and agent.',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
