import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Redis } from '@upstash/redis'

/**
 * POST /api/webhooks/railway-status
 * Receives Railway platform status / deployment webhook notifications.
 * Verification: X-Railway-Secret header matches RAILWAY_WEBHOOK_SECRET env var.
 * Persists latest status to Redis so /dashboard/colony can show real state.
 */

const REDIS_KEY = 'railway:status:latest'
const REDIS_TTL = 60 * 60 * 24 * 7 // 7 days

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  try {
    return new Redis({ url, token })
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET
    if (webhookSecret) {
      const providedSecret =
        req.headers.get('x-railway-secret') ||
        new URL(req.url).searchParams.get('secret')

      if (
        !providedSecret ||
        !crypto.timingSafeEqual(
          Buffer.from(providedSecret),
          Buffer.from(webhookSecret)
        )
      ) {
        console.warn('[Railway Status] Invalid webhook secret — rejecting')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      console.warn('[Railway Status] RAILWAY_WEBHOOK_SECRET not set — accepting without verification')
    }

    const body = await req.json()

    // Railway sends deployment events OR status-page incidents
    // Deployment event shape: { type, deployment: { id, status, url, service: { name } } }
    // Status-page shape: { incident, component, page }
    const { incident, component, deployment, type } = body

    let status = 'unknown'
    let name = 'Railway'
    let message = ''
    let eventType = type || 'status'

    if (deployment) {
      // Deployment webhook from Railway dashboard → webhooks
      status = deployment.status || 'unknown'
      name = deployment.service?.name || 'railway-service'
      message = deployment.url || ''
      eventType = 'deployment'
    } else if (incident) {
      status = incident.status || 'unknown'
      name = incident.name || 'Railway'
      message = incident.incident_updates?.[0]?.body || ''
      eventType = 'incident'
    } else if (component) {
      status = component.status || 'unknown'
      name = component.name || 'Railway'
      eventType = 'component'
    }

    const record = {
      status,
      name,
      message,
      eventType,
      receivedAt: new Date().toISOString(),
    }

    console.log(`[Railway Status] ${eventType}: ${status} — ${name} ${message}`)

    // Persist to Redis for dashboard consumption
    const redis = getRedis()
    if (redis) {
      await redis.set(REDIS_KEY, JSON.stringify(record), { ex: REDIS_TTL })
      console.log('[Railway Status] Persisted to Redis')
    }

    return NextResponse.json({ received: true, record })
  } catch (error) {
    console.error('[Railway Status] Error processing webhook:', error)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function GET() {
  // Allow dashboard to poll last-known Railway status
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({
      status: 'unknown',
      message: 'Redis not configured',
      endpoint: 'railway-status-webhook',
    })
  }

  try {
    const raw = await redis.get<string>(REDIS_KEY)
    const record = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    return NextResponse.json({
      status: record?.status ?? 'no-events',
      lastEvent: record,
      endpoint: 'railway-status-webhook',
    })
  } catch {
    return NextResponse.json({ status: 'unknown', endpoint: 'railway-status-webhook' })
  }
}
