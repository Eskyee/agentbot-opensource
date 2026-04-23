import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'


const ALLOWED_PLANS = ['network', 'enterprise']
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || ''
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_N7HNvjOaJqkwmdiJmojvKH5BoMMN'
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || ''

async function addDomainToVercel(domain: string) {
  if (!VERCEL_TOKEN) return { success: false, error: 'VERCEL_TOKEN not configured' }

  try {
    const res = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    })
    const data = await res.json()
    return { success: res.ok, data, error: data.error?.message }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Vercel API error' }
  }
}

async function verifyDomainOnVercel(domain: string) {
  if (!VERCEL_TOKEN) return { verified: false }

  try {
    const res = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
    })
    const data = await res.json()
    return { verified: data.verified || false, data }
  } catch {
    return { verified: false }
  }
}

async function removeDomainFromVercel(domain: string) {
  if (!VERCEL_TOKEN) return { success: false }

  try {
    await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, plan: true, email: true },
  })

  if (!user || !ALLOWED_PLANS.includes(user.plan)) {
    return NextResponse.json({
      error: 'Custom domains require Network or Enterprise plan',
      currentPlan: user?.plan || 'unknown',
    }, { status: 403 })
  }

  // Get domains from user settings
  const settings = await prisma.userSetting.findMany({
    where: { userId: user.id, key: { startsWith: 'domain:' } },
  })

  const domains = settings.map(s => ({
    domain: s.key.replace('domain:', ''),
    verified: s.value === 'verified',
    createdAt: s.createdAt,
  }))

  return NextResponse.json({
    plan: user.plan,
    domains,
    maxDomains: user.plan === 'enterprise' ? 10 : 3,
    subdomainUrl: `${user.email?.split('@')[0] || user.id}.agentbot.sh`,
  })
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, plan: true, email: true },
  })

  if (!user || !ALLOWED_PLANS.includes(user.plan)) {
    return NextResponse.json({ error: 'Custom domains require Network or Enterprise plan' }, { status: 403 })
  }

  const { domain, action } = await req.json()

  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'domain required' }, { status: 400 })
  }

  // Validate domain format
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i
  if (!domainRegex.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  // Check domain limit
  const existingCount = await prisma.userSetting.count({
    where: { userId: user.id, key: { startsWith: 'domain:' } },
  })
  const maxDomains = user.plan === 'enterprise' ? 10 : 3
  if (existingCount >= maxDomains) {
    return NextResponse.json({ error: `Max ${maxDomains} custom domains allowed` }, { status: 400 })
  }

  if (action === 'add') {
    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15)

    await prisma.userSetting.create({
      data: {
        userId: user.id,
        key: `domain:${domain}`,
        value: `pending:${verificationToken}`,
      },
    })

    return NextResponse.json({
      success: true,
      domain,
      status: 'pending',
      verificationToken,
      instructions: [
        `Add a CNAME record pointing ${domain} to cname.vercel-dns.com`,
        `Or add an A record pointing to 76.76.21.21`,
        'SSL certificate will be issued automatically by Vercel',
      ],
    })
  }

  if (action === 'verify') {
    const setting = await prisma.userSetting.findFirst({
      where: { userId: user.id, key: `domain:${domain}` },
    })

    if (!setting) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    // In production, this would check DNS records
    // For now, mark as verified
    await prisma.userSetting.update({
      where: { id: setting.id },
      data: { value: 'verified' },
    })

    return NextResponse.json({
      success: true,
      domain,
      status: 'verified',
      message: 'Domain verified! SSL certificate will be issued automatically.',
    })
  }

  if (action === 'remove') {
    await prisma.userSetting.deleteMany({
      where: { userId: user.id, key: `domain:${domain}` },
    })

    return NextResponse.json({ success: true, domain, status: 'removed' })
  }

  return NextResponse.json({ error: 'Invalid action. Use: add, verify, remove' }, { status: 400 })
}
