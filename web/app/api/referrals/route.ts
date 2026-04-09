/**
 * GET /api/referrals
 * 
 * Get user's referral data and statistics
 */

import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's referral data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralCredits: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get referral count
    const totalReferrals = await prisma.referral.count({
      where: { referrerId: userId }
    })

    // Get converted (rewarded) referrals
    const convertedReferrals = await prisma.referral.count({
      where: { 
        referrerId: userId,
        referrerReward: true 
      }
    })

    // Calculate stats
    const successfulReferrals = convertedReferrals
    const creditEarned = successfulReferrals * 10 // £10 per referral
    const pendingReferrals = totalReferrals - successfulReferrals

    // Generate referral link if code exists
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.raveculture.xyz'
    const referralLink = user.referralCode 
      ? `${baseUrl}/register?ref=${user.referralCode}`
      : null

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink,
      credits: user.referralCredits,
      stats: {
        successfulReferrals,
        creditEarned,
        totalReferrals,
        pendingReferrals
      }
    })

  } catch (error) {
    console.error('[Referrals API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
