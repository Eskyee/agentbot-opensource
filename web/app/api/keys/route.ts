import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

// In-memory storage for API keys (in production, use database)
const apiKeys = new Map<string, any>()

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all API keys for this user
    const userKeys = Array.from(apiKeys.values()).filter((k: any) => k.userEmail === session.user?.email)

    return NextResponse.json({
      keys: userKeys.map((k: any) => ({
        id: k.id,
        name: k.name,
        keyPreview: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4),
        createdAt: k.createdAt,
        lastUsed: k.lastUsed
      }))
    })
  } catch (error) {
    console.error('Keys fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    // Generate API key
    const key = 'sk_' + Buffer.from(Math.random().toString()).toString('base64').substring(0, 40)
    const id = 'key_' + Date.now()

    apiKeys.set(id, {
      id,
      userEmail: session.user.email,
      name,
      key,
      createdAt: new Date().toISOString(),
      lastUsed: null
    })

    return NextResponse.json({
      id,
      name,
      key, // Only shown once at creation
      createdAt: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Key creation error:', error)
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }
}
