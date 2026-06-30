import { defineAgent } from 'eve'

// Eve — Agentbot's durable agent, powered by Vercel's eve framework.
// Model is routed through Vercel AI Gateway (OIDC auth on Vercel, or
// AI_GATEWAY_API_KEY locally). Provider fallbacks are supported by listing
// multiple model ids.
export default defineAgent({
  model: 'anthropic/claude-sonnet-4.6',
})
