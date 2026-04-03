import { NextResponse } from 'next/server'
import os from 'os'
import { getAuthSession } from '@/app/lib/getAuthSession'

let startTime = Date.now()
let messageCount = 0
let errorCount = 0

function getDeploymentStats() {
  const deploymentUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null

  return {
    provider: process.env.VERCEL === '1' ? 'vercel' : 'node',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    region: process.env.VERCEL_REGION || process.env.FLY_REGION || null,
    deploymentUrl,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    commitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
  }
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000)
    
    // Get CPU usage
    const cpus = os.cpus()
    const loadAvg = os.loadavg()[0]
    const cpuCount = cpus.length
    const cpuUsage = Math.min((loadAvg / cpuCount) * 100, 100)

    // Get memory usage
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsage = (usedMemory / totalMemory) * 100

    // Determine health based on metrics
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (cpuUsage > 85 || memoryUsage > 85 || errorCount > 10) {
      health = 'unhealthy'
    } else if (cpuUsage > 70 || memoryUsage > 70 || errorCount > 5) {
      health = 'degraded'
    }

    return NextResponse.json({
      cpu: Math.max(0, cpuUsage),
      memory: memoryUsage,
      uptime,
      messages: messageCount,
      errors: errorCount,
      health,
      timestamp: new Date().toISOString(),
      deployment: getDeploymentStats(),
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      {
        cpu: 0,
        memory: 0,
        uptime: 0,
        messages: 0,
        errors: 1,
        health: 'unhealthy',
        timestamp: new Date().toISOString(),
        deployment: getDeploymentStats(),
      },
      { status: 500 }
    )
  }
}
