/**
 * Sentry server-runtime configuration. Loaded by `instrumentation.ts` when the
 * Next.js server runtime is `nodejs`.
 *
 * SENTRY_DSN must be set in the environment for this to do anything. If it is
 * empty, `Sentry.init` is a safe no-op — the SDK will just discard events.
 */
import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance monitoring. 10% of transactions in prod, everything in dev,
    // overridable via SENTRY_TRACES_SAMPLE_RATE for tuning without redeploys.
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production'
        ? 0.1
        : 1.0,

    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,

    // Auto-instrument Prisma + outgoing fetch + http alongside the existing
    // @vercel/otel setup. Sentry detects @vercel/otel and integrates with the
    // same trace context, so we get one unified trace per request.
    integrations: [
      Sentry.prismaIntegration(),
    ],

    // Ignore noisy errors that aren't actionable.
    ignoreErrors: [
      // Next.js routing internals
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
      // Aborted client requests show up as ECONNRESET
      'ECONNRESET',
    ],

    // Strip out predictable PII before send.
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['cookie']
        delete event.request.headers['authorization']
        delete event.request.headers['x-api-key']
      }
      return event
    },
  })
}
