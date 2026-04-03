import { NextRequest, NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '../../lib/api-keys'
import { verifyInstanceOwnership } from '../_auth'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const BACKEND_API_URL = getBackendApiUrl()
  const INTERNAL_API_KEY = getInternalApiKey()
  const { userId } = await params

  if (!(await verifyInstanceOwnership(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/agents/${userId}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      }
    })

    let data: any = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok || !data) {
      // Construct Railway URL from userId (agentbot-agent-{userId}-production.up.railway.app)
      const railwayUrl = `https://agentbot-agent-${userId}-production.up.railway.app`;
      return NextResponse.json({
        userId,
        status: 'unknown',
        startedAt: new Date().toISOString(),
        subdomain: `agentbot-agent-${userId}-production.up.railway.app`,
        url: railwayUrl,
        plan: 'free',
        openclawVersion: '2026.4.2'
      }, { status: response.status || 502 })
    }

    return NextResponse.json({
      userId,
      status: data.status === 'active' ? 'running' : (data.status || 'unknown'),
      startedAt: data.startedAt || new Date().toISOString(),
      subdomain: data.subdomain || `agentbot-agent-${userId}-production.up.railway.app`,
      url: data.url || `https://agentbot-agent-${userId}-production.up.railway.app`,
      plan: data.plan || 'free',
      openclawVersion: data.openclawVersion || '2026.4.2'
    })
  } catch (error) {
    return NextResponse.json({
      userId,
      status: 'unknown',
      startedAt: new Date().toISOString(),
      subdomain: `agentbot-agent-${userId}-production.up.railway.app`,
      url: `https://agentbot-agent-${userId}-production.up.railway.app`,
      plan: 'free',
      openclawVersion: '2026.4.2'
    }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';
