import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

/**
 * x402-Gateway Integration
 * 
 * Connects Agentbot agents to the x402-Tempo payment gateway.
 * Provides colony membership, fitness scoring, and dynamic pricing.
 */

const X402_GATEWAY_URL = process.env.X402_GATEWAY_URL || 'https://YOUR_SERVICE_URL'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, walletAddress, action } = body

    // Public actions (no auth required)
    if (action === 'endpoints' || action === 'fitness' || action === 'pricing') {
      if (action === 'endpoints') {
        try {
          const res = await fetch(`${X402_GATEWAY_URL}/gateway/endpoints`, {
            signal: AbortSignal.timeout(10000)
          })
          const data = await res.json() as any
          return NextResponse.json(data)
        } catch (error) {
          return NextResponse.json({
            success: true,
            endpoints: [
              { slug: '/gateway/colony/join', description: 'Join agent colony', price: 'Free' },
              { slug: '/gateway/fitness/:agentId', description: 'Get agent fitness score', price: 'Free' },
              { slug: '/gateway/pricing/:agentId', description: 'Get dynamic pricing', price: 'Free' },
              { slug: '/gateway/pay', description: 'Make payment', price: 'Variable' },
            ]
          })
        }
      }

      if (action === 'fitness') {
        const id = agentId || 'atlas'
        try {
          const res = await fetch(`${X402_GATEWAY_URL}/gateway/fitness/${id}`, {
            signal: AbortSignal.timeout(10000)
          })
          const data = await res.json() as any
          return NextResponse.json(data)
        } catch (error) {
          return NextResponse.json({ success: true, score: 50, tier: 'new', details: null })
        }
      }

      if (action === 'pricing') {
        const id = agentId || 'atlas'
        try {
          const res = await fetch(`${X402_GATEWAY_URL}/gateway/pricing/${id}`, {
            signal: AbortSignal.timeout(10000)
          })
          const data = await res.json() as any
          return NextResponse.json(data)
        } catch (error) {
          return NextResponse.json({
            success: true, agentId: id, tier: 'basic',
            pricing: { rate: 0.01, discount: 0 },
            fitness: { score: 50, tier: 'new' }
          })
        }
      }
    }

    // Require authenticated session for all other actions
    const session = await getAuthSession()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }

    if (!agentId) {
      return NextResponse.json({
        success: false,
        error: 'agentId required',
      }, { status: 400 })
    }

    // Join colony
    if (action === 'join-colony') {
      const res = await fetch(`${X402_GATEWAY_URL}/gateway/colony/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, walletAddress }),
        signal: AbortSignal.timeout(10000)
      })

      const data = await res.json() as any
      return NextResponse.json(data)
    }

    // Make payment (REQUIRES AUTH + AMOUNT LIMITS)
    if (action === 'pay') {
      const { amount, currency, recipient, endpoint, method } = body

      // Security: amount limits
      if (!amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
      }
      if (amount > 100) {
        return NextResponse.json({ success: false, error: 'Amount exceeds $100 limit. Contact support for higher limits.' }, { status: 400 })
      }

      // Security: recipient required
      if (!recipient) {
        return NextResponse.json({ success: false, error: 'Recipient required' }, { status: 400 })
      }

      // Security: validate recipient address format (EVM or Solana)
      const isEVM = /^0x[a-fA-F0-9]{40}$/.test(recipient)
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient)
      if (!isEVM && !isSolana) {
        return NextResponse.json({ success: false, error: 'Invalid recipient address' }, { status: 400 })
      }

      // Security: log the payment for audit
      console.log(`[x402-pay] User ${session.user.email} sending $${amount} ${currency || 'USDC'} to ${recipient} via ${method || 'default'}`)

      const res = await fetch(`${X402_GATEWAY_URL}/gateway/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, amount, currency, recipient, endpoint, method }),
        signal: AbortSignal.timeout(15000)
      })

      const data = await res.json() as any
      return NextResponse.json(data)
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: join-colony, fitness, pricing, endpoints, or pay',
    }, { status: 400 })

  } catch (error: unknown) {
    console.error('[x402] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'x402 gateway error',
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check for x402 gateway
    const res = await fetch(`${X402_GATEWAY_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    })

    const data = await res.json() as any
    return NextResponse.json({
      gateway: X402_GATEWAY_URL,
      ...data
    })
  } catch (error: unknown) {
    return NextResponse.json({
      gateway: X402_GATEWAY_URL,
      status: 'unreachable',
      error: error instanceof Error ? error.message : 'Connection failed'
    }, { status: 503 })
  }
}


export const dynamic = 'force-dynamic';