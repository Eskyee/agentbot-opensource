/**
 * Trial utilities used across billing and gating logic.
 *
 * A trial is considered active if the stored `trialEndsAt` timestamp sits in the future.
 * Once it expires we fall back to paid access only.
 */

export interface TrialCountdown {
  expired: boolean
  daysLeft: number
  endsAt: string
}

export function isTrialActive(trialEndsAt?: string | Date | null): boolean {
  if (!trialEndsAt) return false
  const ends = typeof trialEndsAt === 'string' ? Date.parse(trialEndsAt) : trialEndsAt.getTime()
  if (Number.isNaN(ends)) return false
  return ends > Date.now()
}

export function getTrialCountdown(trialEndsAt?: string | Date | null): TrialCountdown | null {
  if (!trialEndsAt) return null
  const ends = typeof trialEndsAt === 'string' ? Date.parse(trialEndsAt) : trialEndsAt.getTime()
  if (Number.isNaN(ends)) return null
  const now = Date.now()
  const diff = ends - now
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  return {
    expired: diff <= 0,
    daysLeft,
    endsAt: new Date(ends).toISOString(),
  }
}
