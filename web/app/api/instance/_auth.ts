/**
 * Shared ownership check for /api/instance/[userId] routes.
 *
 * The userId in these routes is the hex agentId returned by the provision
 * endpoint — it is NOT the same as session.user.id (a Prisma CUID). We verify
 * ownership by checking user.openclawInstanceId in the database.
 *
 * Returns true if the authenticated user owns the given agentId, false otherwise.
 */

import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function verifyInstanceOwnership(userId: string): Promise<boolean> {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) return false

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openclawInstanceId: true },
    })

    return !!user?.openclawInstanceId && user.openclawInstanceId === userId
  } catch {
    return false
  }
}
