import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateGatewayRequest,
  extractUsage,
  gatewayCorsHeaders,
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  openAiError,
  recordGatewayUsage,
  resolveGatewayUpstreams,
  shouldTryNextGatewayUpstream,
} from '@/app/lib/opengateway'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: gatewayCorsHeaders() })
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  // Abuse protection on a spend-per-request endpoint, before any upstream call
  if (await isRateLimited(getClientIP(req))) {
    return openAiError('Rate limit exceeded. Slow down and retry.', 429, 'rate_limited')
  }

  // Dual auth: API key OR x402 payment signature
  const paymentSignature = req.headers.get('payment-signature') || req.headers.get('PAYMENT-SIGNATURE')
  const auth = await authenticateGatewayRequest(req.headers)

  if (!auth && !paymentSignature) {
    // Neither auth method — return 402 with payment requirements
    const paymentRequired = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact',
          network: 'eip155:8453',
          maxAmountRequired: '1000', // 0.001 USDC
          resource: req.url,
          description: 'MiMo V2.5 Pro chat completions — pay per request in USDC on Base',
          mimeType: 'application/json',
          payTo: '0x451cE4B37ad54BcFCD49b8a4140C17315358EDa5',
          maxTimeoutSeconds: 60,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
      payer: null,
    }
    const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString('base64')
    return new NextResponse(
      JSON.stringify({ error: 'Payment Required', x402Version: 2 }),
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'PAYMENT-REQUIRED': encoded,
          ...gatewayCorsHeaders(),
        },
      }
    )
  }

  // x402 payment — verify and record
  if (!auth && paymentSignature) {
    // Payment signature present — record as x402 payment
    // The proxy middleware already validated the payment
    // We just need to track usage under the x402 payment
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

  const upstreams = resolveGatewayUpstreams()
  if (upstreams.length === 0) {
    return openAiError(
      'Agentbot Vercel Gateway has no upstream provider configured. Set AGENTBOT_GATEWAY_UPSTREAM_API_KEY, AI_GATEWAY_API_KEY, or OPENROUTER_API_KEY.',
      503,
      'upstream_not_configured',
    )
  }

  let lastFailure: { status: number; text: string; provider: string } | null = null

  for (const upstream of upstreams) {
    const upstreamBody = {
      ...body,
      model: normalizeGatewayModel(requestedModel, upstream.provider),
    }

    try {
      const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: gatewayUpstreamHeaders(upstream),
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

      if (!response.ok && shouldTryNextGatewayUpstream(response.status)) {
        lastFailure = { status: response.status, text: text.slice(0, 500), provider: upstream.provider }
        continue
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
      lastFailure = {
        status: 502,
        text: error instanceof Error ? error.message : 'Gateway request failed',
        provider: upstream.provider,
      }
    }
  }

  recordGatewayUsage({
    auth,
    model: requestedModel,
    inputTokens: 0,
    outputTokens: 0,
    endpoint: '/v1/chat/completions',
    latencyMs: Date.now() - startedAt,
    success: false,
    errorMessage: lastFailure ? `${lastFailure.provider}: ${lastFailure.text}` : 'Gateway request failed',
  })
  return openAiError(
    lastFailure ? `All configured upstream providers failed. Last failure from ${lastFailure.provider}: ${lastFailure.text}` : 'Gateway request failed.',
    lastFailure?.status === 401 ? 502 : lastFailure?.status ?? 502,
    'upstream_failed',
  )
}
