/**
 * mcp/x402-mcp.ts — x402 Payment Protocol MCP Server
 *
 * Exposes tools for discovering and calling paid agent services
 * via the Agentic Market API with x402 micropayments.
 *
 * Tools:
 *   discover_services  — list available services on the marketplace
 *   call_paid_endpoint — call a paid API endpoint with x402 payment
 *   check_balance      — check wallet balance for payments
 */

import type { Handler, HandlerMap } from './handlers'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AGENTIC_MARKET_BASE = 'https://api.agentic.market/v1'
const X402_GATEWAY_URL = process.env.X402_GATEWAY_URL ?? 'https://YOUR_SERVICE_URL'

interface AgenticService {
  id: string
  name: string
  description: string
  endpoint: string
  price: string
  currency: string
  category?: string
  agentId?: string
}

// ---------------------------------------------------------------------------
// discover_services — list available paid services
// ---------------------------------------------------------------------------

async function discoverServices(params: Record<string, unknown>): Promise<{
  services: AgenticService[]
  count: number
  query: string | undefined
}> {
  const category = params.category ? String(params.category) : undefined
  const query = params.query ? String(params.query) : undefined

  let url = `${AGENTIC_MARKET_BASE}/services`
  const queryParams: string[] = []
  if (category) queryParams.push(`category=${encodeURIComponent(category)}`)
  if (query) queryParams.push(`q=${encodeURIComponent(query)}`)
  if (queryParams.length) url += `?${queryParams.join('&')}`

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Agentbot-x402-MCP/1.0',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    // If marketplace API is unavailable, return known x402-capable endpoints
    if (res.status === 404 || res.status >= 500) {
      return {
        services: getFallbackServices(category, query),
        count: 1,
        query,
      }
    }
    throw new Error(`discover_services: Agentic Market API returned ${res.status}`)
  }

  const data = await res.json() as { services?: AgenticService[]; data?: AgenticService[] }
  let services = data.services ?? data.data ?? []

  // Client-side filter if API didn't filter
  if (category) {
    services = services.filter(s => s.category?.toLowerCase() === category.toLowerCase())
  }
  if (query) {
    const q = query.toLowerCase()
    services = services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    )
  }

  return { services, count: services.length, query }
}

function getFallbackServices(
  category?: string,
  query?: string
): AgenticService[] {
  const all: AgenticService[] = [
    {
      id: 'agentbot-chat',
      name: 'Agentbot Chat Completions',
      description: 'AI chat completions via x402-protected endpoint (MiMo v2.5 Pro)',
      endpoint: `${X402_GATEWAY_URL}/v1/x402/chat/completions`,
      price: '0.01',
      currency: 'USDC',
      category: 'ai',
      agentId: 'agentbot',
    },
    {
      id: 'agentbot-code',
      name: 'Agentbot Code Generation',
      description: 'Code generation and analysis via x402-protected endpoint',
      endpoint: `${X402_GATEWAY_URL}/v1/x402/chat/completions`,
      price: '0.02',
      currency: 'USDC',
      category: 'ai',
      agentId: 'agentbot',
    },
  ]

  return all.filter(s => {
    if (category && s.category !== category) return false
    if (query) {
      const q = query.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    }
    return true
  })
}

// ---------------------------------------------------------------------------
// call_paid_endpoint — call an x402-protected API
// ---------------------------------------------------------------------------

