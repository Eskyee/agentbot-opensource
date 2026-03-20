export const dynamic = "force-static"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
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
        id: true,
      }
    })

    if (!user) {
      return NextResponse.json({ credits: 0 })
    }

    // TODO: Add credits field to User model or create separate Credits table
    return NextResponse.json({ credits: 0 })
  } catch (error) {
    console.error('Credits fetch error:', error)
    return NextResponse.json({ credits: 0 })
  }
}
