import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { z } from 'zod'

const jobListingSchema = z.object({
  companyId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  salaryMin: z.number().positive(),
  salaryMax: z.number().positive(),
  salaryCurrency: z.string().default("USD"),
  roleType: z.string(),
  techStack: z.array(z.string()).default([]),
  seniority: z.string(),
  contractType: z.string(),
  webType: z.string().default("both"),
  applyUrl: z.string().url(),
  language: z.string().default("en"),
  languagePtBr: z.string().optional(),
  badgeResponseGuaranteed: z.boolean().default(false),
  badgeNoAiScreening: z.boolean().default(false),
})

const companySchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  logoUrl: z.string().optional(),
  website: z.string().url(),
  description: z.string().optional(),
  githubOrg: z.string().optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'
  const roleType = searchParams.get('roleType')
  const seniority = searchParams.get('seniority')
  const webType = searchParams.get('webType')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = { status }
  
  if (roleType) where.roleType = roleType
  if (seniority) where.seniority = seniority
  if (webType) where.webType = webType
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const jobs = await prisma.jobListing.findMany({
    where,
    include: {
      company: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ jobs })
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    if (body.type === 'company') {
      const data = companySchema.parse(body)
      
      const company = await prisma.jobCompany.create({
        data: {
          advertiserId: session.user.id,
          name: data.name,
          slug: data.slug,
          logoUrl: data.logoUrl,
          website: data.website,
          description: data.description,
          githubOrg: data.githubOrg,
        },
      })
      
      return NextResponse.json({ company })
    }
    
    const data = jobListingSchema.parse(body)
    
    const company = await prisma.jobCompany.findUnique({
      where: { id: data.companyId },
    })
    
    if (!company || company.advertiserId !== session.user.id) {
      return NextResponse.json({ error: 'Company not found or access denied' }, { status: 403 })
    }
    
    const job = await prisma.jobListing.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        roleType: data.roleType,
        techStack: data.techStack,
        seniority: data.seniority,
        contractType: data.contractType,
        webType: data.webType,
        applyUrl: data.applyUrl,
        language: data.language,
        languagePtBr: data.languagePtBr,
        badgeResponseGuaranteed: data.badgeResponseGuaranteed,
        badgeNoAiScreening: data.badgeNoAiScreening,
        status: 'draft',
      },
      include: { company: true },
    })
    
    return NextResponse.json({ job })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Job creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}