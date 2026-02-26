import { NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_API_URL || 'http://agentbot-api:3001'
const API_KEY = process.env.INTERNAL_API_KEY || 'dev-secret-key-12345'

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/agents`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()

    const agents = (data || []).map((agent: any) => ({
      id: agent.id,
      name: agent.subdomain || agent.id,
      status: agent.status || 'active',
      port: agent.port,
      uptime: agent.uptime || 'unknown',
      lastHeartbeat: new Date().toLocaleTimeString(),
      plan: agent.plan || 'free',
      url: agent.url,
    }))

    return NextResponse.json({
      agents,
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch heartbeat', agents: [] },
      { status: 500 }
    )
  }
}
