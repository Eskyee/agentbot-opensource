import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'
import { isTrialActive } from '@/app/lib/trial-utils'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'
import { acquireWorkloadSlot, releaseWorkloadSlot, type WorkloadTicket } from '@/app/lib/workload-gate'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'

/**
 * Provision route — creates an OpenClaw agent container for the authenticated user.
 *
 * Strategy:
 *   Queue the provisioning job on the backend control plane and return a job ID.
 *   The backend scheduler performs the Railway API work out of band.
 *
 * Security:
 *   - Session required; admin emails bypass subscription check.
 *   - Never trusts body email for auth — session email only.
 *   - INTERNAL_API_KEY forwarded to backend for its Bearer-token gate.
 *   - stripeSubscriptionId looked up from DB (set by Stripe webhook on checkout).
 */

export async function POST(request: NextRequest) {
  let workloadTicket: WorkloadTicket | null = null
  try {
    const ip = getClientIP(request)
    if (await isRateLimited(ip)) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
    }

    // Read body once at the top
    const body = await request.json()
    const {
      telegramToken,
      telegramUserId,
      whatsappToken,
      discordBotToken,
      aiProvider,
      apiKey,
      plan,
      email: bodyEmail,
      autoProvision,
      agentType,
    } = body

    // 1. Require an authenticated session — NEVER trust body email for auth
    let session = await getAuthSession()
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    // Hardcoded admin fallback — env var encoding can break on Vercel
    const HARDCODED_ADMINS = ['YOUR_ADMIN_EMAIL_1', 'YOUR_ADMIN_EMAIL_4', 'YOUR_ADMIN_EMAIL_2']
    const allAdmins = [...new Set([...adminEmails, ...HARDCODED_ADMINS])]

    // Admin check — session email ONLY, never body email
    let isAdmin = false
    const sessionEmail = (session?.user?.email || '').toLowerCase()
    if (sessionEmail && allAdmins.includes(sessionEmail)) {
      isAdmin = true
      console.log(`[Provision] Admin detected: ${sessionEmail}`)
    }

    // If no session, reject — no synthetic sessions from body email
    if (!session?.user?.id) {
      if (isAdmin) {
        // Allow admin with verified session to proceed
        session = { user: { id: 'admin', email: sessionEmail, isAdmin: true } } as any
      } else {
        return NextResponse.json({
          success: false,
          error: 'Authentication required',
        }, { status: 401 })
      }
    }

    const userEmail = (session!.user!.email || sessionEmail) as string
    const userId = (session!.user!.id || 'admin') as string

    // Admins bypass the workload gate entirely so they can test deploys without hitting limits
    if (!isAdmin) {
      const slot = await acquireWorkloadSlot({
        lane: 'deploy',
        userId,
        ip,
        cost: autoProvision === true ? 2 : 1,
      })
      if (!slot.ok) {
        return NextResponse.json(
          { success: false, error: slot.reason, retryAfterSeconds: slot.retryAfterSeconds },
          { status: 429 }
        )
      }
      workloadTicket = slot.ticket
    }

    // 3. DB subscription check — admins bypass, everyone else must have active subscription
    if (!isAdmin && userId !== 'admin') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    })
    const trialActive = isTrialActive(user?.trialEndsAt)
    if (!trialActive && user?.subscriptionStatus !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Active subscription required. Please purchase a plan to deploy.',
      }, { status: 403 })
    }
  }

    // OpenClaw-only deployments (autoProvision or agentType=business) skip channel token requirement
    const isOpenClawDeploy = autoProvision === true || agentType === 'business'
    if (!isOpenClawDeploy && !telegramToken && !whatsappToken && !discordBotToken) {
      return NextResponse.json({
        success: false,
        error: 'At least one channel token required (telegram, whatsapp, or discord)',
      }, { status: 400 })
    }

    const agentId = crypto.randomBytes(8).toString('hex')

    // Look up stripeSubscriptionId from DB (set by Stripe webhook on checkout)
    let stripeSubscriptionId: string | null = null
    if (userId && userId !== 'admin') {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { stripeSubscriptionId: true, subscriptionStatus: true },
        })
        stripeSubscriptionId = dbUser?.stripeSubscriptionId ?? null
      } catch (err) {
        console.warn('[Provision] Failed to look up stripeSubscriptionId from DB:', err)
      }
    }

    const legacyPayload = {
      userId: agentId,
      email: userEmail,
      agentId,
      aiProvider: aiProvider || 'openrouter',
      plan: plan || 'solo',
      stripeSubscriptionId,
      autoProvision: autoProvision || false,
      agentType: agentType || 'creative',
    }

    const backendUrl = getBackendApiUrl()
    const internalKey = getInternalApiKey()

    const enqueueRes = await fetch(`${backendUrl}/api/platform-jobs/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalKey}`,
      },
      body: JSON.stringify({
        ...legacyPayload,
        userId,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    const contentType = enqueueRes.headers.get('content-type') || ''
    let data: Record<string, unknown>
    if (contentType.includes('application/json')) {
      data = await enqueueRes.json()
    } else {
      const rawText = await enqueueRes.text().catch(() => '')
      console.error('[Provision] Backend returned non-JSON:', enqueueRes.status, rawText.slice(0, 300))
      data = { error: `Backend unavailable (HTTP ${enqueueRes.status}). Please try again in a moment.` }
    }

    const job = data?.job as Record<string, unknown> | undefined
    if (!enqueueRes.ok || !job?.id) {
      return NextResponse.json(
        { success: false, error: data?.error || 'Failed to enqueue provision job' },
        { status: enqueueRes.status >= 400 ? enqueueRes.status : 502 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        queued: true,
        jobId: job.id,
        userId: agentId,
        status: job.status || 'queued',
      },
      { status: 202 }
    )

  } catch (error: unknown) {
    console.error('[Provision] Internal error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  } finally {
    await releaseWorkloadSlot(workloadTicket)
  }
}


// GET /api/provision — signup stats (atlas heartbeat, bridge-secret auth)
const BRIDGE_SECRET = process.env.BRIDGE_SECRET

export async function GET(request: NextRequest) {
  if (BRIDGE_SECRET) {
    const provided = request.headers.get('x-bridge-secret')
    if (provided !== BRIDGE_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  try {
    const totalUsers = await prisma.user.count()
    const recentUsers = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      select: { id: true, email: true, plan: true, subscriptionStatus: true },
    })

    return NextResponse.json({
      ok: true,
      totalUsers,
      recentUsers,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Provision GET] Error:', error)
    return NextResponse.json({ ok: false, error: 'database error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic';
