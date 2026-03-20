export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

const BACKEND_API_URL = getBackendApiUrl()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const INTERNAL_API_KEY = getInternalApiKey()
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/agents/${userId}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      }
    })

    let data: any = null
    try {
      data = await response.json()
    } catch (parseError) {
      console.error('Failed to parse stats response JSON', parseError)
      return NextResponse.json({
        userId,
        cpu: '0%',
        memory: '0MB',
        status: 'unknown',
        error: 'Invalid stats payload from backend'
      }, { status: 502 })
    }

    if (!response.ok) {
      return NextResponse.json({
        userId,
        cpu: data?.cpu || '0%',
        memory: data?.memory || '0MB',
        status: data?.status || 'unknown',
        error: data?.error || 'Failed to fetch instance stats'
      }, { status: response.status || 502 })
    }

    return NextResponse.json({
      userId,
      cpu: data?.cpu || 'unknown',
      memory: data?.memory || 'unknown',
      status: data?.status || 'unknown',
      plan: data?.plan || 'free',
      openclawVersion: data?.openclawVersion || 'unknown'
    })
  } catch (error) {
    console.error('Stats route error', error)
    return NextResponse.json({
      userId,
      cpu: '0%',
      memory: '0MB',
      status: 'unknown',
      error: 'Stats service unavailable'
    }, { status: 500 })
  }
}
