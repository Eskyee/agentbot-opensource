/**
 * MPP Voucher API — Off-chain Debit
 * 
 * POST /api/wallet/sessions/voucher
 * 
 * Process a signed voucher for off-chain billing.
 * Deducts from session balance without on-chain transaction.
 */

import { NextResponse } from 'next/server'
import type { Address } from 'viem'
import { processVoucher, type Voucher } from '@/lib/mpp/sessions'
import { PLUGIN_PRICING } from '@/lib/mpp/middleware'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, userAddress, plugin, signature, nonce } = body as {
      sessionId: string
      userAddress: Address
      plugin: string
      signature: `0x${string}`
      nonce: string
    }

    // Validate required fields
    if (!sessionId || !userAddress || !plugin || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userAddress, plugin, signature, nonce' },
        { status: 400 }
      )
    }

    // Get pricing for plugin
    const pricing = PLUGIN_PRICING[plugin]
    if (!pricing) {
      return NextResponse.json(
        { error: `Unknown plugin: ${plugin}` },
        { status: 400 }
      )
    }

    // Build voucher
    const voucher: Voucher = {
      sessionId,
      userAddress,
      amount: pricing.amount,
      plugin,
      nonce,
      timestamp: Date.now(),
      signature,
    }

    // Process voucher (off-chain debit)
    const result = processVoucher(voucher)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id: result.session.id,
        spent: result.session.spent,
        remaining: result.session.remaining,
        pendingVouchers: result.session.vouchers.length,
      },
      voucher: {
        amount: pricing.amount,
        plugin,
        description: pricing.description,
      },
    })
  } catch (error) {
    console.error('[Voucher API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process voucher' },
      { status: 500 }
    )
  }
}
