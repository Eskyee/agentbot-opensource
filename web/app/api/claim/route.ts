import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { ensureFoundingCommunityBadge } from '@/app/lib/communityProgram'
import { createUserSession, attachSessionCookie } from '@/app/lib/session'
import { consumeWalletNonce, issueWalletNonce } from '@/app/lib/wallet-nonce'
import {
  getCommunityRewardTier,
  getCreditClaimByWallet,
  getSolanaTokenBalance,
  recordCreditClaim,
  verifySolanaWalletMessage,
} from '@/app/lib/solanaRewards'

function isValidSolanaAddress(address: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

function isValidClaimMessage(message: string, address: string, nonce: string) {
  if (message.length > 500) return false
  return (
    message.startsWith('Agentbot community rewards claim\n') &&
    message.includes(`Wallet: ${address}`) &&
    message.includes(`Nonce: ${nonce}`) &&
    message.includes('Issued At: ')
  )
}

async function getOrCreateClaimUser(walletAddress: string) {
  const walletEmail = `${walletAddress.toLowerCase()}@wallet.solana.agentbot`
  let user = await prisma.user.findUnique({
    where: { email: walletEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: `Solana:${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        email: walletEmail,
        emailVerified: new Date(),
      },
    })
  }

  return user
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  const wantsNonce = request.nextUrl.searchParams.get('nonce') === '1'

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json({ error: 'Valid Solana address required' }, { status: 400 })
  }

  let claim = null
  let balance: Awaited<ReturnType<typeof getSolanaTokenBalance>>

  try {
    ;[claim, balance] = await Promise.all([
      getCreditClaimByWallet(address),
      getSolanaTokenBalance(address),
    ])
  } catch {
    return NextResponse.json(
      { error: 'Live Solana balance lookup is temporarily unavailable' },
      { status: 502 }
    )
  }

  const tier = getCommunityRewardTier(balance.ui)
  const nonce = wantsNonce ? await issueWalletNonce() : null

  return NextResponse.json({
    address,
    eligible: Boolean(tier) && !claim,
    alreadyClaimed: Boolean(claim),
    claim,
    balance: {
      raw: balance.raw.toString(),
      ui: balance.ui,
    },
    tier: tier
      ? {
          id: tier.id,
          label: tier.label,
          credits: tier.credits,
          minBalance: tier.minBalance,
        }
      : null,
    nonce,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const address = body?.address
  const message = body?.message
  const signature = body?.signature
  const nonce = body?.nonce

  if (!address || !message || !signature || !nonce || !isValidSolanaAddress(address)) {
    return NextResponse.json({ error: 'address, message, signature, and nonce are required' }, { status: 400 })
  }

  const nonceOk = await consumeWalletNonce(nonce)
  if (!nonceOk) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
  }

  if (!isValidClaimMessage(message, address, nonce)) {
    return NextResponse.json({ error: 'Invalid claim message' }, { status: 400 })
  }

  const valid = await verifySolanaWalletMessage({
    address,
    message,
    signatureBase64: signature,
  }).catch(() => false)

  if (!valid) {
    return NextResponse.json({ error: 'Invalid wallet signature' }, { status: 401 })
  }

  const existingClaim = await getCreditClaimByWallet(address)
  if (existingClaim) {
    return NextResponse.json(
      {
        error: 'Wallet already claimed',
        claim: existingClaim,
      },
      { status: 409 }
    )
  }

  let balance: Awaited<ReturnType<typeof getSolanaTokenBalance>>
  try {
    balance = await getSolanaTokenBalance(address)
  } catch {
    return NextResponse.json(
      { error: 'Live Solana balance lookup is temporarily unavailable' },
      { status: 502 }
    )
  }
  const tier = getCommunityRewardTier(balance.ui)
  if (!tier) {
    return NextResponse.json(
      {
        error: 'Wallet is not eligible for rewards',
        balance: { raw: balance.raw.toString(), ui: balance.ui },
      },
      { status: 403 }
    )
  }

  const session = await getAuthSession()
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : await getOrCreateClaimUser(address)

  if (!user) {
    return NextResponse.json({ error: 'Unable to resolve user for claim' }, { status: 500 })
  }

  let result: Awaited<ReturnType<typeof recordCreditClaim>>
  try {
    result = await recordCreditClaim({
      userId: user.id,
      walletAddress: address,
      tier,
      balanceRaw: balance.raw,
      balanceUi: balance.ui,
      txSignature: signature.slice(0, 24),
    })
  } catch (error) {
    const claim = await getCreditClaimByWallet(address)
    if (claim) {
      return NextResponse.json(
        {
          error: 'Wallet already claimed',
          claim,
        },
        { status: 409 }
      )
    }

    console.error('Failed to record Solana reward claim', error)
    return NextResponse.json({ error: 'Unable to record claim right now' }, { status: 500 })
  }

  await ensureFoundingCommunityBadge({
    userId: user.id,
    walletAddress: address,
    rewardStatus: {
      connected: true,
      walletAddress: address,
      claimed: true,
      currentTier: {
        id: tier.id,
        label: tier.label,
        credits: tier.credits,
        minBalance: tier.minBalance,
      },
      balanceUi: balance.ui,
      creditsClaimed: tier.credits,
      claimedAt: new Date().toISOString(),
      availability: 'live',
      detail: null,
    },
  }).catch(() => {})

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'reward',
      title: 'Community rewards claimed',
      message: `${tier.credits} Agentbot credits unlocked for your ${tier.label} holder tier.`,
      data: {
        walletAddress: address,
        tier: tier.id,
        creditsGranted: tier.credits,
        tokenAddress: '9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump',
      },
    },
  }).catch(() => {})

  const response = NextResponse.json({
    success: true,
    walletAddress: address,
    tier: tier.label,
    creditsGranted: tier.credits,
    balance: { raw: balance.raw.toString(), ui: balance.ui },
    claim: result,
  })

  if (!session?.user?.id) {
    const sessionToken = await createUserSession(user.id)
    attachSessionCookie(response, sessionToken)
  }

  return response
}

export const dynamic = 'force-dynamic'
