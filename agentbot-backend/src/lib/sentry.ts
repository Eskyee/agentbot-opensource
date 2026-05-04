import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || 'development',
    ignoreErrors: ['ECONNRESET', 'EPIPE'],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
        delete event.request.headers['x-agent-signature'];
      }
      return event;
    },
  });
}

export { Sentry };
