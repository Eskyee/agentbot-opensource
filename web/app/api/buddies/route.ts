import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['crab', 'robot', 'ghost', 'dragon', 'alien']
const MAX_BUDDIES = 20

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const buddies = await prisma.buddy.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ buddies })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, type } = body

    if (!name || typeof name !== 'string' || name.length > 30) {
      return NextResponse.json({ error: 'Invalid name (max 30 chars)' }, { status: 400 })
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid buddy type' }, { status: 400 })
    }

    const count = await prisma.buddy.count({ where: { userId: session.user.id } })
    if (count >= MAX_BUDDIES) {
      return NextResponse.json({ error: `Max ${MAX_BUDDIES} buddies allowed` }, { status: 400 })
    }

    const buddy = await prisma.buddy.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        type,
        energy: 50,
        happiness: 50,
      },
    })

    return NextResponse.json({ buddy }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
