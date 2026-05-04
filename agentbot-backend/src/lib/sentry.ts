/**
 * Sentry initialization for the agentbot backend.
 *
 * Importing this module triggers `Sentry.init` if (and only if) the
 * `SENTRY_DSN` environment variable is set. When the DSN is missing the SDK
 * stays a no-op, so this is safe to import unconditionally from `index.ts`
 * during local dev, CI, and Railway environments without a configured DSN.
 *
 * The init must run before other modules import `@sentry/node` so that the
 * SDK can patch outgoing http/https/fetch and Express request handlers.
 */
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production'
        ? 0.1
        : 1.0,

    environment:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.NODE_ENV ||
      'development',

    // Filter out predictable transport-level noise that isn't actionable.
    ignoreErrors: ['ECONNRESET', 'EPIPE'],

    beforeSend(event) {
      // Strip predictable PII / auth material before transmitting to Sentry.
      const headers = event.request?.headers;
      if (headers) {
        delete (headers as Record<string, unknown>)['cookie'];
        delete (headers as Record<string, unknown>)['authorization'];
        delete (headers as Record<string, unknown>)['x-agent-signature'];
      }
      return event;
    },
  });
}

export { Sentry };
