import { NextResponse } from 'next/server'
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
      const sessionWalletAddress = getBaseWalletAddressFromSessionUser(session.user)

      if (sessionWalletAddress) {
        return NextResponse.json({
          authenticated: true,
          address: sessionWalletAddress,
          network: 'base',
          type: 'base-auth',
          source: 'session',
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

export const dynamic = 'force-dynamic'
