/**
 * agent-provision-guards.ts — shared subscription + plan-limit checks
 *
 * Extracted from web/app/api/agents/provision/route.ts so that any route
 * which creates an Agent row can enforce the same guardrails. Operator
 * Mode's template-launch endpoint uses this to avoid bypassing plan
 * limits — flagged by Codex as a P1 revenue risk.
 *
 * Keep this file in lockstep with the provision route: if tierLimits or
 * subscription gating changes, update both callers.
 */

import { prisma } from './prisma'
import { isTrialActive } from './trial-utils'

export type ProvisionGuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string; current?: number; limit?: number }

/** Agent-count ceilings per plan. Mirror of the table in provision/route.ts. */
const TIER_LIMITS: Record<string, number> = {
  free: 1,
  underground: 1,
  solo: 1,
  starter: 1,
  collective: 3,
  pro: 3,
  label: 10,
  network: 100,
  enterprise: 100,
}

/** Admins bypass both subscription and agent-limit checks (mirror of provision route). */
function isProvisionAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

/**
 * Assert that `userId` is allowed to provision one more agent. Returns
 * `{ ok: true }` on success, or a structured error with HTTP status on
 * rejection so the caller can pass it straight to NextResponse.json.
 */
export async function assertUserCanProvisionAgent(
  userId: string,
  email: string | null | undefined,
): Promise<ProvisionGuardResult> {
  const isAdmin = isProvisionAdmin(email)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
    },
  })
  const trialActive = isTrialActive(user?.trialEndsAt)

  if (!isAdmin && (!user || (!trialActive && user.subscriptionStatus !== 'active'))) {
    return {
      ok: false,
      status: 402,
      error: 'Active subscription required to provision agents',
    }
  }

  const agentCount = await prisma.agent.count({ where: { userId } })
  const limit = isAdmin ? 999 : (TIER_LIMITS[user?.plan ?? ''] || 1)

  if (agentCount >= limit) {
    return {
      ok: false,
      status: 429,
      error: `Agent limit reached for ${user?.plan ?? 'free'} tier`,
      current: agentCount,
      limit,
    }
  }

  return { ok: true }
}
