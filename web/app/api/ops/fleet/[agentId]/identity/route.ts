import { NextResponse, NextRequest } from 'next/server'

const MOCK_IDENTITIES: Record<string, unknown> = {
  'settler-12': {
    did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    algo: 'ed25519',
    issued: '2026-04-19T14:08:21Z',
    lastSig: '14ms ago',
    guard: 'SignatureGuard',
    rotation: { inDays: 14, auto: true },
    facts: {
      count: 2148,
      leaf: '0x9c1f…ae72',
      lag: 41,
      lastCommit: 'tx/L-7f3a…',
    },
  },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const identity = MOCK_IDENTITIES[agentId] ?? {
    did: 'did:key:z6Mk…unknown',
    algo: 'ed25519',
    issued: '2026-01-01T00:00:00Z',
    lastSig: 'n/a',
    guard: 'SignatureGuard',
    rotation: { inDays: 30, auto: false },
    facts: { count: 0, leaf: '0x0000', lag: 0, lastCommit: 'n/a' },
  }
  return NextResponse.json(identity)
}
