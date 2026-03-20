export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, walletAddress, amount, currency } = body

    const cdpApiKeyId = process.env.CDP_API_KEY_ID
    const cdpApiKeySecret = process.env.CDP_API_KEY_SECRET

    if (!cdpApiKeyId || !cdpApiKeySecret) {
      return NextResponse.json(
        { error: 'Coinbase CDP not configured' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'create_wallet': {
        const response = await fetch('https://api.cdp.coinbase.com/wallet/v2/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Buffer.from(`${cdpApiKeyId}:${cdpApiKeySecret}`).toString('base64')}`,
          },
          body: JSON.stringify({
            name: `agentbot-${session.user.email}`,
            network: 'base-sepolia',
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          return NextResponse.json(
            { error: 'Failed to create wallet', details: error },
            { status: response.status }
          )
        }

        const wallet = await response.json()
        return NextResponse.json({ wallet })
      }

      case 'get_balance': {
        if (!walletAddress) {
          return NextResponse.json(
            { error: 'Wallet address required' },
            { status: 400 }
          )
        }

        const response = await fetch(
          `https://api.cdp.coinbase.com/wallet/v2/accounts/${walletAddress}/balances`,
          {
            headers: {
              'Authorization': `Bearer ${Buffer.from(`${cdpApiKeyId}:${cdpApiKeySecret}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to get balance' },
            { status: response.status }
          )
        }

        const balances = await response.json()
        return NextResponse.json({ balances })
      }

      case 'create_payment': {
        const { planId, planPrice } = body

        const response = await fetch('https://payments.coinbase.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Buffer.from(`${cdpApiKeyId}:${cdpApiKeySecret}`).toString('base64')}`,
          },
          body: JSON.stringify({
            name: `Agentbot ${planId} Plan`,
            description: `Payment for ${planId} plan`,
            local_price: {
              amount: planPrice.toString(),
              currency: currency || 'USD',
            },
            pricing_type: 'fixed_price',
          }),
        })

        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to create payment' },
            { status: response.status }
          )
        }

        const payment = await response.json()
        return NextResponse.json({ payment })
      }

      case 'onramp': {
        const onrampUrl = `https://onramp.coinbase.com/buy?preset=base&defaultFlow=wallet&walletAddress=${walletAddress || ''}`
        return NextResponse.json({ url: onrampUrl })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Coinbase API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  if (action === 'config') {
    return NextResponse.json({
      supportedNetworks: ['base', 'base-sepolia'],
      supportedTokens: ['USDC', 'ETH'],
      features: {
        wallet: !!process.env.CDP_API_KEY_ID,
        onramp: true,
        payments: !!process.env.CDP_API_KEY_ID,
      },
    })
  }

  return NextResponse.json(
    { error: 'Invalid request' },
    { status: 400 }
  )
}
