import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, decodeAbiParameters, http } from 'viem'
import { worldchain } from 'viem/chains'
import { getAuthSession } from '@/app/lib/getAuthSession'

const AGENT_BOOK_CONTRACT = '0xA23aB2712eA7BBa896930544C7d6636a96b944dA'
const AGENT_BOOK_ABI = [
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'getNextNonce',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
const APP_ID = 'app_a7c3e2b6b83927251a0db5345bd7146a'
const ACTION = 'agentbook-registration'
const DEFAULT_RELAY_URL = 'https://x402-worldchain.vercel.app'
const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/

function normalizeProof(rawProof: string) {
  if (rawProof.startsWith('[')) {
    try {
      const parsed = JSON.parse(rawProof)
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed
      }
    } catch {
      // Fall through to ABI decode.
    }
  }

  try {
    const decoded = decodeAbiParameters([{ type: 'uint256[8]' }], rawProof as `0x${string}`)[0]
    return decoded.map(value => `0x${value.toString(16).padStart(64, '0')}`)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const authSession = await getAuthSession()
  if (!authSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const address = typeof body?.address === 'string' ? body.address.trim() : ''

  if (!EVM_ADDRESS_PATTERN.test(address)) {
    return NextResponse.json(
      { error: 'Valid EVM address required' },
      { status: 400 }
    )
  }

  try {
    const client = createPublicClient({
      chain: worldchain,
      transport: http(process.env.WORLD_CHAIN_RPC_URL),
    })
    const nonce = await client.readContract({
      address: AGENT_BOOK_CONTRACT,
      abi: AGENT_BOOK_ABI,
      functionName: 'getNextNonce',
      args: [address as `0x${string}`],
    })

    return NextResponse.json({
      address,
      nonce: nonce.toString(),
      appId: APP_ID,
      action: ACTION,
      relayUrl: process.env.AGENTKIT_RELAY_URL || DEFAULT_RELAY_URL,
      contract: AGENT_BOOK_CONTRACT,
    })
  } catch (error) {
    console.error('[agentkit/register] prepare failed:', error)
    return NextResponse.json(
      { error: 'Failed to prepare AgentKit registration request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const authSession = await getAuthSession()
  if (!authSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const address = typeof body?.address === 'string' ? body.address.trim() : ''
  const root = typeof body?.root === 'string' ? body.root : ''
  const nonce = typeof body?.nonce === 'string' ? body.nonce : ''
  const nullifierHash = typeof body?.nullifierHash === 'string' ? body.nullifierHash : ''
  const rawProof = typeof body?.proof === 'string' ? body.proof : ''

  if (!EVM_ADDRESS_PATTERN.test(address) || !root || !nonce || !nullifierHash || !rawProof) {
    return NextResponse.json(
      { error: 'Complete AgentKit proof payload required' },
      { status: 400 }
    )
  }

  const proof = normalizeProof(rawProof)
  if (!proof) {
    return NextResponse.json(
      { error: 'Unexpected proof format returned by World ID' },
      { status: 400 }
    )
  }

  try {
    const relayBase = process.env.AGENTKIT_RELAY_URL || DEFAULT_RELAY_URL
    const response = await fetch(`${relayBase.replace(/\/$/, '')}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: address,
        root,
        nonce,
        nullifierHash,
        proof,
        contract: AGENT_BOOK_CONTRACT,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `Relay registration failed: ${response.status}: ${text}` },
        { status: 502 }
      )
    }

    const result = await response.json().catch(() => ({}))
    return NextResponse.json({
      success: true,
      txHash: typeof result?.txHash === 'string' ? result.txHash : null,
    })
  } catch (error) {
    console.error('[agentkit/register] submit failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit AgentKit registration' },
      { status: 500 }
    )
  }
}
