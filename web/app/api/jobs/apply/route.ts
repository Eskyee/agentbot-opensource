import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { listingId } = await request.json()

    const listing = await prisma.jobListing.findUnique({
      where: { id: listingId },
    })

    if (!listing || listing.status !== 'active') {
      return NextResponse.json({ error: 'Job not found or not active' }, { status: 404 })
    }

    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        listingId_userId: {
          listingId,
          userId: session.user.id,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied' }, { status: 400 })
    }

    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId: session.user.id },
    })

    const application = await prisma.jobApplication.create({
      data: {
        listingId,
        userId: session.user.id,
        hasProfile: !!careerProfile,
      },
    })

    await prisma.jobListing.update({
      where: { id: listingId },
      data: { applyCount: { increment: 1 } },
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Job application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: { company: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ applications })
}