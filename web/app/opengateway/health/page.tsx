import Link from 'next/link'
import { resolveGatewayUpstream } from '@/app/lib/opengateway'

export const dynamic = 'force-dynamic'

type HealthState = {
  ok: boolean
  status: string
  provider?: string
  upstreamStatus?: number
  latencyMs?: number
  error?: string
}

async function getHealth(): Promise<HealthState> {
  const upstream = resolveGatewayUpstream()
  if (!upstream) {
    return {
      ok: false,
      status: 'upstream_not_configured',
      error: 'Set AGENTBOT_GATEWAY_UPSTREAM_API_KEY, AI_GATEWAY_API_KEY, or OPENROUTER_API_KEY.',
    }
  }

  const startedAt = Date.now()
  const response = await fetch(`${upstream.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${upstream.apiKey}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  }).catch((error) => error instanceof Error ? error : new Error('healthcheck failed'))

  if (response instanceof Error) {
    return {
      ok: false,
      status: 'upstream_unreachable',
      provider: upstream.provider,
      latencyMs: Date.now() - startedAt,
      error: response.message,
    }
  }

  return {
    ok: response.ok,
    status: response.ok ? 'healthy' : 'degraded',
    provider: upstream.provider,
    upstreamStatus: response.status,
    latencyMs: Date.now() - startedAt,
  }
}

export default async function OpenGatewayHealthPage() {
  const health = await getHealth()

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/opengateway" className="font-mono text-xs uppercase tracking-[0.28em] text-orange-500">
            Agentbot / OpenGateway
          </Link>
          <Link href="/playground" className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 hover:text-white">
            Playground
          </Link>
        </div>

        <section className="mt-12 border border-zinc-900 bg-zinc-950 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">Gateway health</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                {health.status}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                This page checks the configured upstream provider used by the OpenAI-compatible
                <code className="mx-1 text-zinc-200">/v1/chat/completions</code>
                endpoint.
              </p>
            </div>
            <span className={`mt-2 h-4 w-4 rounded-full ${health.ok ? 'bg-emerald-400' : 'bg-orange-500'}`} />
          </div>

          <dl className="mt-8 grid gap-px bg-zinc-900 sm:grid-cols-2">
            {[
              ['Provider', health.provider || 'not configured'],
              ['Upstream status', health.upstreamStatus ? String(health.upstreamStatus) : '-'],
              ['Latency', health.latencyMs ? `${health.latencyMs}ms` : '-'],
              ['Endpoint', '/v1/chat/completions'],
            ].map(([label, value]) => (
              <div key={label} className="bg-black p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">{label}</dt>
                <dd className="mt-2 break-all text-sm text-zinc-200">{value}</dd>
              </div>
            ))}
          </dl>

          {health.error ? (
            <div className="mt-6 border border-orange-500/30 bg-orange-500/10 p-4 text-sm leading-6 text-orange-200">
              {health.error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/opengateway" className="bg-white px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-black hover:bg-zinc-200">
              Open console
            </Link>
            <a href="/api/opengateway/health" className="border border-zinc-800 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-300 hover:border-zinc-600 hover:text-white">
              Raw JSON
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

