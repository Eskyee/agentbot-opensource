export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'
import { getMux } from '@/lib/mux'
import { isRateLimited, getClientIP } from '@/app/lib/security-middleware'
import { alertNewProvision } from '@/app/lib/alerts'

const BACKEND_API_URL = getBackendApiUrl()
const BACKEND_API_FALLBACK_URL = (process.env.BACKEND_API_FALLBACK_URL || '').trim()

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    
    // Generate unique user ID
    const userId = crypto.randomBytes(8).toString('hex')

    // Create a dedicated Mux Live Stream for the new agent
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
      // We continue even if streaming fails, as it's a non-blocking feature
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

    let response: Response | null = null
    let usingLegacyEndpoint = false
    let selectedBackendBaseUrl = BACKEND_API_URL

    for (const baseUrl of backendBaseUrls) {
      selectedBackendBaseUrl = baseUrl
      response = null
      let modernResponse: Response | null = null
      let legacyResponse: Response | null = null

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
        console.error('Modern provisioning endpoint unreachable for backend base URL', {
          backendApiUrl: baseUrl,
          error: err,
        })
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

      usingLegacyEndpoint = true
      try {
        legacyResponse = await fetch(`${baseUrl}/provision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': BACKEND_API_SECRET,
          },
          body: JSON.stringify(legacyPayload),
        })
      } catch (err) {
        console.error('Legacy provisioning endpoint unreachable for backend base URL', {
          backendApiUrl: baseUrl,
          error: err,
        })

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
      console.error('Provisioning backend returned non-JSON error response', {
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
    
    if (response.ok && data?.url) {
      const subdomain = data.subdomain || `${userId}.agents.localhost`
      // Alert ops — non-blocking
      alertNewProvision(session.user.id, plan || 'free').catch(() => {})
      return NextResponse.json({
        success: true,
        userId,
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
    console.error('Provision error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
