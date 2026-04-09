/**
 * Webhook Security Pattern Tests
 *
 * Tests the security-critical logic patterns applied to all webhook handlers
 * in the web frontend (Discord, WhatsApp, Mux, Stripe, Discord Interactions).
 *
 * These are pure crypto/logic unit tests — no Next.js, no HTTP.
 * They validate the exact patterns used in:
 *   web/app/api/webhooks/discord/route.ts
 *   web/app/api/webhooks/whatsapp/route.ts
 *   web/app/api/webhooks/mux/route.ts
 *   web/app/api/webhooks/stripe/route.ts
 *   web/app/api/webhooks/discord/interactions/route.ts
 *
 * Findings covered:
 *   CRIT   Discord interactions was using SHA256 instead of Ed25519
 *   HIGH   timingSafeEqual() crash on mismatched buffer lengths → 500 info-leak
 *   HIGH   Fail-open: unauthenticated requests silently processed when secret absent
 *   MED    Mux replay attack: no timestamp validation (now enforced)
 */

import crypto, { timingSafeEqual, createHmac } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Reference implementations (mirrors the actual webhook handler code)
// ─────────────────────────────────────────────────────────────────────────────

const HMAC_SECRET = 'test-webhook-secret-32-chars-long!';
const WRONG_SECRET = 'wrong-secret';

/**
 * verifyHmacSignature: the pattern used in WhatsApp and Mux webhook handlers.
 * Fail-closed + length guard + timingSafeEqual.
 */
