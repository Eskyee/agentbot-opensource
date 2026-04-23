import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getTrialCountdown, isTrialActive } from '@/app/lib/trial-utils'
import { proxyBitcoinRequest } from '@/app/api/bitcoin/lib/backend'

const ACCESS_TYPES = new Set(['free_testnet', 'paid_mainnet'])

function hasGreenlightDeveloperCreds() {
  return Boolean(
    process.env.GREENLIGHT_DEVELOPER_CERT_PEM?.trim() &&
    process.env.GREENLIGHT_DEVELOPER_KEY_PEM?.trim()
  )
}


export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user, latestRequest] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        greenlightCertPem: true,
        greenlightKeyPem: true,
      },
    }),
    prisma.greenlightAccessRequest.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        accessType: true,
        network: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const trial = getTrialCountdown(user.trialEndsAt)
  const isPaidUser =
    user.subscriptionStatus === 'active' ||
    user.subscriptionStatus === 'trialing' ||
    user.plan !== 'free'

  // Fetch real-time status from backend
  const backendStatusRes = await proxyBitcoinRequest('/api/underground/bitcoin/greenlight/status')
  const backendStatus = await backendStatusRes.json().catch(() => ({ status: 'offline' }))

  return NextResponse.json({
    implementationStatus: backendStatus.status === 'ready' ? 'active' : 'request_only',
    greenlightReady: Boolean(user.greenlightCertPem && user.greenlightKeyPem) || hasGreenlightDeveloperCreds(),
    backendStatus,
    docs: {
      overview: 'https://blockstream.github.io/greenlight/getting-started/',
      installation: 'https://blockstream.github.io/greenlight/getting-started/installation/',
      certificates: 'https://blockstream.github.io/greenlight/getting-started/certs/',
      registerNode: 'https://blockstream.github.io/greenlight/getting-started/register/',
      github: 'https://github.com/Blockstream/greenlight',
      product: 'https://blockstream.com/lightning/greenlight/',
    },
    facts: {
      custody: 'Greenlight is non-custodial; node seed secrets must stay on the user device.',
      auth: 'Greenlight uses mTLS with developer and device identities.',
      libs: ['Rust gl-client', 'Python gl-client'],
      networks: ['testnet', 'bitcoin'],
      scheduler: 'Nodes are scheduled on-demand and return a GRPC URI when started.',
    },
    eligibility: {
      freeTestnet: true,
      paidMainnet: isPaidUser,
      billingRequiredForPaid: !isPaidUser,
      activeTrial: isTrialActive(user.trialEndsAt),
    },
    trial: trial
      ? {
          expired: trial.expired,
          daysLeft: trial.daysLeft,
          endsAt: trial.endsAt,
        }
      : null,
    user: {
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
    },
    latestRequest,
  })
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const accessType = typeof body?.accessType === 'string' ? body.accessType : ''
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 2000) : null

  if (!ACCESS_TYPES.has(accessType)) {
    return NextResponse.json({ error: 'Invalid accessType' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscriptionStatus: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const isPaidUser =
    user.subscriptionStatus === 'active' ||
    user.subscriptionStatus === 'trialing' ||
    user.plan !== 'free'

  if (accessType === 'paid_mainnet' && !isPaidUser) {
    return NextResponse.json(
      { error: 'Paid Greenlight setup requires an active paid plan or trial.' },
      { status: 402 }
    )
  }

  const network = accessType === 'free_testnet' ? 'testnet' : 'bitcoin'

  const existing = await prisma.greenlightAccessRequest.findFirst({
    where: {
      userId: session.user.id,
      accessType,
      status: { in: ['pending', 'approved', 'provisioning'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    return NextResponse.json({ request: existing, deduped: true })
  }

  const request = await prisma.greenlightAccessRequest.create({
    data: {
      userId: session.user.id,
      accessType,
      network,
      notes,
      planSnapshot: user.plan,
      subscriptionSnapshot: user.subscriptionStatus,
    },
  })

  return NextResponse.json({ request, deduped: false }, { status: 201 })
}
