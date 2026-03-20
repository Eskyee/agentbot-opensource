import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'
import { getMux } from '@/lib/mux'
import { isRateLimited, getClientIP } from '@/app/lib/security-middleware'

const BACKEND_API_URL = getBackendApiUrl()
const BACKEND_API_FALLBACK_URL = (process.env.BACKEND_API_FALLBACK_URL || '').trim()

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // No session check — signup flow is public
  const BACKEND_API_SECRET = process.env.BACKEND_API_SECRET || process.env.API_SECRET || getInternalApiKey()
  try {
    const body = await request.json()
    const { 
      telegramToken, 
      telegramUserId, 
      whatsappToken,
      whatsappPhoneNumberId,
      whatsappBusinessAccountId,
      discordBotToken,
      discordGuildId,
      discordChannelId,
      aiProvider, 
      apiKey, 
      plan 
    } = body
    
    if (!telegramToken && !whatsappToken && !discordBotToken) {
      return NextResponse.json({ 
        error: 'At least one channel token required (telegram, whatsapp, or discord)' 
      }, { status: 400 })
    }
    
    const userId = crypto.randomBytes(8).toString('hex')

    let streamKey = null
    let liveStreamId = null
    
    try {
      const liveStream = await getMux().video.liveStreams.create({
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
        test: false,
        latency_mode: 'low'
      })
      
      streamKey = liveStream.stream_key
      liveStreamId = liveStream.id
    } catch (muxError) {
      console.error('Failed to create Mux live stream for agent:', muxError)
    }

    const ownerIds = telegramUserId ? [telegramUserId] : undefined
    
    const modernPayload = {
      agentId: userId,
      version: 'latest',
      config: {
        telegramToken,
        telegramUserId,
        whatsappToken,
        whatsappPhoneNumberId,
        whatsappBusinessAccountId,
        discordBotToken,
        discordGuildId,
        discordChannelId,
        ownerIds,
        aiProvider: aiProvider || 'openrouter',
        apiKey,
        plan: plan || 'free',
        streamKey,
        liveStreamId
      }
    }

    const legacyPayload = {
      userId,
      telegramToken,
      telegramUserId,
      whatsappToken,
      discordBotToken,
      ownerIds,
      aiProvider: aiProvider || 'openrouter',
      apiKey,
      plan: plan || 'free',
      streamKey,
      liveStreamId
    }

    const backendBaseUrls = [BACKEND_API_URL, BACKEND_API_FALLBACK_URL]
      .map((url) => url.trim())
      .filter(Boolean)
      .filter((url, index, all) => all.indexOf(url) === index)

    console.log('[Provision] Trying backends:', backendBaseUrls)

    let response: Response | null = null
    let usingLegacyEndpoint = false
    let selectedBackendBaseUrl = BACKEND_API_URL

    for (const baseUrl of backendBaseUrls) {
      selectedBackendBaseUrl = baseUrl
      response = null
      let modernResponse: Response | null = null
      let legacyResponse: Response | null = null

      // Try modern endpoint: POST /api/deployments
      try {
        const INTERNAL_API_KEY = getInternalApiKey()
        modernResponse = await fetch(`${baseUrl}/api/deployments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_API_KEY}`
          },
          body: JSON.stringify(modernPayload)
        })
      } catch (err) {
        console.error('[Provision] Modern endpoint unreachable:', baseUrl, err)
      }

      if (modernResponse && modernResponse.ok) {
        response = modernResponse
        usingLegacyEndpoint = false
        break
      }

      const shouldTryLegacy = !modernResponse || modernResponse.status === 404 || modernResponse.status === 405
      if (!shouldTryLegacy && modernResponse) {
        response = modernResponse
        usingLegacyEndpoint = false
        break
      }

      // Try legacy endpoint: POST /api/provision (no auth middleware on backend)
      usingLegacyEndpoint = true
      try {
        legacyResponse = await fetch(`${baseUrl}/api/provision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(legacyPayload),
        })
      } catch (err) {
        console.error('[Provision] Legacy endpoint unreachable:', baseUrl, err)
        response = null
        continue
      }

      if (legacyResponse && legacyResponse.ok) {
        response = legacyResponse
        break
      }

      const shouldTryNextBaseUrl = !legacyResponse || legacyResponse.status === 404 || legacyResponse.status === 405
      if (shouldTryNextBaseUrl) {
        response = legacyResponse
        continue
      }

      if (legacyResponse) {
        response = legacyResponse
        break
      }
    }

    if (!response) {
      console.error('[Provision] All backends unreachable:', backendBaseUrls)
      return NextResponse.json(
        {
          success: false,
          error: 'Provisioning service is temporarily unavailable. Please try again later.'
        },
        { status: 502 }
      )
    }
    
    const contentType = response.headers.get('content-type') || ''
    const rawBody = await response.text()
    let data: any = null

    if (rawBody && contentType.toLowerCase().includes('application/json')) {
      try {
        data = JSON.parse(rawBody)
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: `Provisioning service returned malformed JSON (status ${response.status})`
          },
          { status: 502 }
        )
      }
    } else if (!response.ok) {
      console.error('[Provision] Non-JSON error:', {
        backendApiUrl: selectedBackendBaseUrl,
        status: response.status,
        contentType,
        usingLegacyEndpoint,
      })

      return NextResponse.json(
        {
          success: false,
          error: `Provisioning service error (status ${response.status}). Please try again later.`
        },
        { status: 502 }
      )
    }
    
    if (response.ok && data?.success) {
      const subdomain = data.subdomain || `${userId}.agents.localhost`
      return NextResponse.json({
        success: true,
        userId: data.userId || userId,
        subdomain,
        url: data.url,
        streamKey,
        liveStreamId
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || `Provisioning failed (status ${response.status})`
        },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('[Provision] Internal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
