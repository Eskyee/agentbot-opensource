/**
 * feature-flags.ts — Feature flag system for safe rollouts
 *
 * Flags are resolved from environment variables first, then from
 * the user's persisted preferences (UserSetting table).
 *
 * All flags default to OFF so production is unaffected until
 * explicitly enabled per Vercel environment.
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

// ── helpers ──────────────────────────────────────────────────────────────────

function env(key: string): boolean {
  const val = process.env[key]
  if (!val) return false
  return val === '1' || val.toLowerCase() === 'true'
}
