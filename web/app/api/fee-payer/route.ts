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
import { http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { tempo, tempoTestnet } from 'viem/chains'
import { NextResponse } from 'next/server'

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
  if (!handler) {
    return NextResponse.json(
      { error: 'Fee payer not configured' },
      { status: 503 }
    )
  }

  return handler.fetch(request)
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: handler ? 'ready' : 'disabled',
    chain: chain.name,
    chainId: chain.id,
  })
}
