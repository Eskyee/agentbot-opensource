import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      telegramToken, 
      telegramUserId, 
      whatsappToken,
      discordBotToken,
      aiProvider, 
      apiKey, 
      plan 
    } = body
    
    if (!telegramToken && !whatsappToken && !discordBotToken) {
      return NextResponse.json({ 
        success: false,
        error: 'At least one channel token required (telegram, whatsapp, or discord)' 
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
      plan: plan || 'free',
    }

    // Try Render backend directly — /api/provision has no auth middleware
    const backendUrl = process.env.BACKEND_API_URL?.trim()
    const fallbackUrl = process.env.BACKEND_API_FALLBACK_URL?.trim()
    const urls = [backendUrl, fallbackUrl].filter(Boolean) as string[]

    let lastError: string | null = null

    for (const baseUrl of urls) {
      try {
        console.log(`[Provision] Trying ${baseUrl}/api/provision`)
        const res = await fetch(`${baseUrl}/api/provision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(legacyPayload),
          signal: AbortSignal.timeout(15000),
        })

        const data = await res.json()

        if (data.success) {
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
      } catch (err: any) {
        lastError = err?.message || 'Connection failed'
        console.error(`[Provision] Failed to reach ${baseUrl}:`, lastError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: lastError || 'Provisioning service is temporarily unavailable. Please try again later.'
      },
      { status: 502 }
    )
  } catch (error: any) {
    console.error('[Provision] Internal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
