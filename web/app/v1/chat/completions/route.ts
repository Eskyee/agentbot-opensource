import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateGatewayRequest,
  extractUsage,
  gatewayCorsHeaders,
  normalizeGatewayModel,
  openAiError,
  recordGatewayUsage,
  resolveGatewayUpstream,
} from '@/app/lib/opengateway'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: gatewayCorsHeaders() })
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const auth = await authenticateGatewayRequest(req.headers)
  if (!auth) {
    return openAiError('Invalid or missing Agentbot gateway API key.', 401, 'invalid_api_key')
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return openAiError('Request body must be valid JSON.', 400, 'invalid_json')
  }

  const requestedModel = typeof body.model === 'string' ? body.model : ''
  if (!requestedModel.trim()) {
    return openAiError('Missing required field: model.', 400, 'missing_model')
  }
  if (!Array.isArray(body.messages)) {
    return openAiError('Missing required field: messages.', 400, 'missing_messages')
  }

  const upstream = resolveGatewayUpstream()
  if (!upstream) {
    return openAiError(
      'Agentbot OpenGateway has no upstream provider configured. Set AGENTBOT_GATEWAY_UPSTREAM_API_KEY, AI_GATEWAY_API_KEY, or OPENROUTER_API_KEY.',
      503,
      'upstream_not_configured',
    )
  }

  const upstreamBody = {
    ...body,
    model: normalizeGatewayModel(requestedModel, upstream.provider),
  }

  try {
    const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstream.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://127.0.0.1:3007',
        'X-Title': 'Agentbot OpenGateway',
      },
      body: JSON.stringify(upstreamBody),
      signal: AbortSignal.timeout(55_000),
    })

    const contentType = response.headers.get('content-type') || 'application/json'
    const text = await response.text()
    const headers = {
      ...gatewayCorsHeaders(),
      'Content-Type': contentType,
      'x-agentbot-gateway-provider': upstream.provider,
      'x-agentbot-gateway-model': upstreamBody.model,
    }

    if (contentType.includes('text/event-stream') || body.stream === true) {
      recordGatewayUsage({
        auth,
        model: requestedModel,
        inputTokens: 0,
        outputTokens: 0,
        endpoint: '/v1/chat/completions',
        latencyMs: Date.now() - startedAt,
        success: response.ok,
        errorMessage: response.ok ? undefined : text.slice(0, 500),
      })
      return new NextResponse(text, { status: response.status, headers })
    }

    let parsed: unknown = null
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { raw: text }
    }

    const usage = extractUsage(parsed, upstreamBody)
    recordGatewayUsage({
      auth,
      model: requestedModel,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      endpoint: '/v1/chat/completions',
      latencyMs: Date.now() - startedAt,
      success: response.ok,
      errorMessage: response.ok ? undefined : text.slice(0, 500),
    })

    return new NextResponse(text, { status: response.status, headers })
  } catch (error) {
    recordGatewayUsage({
      auth,
      model: requestedModel,
      inputTokens: 0,
      outputTokens: 0,
      endpoint: '/v1/chat/completions',
      latencyMs: Date.now() - startedAt,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Gateway request failed',
    })
    return openAiError(error instanceof Error ? error.message : 'Gateway request failed.', 502, 'upstream_failed')
  }
}

