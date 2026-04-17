/**
 * operator-routing.ts — User routing rules for Operator Mode
 *
 * Determines whether a user should see the Operator (guided) experience
 * or the existing Advanced experience. Never forces existing users into
 * Operator Mode — only new users with no agents/workflows default there.
 *
 * Rule 5: No migration of current users into Operator Mode by force.
 * Rule 6: Any user may explicitly switch modes.
 */

import { prisma } from './prisma'
import { isOperatorModeEnabled, getGlobalFlags } from './feature-flags'

export type UserMode = 'operator' | 'advanced'

/**
 * Resolve which mode a user should see.
 *
 * Priority:
 *  1. If operator mode is globally disabled → always 'advanced'
 *  2. If user has explicit preferred_mode → use it
 *  3. If user has existing agents/workflows → 'advanced' (existing user)
 *  4. If NEW_USER_OPERATOR_DEFAULT is on → 'operator' (new user)
 *  5. Fallback → 'advanced'
 */
export async function resolveUserMode(userId: string): Promise<UserMode> {
  if (!isOperatorModeEnabled()) return 'advanced'

  // Check explicit preference
  const pref = await prisma.userPreference.findUnique({
    where: { userId_key: { userId, key: 'preferred_mode' } },
  })
  if (pref?.value === 'operator' || pref?.value === 'advanced') {
    return pref.value as UserMode
  }

  // Check if existing user (has agents or workflows)
  const [agentCount, workflowCount] = await Promise.all([
    prisma.agent.count({ where: { userId } }),
    prisma.workflow.count({ where: { userId } }),
  ])

  if (agentCount > 0 || workflowCount > 0) {
    return 'advanced' // Existing users stay on advanced
  }

  // New user — check if default-to-operator is enabled
  const flags = getGlobalFlags()
  return flags.newUserOperatorDefault ? 'operator' : 'advanced'
}

/**
 * Save user's explicit mode preference.
 */
export async function setUserMode(userId: string, mode: UserMode): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId_key: { userId, key: 'preferred_mode' } },
    create: { userId, key: 'preferred_mode', value: mode },
    update: { value: mode },
  })
}

/**
 * Check if a user has completed operator onboarding.
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId_key: { userId, key: 'onboarding_complete' } },
  })
  return pref?.value === 'true'
}

/**
 * Mark operator onboarding as complete.
 */
export async function completeOnboarding(userId: string): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId_key: { userId, key: 'onboarding_complete' } },
    create: { userId, key: 'onboarding_complete', value: 'true' },
    update: { value: 'true' },
  })
}
