/**
 * getAuthOrApiKeySession — unified session resolver for agent-ready routes.
 *
 * Priority:
 *   1. Cookie session / NextAuth JWT (browser/dashboard users)
 *   2. Bearer API key (programmatic agent access)
 *
 * Returns the same AuthSession shape as getAuthSession() so routes
 * can swap the import without any other changes.
 */

import { getAuthSession } from '@/app/lib/getAuthSession'
import { verifyApiKey } from '@/app/lib/verifyApiKey'
import { prisma } from '@/app/lib/prisma'

interface AuthSession {
  user: {
    id: string
    name: string | null
    email: string | null
    isAdmin: boolean
  }
}

export async function getAuthOrApiKeySession(req: Request): Promise<AuthSession | null> {
  // 1. Try cookie / NextAuth session (no-op for Bearer-only requests)
  const session = await getAuthSession()
  if (session) return session

  // 2. Try Bearer API key
  const keyAuth = await verifyApiKey(req)
  if (!keyAuth) return null

  const user = await prisma.user.findUnique({
    where: { id: keyAuth.userId },
    select: { id: true, name: true, email: true },
  })
  if (!user) return null

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = adminEmails.includes((user.email || '').toLowerCase())

  return { user: { id: user.id, name: user.name, email: user.email, isAdmin } }
}
