/**
 * Fee Payer Handler — Tempo Gas Sponsorship
 * 
 * Sponsors transaction fees for Agentbot users on Tempo.
 * Users send transactions without holding gas tokens.
 * We pay the fees from our operator wallet.
 * 
 * Route: POST /api/fee-payer
 */

import { Handler } from 'tempo.ts/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { tempo, tempoTestnet } from 'viem/chains'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/lib/auth'

// Select chain based on env
const chain = process.env.TEMPO_TESTNET === 'true' ? tempoTestnet : tempo

// Fee payer account — operator wallet pays gas
const feePayerKey = process.env.TEMPO_FEE_PAYER_KEY as `0x${string}` | undefined

if (!feePayerKey) {
  console.warn('[FeePayer] TEMPO_FEE_PAYER_KEY not set — fee payer disabled')
}

const handler = feePayerKey
  ? Handler.feePayer({
      account: privateKeyToAccount(feePayerKey),
      chain,
      transport: http(
        process.env.TEMPO_TESTNET === 'true'
          ? 'https://rpc.moderato.tempo.xyz'
          : 'https://rpc.tempo.xyz'
      ),
      path: '/api/fee-payer',
      onRequest: async (request) => {
        // Log sponsored transactions for auditing
        console.log(`[FeePayer] Sponsoring tx for method: ${request.method}`)
      },
    })
  : null

// Next.js App Router handler
export async function POST(request: Request) {
  // Require authenticated session for fee sponsorship
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!handler) {
    return NextResponse.json(
      { error: 'Fee payer not configured' },
      { status: 503 }
    )
  }

  return handler.fetch(request)
}

// Health check — require auth since it reveals chain details
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: handler ? 'ready' : 'disabled',
    chain: chain.name,
    chainId: chain.id,
  })
}


export const dynamic = 'force-dynamic';
