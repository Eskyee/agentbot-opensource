/**
 * Ed25519 Agent Authentication
 * Verifies agent signatures for authenticated agent-to-platform communication.
 *
 * Supported public key formats:
 *   - SPKI DER base64 (standard crypto encoding)
 *   - Raw 32-byte base64
 *   - Hex (64 chars)
 *
 * Supported signature formats:
 *   - Hex (128 chars)
 *   - Base64
 */

import crypto from 'crypto'

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

interface AuthResult {
  success: boolean
  agentPublicKey?: string
  error?: string
}

/**
 * Parse a public key from various formats into a raw 32-byte Buffer.
 */
function parsePublicKey(publicKeyStr: string): Buffer | null {
  // Try hex (64 chars = 32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(publicKeyStr)) {
    return Buffer.from(publicKeyStr, 'hex')
  }

  try {
    const buf = Buffer.from(publicKeyStr, 'base64')

    // Raw 32 bytes
    if (buf.length === 32) {
      return buf
    }

    // SPKI DER — extract the 32-byte key from the end
    // Ed25519 SPKI: 12-byte header + 32-byte key = 44 bytes
    if (buf.length === 44) {
      return buf.subarray(12)
    }

    // Alternative: longer SPKI with optional metadata
    if (buf.length > 32) {
      return buf.subarray(buf.length - 32)
    }
  } catch {
    // not base64
  }

  return null
}

/**
 * Parse a signature from hex or base64 into a 64-byte Buffer.
 */
function parseSignature(signatureStr: string): Buffer | null {
  // Try hex (128 chars = 64 bytes)
  if (/^[0-9a-fA-F]{128}$/.test(signatureStr)) {
    return Buffer.from(signatureStr, 'hex')
  }

  try {
    const buf = Buffer.from(signatureStr, 'base64')
    if (buf.length === 64) {
      return buf
    }
  } catch {
    // not base64
  }

  return null
}

/**
 * Verify an Ed25519 signature against a message.
 *
 * @param publicKeyStr - Public key in SPKI DER base64, raw base64, or hex
 * @param signatureStr - Signature in hex or base64
 * @param message - The message that was signed
 * @returns true if the signature is valid
 */
export function verifyEd25519Signature(
  publicKeyStr: string,
  signatureStr: string,
  message: string
): boolean {
  const pubKeyRaw = parsePublicKey(publicKeyStr)
  if (!pubKeyRaw) return false

  const signature = parseSignature(signatureStr)
  if (!signature) return false

  try {
    // Build a SPKI DER-encoded key for Node.js crypto
    const spkiHeader = Buffer.from([
      0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
    ])
    const spkiKey = Buffer.concat([spkiHeader, pubKeyRaw])

    const keyObject = crypto.createPublicKey({
      key: spkiKey,
      format: 'der',
      type: 'spki',
    })

    return crypto.verify(
      null,
      Buffer.from(message, 'utf8'),
      keyObject,
      signature
    )
  } catch {
    return false
  }
}

/**
 * Authenticate an agent request by verifying signature + timestamp + nonce.
 *
 * Expected request body fields:
 *   - agentPublicKey: string (public key in supported format)
 *   - signature: string (hex or base64)
 *   - timestamp: number (ms since epoch)
 *   - nonce: string (unique per request)
 *
 * The signed message is: `${method}:${path}:${bodyHash}:${timestamp}:${nonce}`
 */
export async function authenticateAgent(
  req: Request
): Promise<AuthResult> {
  try {
    const contentType = req.headers.get('content-type') || ''
    let body: Record<string, unknown> = {}

    if (contentType.includes('application/json')) {
      body = await req.json()
    }

    const { agentPublicKey, signature, timestamp, nonce } = body as {
      agentPublicKey?: string
      signature?: string
      timestamp?: number
      nonce?: string
    }

    if (!agentPublicKey || !signature || !timestamp || !nonce) {
      return {
        success: false,
        error: 'Missing required fields: agentPublicKey, signature, timestamp, nonce',
      }
    }

    // Check timestamp window (5 min)
    const now = Date.now()
    if (Math.abs(now - Number(timestamp)) > TIMESTAMP_WINDOW_MS) {
      return { success: false, error: 'Timestamp outside 5-minute window' }
    }

    // Build the expected signed message
    const url = new URL(req.url)
    const bodyForSigning = JSON.stringify(body)
    const bodyHash = crypto
      .createHash('sha256')
      .update(bodyForSigning)
      .digest('hex')
    const message = `${req.method}:${url.pathname}:${bodyHash}:${timestamp}:${nonce}`

    // Verify signature
    const valid = verifyEd25519Signature(agentPublicKey, signature, message)
    if (!valid) {
      return { success: false, error: 'Invalid signature' }
    }

    return { success: true, agentPublicKey }
  } catch (err) {
    return {
      success: false,
      error: `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}
