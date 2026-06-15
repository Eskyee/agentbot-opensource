/**
 * Sentry edge-runtime configuration. Loaded by `instrumentation.ts` when the
 * Next.js server runtime is `edge` (e.g. middleware, edge API routes).
 *
 * The edge runtime does not support Node-specific integrations (Prisma, fs,
 * etc.), so this config is intentionally smaller than the server config.
 */
import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production'
        ? 0.1
        : 1.0,

    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
  })
}
