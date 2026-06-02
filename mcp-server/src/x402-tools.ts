/**
 * x402 MCP Tools — Discover and call paid services on Agentic Market
 *
 * These tools are registered with the MCP server and allow AI agents
 * to discover, price, and pay for x402-enabled services.
 */

const AGENTIC_MARKET_API = 'https://api.agentic.market/v1'

export interface X402Service {
  id: string
  name: string
  description: string
  category: string
  networks: string[]
  endpoints: X402Endpoint[]
}

export interface X402Endpoint {
  url: string
  method: string
  description: string
  pricing: {
    amount: string
    currency: string
    network: string
    scheme: string
  }
}

/**
 * Discover services on Agentic Market
 */
export async function discoverServices(query?: string, category?: string): Promise<X402Service[]> {
  let url = `${AGENTIC_MARKET_API}/services`
  if (query) {
    url = `${AGENTIC_MARKET_API}/services/search?q=${encodeURIComponent(query)}`
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Agentic Market API returned ${res.status}`)

  const data = await res.json() as any
  let services = data.services || []

  if (category) {
    services = services.filter((s: X402Service) =>
      s.category?.toLowerCase() === category.toLowerCase()
    )
  }

  return services
}

/**
 * Get details for a specific service
 */
export async function getService(serviceId: string): Promise<X402Service | null> {
  const res = await fetch(`${AGENTIC_MARKET_API}/services/${serviceId}`, {
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) return null
  return res.json() as Promise<X402Service>
}

/**
 * Make an x402-paid request to an endpoint
 * Returns the response from the paid service
 */
export async function callPaidEndpoint(
  url: string,
  options: {
    method?: string
    body?: string
    headers?: Record<string, string>
    privateKey?: string
  } = {}
): Promise<{ status: number; data: unknown; paymentAmount?: string }> {
  const method = options.method || 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // First request — expect 402
  const initialRes = await fetch(url, {
    method,
    headers,
    body: options.body,
    signal: AbortSignal.timeout(15_000),
  })

  if (initialRes.status !== 402) {
    // No payment required — return directly
    const data = await initialRes.json().catch(() => initialRes.text())
    return { status: initialRes.status, data }
  }

  // Parse payment requirements from PAYMENT-REQUIRED header
  const paymentHeader = initialRes.headers.get('PAYMENT-REQUIRED')
  if (!paymentHeader) {
    throw new Error('Server returned 402 but no PAYMENT-REQUIRED header')
  }

  let paymentRequired: any
  try {
    paymentRequired = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())
  } catch {
    throw new Error('Invalid PAYMENT-REQUIRED header format')
  }

  // If we have a private key, sign the payment
  if (options.privateKey) {
    // In production, use @x402/core to sign the payment
    // For now, return the payment requirements
    return {
      status: 402,
      data: {
        error: 'Payment required',
        paymentRequired,
        message: 'Set X402_PRIVATE_KEY to enable automatic payments',
      },
      paymentAmount: paymentRequired.accepts?.[0]?.maxAmountRequired,
    }
  }

  // No private key — return payment requirements
  return {
    status: 402,
    data: {
      error: 'Payment required',
      paymentRequired,
      message: 'Provide a private key to sign the payment',
    },
    paymentAmount: paymentRequired.accepts?.[0]?.maxAmountRequired,
  }
}
