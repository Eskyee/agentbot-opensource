import { gateway } from 'ai'

// Models routed through Vercel AI Gateway.
// On Vercel, auth is automatic via OIDC; locally set AI_GATEWAY_API_KEY.
// Slugs are env-overridable per deployment.
export const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL || 'anthropic/claude-sonnet-4.6'
export const DEMO_MODEL = process.env.AI_GATEWAY_DEMO_MODEL || 'anthropic/claude-haiku-4.5'

// Returns a Gateway language model for the given slug (defaults to DEFAULT_MODEL).
export const gatewayModel = (id?: string) => gateway(id ?? DEFAULT_MODEL)