async function callPaidEndpoint(params: Record<string, unknown>): Promise<{
  service: string
  status: number
  data: unknown
  paymentRequired: boolean
}> {
  const endpoint = String(params.endpoint ?? '')
  const method = String(params.method ?? 'POST').toUpperCase()
  const body = params.body as Record<string, unknown> | undefined
  const headers = params.headers as Record<string, string> | undefined
  const maxPayment = params.maxPayment ? String(params.maxPayment) : undefined

  if (!endpoint) throw new Error('call_paid_endpoint: "endpoint" is required')

  // Build request
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Agentbot-x402-MCP/1.0',
      ...headers,
    },
    signal: AbortSignal.timeout(30_000),
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  let res = await fetch(endpoint, fetchOptions)

  // Handle 402 Payment Required — the core x402 flow
  if (res.status === 402) {
    const paymentDetails = await res.json() as {
      x402Version?: number
      accepts?: Array<{
        scheme: string
        network: string
        maxAmountRequired: string
        resource: string
        description: string
        mimeType: string
        payTo: string
        maxTimeoutSeconds: number
      }>
    }

    // Check if we have an x402 wallet configured to auto-pay
    const walletKey = process.env.X402_WALLET_PRIVATE_KEY
    if (!walletKey) {
      return {
        service: endpoint,
        status: 402,
        data: {
          error: 'Payment required but no X402_WALLET_PRIVATE_KEY configured',
          paymentDetails,
          hint: 'Set X402_WALLET_PRIVATE_KEY in your environment to enable auto-payment',
        },
        paymentRequired: true,
      }
    }

    // Attempt x402 payment via the gateway
    const paymentRes = await fetch(`${X402_GATEWAY_URL}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        method,
        body,
        headers,
        paymentDetails: paymentDetails.accepts?.[0],
        maxPayment,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!paymentRes.ok) {
      const errText = await paymentRes.text()
      return {
        service: endpoint,
        status: paymentRes.status,
        data: { error: `Payment settlement failed: ${errText}` },
        paymentRequired: true,
      }
    }

    const settled = await paymentRes.json() as { data?: unknown; status?: number }
    return {
      service: endpoint,
      status: settled.status ?? 200,
      data: settled.data ?? settled,
      paymentRequired: false,
    }
  }

  // Non-402 response — return as-is
  let data: unknown
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }

  return {
    service: endpoint,
    status: res.status,
    data,
    paymentRequired: res.status === 402,
  }
}

// ---------------------------------------------------------------------------
// check_balance — check USDC balance on Base for x402 payments
// ---------------------------------------------------------------------------

async function checkBalance(params: Record<string, unknown>): Promise<{
  address: string
  balance: string
  currency: string
  network: string
  sufficient: boolean
}> {
  const address = String(params.address ?? process.env.X402_WALLET_ADDRESS ?? '')

  if (!address) {
    throw new Error(
      'check_balance: "address" is required. Pass it as a parameter or set X402_WALLET_ADDRESS.'
    )
  }

  // USDC on Base L2
  const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

  // Use Base RPC to check ERC-20 balance
  const baseRpc = process.env.BASE_RPC_URL ?? 'https://mainnet.base.org'

  // balanceOf(address) selector: 0x70a08231
  const paddedAddr = address.toLowerCase().replace('0x', '').padStart(64, '0')
  const callData = `0x70a08231${paddedAddr}`

  const rpcRes = await fetch(baseRpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [
        { to: USDC_BASE_ADDRESS, data: callData },
        'latest',
      ],
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!rpcRes.ok) {
    throw new Error(`check_balance: Base RPC returned ${rpcRes.status}`)
  }

  const rpcData = await rpcRes.json() as { result?: string; error?: { message?: string } }

  if (rpcData.error) {
    throw new Error(`check_balance: RPC error: ${rpcData.error.message}`)
  }

  // USDC has 6 decimals
  const rawBalance = BigInt(rpcData.result ?? '0x0')
  const balance = (Number(rawBalance) / 1e6).toFixed(6)

  return {
    address,
    balance,
    currency: 'USDC',
    network: 'base',
    sufficient: Number(balance) > 0,
  }
}

// ---------------------------------------------------------------------------
// Handler map (conforms to the handlers.ts pattern)
// ---------------------------------------------------------------------------

export const x402Handlers: HandlerMap = {
  discover_services: discoverServices as Handler,
  call_paid_endpoint: callPaidEndpoint as Handler,
  check_balance: checkBalance as Handler,
}

/**
 * x402 MCP configuration (for registration with McpManager)
 */
export const X402_MCP_CONFIG = {
  enabled: true,
  name: 'x402',
  version: '1.0.0',
  tools: [
    {
      name: 'discover_services',
      description: 'List available paid services on the Agentic Market',
      parameters: {
        category: { type: 'string', description: 'Filter by category (e.g. "ai", "data")' },
        query: { type: 'string', description: 'Search query for services' },
      },
    },
    {
      name: 'call_paid_endpoint',
      description: 'Call an x402-protected API endpoint with automatic payment',
      parameters: {
        endpoint: { type: 'string', required: true, description: 'The API endpoint URL' },
        method: { type: 'string', default: 'POST', description: 'HTTP method' },
        body: { type: 'object', description: 'Request body (for POST/PUT)' },
        headers: { type: 'object', description: 'Additional headers' },
        maxPayment: { type: 'string', description: 'Max payment amount in USDC' },
      },
    },
    {
      name: 'check_balance',
      description: 'Check USDC balance on Base for x402 payments',
      parameters: {
        address: { type: 'string', description: 'Wallet address (defaults to X402_WALLET_ADDRESS env)' },
      },
    },
  ],
}
