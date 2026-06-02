import { NextResponse } from 'next/server'
import { resolveGatewayUpstreams } from '@/app/lib/vercel-gateway'

export const runtime = 'nodejs'

export async function GET() {
  const upstreams = resolveGatewayUpstreams()
  if (upstreams.length === 0) {
    return NextResponse.json({
      ok: false,
      status: 'upstream_not_configured',
      endpoint: '/v1/chat/completions',
      requiredEnv: [
        'AGENTBOT_GATEWAY_UPSTREAM_API_KEY',
        'AI_GATEWAY_API_KEY',
        'OPENROUTER_API_KEY',
      ],
    }, { status: 503 })
  }

  const startedAt = Date.now()
  const checks = []

  for (const upstream of upstreams) {
    const response = await fetch(`${upstream.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${upstream.apiKey}` },
      signal: AbortSignal.timeout(10_000),
    }).catch((error) => error instanceof Error ? error : new Error('healthcheck failed'))

    if (response instanceof Error) {
      checks.push({
        provider: upstream.provider,
        ok: false,
        error: response.message,
      })
      continue
    }

    checks.push({
      provider: upstream.provider,
      ok: response.ok,
      upstreamStatus: response.status,
    })

    if (response.ok) {
      return NextResponse.json({
        ok: true,
        status: 'healthy',
        provider: upstream.provider,
        latencyMs: Date.now() - startedAt,
        upstreamStatus: response.status,
        checks,
      })
    }
  }

  return NextResponse.json({
    ok: false,
    status: 'degraded',
    latencyMs: Date.now() - startedAt,
    checks,
  }, { status: 502 })
}
