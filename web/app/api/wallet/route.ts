import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Coinbase, Wallet } from '@coinbase/cdp-sdk'

// Initialize CDP SDK
const initCDP = () => {
  if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
    throw new Error('CDP API keys not configured')
  }
  
  Coinbase.configure({
    apiKeyName: process.env.CDP_API_KEY_NAME,
    privateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
  })
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    initCDP()

    // TODO: Fetch wallet data from database
    // For now, return placeholder
    return NextResponse.json({
      address: null,
      balance: '0',
      network: 'base-sepolia'
    })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    initCDP()

    const { action } = await req.json()

    if (action === 'create') {
      // Create new wallet
      const wallet = await Wallet.create()
      const address = await wallet.getDefaultAddress()

      // TODO: Store wallet data in database encrypted
      // wallet.export() returns seed that must be stored securely

      return NextResponse.json({
        address: address.getId(),
        network: wallet.getNetworkId(),
        created: true
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Wallet creation error:', error)
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
  }
}
