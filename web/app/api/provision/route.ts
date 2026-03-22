import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
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
    // 1. Require an authenticated session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }

    const userEmail = session.user.email

    // 2. Admin bypass — admins skip subscription check
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
    const isAdmin = adminEmails.includes(userEmail.toLowerCase())

    // 3. DB subscription check (mirrors /api/agents/provision pattern)
    if (!isAdmin) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user || user.subscriptionStatus !== 'active') {
        return NextResponse.json({
          success: false,
          error: 'Active subscription required. Subscribe at /pricing',
          code: 'SUBSCRIPTION_REQUIRED',
        }, { status: 402 })
      }
    }

    const body = await request.json()
    const {
      telegramToken,
      telegramUserId,
      whatsappToken,
      discordBotToken,
      aiProvider,
      apiKey,
      plan,
    } = body

    if (!telegramToken && !whatsappToken && !discordBotToken) {
      return NextResponse.json({
        success: false,
        error: 'At least one channel token required (telegram, whatsapp, or discord)',
      }, { status: 400 })
    }

    const userId = crypto.randomBytes(8).toString('hex')

    const legacyPayload = {
      userId,
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
            'X-User-Id': session.user.id,
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
            alertNewProvision(data.userId || userId, legacyPayload.plan || 'solo').catch(() => {})
          }).catch(() => {})

          return NextResponse.json({
            success: true,
            userId: data.userId || userId,
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
