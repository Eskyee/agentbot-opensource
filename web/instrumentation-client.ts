/**
 * Sentry client-runtime configuration. Next.js 15+ loads this automatically in
 * the browser bundle when present.
 *
 * NEXT_PUBLIC_SENTRY_DSN must be set in the environment for this to do
 * anything. If empty, `Sentry.init` is a safe no-op.
 */
import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Browser performance: 10% of page loads in prod, everything in dev.
    // Overridable via NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE.
    tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production'
        ? 0.1
        : 1.0,

    // Session replay: only 10% of normal sessions, but 100% of sessions with
    // errors so we can see what the user did before it broke.
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
      process.env.NEXT_PUBLIC_VERCEL_ENV ||
      process.env.NODE_ENV,

    // Session Replay is added only when the installed SDK exposes it
    // (type defs / API vary by @sentry/nextjs version).
    integrations: (() => {
      const s = Sentry as unknown as { replayIntegration?: (opts: unknown) => unknown }
      return typeof s.replayIntegration === 'function'
        ? [s.replayIntegration({ maskAllText: true, blockAllMedia: true })]
        : []
    })() as Parameters<typeof Sentry.init>[0]['integrations'],

    // Filter out noise that isn't actionable.
    ignoreErrors: [
      // Browser extensions and ad-blockers commonly throw these.
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // User aborted a fetch (closed tab, navigated away).
      'AbortError',
      // Common pattern in console scripts.
      "Can't find variable: ZiteReader",
      // User declined a wallet prompt (signature/transaction). This is a
      // normal user action via viem/wagmi, not an application error.
      'UserRejectedRequestError',
      /User rejected the request/,
      /User denied (transaction|message) signature/,
      // EIP-1193 user-rejection code, in case it surfaces as a generic error.
      /\b4001\b.*rejected/i,
    ],
  })
}

// Required for Next.js navigation instrumentation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
