import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

const INTERNAL_KEY = process.env.INTERNAL_API_KEY

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!INTERNAL_KEY || auth !== `Bearer ${INTERNAL_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { openclawInstanceId: { not: null } },
    select: {
      id: true,
      email: true,
      plan: true,
      subscriptionStatus: true,
      openclawInstanceId: true,
      openclawUrl: true,
    },
  })

  return NextResponse.json({ users })
}

export const dynamic = 'force-dynamic'
