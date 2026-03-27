import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'

/**
 * Legacy provision proxy — forwards provisioning requests to the agentbot backend.
 *
 * SECURITY PATTERNS APPLIED (web/api/agents/provision/route.ts template):
 *
 *  1. NextAuth session gate: callers must have an authenticated session.
 *     Previously the session was read for the email only — a missing session
 *     would silently proceed as an anonymous request.
 *
 *  2. DB subscription check: verifies subscriptionStatus = 'active' in Prisma
 *     before forwarding to the backend, matching the pattern in /api/agents/provision.
 *     Admin emails bypass subscription enforcement.
 *
 *  3. INTERNAL_API_KEY forwarded: backend /api/provision requires Bearer auth.
 *     The previous code omitted the Authorization header, so all calls would have
 *     been rejected by the backend's outer Bearer-token middleware.
 */

export async function POST(request: NextRequest) {
  try {
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

    // 3. DB subscription check — admins bypass, everyone else must have active subscription
    if (!isAdmin && userId !== 'admin') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionStatus: true },
      })
      if (user?.subscriptionStatus !== 'active') {
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
    }

    const backendUrl = process.env.BACKEND_API_URL?.trim()
    const fallbackUrl = process.env.BACKEND_API_FALLBACK_URL?.trim()
    const urls = [backendUrl, fallbackUrl].filter(Boolean) as string[]
    const internalKey = process.env.INTERNAL_API_KEY?.trim()

    if (!internalKey) {
      console.error('[Provision] INTERNAL_API_KEY not configured — cannot reach backend')
      return NextResponse.json({
        success: false,
        error: 'Provisioning service misconfigured. Contact support.',
      }, { status: 503 })
    }

    let lastError: string | null = null

    for (const baseUrl of urls) {
      try {
        console.log(`[Provision] Trying ${baseUrl}/api/provision`)
        const res = await fetch(`${baseUrl}/api/provision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Bearer token required by backend outer auth middleware
            'Authorization': `Bearer ${internalKey}`,
            // Trusted user context headers (read by authenticate() middleware)
            'X-User-Email': userEmail,
            'X-User-Id': userId,
          },
          body: JSON.stringify(legacyPayload),
          signal: AbortSignal.timeout(15000),
        })

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
          // Fire-and-forget alert — don't block provisioning response
          import('@/app/lib/alerts').then(({ alertNewProvision }) => {
            alertNewProvision(data.userId || agentId, legacyPayload.plan || 'solo').catch(() => {})
          }).catch(() => {})

          // Persist OpenClaw URL to user record for reliable sidebar access
          if (data.url && userId && userId !== 'admin') {
            prisma.user.update({
              where: { id: userId },
              data: {
                openclawUrl: data.url,
                openclawInstanceId: data.userId || agentId,
              },
            }).catch((err: unknown) => {
              console.error('[Provision] Failed to save openclawUrl to user:', err)
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


export const dynamic = 'force-dynamic';