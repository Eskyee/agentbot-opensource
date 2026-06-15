import { registerOTel } from '@vercel/otel'

// Next.js calls this on cold start of any server runtime (nodejs or edge).
// We register two things:
//   1. The existing @vercel/otel exporter (kept as-is for the Vercel dashboard).
//   2. Sentry, which auto-detects @vercel/otel and integrates into the same
//      trace context. Sentry takes the runtime-specific config from
//      sentry.server.config.ts or sentry.edge.config.ts.
//
// SENTRY_DSN must be set in the env for Sentry to actually send data — if it
// is missing the SDK initialises into a no-op state and adds zero overhead.
export async function register() {
  registerOTel({
    serviceName: 'agentbot-web',
    instrumentationConfig: {
      fetch: {
        ignoreUrls: [
          /vercel\.com/,
          /api\.github\.com/,
          /localhost/,
        ],
      },
    },
  })

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Sentry uses this to forward unhandled errors from React Server Components
// to the same project as the rest of the runtime instrumentation.
export { captureRequestError as onRequestError } from '@sentry/nextjs'
