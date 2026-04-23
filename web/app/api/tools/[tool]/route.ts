import { NextRequest, NextResponse } from 'next/server'
import { executePaidTool, getPaidTool, quotePaidTool, type PaidToolId } from '@/app/lib/paidTools'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { create402Response, getPaymentMethod, hasMppCredential, verifyMppPayment } from '@/lib/mpp/middleware'
import { getUserSession, processVoucher, type Voucher } from '@/lib/mpp/sessions'
import type { Address } from 'viem'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

type StoredResponse = {
  requestHash: string
  expiresAt: number
  status: number
  headers: Record<string, string>
  body: unknown
}

const idempotencyStore = new Map<string, StoredResponse>()
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000

function cleanupIdempotency() {
  const now = Date.now()
  for (const [key, value] of idempotencyStore.entries()) {
    if (value.expiresAt <= now) idempotencyStore.delete(key)
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(',')}}`
}

function requestHash(toolId: string, body: unknown) {
  return `${toolId}:${stableStringify(body)}`
}

function storeIdempotent(key: string, response: StoredResponse) {
  cleanupIdempotency()
  idempotencyStore.set(key, response)
}

function readIdempotent(key: string) {
  cleanupIdempotency()
  return idempotencyStore.get(key) || null
}

function buildReceipt(args: {
  tool: string
  protocol: 'preview' | 'mpp' | 'session'
  amount: string
  currency: string
  network: string
  settled: boolean
}) {
  const payload = {
    tool: args.tool,
    protocol: args.protocol,
    amount: args.amount,
    currency: args.currency,
    network: args.network,
    settled: args.settled,
    timestamp: new Date().toISOString(),
    reference: `tool_${args.tool}_${crypto.randomUUID()}`,
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function jsonResponse(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: init?.headers,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params
  const definition = getPaidTool(tool)
  if (!definition) {
    return jsonResponse(
      {
        type: 'https://agentbot.sh/problems/unknown-tool',
        title: 'Unknown tool',
        status: 404,
        detail: `No paid tool is registered for "${tool}".`,
      },
      { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
    )
  }

  const body = await request.json().catch(() => ({}))
  const input = body?.input && typeof body.input === 'object' ? body.input : {}
  const quote = quotePaidTool(definition.id, input)
  const idemKey = request.headers.get('Idempotency-Key')
  const reqHash = requestHash(definition.id, body)

  if (idemKey) {
    const cached = readIdempotent(`${definition.id}:${idemKey}`)
    if (cached) {
      if (cached.requestHash !== reqHash) {
        return jsonResponse(
          {
            type: 'https://agentbot.sh/problems/idempotency-mismatch',
            title: 'Idempotency key reuse with different body',
            status: 409,
            detail: 'Reuse the same Idempotency-Key only when retrying the exact same tool request.',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } }
        )
      }

      return jsonResponse(cached.body, {
        status: cached.status,
        headers: {
          ...cached.headers,
          'Idempotent-Replayed': 'true',
        },
      })
    }
  }

  const paymentMethod = getPaymentMethod(request)
  const session = await getAuthSession()
  const preview = body?.preview === true && Boolean(session?.user?.id)

  let receipt: string | null = null
  let paymentProtocol: 'preview' | 'mpp' | 'session' = 'preview'

  if (!preview) {
    if (paymentMethod === 'session') {
      const sessionId = request.headers.get('X-Session-Id')
      const userAddress = request.headers.get('X-Wallet-Address') as Address | null
      if (!sessionId || !userAddress) {
        return jsonResponse(
          {
            type: 'https://agentbot.sh/problems/payment-required',
            title: 'Payment Required',
            status: 402,
            detail: 'Session payment requires X-Session-Id and X-Wallet-Address headers.',
            quote,
          },
          { status: 402, headers: { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store' } }
        )
      }

      const active = getUserSession(userAddress)
      if (!active || active.id !== sessionId) {
        return jsonResponse(
          {
            type: 'https://agentbot.sh/problems/payment-required',
            title: 'Payment Required',
            status: 402,
            detail: 'No active payment session found for this wallet.',
            quote,
          },
          { status: 402, headers: { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store' } }
        )
      }

      paymentProtocol = 'session'
    } else if (paymentMethod === 'mpp' && hasMppCredential(request)) {
      const verification = await verifyMppPayment(request, 'agent')
      if (!verification.valid) {
        return create402Response(definition.id, {
          amount: quote.amount,
          description: definition.description,
        })
      }
      paymentProtocol = 'mpp'
      receipt = verification.receipt || null
    } else {
      return create402Response(definition.id, {
        amount: quote.amount,
        description: definition.description,
      })
    }
  }

  let result
  try {
    result = await executePaidTool(definition.id, input, session?.user?.id || null)
  } catch (error) {
    return jsonResponse(
      {
        type: 'https://agentbot.sh/problems/run-failed',
        title: 'Tool execution failed',
        status: 500,
        detail: error instanceof Error ? error.message : 'Tool execution failed',
      },
      { status: 500, headers: { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store' } }
    )
  }

  if (paymentProtocol === 'session') {
    const sessionId = request.headers.get('X-Session-Id')!
    const userAddress = request.headers.get('X-Wallet-Address') as Address
    const voucher: Voucher = {
      sessionId,
      userAddress,
      amount: quote.amount,
      plugin: definition.id,
      nonce: `tool_${crypto.randomUUID()}`,
      timestamp: Date.now(),
      signature: '0x' as `0x${string}`,
    }

    const voucherResult = processVoucher(voucher)
    if (!voucherResult.success) {
      return jsonResponse(
        {
          type: 'https://agentbot.sh/problems/payment-required',
          title: 'Payment Required',
          status: 402,
          detail: voucherResult.error || 'Unable to debit active session.',
          quote,
        },
        { status: 402, headers: { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store' } }
      )
    }
    receipt = buildReceipt({
      tool: definition.id,
      protocol: 'session',
      amount: quote.amount,
      currency: quote.currency,
      network: quote.network,
      settled: true,
    })
  }

  if (paymentProtocol === 'preview') {
    receipt = buildReceipt({
      tool: definition.id,
      protocol: 'preview',
      amount: quote.amount,
      currency: quote.currency,
      network: quote.network,
      settled: false,
    })
  }

  const responseBody = {
    tool: definition.id,
    ok: true,
    quotedPrice: {
      amount: quote.displayAmount,
      currency: quote.currency,
      network: quote.network,
      scheme: quote.scheme,
    },
    payment: {
      protocol: paymentProtocol,
      amount: quote.displayAmount,
      currency: quote.currency,
      settled: paymentProtocol !== 'preview',
    },
    result,
  }

  const responseHeaders: Record<string, string> = {
    'Cache-Control': 'private',
  }
  if (receipt) {
    responseHeaders['Payment-Receipt'] = receipt
  }
  if (idemKey) {
    storeIdempotent(`${definition.id}:${idemKey}`, {
      requestHash: reqHash,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      status: 200,
      headers: responseHeaders,
      body: responseBody,
    })
  }

  return jsonResponse(responseBody, { headers: responseHeaders })
}
