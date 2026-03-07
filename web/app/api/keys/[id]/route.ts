import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// In-memory storage (in production, use database)
const apiKeys = new Map<string, any>()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const apiKey = apiKeys.get(id)

    if (!apiKey || apiKey.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: apiKey.key.substring(0, 8) + '...' + apiKey.key.substring(apiKey.key.length - 4),
      createdAt: apiKey.createdAt,
      lastUsed: apiKey.lastUsed
    })
  } catch (error) {
    console.error('Key fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch key' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const apiKey = apiKeys.get(id)

    if (!apiKey || apiKey.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    apiKeys.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Key deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 })
  }
}
