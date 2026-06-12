/**
 * POST /v1/search — fast codebase search.
 *
 * Returns the few relevant chunks for a query from a supplied file corpus, so
 * an agent can locate code without feeding the whole repo to the big model.
 * Deterministic lexical ranker (no model call, no cost beyond the request).
 *
 *   curl https://agentbot.sh/v1/search \
 *     -H "authorization: Bearer ogw_live_..." \
 *     -H "content-type: application/json" \
 *     -d '{"query":"rate limit","files":[{"path":"a.ts","content":"..."}],"limit":5}'
 *
 *   → { hits: [{ path, startLine, endLine, score, snippet }] }
 */
import { NextRequest } from 'next/server'
import { authenticateGatewayRequest, gatewayCorsHeaders, openAiError } from '@/app/lib/opengateway'
import { searchCode, type SearchFile } from '@/app/lib/code-search'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { apiOk } from '@/app/lib/api/respond'
import { readJson, str, num } from '@/app/lib/api/body'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: gatewayCorsHeaders() })
}

const MAX_FILES = 400
const MAX_TOTAL_CHARS = 2_000_000

function sanitizeFiles(raw: unknown): SearchFile[] {
  if (!Array.isArray(raw)) return []
  const out: SearchFile[] = []
  let total = 0
  for (const entry of raw as unknown[]) {
    if (out.length >= MAX_FILES) break
    if (!entry || typeof entry !== 'object') continue
    const f = entry as { path?: unknown; content?: unknown }
    const path = str(f.path, '', 400)
    const content = typeof f.content === 'string' ? f.content : ''
    if (!path || !content) continue
    if (total + content.length > MAX_TOTAL_CHARS) break
    total += content.length
    out.push({ path, content })
  }
  return out
}

export async function POST(req: NextRequest) {
  // Cheap endpoint, but still gate to deter scraping/abuse
  if (await checkRateLimit(req, 'write')) {
    return openAiError('Rate limit exceeded. Slow down and retry.', 429, 'rate_limited')
  }

  const paymentSignature = req.headers.get('payment-signature') || req.headers.get('PAYMENT-SIGNATURE')
  const auth = await authenticateGatewayRequest(req.headers)
  if (!auth && !paymentSignature) {
    return openAiError('Authentication required. Provide an API key or x402 payment.', 401, 'unauthorized')
  }

  const parsed = await readJson<{ query?: unknown; files?: unknown; limit?: unknown }>(req)
  if (!parsed.ok) return openAiError('Request body must be valid JSON.', 400, 'invalid_json')

  const query = str(parsed.data.query, '', 500).trim()
  if (!query) return openAiError('Missing required field: query.', 400, 'missing_query')

  const files = sanitizeFiles(parsed.data.files)
  if (files.length === 0) return openAiError('Missing required field: files.', 400, 'missing_files')

  const limit = num(parsed.data.limit, 8, 1, 50)
  const hits = searchCode(query, files, { limit })

  return apiOk({ query, hits, fileCount: files.length }, 200, gatewayCorsHeaders())
}
