import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LIQUID_RPC_URL = process.env.LIQUID_RPC_URL || 'https://elements-liquid-production.up.railway.app'
const LIQUID_RPC_USER = process.env.LIQUID_RPC_USER || 'liquidrpc'
const LIQUID_RPC_PASS = process.env.LIQUID_RPC_PASS || ''

// ── Per-instance cache to reduce RPC calls to the Liquid node ──
// Intentionally in-memory (not DB-backed): the goal is reducing total RPC calls
// across cold-starts, not sharing cache across Vercel instances. Each instance
// independently backs off, which is sufficient to cut bandwidth costs.
let cachedResponse: { data: Record<string, unknown>; ts: number } | null = null
const CACHE_TTL_MS = 30_000 // 30 seconds — fresh enough for dashboard
const UNREACHABLE_CACHE_TTL_MS = 60_000 // 60 seconds — back off harder when node is down

async function liquidRpc(method: string, params: unknown[] = []) {
  if (!LIQUID_RPC_PASS) {
    console.warn('[Liquid] LIQUID_RPC_PASS not set, falling back to public blockstream explorer');
    
    if (method === 'getblockchaininfo' || method === 'getblockcount') {
      try {
        const res = await fetch('https://blockstream.info/liquid/api/blocks/tip/height', { signal: AbortSignal.timeout(5000) });
        const height = await res.text();
        return { 
          ok: true, 
          result: { 
            chain: 'liquidv1', 
            headers: parseInt(height, 10), 
            blocks: parseInt(height, 10),
            verificationprogress: 1.0,
            pruned: false 
          } 
        };
      } catch {
        return { ok: false, error: 'All Liquid explorers unreachable' };
      }
    }
    return { ok: false, error: 'LIQUID_RPC_PASS not configured' };
  }

  // Retry with exponential backoff (up to 2 retries for transient 502s)
  const MAX_RETRIES = 2
  let lastError = 'Connection failed'

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)))
      }

      const res = await fetch(LIQUID_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${LIQUID_RPC_USER}:${LIQUID_RPC_PASS}`).toString('base64')}`,
        },
        body: JSON.stringify({ jsonrpc: '1.0', id: 'agentbot', method, params }),
        signal: AbortSignal.timeout(8000),
      })

      // Retry on 502/503/504 (transient infrastructure errors)
      if (res.status >= 502 && res.status <= 504 && attempt < MAX_RETRIES) {
        lastError = `HTTP ${res.status}`
        continue
      }

      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` }
      }

      const data = await res.json()
      return { ok: true, result: data.result, error: data.error }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Connection failed'
      if (attempt < MAX_RETRIES) continue
    }
  }

  return { ok: false, error: lastError }
}

export async function GET() {
  const now = Date.now()

  // Return cached response if still fresh
  if (cachedResponse) {
    const ttl = cachedResponse.data.status === 'unreachable' ? UNREACHABLE_CACHE_TTL_MS : CACHE_TTL_MS
    if (now - cachedResponse.ts < ttl) {
      return NextResponse.json({ ...cachedResponse.data, cached: true })
    }
  }

  const [info, blockCount] = await Promise.all([
    liquidRpc('getblockchaininfo'),
    liquidRpc('getblockcount'),
  ])

  const response: Record<string, unknown> = {
    status: info.ok ? 'connected' : 'unreachable',
    chain: info.result?.chain || 'liquidv1',
    blocks: blockCount.ok ? blockCount.result : (info.result?.blocks || 0),
    headers: info.result?.headers || 0,
    bestBlockHash: info.result?.bestblockhash || null,
    pruned: info.result?.pruned ?? true,
    sizeOnDisk: info.result?.size_on_disk || 0,
    verificationProgress: info.result?.verificationprogress || 0,
    isSynched: info.ok && info.result?.verificationprogress > 0.99,
    cached: false,
  }

  // Include error detail when unreachable so dashboard can show it
  if (!info.ok) {
    response.errorDetail = info.error
  }

  // Cache the response
  cachedResponse = { data: response, ts: now }

  return NextResponse.json(response)
}
