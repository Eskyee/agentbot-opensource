import { registerOTel } from '@vercel/otel'

export function register() {
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