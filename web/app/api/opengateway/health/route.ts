import { NextResponse } from 'next/server'
import { resolveGatewayUpstream } from '@/app/lib/opengateway'

export const runtime = 'nodejs'

export async function GET() {
  const upstream = resolveGatewayUpstream()
  if (!upstream) {
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
  const response = await fetch(`${upstream.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${upstream.apiKey}` },
    signal: AbortSignal.timeout(10_000),
  }).catch((error) => error instanceof Error ? error : new Error('healthcheck failed'))

  if (response instanceof Error) {
    return NextResponse.json({
      ok: false,
      status: 'upstream_unreachable',
      provider: upstream.provider,
      latencyMs: Date.now() - startedAt,
      error: response.message,
    }, { status: 502 })
  }

  return NextResponse.json({
    ok: response.ok,
    status: response.ok ? 'healthy' : 'degraded',
    provider: upstream.provider,
    latencyMs: Date.now() - startedAt,
    upstreamStatus: response.status,
  }, { status: response.ok ? 200 : 502 })
}

