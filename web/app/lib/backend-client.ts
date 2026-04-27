import { Wallet } from 'ethers'
import { canonicalJsonStringify } from './canonical-json'

/**
 * BackendClient — Securely communicates with the agentbot-backend.
 *
 * Implements "Identity as a Fact" by signing every request with the
 * application's private key. This allows the backend to verify the
 * request origin cryptographically without relying on shared API keys.
 *
 * Signature payload (must match `signatureGuard`):
 *   `${METHOD}:${PATH}:${CANONICAL_BODY}:${TIMESTAMP}`
 *
 * `CANONICAL_BODY` is produced by canonicalJsonStringify so signer/verifier
 * agree byte-for-byte regardless of object property insertion order. Using
 * raw JSON.stringify here was a silent breakage waiting to happen — any
 * caller passing `{ b: 1, a: 2 }` would produce a different signature than a
 * caller passing `{ a: 2, b: 1 }` even though both are semantically the same
 * payload.
 */
export async function signedFetch(path: string, init?: RequestInit) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
  const privateKey = process.env.APP_PRIVATE_KEY
  const internalApiKey = process.env.INTERNAL_API_KEY

  // Ensure path starts with /
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${backendUrl}${sanitizedPath}`

  const method = init?.method?.toUpperCase() || 'GET'
  const timestamp = Date.now().toString()

  // Build the (a) on-the-wire body and (b) the body fed to canonicalization for
  // signing. They must agree: if the caller passes a string, we sign that
  // exact string; otherwise we serialize once via canonicalJsonStringify and
  // send that same canonical form on the wire.
  // The verifier (`signatureGuard`) parses the request body via express.json
  // and then canonical-stringifies the parsed object. To stay byte-identical
  // with the verifier we:
  //   - For string / buffer bodies that are JSON: parse → canonicalize, and
  //     ALSO replace the wire body with the canonical form so the verifier's
  //     express.json() result feeds back into the same canonicalStringify.
  //   - For string bodies that are NOT JSON (caller intent), sign and send
  //     them verbatim — the verifier's hasBody check skips canonicalization.
  //   - For plain objects, canonicalize once and use that for both sides.
  let bodyStr = ''
  let wireBody: BodyInit | null | undefined = init?.body as BodyInit | null | undefined

  const tryCanonicalizeJsonString = (raw: string): string | null => {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const first = trimmed[0]
    if (first !== '{' && first !== '[') return null
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed === null || typeof parsed !== 'object') return null
      return canonicalJsonStringify(parsed)
    } catch {
      return null
    }
  }

  if (init?.body !== undefined && init?.body !== null) {
    if (typeof init.body === 'string') {
      const canonical = tryCanonicalizeJsonString(init.body)
      if (canonical !== null) {
        bodyStr = canonical
        wireBody = canonical
      } else {
        bodyStr = init.body
      }
    } else if (
      typeof Buffer !== 'undefined' &&
      Buffer.isBuffer?.(init.body as unknown)
    ) {
      const utf = (init.body as Buffer).toString('utf8')
      const canonical = tryCanonicalizeJsonString(utf)
      if (canonical !== null) {
        bodyStr = canonical
        wireBody = canonical
      } else {
        bodyStr = utf
      }
    } else if (
      init.body instanceof ArrayBuffer ||
      ArrayBuffer.isView(init.body as unknown)
    ) {
      const utf = new TextDecoder().decode(init.body as ArrayBuffer)
      const canonical = tryCanonicalizeJsonString(utf)
      if (canonical !== null) {
        bodyStr = canonical
        wireBody = canonical
      } else {
        bodyStr = utf
      }
    } else if (typeof init.body === 'object') {
      // Convert plain object/array → canonical JSON for signing AND wire.
      bodyStr = canonicalJsonStringify(init.body)
      wireBody = bodyStr
    }
  }

  const headers = new Headers(init?.headers || {})
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // 1. Attempt Cryptographic Signing (Identity as a Fact)
  if (privateKey) {
    try {
      const wallet = new Wallet(privateKey)
      const message = `${method}:${sanitizedPath}:${bodyStr}:${timestamp}`
      const signature = await wallet.signMessage(message)

      headers.set('x-agent-signature', signature)
      headers.set('x-agent-address', wallet.address)
      headers.set('x-agent-timestamp', timestamp)
    } catch (error) {
      // Failing to sign is a configuration problem the operator must see.
      // We surface it loudly here and let the request proceed; the backend
      // will reject it via the bearer fallback if INTERNAL_API_KEY is unset.
      console.error('[BackendClient] Signing failed (request will fall back to bearer):', error)
    }
  }

  // 2. Legacy Fallback (Bearer Token)
  // We keep this during the transition phase to ensure no service interruption.
  if (internalApiKey) {
    headers.set('Authorization', `Bearer ${internalApiKey}`)
  }

  return fetch(url, {
    ...init,
    body: wireBody,
    headers,
  })
}
