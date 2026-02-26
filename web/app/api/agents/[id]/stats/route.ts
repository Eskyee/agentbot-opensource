import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id

    // Mock stats data - replace with real data from backend
    const stats = {
      agentId,
      messagesProcessed: Math.floor(Math.random() * 10000),
      messagesPerHour: Math.floor(Math.random() * 500),
      averageResponseTime: Math.floor(Math.random() * 2000),
      uptime: Math.floor(Math.random() * 864000), // up to 10 days
      successRate: (90 + Math.random() * 10).toFixed(2),
      errorRate: (0 + Math.random() * 10).toFixed(2),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      stats,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch agent stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent stats' },
      { status: 500 }
    )
  }
}
