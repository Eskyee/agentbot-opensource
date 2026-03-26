import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'


export async function POST(
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
    const response = await fetch(`${BACKEND_API_URL}/api/agents/${userId}/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      }
    })

    if (!response.ok) {
      return NextResponse.json({ success: false, status: 'error' }, { status: 502 })
    }

    return NextResponse.json({ success: true, status: 'running' })
  } catch (error) {
    return NextResponse.json({ success: false, status: 'error' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';