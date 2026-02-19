import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const BACKEND_API_FALLBACK_URL = (process.env.BACKEND_API_FALLBACK_URL || '').trim()
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-secret-key-12345'
const BACKEND_API_SECRET = process.env.BACKEND_API_SECRET || process.env.API_SECRET || INTERNAL_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramToken, telegramUserId, aiProvider, apiKey, plan } = body
    
    if (!telegramToken) {
      return NextResponse.json({ error: 'Telegram token required' }, { status: 400 })
    }
    
    // Generate unique user ID
    const userId = crypto.randomBytes(8).toString('hex')

    const ownerIds = telegramUserId ? [telegramUserId] : undefined
    
    const modernPayload = {
      agentId: userId,
      version: 'latest',
      config: {
        telegramToken,
        ownerIds,
        aiProvider: aiProvider || 'openrouter',
        apiKey,
        plan: plan || 'free'
      }
    }

    const legacyPayload = {
      userId,
      telegramToken,
      ownerIds,
      aiProvider: aiProvider || 'openrouter',
      apiKey,
      plan: plan || 'free'
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
      return NextResponse.json({
        success: true,
        userId,
        subdomain,
        url: data.url
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
