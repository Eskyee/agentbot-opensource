/**
 * PATCH /api/user/x-handle  — save or clear X/Twitter handle
 * GET   /api/user/x-handle  — return current handle
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getLegacyUserIdByEmail } from '@/app/lib/legacyUserId'

// Allow letters, numbers, underscores — X handle rules
const X_HANDLE_RE = /^[a-zA-Z0-9_]{1,50}$/

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const legacyId = await getLegacyUserIdByEmail(session.user.email)
  if (!legacyId) return NextResponse.json({ handle: null })

  const user = await prisma.users.findUnique({
    where:  { id: legacyId },
    select: { x_handle: true },
  })

  return NextResponse.json({ handle: user?.x_handle ?? null })
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { handle } = await req.json()
  const clean = handle ? String(handle).trim().replace(/^@/, '') : null

  if (clean && !X_HANDLE_RE.test(clean)) {
    return NextResponse.json({ error: 'Invalid X handle' }, { status: 400 })
  }

  const legacyId = await getLegacyUserIdByEmail(session.user.email)
  if (!legacyId) return NextResponse.json({ error: 'Legacy user record not found' }, { status: 404 })

  await prisma.users.update({
    where: { id: legacyId },
    data:  { x_handle: clean || null },
  })

  return NextResponse.json({ ok: true, handle: clean || null })
}

export const dynamic = 'force-dynamic'
