/**
 * GET /api/cron/broadcast
 * Scheduled every 5 minutes by Vercel Cron.
 *
 * Finds mixtapes and ad campaigns due to broadcast, creates Mux live streams,
 * and triggers FFmpeg via the platform OpenClaw runtime.
 *
 * Required env vars:
 *   CRON_SECRET             — shared secret checked by Vercel
 *   MUX_TOKEN_ID / SECRET   — Mux API credentials
 *   PLATFORM_OPENCLAW_URL   — the admin/platform OpenClaw instance URL
 *   PLATFORM_OPENCLAW_TOKEN — bearer token for the platform OpenClaw
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { sendAlert } from '@/app/lib/alerts'

const MUX_RTMP_URL = 'rtmps://global-live.mux.com:443/app'
const BROADCAST_LOOK_AHEAD_MS = 5 * 60 * 1000

async function resolveLegacyUserId(cuid: string): Promise<number | null> {
  const user = await prisma.user.findUnique({ where: { id: cuid }, select: { email: true } })
  if (!user?.email) return null
  const legacy = await prisma.users.findUnique({ where: { email: user.email }, select: { id: true } })
  return legacy?.id ?? null
}

function getMuxAuth() {
  const id  = process.env.MUX_TOKEN_ID
  const sec = process.env.MUX_TOKEN_SECRET
  if (!id || !sec) return null
  return `Basic ${Buffer.from(`${id}:${sec}`).toString('base64')}`
}

async function createMuxLiveStream(muxAuth: string, label: string) {
  const res = await fetch('https://api.mux.com/video/v1/live-streams', {
    method:  'POST',
    headers: { Authorization: muxAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playback_policy:    ['public'],
      new_asset_settings: { playback_policy: ['public'] },
      metadata:           { broadcast_label: label },
    }),
  })
  if (!res.ok) throw new Error(`Mux live-stream create failed: ${res.status}`)
  const data = await res.json()
  return {
    id:        data.data.id          as string,
    streamKey: data.data.stream_key  as string,
    playbackId: (data.data.playback_ids?.[0]?.id ?? null) as string | null,
    rtmpUrl:   `${MUX_RTMP_URL}/${data.data.stream_key}`,
  }
}

async function deleteMuxLiveStream(muxAuth: string, streamId: string) {
  await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}/disable`, {
    method: 'PUT', headers: { Authorization: muxAuth },
  }).catch(() => null)
  await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}`, {
    method: 'DELETE', headers: { Authorization: muxAuth },
  }).catch(() => null)
}

async function triggerOpenClawBroadcast(opts: {
  sourceHlsUrl: string
  rtmpTarget:   string
  durationSecs: number
  label:        string
}) {
  const baseUrl = process.env.PLATFORM_OPENCLAW_URL?.replace(/\/$/, '')
  const token   = process.env.PLATFORM_OPENCLAW_TOKEN
  if (!baseUrl || !token) return false

  const res = await fetch(`${baseUrl}/api/basefm/broadcast`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(opts),
    signal:  AbortSignal.timeout(10_000),
  }).catch(() => null)

  return res?.ok === true
}

interface BroadcastJob {
  kind:         'mixtape' | 'ad'
  id:           string
  title:        string
  sourceHlsUrl: string
  durationSecs: number
  userId?:      string | null
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const muxAuth = getMuxAuth()
  if (!muxAuth) return NextResponse.json({ error: 'Mux not configured' }, { status: 500 })

  const now       = new Date()
  const windowEnd = new Date(now.getTime() + BROADCAST_LOOK_AHEAD_MS)

  const jobs: BroadcastJob[] = []

  // Mixtapes due to broadcast (scheduled_at within the look-ahead window)
  const dueMixtapes = await prisma.mixtapes.findMany({
    where: {
      status:       'scheduled',
      scheduled_at: { lte: windowEnd },
      playback_id:  { not: null },
    },
    take: 10,
  })
  for (const m of dueMixtapes) {
    if (!m.playback_id) continue
    jobs.push({
      kind:         'mixtape',
      id:           m.id,
      title:        m.title,
      sourceHlsUrl: `https://stream.mux.com/${m.playback_id}.m3u8`,
      durationSecs: m.duration_secs ?? 7200,
      userId:       m.user_id,
    })
  }

  // Ad campaigns: approved, past starts_at, have remaining slots, have a playback_id
  const dueAds = await prisma.ad_campaigns.findMany({
    where: {
      status:      'approved',
      starts_at:   { lte: windowEnd },
      playback_id: { not: null },
    },
    take: 10,
  })
  // Filter in JS: only campaigns with broadcasts remaining (Prisma can't compare two columns)
  for (const ad of dueAds.filter((a) => a.broadcasts_done < a.scheduled_slots)) {
    if (!ad.playback_id) continue
    jobs.push({
      kind:         'ad',
      id:           ad.id,
      title:        ad.title,
      sourceHlsUrl: `https://stream.mux.com/${ad.playback_id}.m3u8`,
      durationSecs: ad.duration_secs ?? 60,
    })
  }

  if (jobs.length === 0) {
    return NextResponse.json({ checked: true, jobs: 0, ts: now.toISOString() })
  }

  const results: Array<{ id: string; kind: string; outcome: string }> = []

  for (const job of jobs) {
    let liveStream: Awaited<ReturnType<typeof createMuxLiveStream>> | null = null

    try {
      liveStream = await createMuxLiveStream(muxAuth, `${job.kind}:${job.id}`)

      // Mark broadcasting / live in DB
      if (job.kind === 'mixtape') {
        await prisma.mixtapes.update({
          where: { id: job.id },
          data:  { status: 'broadcasting', broadcast_at: now },
        })
      } else {
        await prisma.ad_campaigns.update({
          where: { id: job.id },
          data:  { status: 'live', broadcasts_done: { increment: 1 } },
        })
      }

      const triggered = await triggerOpenClawBroadcast({
        sourceHlsUrl: job.sourceHlsUrl,
        rtmpTarget:   liveStream.rtmpUrl,
        durationSecs: job.durationSecs,
        label:        job.title,
      })

      if (triggered) {
        console.info(`[broadcast] triggered ${job.kind}=${job.id} via OpenClaw`)
        results.push({ id: job.id, kind: job.kind, outcome: 'triggered' })
        // Record outcome for spend dashboard "Value Delivered" feed
        await prisma.platform_outcomes.create({
          data: {
            user_id:      job.userId ? await resolveLegacyUserId(job.userId) : null,
            outcome_type: 'broadcast_complete',
            title:        `Broadcast: ${job.title}`,
            description:  `${job.kind === 'mixtape' ? 'Mix' : 'Ad'} aired on baseFM`,
            metadata:     { jobId: job.id, kind: job.kind },
          },
        }).catch(() => null)
      } else {
        // Alert admin with the exact ffmpeg command ready to paste
        const ffmpegCmd = [
          'ffmpeg -re',
          `-i "${job.sourceHlsUrl}"`,
          '-c:v libx264 -preset veryfast -b:v 3500k',
          '-c:a aac -b:a 256k -ar 44100 -ac 2',
          '-f flv',
          `"${liveStream.rtmpUrl}"`,
        ].join(' \\\n  ')

        await sendAlert({
          title:    `📻 Broadcast Ready — Action Required`,
          message:  `"${job.title}" is due to air. Set PLATFORM_OPENCLAW_URL or run FFmpeg manually.`,
          severity: 'warning',
          fields: {
            ID:      job.id,
            Kind:    job.kind,
            Source:  job.sourceHlsUrl,
            RTMP:    liveStream.rtmpUrl,
            Watch:   liveStream.playbackId ? `https://stream.mux.com/${liveStream.playbackId}.m3u8` : 'pending',
            Command: ffmpegCmd,
          },
        }).catch(() => null)

        results.push({ id: job.id, kind: job.kind, outcome: 'needs_operator' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[broadcast] error job=${job.id}:`, msg)

      // Roll back status
      if (job.kind === 'mixtape') {
        await prisma.mixtapes.update({ where: { id: job.id }, data: { status: 'scheduled' } }).catch(() => null)
      } else {
        await prisma.ad_campaigns.update({
          where: { id: job.id },
          data:  { status: 'approved', broadcasts_done: { decrement: 1 } },
        }).catch(() => null)
      }
      if (liveStream) await deleteMuxLiveStream(muxAuth, liveStream.id).catch(() => null)

      results.push({ id: job.id, kind: job.kind, outcome: `error: ${msg}` })
    }
  }

  console.info(`[broadcast] cron run complete: ${results.length} jobs`)
  return NextResponse.json({ checked: true, jobs: results.length, results, ts: now.toISOString() })
}
