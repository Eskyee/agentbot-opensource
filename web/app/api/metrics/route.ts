import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Mock metrics - replace with real metrics from backend
    const metrics = {
      agents: {
        total: 4,
        active: 4,
        inactive: 0,
        failed: 0,
      },
      messages: {
        today: Math.floor(Math.random() * 50000),
        thisWeek: Math.floor(Math.random() * 350000),
        thisMonth: Math.floor(Math.random() * 1500000),
      },
      deployments: {
        total: 4,
        successful: 4,
        failed: 0,
      },
      uptime: {
        platformUptime: 99.9,
        averageAgentUptime: 98.5,
      },
      performance: {
        averageResponseTime: Math.floor(Math.random() * 2000),
        successRate: (95 + Math.random() * 5).toFixed(2),
        errorRate: (0 + Math.random() * 5).toFixed(2),
      },
      storage: {
        used: Math.floor(Math.random() * 500),
        total: 1024,
        percentUsed: 35,
      },
    }

    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString(),
      status: 'ok',
    })
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics', metrics: {} },
      { status: 500 }
    )
  }
}
