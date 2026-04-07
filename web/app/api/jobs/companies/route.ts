import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companies = await prisma.jobCompany.findMany({
    where: { advertiserId: session.user.id },
    include: {
      jobs: {
        select: {
          id: true,
          title: true,
          status: true,
          viewCount: true,
          applyCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ companies })
}