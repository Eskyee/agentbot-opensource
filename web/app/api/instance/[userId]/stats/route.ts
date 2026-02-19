import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || ''

if (!INTERNAL_API_KEY) {
  throw new Error('INTERNAL_API_KEY is required for /api/instance/[userId]/stats route')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  
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
