import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        credits: true,
      }
    })

    if (!user) {
      return NextResponse.json({ credits: 0 })
    }

    return NextResponse.json({ credits: user.credits || 0 })
  } catch (error) {
    console.error('Credits fetch error:', error)
    return NextResponse.json({ credits: 0 })
  }
}
