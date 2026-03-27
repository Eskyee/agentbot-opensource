import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false, needsAuth: true }, { status: 401 })
  }

  try {
    const wallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
      select: { address: true, network: true, walletType: true },
    })

    if (!wallet) {
      return NextResponse.json({
        authenticated: true,
        address: null,
        message: 'No wallet found. Create one from the wallet page.',
      })
    }

    return NextResponse.json({
      authenticated: true,
      address: wallet.address,
      network: wallet.network,
      type: wallet.walletType,
    })
  } catch (error) {
    console.error('[Wallet Address] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
