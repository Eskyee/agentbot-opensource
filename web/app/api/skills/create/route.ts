import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const MAX_NAME_LENGTH = 80
const MAX_DESCRIPTION_LENGTH = 600
const MAX_CATEGORY_LENGTH = 40
const MAX_CODE_LENGTH = 2000

function sanitizeInput(value: unknown, limit: number) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, limit)
}

export async function POST(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const name = sanitizeInput(body?.name, MAX_NAME_LENGTH)
    const description = sanitizeInput(body?.description, MAX_DESCRIPTION_LENGTH)
    const rawCategory = sanitizeInput(body?.category, MAX_CATEGORY_LENGTH)
    const category = rawCategory || 'custom'
    const code = sanitizeInput(body?.code, MAX_CODE_LENGTH)

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.skill.findFirst({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A skill with that name already exists' },
        { status: 400 }
      )
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        description,
        category,
        code,
        author:
          session.user.name ||
          session.user.email ||
          'Community',
      },
    })

    return NextResponse.json({ success: true, skill })
  } catch (error) {
    console.error('Skill creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}
