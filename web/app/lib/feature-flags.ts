/**
 * feature-flags.ts — Feature flag system for safe rollouts
 *
 * Flags are resolved from environment variables first, then from
 * the user's persisted preferences (UserSetting table).
 *
 * All flags default to OFF so production is unaffected until
 * explicitly enabled per Vercel environment.
 *
 * Admin bypass: specific admin emails (configured via OPERATOR_ADMIN_EMAILS,
 * with a built-in fallback list) can test Operator Mode even when the global
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
  }
}

export type FeatureFlags = ReturnType<typeof getGlobalFlags>

/** Check if operator mode is globally enabled */
export function isOperatorModeEnabled(): boolean {
  return getGlobalFlags().operatorModeEnabled
}

/**
 * Built-in admin fallback — used when OPERATOR_ADMIN_EMAILS env var is unset.
 * Keeps admin-testing working even if the env var is not configured in Vercel yet.
 */
const DEFAULT_ADMIN_EMAILS = [
  'djescaba@icloud.com',
  'eskyjunglelab@gmail.com',
]

/**
 * Returns the normalised admin email list. Reads OPERATOR_ADMIN_EMAILS
 * (comma-separated) if set, otherwise falls back to DEFAULT_ADMIN_EMAILS.
 */
function getAdminEmails(): string[] {
  const raw = process.env.OPERATOR_ADMIN_EMAILS
  const list = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_ADMIN_EMAILS
  return list.map((e) => e.toLowerCase())
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
