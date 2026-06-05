import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyMessage } from 'viem'

const FREE_DAILY_LIMIT = 5

/**
 * GET /api/free-tier/check?wallet=0x...
 * Returns remaining free messages for today
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const usage = await prisma.freeUsage.findUnique({
    where: {
      walletAddress_date: {
        walletAddress: wallet.toLowerCase(),
        date: today,
      },
    },
  })

  const used = usage?.messagesUsed || 0
  const remaining = Math.max(0, FREE_DAILY_LIMIT - used)

  return NextResponse.json({
    wallet: wallet.toLowerCase(),
    date: today.toISOString(),
    used,
    remaining,
    limit: FREE_DAILY_LIMIT,
    canMessage: remaining > 0,
  })
}

/**
 * POST /api/free-tier/check
 * Body: { wallet: "0x...", action: "use" | "check" }
 * "use" increments the counter, "check" just reads
 */
export async function POST(req: NextRequest) {
  const { wallet, action, message, signature } = await req.json()

  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 })
  }

  // Verify wallet ownership via signature
  if (message && signature) {
    try {
      const recovered = await verifyMessage({ message, signature })
      if (recovered.toLowerCase() !== wallet.toLowerCase()) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const walletLower = wallet.toLowerCase()

  if (action === 'check') {
    const usage = await prisma.freeUsage.findUnique({
      where: {
        walletAddress_date: {
          walletAddress: walletLower,
          date: today,
        },
      },
    })

    const used = usage?.messagesUsed || 0
    const remaining = Math.max(0, FREE_DAILY_LIMIT - used)

    return NextResponse.json({
      wallet: walletLower,
      used,
      remaining,
      limit: FREE_DAILY_LIMIT,
      canMessage: remaining > 0,
    })
  }

  if (action === 'use') {
    // Upsert: increment usage count
    const usage = await prisma.freeUsage.upsert({
      where: {
        walletAddress_date: {
          walletAddress: walletLower,
          date: today,
        },
      },
      update: {
        messagesUsed: { increment: 1 },
      },
      create: {
        walletAddress: walletLower,
        date: today,
        messagesUsed: 1,
      },
    })

    const remaining = Math.max(0, FREE_DAILY_LIMIT - usage.messagesUsed)

    return NextResponse.json({
      wallet: walletLower,
      used: usage.messagesUsed,
      remaining,
      limit: FREE_DAILY_LIMIT,
      canMessage: remaining > 0,
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
