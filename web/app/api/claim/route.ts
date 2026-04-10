import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

const SOLANA_TOKEN_ADDRESS = '9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump'
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'

interface TokenTier {
  minBalance: number
  credits: number
  label: string
}

const TIERS: TokenTier[] = [
  { minBalance: 100_000, credits: 500, label: 'Whale 🐋' },
  { minBalance: 10_000, credits: 150, label: 'Builder 🔧' },
  { minBalance: 1_000, credits: 50, label: 'Holder 💎' },
]

/**
 * POST /api/claim
 * Verify Solana Agentbot token balance and grant credits
 *
 * Body: { solanaAddress: string, email: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const solana_address = body.solana_address || body.solanaAddress
    const { email } = body

    if (!solana_address || !email) {
      return NextResponse.json(
        { error: 'Missing solanaAddress or email' },
        { status: 400 }
      )
    }

    // Validate Solana address format (base58, 32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(solana_address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address' },
        { status: 400 }
      )
    }

    // Check if this wallet already claimed
    const existingClaim = await prisma.credit_claims.findFirst({
      where: { solana_address },
    })

    if (existingClaim) {
      return NextResponse.json(
        {
          error: 'Already claimed',
          claimedAt: existingClaim.created_at,
          credits: existingClaim.credits,
        },
        { status: 409 }
      )
    }

    // Query token balance via Solana RPC
    const balance = await getTokenBalance(solana_address)

    if (balance === null) {
      return NextResponse.json(
        { error: 'Could not verify token balance' },
        { status: 502 }
      )
    }

    // Determine tier
    const tier = TIERS.find((t) => balance >= t.minBalance)

    if (!tier) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          balance,
          minimumRequired: TIERS[TIERS.length - 1].minBalance,
          message: `You need at least ${TIERS[TIERS.length - 1].minBalance.toLocaleString()} Agentbot tokens to claim credits.`,
        },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({
        data: { email, plan: 'free' },
      })
    }

    // Record claim
    await prisma.credit_claims.create({
      data: {
        solana_address,
        email,
        balance,
        credits: tier.credits,
        tier: tier.label,
        user_id: user.id,
      },
    })

    // Add credits to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        referralCredits: { increment: tier.credits },
      },
    })

    return NextResponse.json({
      success: true,
      tier: tier.label,
      credits: tier.credits,
      balance,
      message: `Claimed ${tier.credits} free agent credits as ${tier.label}!`,
    })
  } catch (error) {
    console.error('Claim error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/claim?address=SOLANA_ADDR
 * Check claim eligibility without claiming
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Missing address param' }, { status: 400 })
  }

  const balance = await getTokenBalance(address)

  if (balance === null) {
    return NextResponse.json({ error: 'Could not verify balance' }, { status: 502 })
  }

  const tier = TIERS.find((t) => balance >= t.minBalance)
  const alreadyClaimed = await prisma.credit_claims.findFirst({
    where: { solana_address: address },
  })

  return NextResponse.json({
    balance,
    eligible: !!tier && !alreadyClaimed,
    tier: tier?.label || null,
    credits: tier?.credits || 0,
    alreadyClaimed: !!alreadyClaimed,
    tiers: TIERS.map((t) => ({
      ...t,
      current: tier?.minBalance === t.minBalance,
    })),
  })
}

/**
 * Query Solana RPC for Token-2022 balance
 */
async function getTokenBalance(ownerAddress: string): Promise<number | null> {
  try {
    // Get token accounts for this owner + token mint
    const res = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          ownerAddress,
          { mint: SOLANA_TOKEN_ADDRESS },
          { encoding: 'jsonParsed' },
        ],
      }),
    })

    const data = await res.json()
    const accounts = data?.result?.value || []

    if (accounts.length === 0) return 0

    // Sum all token accounts (some wallets have multiple)
    let total = 0
    for (const account of accounts) {
      const amount =
        account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0
      total += amount
    }

    return total
  } catch (error) {
    console.error('Solana RPC error:', error)
    return null
  }
}

export const dynamic = 'force-dynamic'
