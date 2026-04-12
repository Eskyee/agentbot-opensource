/**
 * PATCH /api/user/basefm-wallet  — save or clear baseFM wallet address
 * GET   /api/user/basefm-wallet  — return current linked wallet
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const BASE_WALLET_RE = /^0x[0-9a-fA-F]{40}$/

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { basefm_wallet: true },
  })

  return NextResponse.json({ wallet: user?.basefm_wallet ?? null })
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wallet } = await req.json()

  // Allow null/empty to unlink
  if (wallet && !BASE_WALLET_RE.test(wallet)) {
    return NextResponse.json({ error: 'Invalid Base wallet address' }, { status: 400 })
  }

  await prisma.users.update({
    where: { id: session.user.id },
    data:  { basefm_wallet: wallet || null },
  })

  return NextResponse.json({ ok: true, wallet: wallet || null })
}

export const dynamic = 'force-dynamic'
