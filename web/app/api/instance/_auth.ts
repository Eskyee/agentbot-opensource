/**
 * Shared ownership check for /api/instance/[userId] routes.
 *
 * The userId in these routes is the hex agentId returned by the provision
 * endpoint — it is NOT the same as session.user.id (a Prisma CUID). We verify
 * ownership by checking user.openclawInstanceId in the database.
 *
 * Returns:
 *   true          — user is authenticated and owns this agentId
 *   false         — unexpected error
 *   'no_session'  — not authenticated (should show sign-in)
 *   'no_instance' — authenticated but no agent deployed (should show deploy prompt)
 */

import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function verifyInstanceOwnership(userId: string): Promise<boolean | 'no_session' | 'no_instance'> {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) return 'no_session'

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openclawInstanceId: true },
    })

    if (!user?.openclawInstanceId) return 'no_instance'
    return user.openclawInstanceId === userId
  } catch {
    return false
  }
}
