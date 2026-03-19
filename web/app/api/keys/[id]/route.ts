import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: apiKey.keyPrefix + '...',
      createdAt: apiKey.createdAt,
      lastUsed: apiKey.lastUsed,
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const deleted = await prisma.apiKey.deleteMany({
      where: { id, userId: session.user.id },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Key deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 })
  }
}
