import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'
import { provisionOnRailway, isRailwayConfigured } from '@/app/lib/railway-provision'
import { isTrialActive } from '@/app/lib/trial-utils'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'

/**
 * Provision route — creates an OpenClaw agent container for the authenticated user.
 *
 * Strategy (in order):
 *   1. Try the agentbot backend Express service (BACKEND_API_URL) — legacy path.
 *   2. If backend is unreachable or returns an error, fall back to provisioning
 *      directly via Railway GraphQL API (RAILWAY_API_KEY / RAILWAY_PROJECT_ID /
 *      RAILWAY_ENVIRONMENT_ID must be set in Vercel env vars for this to work).
 *
 * Security:
 *   - Session required; admin emails bypass subscription check.
 *   - Never trusts body email for auth — session email only.
 *   - INTERNAL_API_KEY forwarded to backend for its Bearer-token gate.
 *   - stripeSubscriptionId looked up from DB (set by Stripe webhook on checkout).
 */

export async function POST(request: NextRequest) {
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
    const HARDCODED_ADMINS = ['eskyjunglelab@gmail.com', 'admin@agentbot.raveculture.xyz', 'rbasefm@icloud.com']
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
      telegramToken,
      telegramUserId,
      whatsappToken,
      discordBotToken,
      aiProvider: aiProvider || 'openrouter',
      apiKey,
      plan: plan || 'solo',
      email: userEmail,
      stripeSubscriptionId,
      autoProvision: autoProvision || false,
      agentType: agentType || 'creative',
    }

    const backendUrl = process.env.BACKEND_API_URL?.trim()
    const fallbackUrl = process.env.BACKEND_API_FALLBACK_URL?.trim()
    const urls = [backendUrl, fallbackUrl].filter(Boolean) as string[]
    const internalKey = process.env.INTERNAL_API_KEY?.trim()

    let lastError: string | null = null

    // ── Path 1: Try backend Express service ──────────────────────────────────
    if (internalKey && urls.length > 0) {
      for (const baseUrl of urls) {
        try {
          console.log(`[Provision] Trying backend ${baseUrl}/api/provision`)
          const res = await fetch(`${baseUrl}/api/provision`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${internalKey}`,
              'X-User-Email': userEmail,
              'X-User-Id': userId,
            },
            body: JSON.stringify(legacyPayload),
            signal: AbortSignal.timeout(15_000),
          })

          // Guard against HTML error pages from proxy/load-balancer
          const contentType = res.headers.get('content-type') || ''
          if (!contentType.includes('application/json')) {
            lastError = `Backend returned non-JSON response (${res.status})`
            console.error(`[Provision] Backend at ${baseUrl} returned HTML/non-JSON — skipping`)
            continue
          }

          const data = await res.json() as {
            success?: boolean;
            error?: string;
            userId?: string;
            subdomain?: string;
            url?: string;
            streamKey?: string;
            liveStreamId?: string;
          }

          if (data.success) {
            import('@/app/lib/alerts').then(({ alertNewProvision }) => {
              alertNewProvision(data.userId || agentId, legacyPayload.plan || 'solo').catch(() => {})
            }).catch(() => {})

            if (data.url && userId && userId !== 'admin') {
              prisma.user.update({
                where: { id: userId },
                data: {
                  openclawUrl: data.url,
                  openclawInstanceId: data.userId || agentId,
                },
              }).catch((err: unknown) => {
                console.error('[Provision] Failed to save openclawUrl:', err)
              })
            }

            return NextResponse.json({
              success: true,
              userId: data.userId || agentId,
              subdomain: data.subdomain,
              url: data.url,
              streamKey: data.streamKey,
              liveStreamId: data.liveStreamId,
            })
          }

          lastError = data.error || `Backend returned ${res.status}`
          console.error(`[Provision] Backend error from ${baseUrl}:`, lastError)
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : 'Connection failed'
          console.error(`[Provision] Failed to reach ${baseUrl}:`, lastError)
        }
      }
    } else {
      console.warn('[Provision] No backend URL or INTERNAL_API_KEY — skipping backend path')
    }

    // ── Path 2: Direct Railway provisioning ──────────────────────────────────
    if (isRailwayConfigured()) {
      try {
        console.log(`[Provision] Falling back to direct Railway provisioning for ${agentId}`)
        const result = await provisionOnRailway(agentId, legacyPayload.plan)

        import('@/app/lib/alerts').then(({ alertNewProvision }) => {
          alertNewProvision(agentId, legacyPayload.plan || 'solo').catch(() => {})
        }).catch(() => {})

        if (userId && userId !== 'admin') {
          prisma.user.update({
            where: { id: userId },
            data: {
              openclawUrl: result.url,
              openclawInstanceId: result.agentId,
            },
          }).catch((err: unknown) => {
            console.error('[Provision] Failed to save openclawUrl (Railway path):', err)
          })
        }

        return NextResponse.json({
          success: true,
          userId: result.agentId,
          url: result.url,
          status: result.status,
        })
      } catch (railwayErr: unknown) {
        const msg = railwayErr instanceof Error ? railwayErr.message : 'Railway provision failed'
        console.error('[Provision] Railway direct provision failed:', msg)
        lastError = msg
      }
    } else {
      console.warn('[Provision] Railway env vars not configured — cannot fall back to direct provision')
    }

    return NextResponse.json({
      success: false,
      error: lastError || 'Provisioning service is temporarily unavailable. Please try again later.',
    }, { status: 502 })

  } catch (error: unknown) {
    console.error('[Provision] Internal error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
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
