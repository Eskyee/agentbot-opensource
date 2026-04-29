import { prisma } from '@/app/lib/prisma'

export type BasefmRelayStatus = 'pending' | 'healthy' | 'degraded' | 'failed' | 'stopped'

export type BasefmRelayType = 'hls-consumer' | 'rtmp' | 'youtube' | 'custom'

export interface BasefmLiveDjLike {
  playbackId: string | null
  hlsUrl: string | null
}

export interface BasefmRelayDestination {
  key: string
  name: string
  type: BasefmRelayType
  required: boolean
  enabled: boolean
  status: BasefmRelayStatus
  viewerUrl: string | null
  probeUrl: string | null
  note: string | null
  lastHealthyAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
}

export interface BasefmDistributionState {
  origin: {
    status: 'active' | 'degraded' | 'idle'
    playbackId: string | null
    hlsUrl: string | null
  }
  firstParty: {
    status: BasefmRelayStatus
    pageUrl: string
    note: string | null
  }
  relays: BasefmRelayDestination[]
  requiredRelayStatus: BasefmRelayStatus
  overallStatus: BasefmRelayStatus
}

type BuildDistributionArgs = {
  availability: 'live' | 'degraded'
  primaryDj: BasefmLiveDjLike | null
  relays?: BasefmRelayDestination[]
}

type ProbeResult = {
  ok: boolean
  error?: string
}

const DEFAULT_FIRST_PARTY_URL = 'https://agentbot.sh/basefm/live'
const DEFAULT_BASEFM_SPACE_URL = 'https://basefm.space'
const PROBE_TIMEOUT_MS = 8000

