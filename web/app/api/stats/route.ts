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
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    target: process.env.VERCEL_TARGET_ENV || null,
    projectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
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
    const processMemory = process.memoryUsage()
    const runtime = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      heapUsedMb: Number((processMemory.heapUsed / 1024 / 1024).toFixed(1)),
      heapTotalMb: Number((processMemory.heapTotal / 1024 / 1024).toFixed(1)),
      rssMb: Number((processMemory.rss / 1024 / 1024).toFixed(1)),
      externalMb: Number((processMemory.external / 1024 / 1024).toFixed(1)),
    }

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
      runtime,
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
        runtime: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          heapUsedMb: 0,
          heapTotalMb: 0,
          rssMb: 0,
          externalMb: 0,
        },
      },
      { status: 500 }
    )
  }
}
