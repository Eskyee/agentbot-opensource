import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-secret-key-12345'

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
    
    let response: Response
    try {
      response = await fetch(`${BACKEND_API_URL}/api/deployments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          agentId: userId,
          version: 'latest',
          config: {
            telegramToken,
            ownerIds,
            aiProvider: aiProvider || 'openrouter',
            apiKey,
            plan: plan || 'free'
          }
        })
      })
    } catch (err) {
      console.error('Provisioning backend unreachable', {
        backendApiUrl: BACKEND_API_URL,
        error: err,
      })

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
        backendApiUrl: BACKEND_API_URL,
        status: response.status,
        contentType,
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