function fallbackRelayRows(): BasefmRelayDestination[] {
  const relays: BasefmRelayDestination[] = [
    {
      key: 'basefm-space',
      name: 'basefm.space',
      type: 'hls-consumer',
      required: true,
      enabled: true,
      status: 'pending',
      viewerUrl: process.env.BASEFM_SPACE_URL || DEFAULT_BASEFM_SPACE_URL,
      probeUrl: process.env.BASEFM_SPACE_PROBE_URL || process.env.BASEFM_SPACE_URL || DEFAULT_BASEFM_SPACE_URL,
      note: 'Relay fallback mode. Apply the Prisma migration to persist relay state.',
      lastHealthyAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  ]

  const hasYoutubeRelay =
    Boolean(process.env.BASEFM_YOUTUBE_RTMP_URL) || Boolean(process.env.BASEFM_YOUTUBE_STREAM_KEY)
  if (hasYoutubeRelay) {
    relays.push({
      key: 'youtube-main',
      name: 'YouTube',
      type: 'youtube',
      required: false,
      enabled: true,
      status: 'pending',
      viewerUrl: process.env.BASEFM_YOUTUBE_VIEWER_URL || null,
      probeUrl: process.env.BASEFM_YOUTUBE_VIEWER_URL || null,
      note: 'Relay fallback mode. Apply the Prisma migration to persist relay state.',
      lastHealthyAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
    })
  }

  return relays
}

function normalizeRelayStatus(status: string): BasefmRelayStatus {
  if (status === 'healthy' || status === 'degraded' || status === 'failed' || status === 'stopped') {
    return status
  }
  return 'pending'
}

function summarizeRequiredRelayStatus(relays: BasefmRelayDestination[]): BasefmRelayStatus {
  const requiredRelays = relays.filter((relay) => relay.required && relay.enabled)
  if (requiredRelays.length === 0) return 'stopped'
  if (requiredRelays.some((relay) => relay.status === 'failed' || relay.status === 'degraded')) return 'degraded'
  if (requiredRelays.every((relay) => relay.status === 'healthy')) return 'healthy'
  if (requiredRelays.some((relay) => relay.status === 'pending')) return 'pending'
  return 'stopped'
}

export async function ensureDefaultBasefmRelayDestinations() {
  try {
    await prisma.basefm_relay_destinations.upsert({
      where: { key: 'basefm-space' },
      update: {
        name: 'basefm.space',
        type: 'hls-consumer',
        required: true,
        enabled: true,
        viewer_url: process.env.BASEFM_SPACE_URL || DEFAULT_BASEFM_SPACE_URL,
        probe_url: process.env.BASEFM_SPACE_PROBE_URL || process.env.BASEFM_SPACE_URL || DEFAULT_BASEFM_SPACE_URL,
      },
      create: {
        key: 'basefm-space',
        name: 'basefm.space',
        type: 'hls-consumer',
        required: true,
        enabled: true,
        viewer_url: process.env.BASEFM_SPACE_URL || DEFAULT_BASEFM_SPACE_URL,
        probe_url: process.env.BASEFM_SPACE_PROBE_URL || process.env.BASEFM_SPACE_URL || DEFAULT_BASEFM_SPACE_URL,
        status: 'pending',
      },
    })

    const hasYoutubeRelay =
      Boolean(process.env.BASEFM_YOUTUBE_RTMP_URL) || Boolean(process.env.BASEFM_YOUTUBE_STREAM_KEY)

    if (hasYoutubeRelay) {
      await prisma.basefm_relay_destinations.upsert({
        where: { key: 'youtube-main' },
        update: {
          name: 'YouTube',
          type: 'youtube',
          required: false,
          enabled: true,
          viewer_url: process.env.BASEFM_YOUTUBE_VIEWER_URL || null,
          probe_url: process.env.BASEFM_YOUTUBE_VIEWER_URL || null,
        },
        create: {
          key: 'youtube-main',
          name: 'YouTube',
          type: 'youtube',
          required: false,
          enabled: true,
          viewer_url: process.env.BASEFM_YOUTUBE_VIEWER_URL || null,
          probe_url: process.env.BASEFM_YOUTUBE_VIEWER_URL || null,
          status: 'pending',
        },
      })
    }
  } catch (error) {
    console.warn('[basefmDistribution] relay destination persistence unavailable, using fallback definitions', error)
  }
}

export async function listBasefmRelayDestinations(): Promise<BasefmRelayDestination[]> {
  await ensureDefaultBasefmRelayDestinations()

  try {
    const rows = await prisma.basefm_relay_destinations.findMany({
      orderBy: [{ required: 'desc' }, { key: 'asc' }],
    })

    return rows.map((row) => ({
      key: row.key,
      name: row.name,
      type: row.type as BasefmRelayType,
      required: row.required,
      enabled: row.enabled,
      status: normalizeRelayStatus(row.status),
      viewerUrl: row.viewer_url,
      probeUrl: row.probe_url,
      note:
        row.status === 'pending'
          ? 'Relay configured, but downstream health is not fully validated yet.'
          : row.last_error_message || null,
      lastHealthyAt: row.last_healthy_at?.toISOString() || null,
      lastErrorAt: row.last_error_at?.toISOString() || null,
      lastErrorMessage: row.last_error_message || null,
    }))
  } catch (error) {
    console.warn('[basefmDistribution] unable to read relay destinations from database, using fallback definitions', error)
    return fallbackRelayRows()
  }
}

export async function probeRelayDestinationUrl(url: string): Promise<ProbeResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Agentbot/baseFM relay probe',
      },
      cache: 'no-store',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { ok: false, error: `Probe returned HTTP ${response.status}` }
    }

    return { ok: true }
  } catch (error) {
    clearTimeout(timeout)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown relay probe error',
    }
  }
}

function extractPlaybackIdFromHlsUrl(value: string | null | undefined) {
  if (!value) return null
  const match = value.match(/stream\.mux\.com\/([^./?]+)\.m3u8/i)
  return match?.[1] || null
}

