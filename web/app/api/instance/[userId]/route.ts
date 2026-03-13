import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { getInternalApiKey, getBackendApiUrl } from '../../lib/api-keys'

const BACKEND_API_URL = getBackendApiUrl()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const INTERNAL_API_KEY = getInternalApiKey()
  const { userId } = await params
  
  // Authorization: Verify session user matches requested userId
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.id !== userId) {
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
      return NextResponse.json({
        userId,
        status: 'unknown',
        startedAt: new Date().toISOString(),
        subdomain: `${userId}.agents.localhost`,
        url: `https://${userId}.agents.localhost`,
        plan: 'free',
        openclawVersion: '2026.2.17'
      }, { status: response.status || 502 })
    }

    return NextResponse.json({
      userId,
      status: data.status === 'active' ? 'running' : (data.status || 'unknown'),
      startedAt: data.startedAt || new Date().toISOString(),
      subdomain: data.subdomain || `${userId}.agents.localhost`,
      url: data.url || `https://${userId}.agents.localhost`,
      plan: data.plan || 'free',
      openclawVersion: data.openclawVersion || '2026.2.17'
    })
  } catch (error) {
    return NextResponse.json({
      userId,
      status: 'unknown',
      startedAt: new Date().toISOString(),
      subdomain: `${userId}.agents.localhost`,
      url: `https://${userId}.agents.localhost`,
      plan: 'free',
      openclawVersion: '2026.2.17'
    }, { status: 500 })
  }
}
