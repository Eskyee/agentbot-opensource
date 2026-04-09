import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET() {
  try {
    const sponsors = await prisma.jobCompany.findMany({
      where: { hiredCount: { gt: 0 } },
      orderBy: { hiredCount: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        website: true,
        description: true,
        hiredCount: true,
      },
    })
    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('Failed to fetch sponsors:', error)
    return NextResponse.json({ sponsors: [] })
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, website, description, tier, budget, contactEmail } = body

    const sponsor = await prisma.jobCompany.create({
      data: {
        advertiserId: session.user.id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        website,
        description,
        hiredCount: 0,
      },
    })

    return NextResponse.json({ sponsor })
  } catch (error) {
    console.error('Failed to create sponsor:', error)
    return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 })
  }
}