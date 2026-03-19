import { NextResponse } from 'next/server'
import os from 'os'

export async function GET() {
  try {
    const cpus = os.cpus()
    const loadAvg = os.loadavg()[0]
    const cpuCount = cpus.length
    const cpuUsage = Math.min((loadAvg / cpuCount) * 100, 100)

    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsage = (usedMemory / totalMemory) * 100

    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (cpuUsage > 85 || memoryUsage > 85) {
      health = 'unhealthy'
    } else if (cpuUsage > 70 || memoryUsage > 70) {
      health = 'degraded'
    }

    return NextResponse.json({
      status: 'ok',
      health,
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuUsage,
        cores: cpuCount,
      },
      memory: {
        usage: memoryUsage,
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
      },
      uptime: os.uptime(),
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        health: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
