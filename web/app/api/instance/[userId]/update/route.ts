import { NextRequest, NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

const BACKEND_API_URL = getBackendApiUrl()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const INTERNAL_API_KEY = getInternalApiKey()

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/agents/${userId}/update`, {
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
