import { registerOTel } from '@vercel/otel'

// Next.js calls this on cold start of any server runtime (nodejs or edge).
// Registers the @vercel/otel exporter for tracing in the Vercel dashboard.
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

}
