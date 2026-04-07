import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { z } from 'zod'

const careerProfileSchema = z.object({
  skills: z.array(z.string()).default([]),
  seniority: z.string(),
  yearsExperience: z.number().optional(),
  bio: z.string(),
  webType: z.string().default("both"),
  contractTypes: z.array(z.string()).default([]),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default("USD"),
  salaryVisible: z.boolean().default(false),
  languages: z.array(z.string()).default([]),
  timezone: z.string().optional(),
  linkPortfolio: z.string().optional(),
  linkLinkedin: z.string().optional(),
  linkWebsite: z.string().optional(),
  openToWork: z.boolean().default(false),
})

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.careerProfile.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ profile })
}

export async function PUT(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = careerProfileSchema.parse(body)

    const profile = await prisma.careerProfile.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        ...data,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Career profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}