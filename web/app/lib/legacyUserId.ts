import { prisma } from '@/app/lib/prisma'

/**
 * Bridges the modern NextAuth `User` table (cuid String id) to the legacy
 * `users` table (Int id) by matching on email. Many feature routes still point
 * at `users`; this helper is the one legitimate way to reach them from a
 * session.user.id cuid without hitting P2025 or returning stale data.
 *
 * Returns null if the session has no email or no matching legacy row exists.
 */
export async function getLegacyUserIdByEmail(email: string | null | undefined): Promise<number | null> {
  if (!email) return null
  const row = await prisma.users.findUnique({ where: { email }, select: { id: true } })
  return row?.id ?? null
}

/**
 * Same bridge as `getLegacyUserIdByEmail` but creates a legacy `users` row on
 * first call if one does not yet exist. Use this on write paths (wallet link,
 * outcomes, etc) where a missing legacy row should not fail the request —
 * NextAuth-created accounts don't get a legacy row until they hit a feature
 * that requires it.
 */
export async function ensureLegacyUserIdByEmail(email: string | null | undefined): Promise<number | null> {
  if (!email) return null
  const row = await prisma.users.upsert({
    where:  { email },
    update: {},
    create: { email },
    select: { id: true },
  })
  return row.id
}
