import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const BACKEND_API_URL = getBackendApiUrl()
  const { userId } = await params
  const session = await getAuthSession()
  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const INTERNAL_API_KEY = getInternalApiKey()
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/agents/${userId}/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to get token' }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';