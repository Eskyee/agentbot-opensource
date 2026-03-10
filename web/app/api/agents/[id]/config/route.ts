import { NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

const API_URL = getBackendApiUrl()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const API_KEY = getInternalApiKey()
    const { id: agentId } = await params

    const response = await fetch(`${API_URL}/api/agents/${agentId}/config`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent configuration not found' },
          { status: 404 }
        )
      }
      throw new Error(`Backend returned ${response.status}`)
    }

    const config = await response.json()

    return NextResponse.json({
      config,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch agent config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const API_KEY = getInternalApiKey()
    const { id: agentId } = await params
    const body = await request.json()

    const response = await fetch(`${API_URL}/api/agents/${agentId}/config`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const config = await response.json()

    return NextResponse.json({
      config,
      status: 'updated',
    })
  } catch (error) {
    console.error('Failed to update agent config:', error)
    return NextResponse.json(
      { error: 'Failed to update agent configuration' },
      { status: 500 }
    )
  }
}
