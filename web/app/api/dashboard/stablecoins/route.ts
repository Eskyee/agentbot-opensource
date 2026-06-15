import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Wallet info — would connect to ClawBank/CDP in production
  return NextResponse.json({
    address: null, // Populated when wallet is provisioned
    chain: 'Base',
    balance: 0,
    currency: 'USDC',
    recentTxns: [],
  })
}
