/**
 * /api/wallet/base-link — manage the linked Base wallet for the current account.
 *
 * GET    → { address }              the currently linked Base address
 * DELETE → { ok: true }            unlink (clear) the Base address
 *
 * Linking happens via POST /api/wallet-auth (verifies signature, sets vaultId).
 * This route is the read/clear side so users can change wallets from Settings.
 */
import { NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getBaseWalletAddressFromSessionUser } from '@/app/lib/base-wallet'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  // Source of truth: the linked address on the user (vaultId), with the
  // wallet-email derivation as a fallback for anonymous wallet users.
  const user = await prisma.user
    .findUnique({ where: { id: session.user.id }, select: { vaultId: true } })
    .catch(() => null)
  const linked = user?.vaultId && isAddress(user.vaultId) ? user.vaultId : null
  const address = linked ?? getBaseWalletAddressFromSessionUser(session.user)
  return NextResponse.json({ authenticated: true, address: address ?? null })
}

export async function DELETE() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { vaultId: null },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[base-link] unlink failed', error)
    return NextResponse.json({ error: 'Failed to unlink wallet' }, { status: 500 })
  }
}
