/**
 * feature-flags.ts — Feature flag system for safe rollouts
 *
 * Flags are resolved from environment variables first, then from
 * the user's persisted preferences (UserSetting table).
 *
 * All flags default to OFF so production is unaffected until
 * explicitly enabled per Vercel environment.
 *
 * Admin bypass: specific admin emails (configured via OPERATOR_ADMIN_EMAILS
 * env var, comma-separated) can test Operator Mode even when the global
 * flag is off. This lets the product owner preview the feature in production
 * without exposing it to real users.
 */

/**
 * Server-side flag resolution from env vars.
 * These are the global "kill switches" — if the env var is falsy,
 * the feature is off for everyone regardless of user preference.
 */
export function getGlobalFlags() {
  return {
    /** Master switch: are the /app/* operator routes available? */
    operatorModeEnabled: env('OPERATOR_MODE_ENABLED'),
    /** Should brand-new users (no agents, no workflows) default to /app/start? */
    newUserOperatorDefault: env('NEW_USER_OPERATOR_DEFAULT'),
    /** Show subtle "Powered by OpenClaw" badge in operator UI */
    showOpenclawBadgeInOperator: env('SHOW_OPENCLAW_BADGE_IN_OPERATOR'),
    /** Are admin-gated /api/debug-* and /api/test-env routes mounted? */
    debugRoutesEnabled: env('DEBUG_ROUTES_ENABLED'),
  }
}

export type FeatureFlags = ReturnType<typeof getGlobalFlags>

/** Check if operator mode is globally enabled */
export function isOperatorModeEnabled(): boolean {
  return getGlobalFlags().operatorModeEnabled
}

/**
 * No hardcoded fallback — OPERATOR_ADMIN_EMAILS env var is required.
 * Per PLATFORM_RULES.md: "do not hardcode emails in source."
 * Set OPERATOR_ADMIN_EMAILS in Vercel env vars (comma-separated).
 */

/**
 * Returns the normalised admin email list from OPERATOR_ADMIN_EMAILS env var.
 * Returns empty array if env var is not set (no admin bypass active).
 */
function getAdminEmails(): string[] {
  const raw = process.env.OPERATOR_ADMIN_EMAILS
  if (!raw) return []
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

/** Is this email an Operator Mode admin (test access even when flag is off)? */
export function isOperatorAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

/**
 * Effective Operator Mode availability for a given user. True when either:
 *  - the global flag is enabled, OR
 *  - the user is an admin (bypass for testing).
 */
export function isOperatorModeEnabledForUser(email: string | null | undefined): boolean {
  return isOperatorModeEnabled() || isOperatorAdmin(email)
}

// ── helpers ──────────────────────────────────────────────────────────────────

function env(key: string): boolean {
  const val = process.env[key]
  if (!val) return false
  return val === '1' || val.toLowerCase() === 'true'
}
