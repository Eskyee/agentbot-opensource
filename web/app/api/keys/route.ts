import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// In-memory store for demo (use database in production)
const apiKeys = new Map<string, {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
  status: 'active' | 'revoked'
}>()

export async function GET() {
  try {
    const keys = Array.from(apiKeys.values()).filter(k => k.status === 'active')
    return NextResponse.json({
      keys: keys.map(k => ({
        id: k.id,
        name: k.name,
        key: k.key,
        createdAt: k.createdAt,
        lastUsed: k.lastUsed,
        status: k.status,
      })),
      count: keys.length,
    })
  } catch (error) {
    console.error('Failed to fetch keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch keys', keys: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      )
    }

    const keyId = crypto.randomBytes(12).toString('hex')
    const keyValue = `sk-${crypto.randomBytes(32).toString('hex')}`
    
    const apiKey = {
      id: keyId,
      name: name.trim(),
      key: keyValue,
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    }

    apiKeys.set(keyId, apiKey)

    return NextResponse.json(
      {
        success: true,
        key: apiKey,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create key:', error)
    return NextResponse.json(
      { error: 'Failed to create key' },
      { status: 500 }
    )
  }
}
