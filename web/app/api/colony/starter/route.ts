import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { provisionOnRailway, isRailwayConfigured } from '@/app/lib/railway-provision'


const TEMPLATE_PLAN: Record<string, string> = {
  'alpha-terminal': 'solo',
  'support-ops':    'collective',
  'content-studio': 'collective',
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { template?: string; name?: string }

    if (!body.template || !body.name?.trim()) {
      return NextResponse.json({ error: 'Missing template or name' }, { status: 400 })
    }

    const validTemplates = ['alpha-terminal', 'support-ops', 'content-studio']
    if (!validTemplates.includes(body.template)) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
    }

    const plan = TEMPLATE_PLAN[body.template] ?? 'solo'

    if (isRailwayConfigured()) {
      // Real provisioning via Railway GraphQL API
      const agentId = `col_${Math.random().toString(36).slice(2, 10)}`
      const result = await provisionOnRailway(agentId, plan)
      return NextResponse.json(
        { colonyId: result.agentId, serviceId: result.serviceId, url: result.url, status: result.status },
        { status: 201 }
      )
    }

    // Railway not yet configured — return scaffold ID so the UI can redirect
    const colonyId = `col_${Math.random().toString(36).slice(2, 10)}`
    return NextResponse.json({ colonyId, status: 'provisioning' }, { status: 201 })
  } catch (err) {
    console.error('[colony/starter] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
