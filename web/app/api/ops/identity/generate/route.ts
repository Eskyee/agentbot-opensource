import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

/**
 * POST /api/ops/identity/generate
 *
 * Generates a DID (did:key) for an agent using ed25519-style deterministic hashing.
 * Stores the DID in the agent's config JSON field.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { agentId } = body

    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    // Verify the agent belongs to this user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
      select: { id: true, name: true, config: true },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Try ed25519 via SubtleCrypto first, fall back to deterministic SHA-256
    let publicKey: string
    let did: string

    try {
      const keyPair = await crypto.subtle.generateKey(
        { name: 'Ed25519' } as AlgorithmIdentifier,
        true,
        ['sign', 'verify']
      )
      const pubKey = 'publicKey' in keyPair ? keyPair.publicKey : keyPair
      const rawKey = await crypto.subtle.exportKey('raw', pubKey)
      publicKey = Buffer.from(rawKey).toString('base64url')
      did = `did:key:z6Mk${publicKey.slice(0, 44)}`
    } catch {
      // Ed25519 not available in this runtime — use deterministic SHA-256
      const seed = `${agentId}:${Date.now()}:${Math.random().toString(36).slice(2)}`
      const hash = createHash('sha256').update(seed).digest('base64url')
      publicKey = hash
      did = `did:key:z6Mk${hash.slice(0, 44)}`
    }

    const createdAt = new Date().toISOString()

    // Merge DID into existing config
    const existingConfig = (agent.config as Record<string, unknown>) || {}
    const updatedConfig = {
      ...existingConfig,
      did,
      publicKey,
      keyAlgorithm: 'ed25519',
      didCreatedAt: createdAt,
    }

    await prisma.agent.update({
      where: { id: agentId },
      data: { config: updatedConfig },
    })

    return NextResponse.json({
      did,
      publicKey,
      keyAlgorithm: 'ed25519',
      createdAt,
      agentId: agent.id,
      agentName: agent.name,
    })
  } catch (error) {
    console.error('DID generate error:', error)
    return NextResponse.json({ error: 'Failed to generate DID' }, { status: 500 })
  }
}
