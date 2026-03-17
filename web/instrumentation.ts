import { registerOTel } from '@vercel/otel'
import { BraintrustExporter } from '@braintrust/otel'

export function register() {
  registerOTel({
    serviceName: 'agentbot-web',
    traceExporter: new BraintrustExporter({
      parent: 'project_name:agentbot-openclaw',
      filterAISpans: true,
    }),
  })
}
