import type { NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { verifyBasefmSessionToken } from '@/app/lib/basefmSession'
import { prisma } from '@/app/lib/prisma'

// Mirrors CURRENT_SESSION_STATUSES used by the streams route.
const ACTIVE_SESSION_STATUSES = ['active', 'live']

// The optional simulcast relays a DJ may manage from the stream page.
// The required station relay (basefm-space) stays admin-only.
export const OPTIONAL_RELAY_KEYS = ['x-live', 'youtube-main']

export type RelayWriteAuth =
  | { ok: true; isAdmin: boolean }
  | { ok: false; status: number; error: string }

/**
 * Authorize a write to the (global) baseFM relay destinations / stream keys.
 *
 * Allowed for:
 *  - platform admins (full access), or
 *  - the owner of an active baseFM stream session, proven via the
 *    `x-basefm-session` token tied to a live `dj_sessions` row.
 *
 * Stream owners are NOT admins — callers must additionally restrict them to
 * OPTIONAL_RELAY_KEYS and refuse `required: true` (see route handlers).
 */
export async function authorizeBasefmRelayWrite(request: NextRequest): Promise<RelayWriteAuth> {
  // 1. Active stream owner via session token (same proof the streams route uses).
  const token = request.headers.get('x-basefm-session')
  if (token) {
    const payload = verifyBasefmSessionToken(token)
    if (payload) {
      const djSession = await prisma.dj_sessions.findUnique({ where: { id: payload.sessionId } })
      if (
        djSession &&
        ACTIVE_SESSION_STATUSES.includes(djSession.status) &&
        djSession.wallet.toLowerCase() === payload.wallet.toLowerCase()
      ) {
        return { ok: true, isAdmin: false }
      }
    }
  }

  // 2. Platform admin (operator) — full access, no active stream required.
  const session = await getAuthSession()
  if (session?.user?.email && isAdminEmail(session.user.email)) {
    return { ok: true, isAdmin: true }
  }

  return {
    ok: false,
    status: 403,
    error: 'Start your stream (or sign in as an operator) to manage relays.',
  }
}
