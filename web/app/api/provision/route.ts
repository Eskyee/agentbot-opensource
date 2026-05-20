import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'
import { isTrialActive } from '@/app/lib/trial-utils'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'
import { acquireWorkloadSlot, releaseWorkloadSlot, type WorkloadTicket } from '@/app/lib/workload-gate'
import { signedFetch } from '@/app/lib/backend-client'
import { isAdminEmail } from '@/app/lib/admin'
import { sendAlert } from '@/app/lib/alerts'

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

type RemoteAccessPayload =
  | { type?: 'off' | 'ssh' | 'tailscale-serve' | 'tailscale-funnel' | 'tailnet'; [key: string]: unknown }
  | null

function resolveTailscaleChoice(tailscale: unknown, remoteAccess: RemoteAccessPayload) {
  if (tailscale && typeof tailscale === 'object') {
    return tailscale
  }

  if (!remoteAccess || typeof remoteAccess !== 'object') {
    return null
  }

  switch (remoteAccess.type) {
    case 'tailscale-serve':
      return { ...remoteAccess, enabled: true, mode: 'serve' }
    case 'tailscale-funnel':
      return { ...remoteAccess, enabled: true, mode: 'funnel' }
    case 'tailnet':
      return { ...remoteAccess, enabled: true, mode: 'tailnet' }
    default:
      return null
  }
}

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
      tailscale,
      remoteAccess,
    } = body

    // 1. Require an authenticated session — NEVER trust body email for auth
    let session = await getAuthSession()

    // Admin check — session email ONLY, never body email
    const sessionEmail = (session?.user?.email || '').toLowerCase()
    const isAdmin = isAdminEmail(sessionEmail)
    if (isAdmin) {
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

    // M-20: build the payload with the correct userId from the session up
    // front. The previous code seeded `userId: agentId` and relied on a
    // second spread to override it, which silently broke if anyone tidied
    // the duplicate key.
    const provisionPayload = {
      userId,
      email: userEmail,
      agentId,
      aiProvider: aiProvider || 'openrouter',
      plan: plan || 'solo',
      stripeSubscriptionId,
      autoProvision: autoProvision || false,
      agentType: agentType || 'creative',
      tailscale: resolveTailscaleChoice(tailscale, remoteAccess),
    }

    // M-21: bounded retry. The backend can briefly 5xx during a deploy or
    // when the platform-jobs DB is reconnecting. Without a retry the user
    // pays (Stripe webhook fires before this) and then sees a hard error
    // with no recovery path. We retry transient failures up to 3 times,
    // then fall through to the existing error path AND raise an alert so
    // an operator can manually re-trigger.
    const maxAttempts = 3
    let enqueueRes: Response | null = null
    let lastError: string | null = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        enqueueRes = await signedFetch('/api/platform-jobs/provision', {
          method: 'POST',
          headers: {
            'X-User-Email': userEmail,
            'X-User-Plan': plan || 'solo',
            'X-Stripe-Subscription-Id': stripeSubscriptionId || '',
          },
          body: JSON.stringify(provisionPayload),
          signal: AbortSignal.timeout(15_000),
        })
        if (enqueueRes.ok) break
        if (enqueueRes.status < 500 && enqueueRes.status !== 408 && enqueueRes.status !== 429) break
        lastError = `HTTP ${enqueueRes.status}`
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        const transient = /AbortError|timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|fetch failed/i.test(lastError)
        // Always reset enqueueRes when a network-level error fires.
        // Otherwise an earlier-attempt 5xx response would still be live in
        // the loop variable; the post-loop `if (!enqueueRes)` alert path
        // would be skipped, the operator would never be notified, and the
        // user would get the stale 5xx body instead of the intended
        // 503 "Backend unavailable" message.
        enqueueRes = null
        if (!transient) {
          break
        }
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250 * Math.pow(3, attempt - 1)))
      }
    }

    if (!enqueueRes) {
      console.error('[Provision] Backend unreachable after retries:', lastError)
      await sendAlert({
        title: 'Provision enqueue failed',
        message: `User ${userId} (${userEmail}) could not enqueue a provision job; backend unreachable after ${maxAttempts} attempts. Operator action required.`,
        severity: 'critical',
        fields: { UserId: userId, Plan: plan || 'solo', Attempts: String(maxAttempts), Error: lastError ?? 'unknown' },
      }).catch(() => null)
      return NextResponse.json(
        { success: false, error: 'Backend unavailable, please try again in a moment.' },
        { status: 503 }
      )
    }

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