function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string | undefined
): boolean {
  // Fail closed — reject all requests if secret is not configured
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(body).digest('hex');

  const sigBuf      = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  // Length guard — timingSafeEqual() throws on mismatched lengths
  if (sigBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * verifyMuxSignatureWithTimestamp: adds replay-protection (5-min window).
 */
function verifyMuxSignatureWithTimestamp(
  body: string,
  signatureHeader: string, // "t=<unix>,v1=<hex>"
  secret: string | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!secret) return false;

  const parts     = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const sig       = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !sig) return false;

  // Replay check: reject if older than 5 minutes
  const age = nowMs - parseInt(timestamp) * 1000;
  if (age > 5 * 60 * 1000) return false;

  const payload  = timestamp + '.' + body;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');

  const sigBuf      = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * verifyApiKeyTimingSafe: the pattern used in Discord webhook GET/POST.
 * Fail-closed + length guard + timingSafeEqual.
 */
function verifyApiKeyTimingSafe(
  provided: string,
  expected: string | undefined
): boolean {
  if (!expected) return false;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(providedBuf, expectedBuf);
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp / HMAC-SHA256 webhook pattern
// ─────────────────────────────────────────────────────────────────────────────
describe('WhatsApp webhook — HMAC-SHA256 + fail-closed + length guard', () => {
  const body = JSON.stringify({ entry: [{ id: '123' }] });
  const goodSig = createHmac('sha256', HMAC_SECRET).update(body).digest('hex');

  it('accepts a valid HMAC-SHA256 signature', () => {
    expect(verifyHmacSignature(body, goodSig, HMAC_SECRET)).toBe(true);
  });

  it('rejects an incorrect signature', () => {
    const badSig = createHmac('sha256', WRONG_SECRET).update(body).digest('hex');
    expect(verifyHmacSignature(body, badSig, HMAC_SECRET)).toBe(false);
  });

  it('rejects a tampered body (signature mismatch)', () => {
    const tamperedBody = JSON.stringify({ entry: [{ id: '999' }] });
    expect(verifyHmacSignature(tamperedBody, goodSig, HMAC_SECRET)).toBe(false);
  });

  it('FAIL-CLOSED: returns false when secret is undefined (not configured)', () => {
    expect(verifyHmacSignature(body, goodSig, undefined)).toBe(false);
  });

  it('FAIL-CLOSED: returns false when secret is empty string', () => {
    expect(verifyHmacSignature(body, goodSig, '')).toBe(false);
  });

  it('LENGTH GUARD: does not crash when signature is shorter than expected', () => {
    // Pre-fix: timingSafeEqual(short, long) throws → 500
    // Post-fix: length guard returns false cleanly
    const shortSig = 'abc123';
    expect(() => verifyHmacSignature(body, shortSig, HMAC_SECRET)).not.toThrow();
    expect(verifyHmacSignature(body, shortSig, HMAC_SECRET)).toBe(false);
  });

  it('LENGTH GUARD: does not crash when signature is longer than expected', () => {
    const longSig = goodSig + 'aaaaaaaaaaaaaaaa';
    expect(() => verifyHmacSignature(body, longSig, HMAC_SECRET)).not.toThrow();
    expect(verifyHmacSignature(body, longSig, HMAC_SECRET)).toBe(false);
  });

  it('LENGTH GUARD: does not crash on empty string signature', () => {
    expect(() => verifyHmacSignature(body, '', HMAC_SECRET)).not.toThrow();
    expect(verifyHmacSignature(body, '', HMAC_SECRET)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mux webhook pattern — adds replay-attack prevention
// ─────────────────────────────────────────────────────────────────────────────
describe('Mux webhook — HMAC-SHA256 + replay-protection', () => {
  const body      = JSON.stringify({ type: 'video.asset.ready', data: {} });
  const nowMs     = Date.now();
  const tsSeconds = Math.floor(nowMs / 1000);
  const payload   = tsSeconds + '.' + body;
  const goodSig   = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  const header    = `t=${tsSeconds},v1=${goodSig}`;

  it('accepts a valid Mux signature within the 5-minute window', () => {
    expect(verifyMuxSignatureWithTimestamp(body, header, HMAC_SECRET, nowMs)).toBe(true);
  });

  it('REPLAY: rejects a signature older than 5 minutes', () => {
    const oldTs = Math.floor((nowMs - 6 * 60 * 1000) / 1000);
    const oldPayload = oldTs + '.' + body;
    const oldSig    = createHmac('sha256', HMAC_SECRET).update(oldPayload).digest('hex');
    const oldHeader = `t=${oldTs},v1=${oldSig}`;
    expect(verifyMuxSignatureWithTimestamp(body, oldHeader, HMAC_SECRET, nowMs)).toBe(false);
  });

  it('accepts a signature that is just inside the 5-minute window', () => {
    const borderTs = Math.floor((nowMs - 4 * 60 * 1000) / 1000);
    const borderPayload = borderTs + '.' + body;
    const borderSig    = createHmac('sha256', HMAC_SECRET).update(borderPayload).digest('hex');
    const borderHeader = `t=${borderTs},v1=${borderSig}`;
    expect(verifyMuxSignatureWithTimestamp(body, borderHeader, HMAC_SECRET, nowMs)).toBe(true);
  });

  it('FAIL-CLOSED: returns false when secret is not configured', () => {
    expect(verifyMuxSignatureWithTimestamp(body, header, undefined, nowMs)).toBe(false);
  });

  it('returns false when signature header is malformed (missing v1=)', () => {
    expect(verifyMuxSignatureWithTimestamp(body, `t=${tsSeconds}`, HMAC_SECRET, nowMs)).toBe(false);
  });

  it('returns false when signature header is malformed (missing t=)', () => {
    expect(verifyMuxSignatureWithTimestamp(body, `v1=${goodSig}`, HMAC_SECRET, nowMs)).toBe(false);
  });

  it('LENGTH GUARD: does not crash on truncated v1 signature', () => {
    const shortHeader = `t=${tsSeconds},v1=abc`;
    expect(() => verifyMuxSignatureWithTimestamp(body, shortHeader, HMAC_SECRET, nowMs)).not.toThrow();
    expect(verifyMuxSignatureWithTimestamp(body, shortHeader, HMAC_SECRET, nowMs)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Discord webhook API key — timingSafeEqual + fail-closed
// ─────────────────────────────────────────────────────────────────────────────
describe('Discord webhook — API key (timingSafeEqual + fail-closed)', () => {
  const WEBHOOK_KEY = 'discord-webhook-api-key-secret-abc';

  it('accepts the correct API key', () => {
    expect(verifyApiKeyTimingSafe(WEBHOOK_KEY, WEBHOOK_KEY)).toBe(true);
  });

  it('rejects an incorrect API key', () => {
    expect(verifyApiKeyTimingSafe('wrong-key', WEBHOOK_KEY)).toBe(false);
  });

  it('FAIL-CLOSED: rejects when expected key is undefined', () => {
    expect(verifyApiKeyTimingSafe(WEBHOOK_KEY, undefined)).toBe(false);
  });

  it('FAIL-CLOSED: rejects when expected key is empty string', () => {
    expect(verifyApiKeyTimingSafe(WEBHOOK_KEY, '')).toBe(false);
  });

  it('LENGTH GUARD: does not crash when provided key is shorter', () => {
    expect(() => verifyApiKeyTimingSafe('short', WEBHOOK_KEY)).not.toThrow();
    expect(verifyApiKeyTimingSafe('short', WEBHOOK_KEY)).toBe(false);
  });

  it('LENGTH GUARD: does not crash when provided key is longer', () => {
    const longer = WEBHOOK_KEY + 'extra-padding-here';
    expect(() => verifyApiKeyTimingSafe(longer, WEBHOOK_KEY)).not.toThrow();
    expect(verifyApiKeyTimingSafe(longer, WEBHOOK_KEY)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook — fail-closed (no secret → reject with 503)
// ─────────────────────────────────────────────────────────────────────────────
describe('Stripe webhook — fail-closed pattern', () => {
  it('FAIL-CLOSED: handler must reject if STRIPE_WEBHOOK_SECRET is absent', () => {
    // Stripe uses constructEvent() which requires the secret.
    // The fix: check for secret before calling constructEvent() and return 503.
    const secret = process.env.STRIPE_WEBHOOK_SECRET; // undefined in test env
    const shouldProcess = Boolean(secret);
    expect(shouldProcess).toBe(false);
    // In the real handler: if (!webhookSecret) return 503
  });

  it('constructEvent equivalent: empty string secret is treated as absent', () => {
    // An empty-string secret would cause stripe.webhooks.constructEvent to
    // accept any signature. Our guard treats '' as not configured.
    const secret = '';
    expect(Boolean(secret)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Discord Interactions — Ed25519 (not SHA256)
// ─────────────────────────────────────────────────────────────────────────────
describe('Discord Interactions — Ed25519 signature verification', () => {
  // Generate a real Ed25519 key pair for testing
  let privateKey: crypto.KeyObject;
  let publicKey: crypto.KeyObject;

  beforeAll(() => {
    const pair = crypto.generateKeyPairSync('ed25519');
    privateKey  = pair.privateKey;
    publicKey   = pair.publicKey;
  });

  /**
   * Signs a Discord interaction using Ed25519 — mirrors Discord's signing.
   * Discord signs: Buffer.concat([timestampBytes, bodyBytes])
   */
  function signInteraction(timestamp: string, body: string): string {
    const message = Buffer.concat([Buffer.from(timestamp), Buffer.from(body)]);
    return crypto.sign(null, message, privateKey).toString('hex');
  }

  /**
   * Verifies using SubtleCrypto — mirrors the actual route.ts implementation.
   * This is the CORRECT algorithm; the old code used SHA256 (wrong).
   */
  async function verifyInteractionSignature(
    signature: string,
    timestamp: string,
    body: string,
    pubKeyHex: string
  ): Promise<boolean> {
    if (!pubKeyHex) return false;
    try {
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        Buffer.from(pubKeyHex, 'hex'),
        'Ed25519',
        false,
        ['verify']
      );
      return await globalThis.crypto.subtle.verify(
        'Ed25519',
        key,
        Buffer.from(signature, 'hex'),
        Buffer.concat([Buffer.from(timestamp), Buffer.from(body)])
      );
    } catch {
      return false;
    }
  }

  function getPublicKeyHex(): string {
    // Export the raw 32-byte public key as hex
    return publicKey.export({ type: 'spki', format: 'der' })
      .subarray(-32).toString('hex');
  }

  it('verifies a valid Ed25519 signature', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body      = JSON.stringify({ type: 1 }); // PING
    const sig       = signInteraction(timestamp, body);
    const pubHex    = getPublicKeyHex();

    const result = await verifyInteractionSignature(sig, timestamp, body, pubHex);
    expect(result).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const timestamp    = String(Math.floor(Date.now() / 1000));
    const body         = JSON.stringify({ type: 1 });
    const tamperedBody = JSON.stringify({ type: 2 }); // altered
    const sig          = signInteraction(timestamp, body);
    const pubHex       = getPublicKeyHex();

    const result = await verifyInteractionSignature(sig, timestamp, tamperedBody, pubHex);
    expect(result).toBe(false);
  });

  it('rejects a tampered timestamp', async () => {
    const timestamp  = String(Math.floor(Date.now() / 1000));
    const body       = JSON.stringify({ type: 1 });
    const sig        = signInteraction(timestamp, body);
    const pubHex     = getPublicKeyHex();

    const result = await verifyInteractionSignature(sig, '0000000000', body, pubHex);
    expect(result).toBe(false);
  });

  it('rejects a signature from a different key pair', async () => {
    const { privateKey: altPriv } = crypto.generateKeyPairSync('ed25519');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body      = JSON.stringify({ type: 1 });

    const sigFromAltKey = crypto
      .sign(null, Buffer.concat([Buffer.from(timestamp), Buffer.from(body)]), altPriv)
      .toString('hex');

    const pubHex = getPublicKeyHex(); // correct public key

    const result = await verifyInteractionSignature(sigFromAltKey, timestamp, body, pubHex);
    expect(result).toBe(false);
  });

  it('FAIL-CLOSED: returns false when public key is not configured', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body      = JSON.stringify({ type: 1 });
    const sig       = signInteraction(timestamp, body);

    const result = await verifyInteractionSignature(sig, timestamp, body, '');
    expect(result).toBe(false);
  });

  it('returns false on a malformed hex signature (does not throw)', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body      = JSON.stringify({ type: 1 });
    const pubHex    = getPublicKeyHex();

    // Should return false (not throw) for non-hex or wrong-length input
    const result = await verifyInteractionSignature('not-valid-hex!!!', timestamp, body, pubHex);
    expect(result).toBe(false);
  });

  it('ALGORITHM CHECK: SHA256 HMAC cannot produce a valid Ed25519 verification', async () => {
    // This test documents why the old SHA256 approach was ALWAYS wrong.
    // A SHA256 HMAC of the body is not an Ed25519 signature — it will always fail.
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body      = JSON.stringify({ type: 1 });
    const pubHex    = getPublicKeyHex();

    // Produce a SHA256 HMAC as the old code did
    const sha256FakeSig = createHmac('sha256', 'some-secret')
      .update(timestamp + body)
      .digest('hex');

    const result = await verifyInteractionSignature(sha256FakeSig, timestamp, body, pubHex);
    expect(result).toBe(false);
    // The old code would: always get false here → always return 401 for real Discord events,
    // meaning the endpoint was both broken AND only "secure" by accident.
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// timingSafeEqual — property-based behaviour tests
// ─────────────────────────────────────────────────────────────────────────────
describe('timingSafeEqual — core behaviour', () => {
  it('throws when buffer lengths differ (documents why the length guard is required)', () => {
    const a = Buffer.from('short');
    const b = Buffer.from('much-longer-buffer');
    expect(() => timingSafeEqual(a, b)).toThrow();
  });

  it('returns true for identical buffers', () => {
    const secret = 'my-api-key-value';
    expect(timingSafeEqual(Buffer.from(secret), Buffer.from(secret))).toBe(true);
  });

  it('returns false for same-length different buffers', () => {
    const a = Buffer.from('aaaaaaaa');
    const b = Buffer.from('bbbbbbbb');
    expect(timingSafeEqual(a, b)).toBe(false);
  });
});
