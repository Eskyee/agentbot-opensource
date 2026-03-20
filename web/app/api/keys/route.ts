export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      keys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPreview: k.keyPrefix + '...',
        createdAt: k.createdAt,
        lastUsed: k.lastUsed,
      })),
    })
  } catch (error) {
    console.error('Keys fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await req.json()
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }
    if (name.length > 64) {
      return NextResponse.json({ error: 'Name too long (max 64 chars)' }, { status: 400 })
    }

    // Generate a cryptographically secure key — returned once, never stored in plaintext
    const rawKey = 'sk_' + crypto.randomBytes(32).toString('hex')
    const keyPrefix = rawKey.substring(0, 10)      // "sk_" + 7 chars shown in UI
    const keyHash = await bcrypt.hash(rawKey, 10)  // hashed for DB storage

    const record = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        keyHash,
        keyPrefix,
      },
    })

    return NextResponse.json(
      {
        id: record.id,
        name: record.name,
        key: rawKey,   // shown ONCE at creation — client must save it
        createdAt: record.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Key creation error:', error)
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }
}
