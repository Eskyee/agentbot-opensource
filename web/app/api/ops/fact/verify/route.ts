import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

// Mock Merkle proof verification — real implementation would use a Merkle tree
function generateMockProof(factId: string) {
  const hex = (len: number) =>
    '0x' + Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')

  return {
    verified: true,
    factId: factId || `tx/L-${hex(4).slice(2, 6)}`,
    leaf: hex(64),
    proof: [hex(64), hex(64), hex(64)],
    root: hex(64),
    signedBy: `did:key:z6Mk${hex(16).slice(2)}…1F2a`,
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { factId } = body

    if (!factId || typeof factId !== 'string') {
      return NextResponse.json({ error: 'factId is required' }, { status: 400 })
    }

    const proof = generateMockProof(factId)
    return NextResponse.json(proof)
  } catch (error) {
    console.error('Fact verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
