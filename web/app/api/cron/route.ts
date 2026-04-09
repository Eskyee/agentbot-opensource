import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { invokeGatewayTool } from '@/app/lib/gateway-proxy'

/**
 * GET /api/cron
 * List cron jobs from the OpenClaw gateway.
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await invokeGatewayTool('cron', { action: 'list', includeDisabled: true }, session.user.id)

  if (!result.ok) {
    return NextResponse.json({
      jobs: [],
      error: result.error,
      source: 'gateway-error',
    })
  }

  const data = typeof result.result === 'string' ? JSON.parse(result.result) : result.result
  const jobs = Array.isArray(data) ? data : data?.jobs || data?.result || []

  return NextResponse.json({
    jobs: jobs.map((j: any) => ({
      id: j.id || j.name,
      name: j.name || j.id,
      enabled: j.enabled !== false,
      schedule: j.schedule,
      payload: j.payload,
      lastRun: j.lastRun || null,
      nextRun: j.nextRun || null,
    })),
    total: jobs.length,
    source: 'gateway',
  })
}

/**
 * POST /api/cron
 * Add a new cron job to the gateway.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, schedule, payload, enabled } = body

  if (!name || !schedule || !payload) {
    return NextResponse.json({ error: 'name, schedule, and payload required' }, { status: 400 })
  }

  const result = await invokeGatewayTool('cron', {
    action: 'add',
    job: { name, schedule, payload, enabled: enabled !== false },
  }, session.user.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ success: true, source: 'gateway' })
}

/**
 * DELETE /api/cron?jobId=xxx
 * Remove a cron job.
 */
export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  }

  const result = await invokeGatewayTool('cron', { action: 'remove', jobId }, session.user.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ success: true, source: 'gateway' })
}

export const dynamic = 'force-dynamic'
