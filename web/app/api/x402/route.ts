import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

/**
 * x402-Gateway Integration
 * 
 * Connects Agentbot agents to the x402-Tempo payment gateway.
 * Provides colony membership, fitness scoring, and dynamic pricing.
 */

const X402_GATEWAY_URL = process.env.X402_GATEWAY_URL || 'https://x402-gw-v2-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, walletAddress, action } = body

    // List endpoints (public - no auth required)
    if (action === 'endpoints') {
      try {
        const res = await fetch(`${X402_GATEWAY_URL}/gateway/endpoints`, {
          signal: AbortSignal.timeout(10000)
        })

        const data = await res.json() as any
        return NextResponse.json(data)
      } catch (error) {
        // Return default endpoints if gateway doesn't have them
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

    // Require authenticated session for all other actions
    const session = await getServerSession(authOptions)
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

    // Get fitness
    if (action === 'fitness') {
      try {
        const res = await fetch(`${X402_GATEWAY_URL}/gateway/fitness/${agentId}`, {
          signal: AbortSignal.timeout(10000)
        })

        const data = await res.json() as any
        return NextResponse.json(data)
      } catch (error) {
        // Return default fitness if gateway doesn't have endpoint
        return NextResponse.json({
          success: true,
          score: 50,
          tier: 'new',
          details: null
        })
      }
    }

    // Get pricing
    if (action === 'pricing') {
      try {
        const res = await fetch(`${X402_GATEWAY_URL}/gateway/pricing/${agentId}`, {
          signal: AbortSignal.timeout(10000)
        })

        const data = await res.json() as any
        return NextResponse.json(data)
      } catch (error) {
        // Return default pricing if gateway doesn't have endpoint
        return NextResponse.json({
          success: true,
          agentId,
          tier: 'basic',
          pricing: { rate: 0.01, discount: 0 },
          fitness: { score: 50, tier: 'new' }
        })
      }
    }

    // List endpoints
    if (action === 'endpoints') {
      const res = await fetch(`${X402_GATEWAY_URL}/gateway/endpoints`, {
        signal: AbortSignal.timeout(10000)
      })

      const data = await res.json() as any
      return NextResponse.json(data)
    }

    // Make payment
    if (action === 'pay') {
      const { amount, currency, recipient, endpoint, method } = body

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
