import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LIQUID_RPC_URL = process.env.LIQUID_RPC_URL || 'https://elements-liquid-production.up.railway.app'
const LIQUID_RPC_USER = process.env.LIQUID_RPC_USER || 'liquidrpc'
const LIQUID_RPC_PASS = process.env.LIQUID_RPC_PASS || 'liquidpass2026secure'

async function liquidRpc(method: string, params: unknown[] = []) {
  try {
    const res = await fetch(LIQUID_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${LIQUID_RPC_USER}:${LIQUID_RPC_PASS}`).toString('base64')}`,
      },
      body: JSON.stringify({ jsonrpc: '1.0', id: 'agentbot', method, params }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return { ok: true, result: data.result, error: data.error }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed'
    return { ok: false, error: msg }
  }
}

export async function GET() {
  const [info, blockCount] = await Promise.all([
    liquidRpc('getblockchaininfo'),
    liquidRpc('getblockcount'),
  ])

  return NextResponse.json({
    status: info.ok ? 'connected' : 'unreachable',
    chain: info.result?.chain || 'liquidv1',
    blocks: blockCount.result || 0,
    headers: info.result?.headers || 0,
    bestBlockHash: info.result?.bestblockhash || null,
    pruned: info.result?.pruned ?? true,
    sizeOnDisk: info.result?.size_on_disk || 0,
    verificationProgress: info.result?.verificationprogress || 0,
    isSynched: info.ok && info.result?.verificationprogress > 0.99,
  })
}
