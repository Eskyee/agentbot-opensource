import { NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_API_URL || 'http://agentbot-api:3001'
const API_KEY = process.env.INTERNAL_API_KEY || 'dev-secret-key-12345'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params

    const response = await fetch(`${API_URL}/api/agents/${agentId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        )
      }
      throw new Error(`Backend returned ${response.status}`)
    }

    const agent = await response.json()

    return NextResponse.json({
      agent,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}
