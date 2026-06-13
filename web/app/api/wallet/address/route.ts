import { NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getBaseWalletAddressFromSessionUser } from '@/app/lib/base-wallet'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false, needsAuth: true }, { status: 401 })
  }

  try {
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: session.user.id,
        network: { in: ['base', 'base-mainnet', 'base-sepolia'] },
      },
      select: { address: true, network: true, walletType: true },
    })

    if (!wallet) {
      // Linked-once address: the user confirmed ownership via Sign in with Base
      // (stored on user.vaultId). Makes "link once, use everywhere" work for
      // DJs who signed in with a real email.
      const linkedUser = await prisma.user
        .findUnique({ where: { id: session.user.id }, select: { vaultId: true } })
        .catch(() => null)
      const linked = linkedUser?.vaultId && isAddress(linkedUser.vaultId) ? linkedUser.vaultId : null

      const sessionWalletAddress = linked ?? getBaseWalletAddressFromSessionUser(session.user)

      if (sessionWalletAddress) {
        return NextResponse.json({
          authenticated: true,
          address: sessionWalletAddress,
          network: 'base',
          type: 'base-auth',
          source: linked ? 'linked' : 'session',
        })
      }

      return NextResponse.json({
        authenticated: true,
        address: null,
        message: 'No Base wallet linked. Sign in with Base to use send and receive.',
      })
    }

    return NextResponse.json({
      authenticated: true,
      address: wallet.address,
      network: wallet.network,
      type: wallet.walletType,
      source: 'managed',
    })
  } catch (error) {
    console.error('[Wallet Address] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}

