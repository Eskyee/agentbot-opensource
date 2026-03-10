import { NextRequest, NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

const BACKEND_API_URL = getBackendApiUrl()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
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
