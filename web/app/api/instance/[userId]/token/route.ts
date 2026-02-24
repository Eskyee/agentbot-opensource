import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-secret-key-12345'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  
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
