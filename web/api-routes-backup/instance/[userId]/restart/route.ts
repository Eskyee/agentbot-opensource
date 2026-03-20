export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

const BACKEND_API_URL = getBackendApiUrl()

export async function POST(
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