async function verifyBasefmSpaceRelayPlayback(
  relay: BasefmRelayDestination,
  primaryDj: BasefmLiveDjLike
): Promise<BasefmRelayDestination> {
  if (!relay.viewerUrl || !primaryDj.playbackId) {
    return relay
  }

  try {
    const relayUrl = new URL(relay.viewerUrl)
    const response = await fetch(`${relayUrl.origin}/api/streams?status=LIVE&limit=10`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Agentbot/baseFM relay playback verification',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })

    if (!response.ok) {
      return {
        ...relay,
        status: 'degraded',
        note: `Relay live API returned HTTP ${response.status}.`,
      }
    }

    const payload = await response.json().catch(() => ({}))
    const streams = Array.isArray(payload?.streams) ? payload.streams : []
    const playbackIds = streams
      .map((stream: { muxPlaybackId?: string | null; hlsPlaybackUrl?: string | null }) =>
        stream.muxPlaybackId || extractPlaybackIdFromHlsUrl(stream.hlsPlaybackUrl)
      )
      .filter(Boolean)

    if (playbackIds.includes(primaryDj.playbackId)) {
      return {
        ...relay,
        status: 'healthy',
        note: null,
      }
    }

    return {
      ...relay,
      status: 'degraded',
      note: 'Relay live API is not serving the current Agentbot playback id.',
    }
  } catch (error) {
    return {
      ...relay,
      status: 'degraded',
      note: error instanceof Error ? error.message : 'Relay playback verification failed.',
    }
  }
}

export async function verifyRelayPlaybackCoverage(
  primaryDj: BasefmLiveDjLike | null,
  relays: BasefmRelayDestination[]
): Promise<BasefmRelayDestination[]> {
  if (!primaryDj?.playbackId) {
    return relays
  }

  return Promise.all(
    relays.map(async (relay) => {
      if (relay.key === 'basefm-space' && relay.enabled) {
        return verifyBasefmSpaceRelayPlayback(relay, primaryDj)
      }

      return relay
    })
  )
}

export async function updateRelayProbeStatus(relayKey: string, result: ProbeResult) {
  const now = new Date()

  await prisma.basefm_relay_destinations.update({
    where: { key: relayKey },
    data: result.ok
      ? {
          status: 'healthy',
          last_healthy_at: now,
          last_error_at: null,
          last_error_message: null,
        }
      : {
          status: 'failed',
          last_error_at: now,
          last_error_message: result.error || 'Relay probe failed',
        },
  })
}

export function buildBasefmDistribution({
  availability,
  primaryDj,
  relays = [],
}: BuildDistributionArgs): BasefmDistributionState {
  const originStatus =
    availability === 'live' && primaryDj?.hlsUrl ? 'active' : availability === 'degraded' ? 'degraded' : 'idle'

  const firstPartyStatus: BasefmRelayStatus =
    availability === 'live' && primaryDj?.hlsUrl ? 'healthy' : primaryDj?.hlsUrl ? 'degraded' : 'stopped'

  const requiredRelayStatus = summarizeRequiredRelayStatus(relays)

  let overallStatus: BasefmRelayStatus = 'stopped'
  if (originStatus === 'active' && firstPartyStatus === 'healthy') {
    overallStatus = requiredRelayStatus === 'degraded' ? 'degraded' : 'healthy'
  } else if (originStatus === 'degraded' || firstPartyStatus === 'degraded') {
    overallStatus = 'degraded'
  }

  return {
    origin: {
      status: originStatus,
      playbackId: primaryDj?.playbackId || null,
      hlsUrl: primaryDj?.hlsUrl || null,
    },
    firstParty: {
      status: firstPartyStatus,
      pageUrl: process.env.BASEFM_FIRST_PARTY_URL || DEFAULT_FIRST_PARTY_URL,
      note:
        firstPartyStatus === 'healthy'
          ? 'First-party playback on Agentbot is the canonical listener surface.'
          : 'First-party playback is the source of truth and must be healthy before downstream relays matter.',
    },
    relays,
    requiredRelayStatus,
    overallStatus,
  }
}
