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

    // Drop React hydration mismatches that originate from in-app browsers
    // (Twitter/X, Facebook, Instagram, etc.) and known DOM-injecting webviews.
    // Those clients mutate the server HTML before React hydrates, which trips a
    // hydration error we can't fix in app code. Real hydration bugs from normal
    // browsers (Chrome/Firefox/desktop Safari) still report.
    beforeSend(event, hint) {
      const original = hint?.originalException as { message?: string } | undefined
      const msg =
        original?.message ||
        event.exception?.values?.[0]?.value ||
        (typeof event.message === 'string' ? event.message : '') ||
        ''
      const isHydration =
        /hydrat|did not match|server rendered HTML|Text content does not match|Minified React error #(418|421|422|423|425)/i.test(
          msg
        )
      if (isHydration && typeof navigator !== 'undefined') {
        const inAppBrowser =
          /(Twitter|FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|BytedanceWebview|musical_ly|Snapchat|LinkedInApp|Pinterest|GSA\/|DuckDuckGo)/i.test(
            navigator.userAgent || ''
          )
        if (inAppBrowser) return null
      }
      return event
    },
  })
}

// Required for Next.js navigation instrumentation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
