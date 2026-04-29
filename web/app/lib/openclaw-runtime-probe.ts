import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { redis } from '@/app/lib/redis'

export type OpenClawProbeCheck = {
  path: string
  ok: boolean
  status: number | null
  reason: string | null
}

export type OpenClawRuntimeStatus =
  | 'running'
  | 'healthy'
  | 'starting'
  | 'stopped'
  | 'setup'
  | 'unknown'
  | 'unreachable'

export type OpenClawRuntimeProbeResult = {
  status: OpenClawRuntimeStatus
  healthy: boolean
  ready: boolean
  openclawVersion: string
  ffmpeg: {
    available: boolean
    version: string | null
  }
  checks: OpenClawProbeCheck[]
  reason: string | null
  uptime: string | null
}

/**
 * Probe an OpenClaw runtime URL for health and status.
 * Results are cached in Redis for 15 seconds to minimize external network latency.
 */
export async function probeOpenClawRuntime(url: string): Promise<OpenClawRuntimeProbeResult> {
  const normalized = String(url).replace(/\/$/, '')
  const cacheKey = `probe:${normalized}`

  // 1. Try Cache
  if (redis) {
    try {
      const cached = await redis.get<OpenClawRuntimeProbeResult>(cacheKey)
      if (cached) return cached
    } catch (err) {
      console.warn('[Probe] Cache read failed:', err)
    }
  }

  try {
    const [healthRes, readyRes, statusRes] = await Promise.allSettled([
      fetch(`${normalized}/healthz`, {
        signal: AbortSignal.timeout(5000),
        cache: 'no-store',
      }),
      fetch(`${normalized}/readyz`, {
        signal: AbortSignal.timeout(4000),
        cache: 'no-store',
      }),
      fetch(`${normalized}/api/status`, {
        signal: AbortSignal.timeout(5000),
        cache: 'no-store',
      }),
    ])

    const healthOk = healthRes.status === 'fulfilled' && healthRes.value.ok
    const readyOk = readyRes.status === 'fulfilled' && readyRes.value.ok
    const statusOk = statusRes.status === 'fulfilled' && statusRes.value.ok
    const checks: OpenClawProbeCheck[] = [
      {
        path: '/healthz',
        ok: healthOk,
        status: healthRes.status === 'fulfilled' ? healthRes.value.status : null,
        reason: healthRes.status === 'rejected'
          ? healthRes.reason instanceof Error ? healthRes.reason.message : 'request failed'
          : healthRes.value.ok ? null : `HTTP ${healthRes.value.status}`,
      },
      {
        path: '/readyz',
        ok: readyOk,
        status: readyRes.status === 'fulfilled' ? readyRes.value.status : null,
        reason: readyRes.status === 'rejected'
          ? readyRes.reason instanceof Error ? readyRes.reason.message : 'request failed'
          : readyRes.value.ok ? null : `HTTP ${readyRes.value.status}`,
      },
      {
        path: '/api/status',
        ok: statusOk,
        status: statusRes.status === 'fulfilled' ? statusRes.value.status : null,
        reason: statusRes.status === 'rejected'
          ? statusRes.reason instanceof Error ? statusRes.reason.message : 'request failed'
          : statusRes.value.ok ? null : `HTTP ${statusRes.value.status}`,
      },
    ]

    const healthPayload = healthRes.status === 'fulfilled'
      ? await healthRes.value.json().catch(() => ({}))
      : {}
    const statusPayload = statusRes.status === 'fulfilled'
      ? await statusRes.value.json().catch(() => ({}))
      : {}

    const runtimeVersion = typeof healthPayload?.version === 'string'
      ? healthPayload.version
      : typeof statusPayload?.version === 'string'
        ? statusPayload.version
        : DEFAULT_OPENCLAW_VERSION

    const healthFfmpegAvailable =
      typeof healthPayload?.ffmpeg?.available === 'boolean'
        ? healthPayload.ffmpeg.available
        : typeof healthPayload?.runtime?.ffmpeg?.available === 'boolean'
          ? healthPayload.runtime.ffmpeg.available
          : null
    const healthFfmpegVersion =
      typeof healthPayload?.ffmpeg?.version === 'string'
        ? healthPayload.ffmpeg.version
        : typeof healthPayload?.runtime?.ffmpeg?.version === 'string'
          ? healthPayload.runtime.ffmpeg.version
          : null

    const ffmpeg = {
      available:
        typeof statusPayload?.runtime?.ffmpeg?.available === 'boolean'
          ? statusPayload.runtime.ffmpeg.available
          : healthFfmpegAvailable === true,
      version: typeof statusPayload?.runtime?.ffmpeg?.version === 'string'
        ? statusPayload.runtime.ffmpeg.version
        : healthFfmpegVersion,
    }

    const configured = statusPayload?.configured
    const state = typeof statusPayload?.state === 'string' ? statusPayload.state : null
    const running = statusPayload?.running === true
    const uptime = typeof healthPayload?.uptime === 'string'
      ? healthPayload.uptime
      : typeof statusPayload?.uptime === 'string'
        ? statusPayload.uptime
        : null

    const result: OpenClawRuntimeProbeResult = {
      status: 'unknown',
      healthy: healthOk,
      ready: readyOk,
      openclawVersion: runtimeVersion,
      ffmpeg,
      checks,
      reason: null,
      uptime,
    }

    if (statusOk) {
      if (configured === false) {
        result.status = 'setup'
        result.reason = 'Runtime reachable but setup is not complete'
      } else if (running || state === 'running') {
        result.status = 'running'
        result.reason = !healthOk && !readyOk
          ? 'Legacy health probes unavailable; using /api/status'
          : null
      } else if (state === 'stopped' || running === false) {
        result.status = 'stopped'
        result.reason = 'Runtime reachable but process is stopped'
      } else {
        result.status = healthOk && readyOk ? 'healthy' : healthOk ? 'starting' : 'unknown'
        result.reason = 'Runtime reachable but returned a non-standard state'
      }
    } else if (healthOk && readyOk) {
      result.status = 'healthy'
      result.reason = 'Legacy /api/status unavailable; using /healthz and /readyz'
    } else if (healthOk) {
      result.status = 'starting'
      result.reason = 'Health probe is up but readiness is not complete'
    } else {
      result.status = 'unreachable'
      result.reason = checks.find((check) => check.path === '/api/status')?.reason
        || 'Runtime did not answer /api/status and the legacy probes were not healthy'
    }

    // 2. Save to Cache
    if (redis && result.status !== 'unreachable') {
      void redis.set(cacheKey, result, { ex: 15 }).catch(() => {})
    }

    return result
  } catch (error) {
    return {
      status: 'unreachable',
      healthy: false,
      ready: false,
      openclawVersion: DEFAULT_OPENCLAW_VERSION,
      ffmpeg: { available: false, version: null },
      checks: [
        { path: '/healthz', ok: false, status: null, reason: 'probe not executed' },
        { path: '/readyz', ok: false, status: null, reason: 'probe not executed' },
        { path: '/api/status', ok: false, status: null, reason: error instanceof Error ? error.message : 'probe failed' },
      ],
      reason: error instanceof Error ? error.message : 'Runtime probe failed',
      uptime: null,
    }
  }
}
