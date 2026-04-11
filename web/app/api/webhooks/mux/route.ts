import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'

/**
 * Mux Webhook Handler for baseFM (Hardened)
 * Listen for stream status changes and asset readiness.
 * Includes Signature Verification to prevent external agent probing.
 */

function getMuxSigningSecret() {
  return process.env.MUX_SIGNING_SECRET || process.env.MUX_WEBHOOK_SECRET || ''
}

function verifyMuxSignature(body: string, signature: string): boolean {
  // Fail closed - deny if signing secret not configured
  const signingSecret = getMuxSigningSecret()
  if (!signingSecret) {
    console.error('[SECURITY] MUX_SIGNING_SECRET not configured - rejecting request')
    return false
  }

  // Mux sends signature in format: t=timestamp,v1=signature
  const parts = signature.split(',')
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
  const sig = parts.find(p => p.startsWith('v1='))?.split('=')[1]

  if (!timestamp || !sig) return false

  // Verify timestamp is within 5 minutes to prevent replay attacks
  const webhookAge = Date.now() - parseInt(timestamp) * 1000
  if (webhookAge > 5 * 60 * 1000) {
    console.error('[SECURITY] Mux webhook timestamp too old, possible replay attack')
    return false
  }

  const payload = timestamp + '.' + body
  const expectedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(payload)
    .digest('hex')

  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSignature)

  // crypto.timingSafeEqual() THROWS if buffers have different lengths.
  // An attacker sending a truncated or padded sig header would get a 500 instead
  // of a 401, leaking server state. Guard the length before calling.
  if (sigBuf.length !== expectedBuf.length) {
    return false
  }

  // Timing-safe comparison (prevents enumeration via response timing)
  return crypto.timingSafeEqual(sigBuf, expectedBuf)
}

function getPlaybackId(data: {
  playback_ids?: Array<{ id?: string | null }>
  passthrough?: string | null
  meta?: { playback_ids?: Array<{ id?: string | null }> } | null
}) {
  return data.playback_ids?.[0]?.id || data.meta?.playback_ids?.[0]?.id || null
}

async function syncDjSessionFromMux(type: string, data: {
  id?: string
  playback_ids?: Array<{ id?: string | null }>
  meta?: { playback_ids?: Array<{ id?: string | null }> } | null
}) {
  if (!data.id) return

  if (type === 'video.live_stream.active' || type === 'video.live_stream.connected') {
    await prisma.dj_sessions.updateMany({
      where: { mux_stream_id: data.id },
      data: {
        status: 'live',
        ...(getPlaybackId(data) ? { playback_id: getPlaybackId(data) } : {}),
      },
    })
    return
  }

  if (type === 'video.live_stream.idle' || type === 'video.live_stream.disconnected') {
    await prisma.dj_sessions.updateMany({
      where: { mux_stream_id: data.id, status: 'live' },
      data: { status: 'active' },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('mux-signature')
    const body = await request.text()

    if (!signature) {
      console.error('[SECURITY] Webhook received without Mux Signature. Dropping.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!verifyMuxSignature(body, signature)) {
      console.error('[SECURITY] Signature verification failed. Probing attempt suspected.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const event = JSON.parse(body)
    const { type, data } = event

    console.log(`[MUX WEBHOOK] Received verified event: ${type}`)
    await syncDjSessionFromMux(type, data).catch((error) => {
      console.error('[MUX WEBHOOK] Failed to sync dj_session state:', error)
    })

    switch (type) {
      case 'video.asset.ready':
        // Elite Archive Logic: Only store 1080p+ and 15min+ sets
        const isHighRes = data.max_stored_resolution === 'HD' || data.resolution_tier === '1080p'
        const isLongEnough = data.duration > 900 // 15 minutes

        if (isHighRes && isLongEnough) {
          console.log(`[ARCHIVE] Saving Elite Set: ${data.id} (${data.resolution_tier})`)
          // TRIGGER: Social Archive Post
        } else {
          console.log(`[PRUNE] Low res or short set detected (${data.id}). Queued for deletion.`)
        }
        break

      case 'video.live_stream.active':
      case 'video.live_stream.connected':
        console.log(`[LIVE] Verified Stream is active: ${data.id}`)
        // TRIGGER: Social Amplification
        break

      case 'video.live_stream.idle':
      case 'video.live_stream.disconnected':
        console.log(`[IDLE] Verified Stream stopped: ${data.id}`)
        // TRIGGER: AI Set Summary via DeepSeek/Llama
        break

      default:
        console.log(`Unhandled Mux event type: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[MUX WEBHOOK ERROR]:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
