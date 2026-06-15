/**
 * Google RISC (Cross-Account Protection) Receiver Endpoint
 * 
 * Receives security event tokens from Google when:
 * - User's Google account is compromised/disabled
 * - Sessions are revoked
 * - Tokens are revoked
 * - Credentials need changing
 * 
 * Based on: https://developers.google.com/identity/protocols/risc
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Google's RISC configuration
const RISC_CONFIG_URL = 'https://accounts.google.com/.well-known/risc-configuration';

// Your OAuth client IDs (from Google Cloud Console)
const CLIENT_IDS = (process.env.GOOGLE_CLIENT_ID || '').split(',').filter(Boolean);

// Cache for Google's signing keys
let cachedKeys: { keys: any[]; fetchedAt: number } | null = null;
const KEYS_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch Google's RISC signing keys (cached)
 */
async function getGoogleSigningKeys(): Promise<any[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < KEYS_TTL) {
    return cachedKeys.keys;
  }

  const configRes = await fetch(RISC_CONFIG_URL);
  const config = await configRes.json();
  
  const keysRes = await fetch(config.jwks_uri);
  const keysData = await keysRes.json();
  
  cachedKeys = { keys: keysData.keys, fetchedAt: Date.now() };
  return keysData.keys;
}

/**
 * Decode and validate a JWT without external libraries
 * (Uses Web Crypto API available in Edge/runtime)
 */
function decodeJwtPayload(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  
  const payload = parts[1];
  const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
  return JSON.parse(decoded);
}

function decodeJwtHeader(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  
  const header = parts[0];
  const decoded = Buffer.from(header, 'base64url').toString('utf-8');
  return JSON.parse(decoded);
}

/**
 * Validate a security event token
 * Returns decoded payload if valid, null if invalid
 */
async function validateSecurityEventToken(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[RISC] Invalid JWT format');
      return null;
    }
    
    const header = decodeJwtHeader(token);
    const payload = decodeJwtPayload(token);
    
    // Check issuer
    if (payload.iss !== 'https://accounts.google.com/') {
      console.warn('[RISC] Invalid issuer:', payload.iss);
      return null;
    }
    
    // Check audience (must be one of our client IDs)
    if (!CLIENT_IDS.includes(payload.aud)) {
      console.warn('[RISC] Invalid audience:', payload.aud);
      return null;
    }
    
    // Get signing keys and find matching key
    const keys = await getGoogleSigningKeys();
    const key = keys.find((k: any) => k.kid === header.kid);
    
    if (!key) {
      console.warn('[RISC] Signing key not found:', header.kid);
      return null;
    }
    
    // Verify RS256 signature using Web Crypto API
    if (header.alg !== 'RS256') {
      console.warn('[RISC] Unsupported algorithm:', header.alg);
      return null;
    }
    
    const isValid = await verifyRs256Signature(parts[0] + '.' + parts[1], parts[2], key);
    if (!isValid) {
      console.warn('[RISC] Invalid JWT signature');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('[RISC] Token validation error:', error);
    return null;
  }
}

/**
 * Verify RS256 JWT signature using Web Crypto API
 */
async function verifyRs256Signature(
  signedContent: string,
  signatureB64: string,
  jwk: any
): Promise<boolean> {
  try {
    // Import the RSA public key
    const key = await crypto.subtle.importKey(
      'jwk',
      {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        alg: jwk.alg || 'RS256',
        use: jwk.use || 'sig',
      },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode the signature
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    // Encode the signed content
    const encoder = new TextEncoder();
    const data = encoder.encode(signedContent);

    // Verify
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data);
  } catch (error) {
    console.error('[RISC] Signature verification error:', error);
    return false;
  }
}

/**
 * Handle security events
 */
async function handleSecurityEvent(payload: any): Promise<void> {
  const events = payload.events || {};
  const jti = payload.jti; // Unique event ID for deduplication
  
  // Check for duplicate events
  if (jti) {
    const existing = await pool.query(
      'SELECT id FROM risc_events WHERE jti = $1',
      [jti]
    ).catch(() => null);
    
    if (existing && existing.rows.length > 0) {
      console.log('[RISC] Duplicate event ignored:', jti);
      return;
    }
    
    // Store event for deduplication
    await pool.query(
      `INSERT INTO risc_events (jti, event_type, payload, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (jti) DO NOTHING`,
      [jti, Object.keys(events)[0] || 'unknown', JSON.stringify(payload)]
    ).catch(err => console.error('[RISC] Failed to store event:', err));
  }
  
  // Process each event type
  for (const [eventType, eventData] of Object.entries(events)) {
    const subject = (eventData as any)?.subject;
    const googleSub = subject?.sub;
    const email = subject?.email;
    const reason = (eventData as any)?.reason;
    
    console.log(`[RISC] Event: ${eventType}`, { googleSub, email, reason });
    
    switch (eventType) {
      // Account was compromised/hijacked
      case 'https://schemas.openid.net/secevent/risc/event-type/account-disabled':
        if (reason === 'hijacking') {
          console.warn(`[RISC] HIJACKING detected for user ${googleSub || email}`);
          // Disable Google Sign-in for this user
          await disableGoogleSignIn(googleSub, email);
          // Invalidate all sessions
          await invalidateSessions(googleSub, email);
        }
        break;
      
      // Sessions revoked by Google
      case 'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked':
        console.warn(`[RISC] Sessions revoked for user ${googleSub || email}`);
        await invalidateSessions(googleSub, email);
        break;
      
      // OAuth tokens revoked
      case 'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked':
        console.warn(`[RISC] Tokens revoked for user ${googleSub || email}`);
        await revokeOAuthTokens(googleSub, email);
        await invalidateSessions(googleSub, email);
        break;
      
      // Account re-enabled
      case 'https://schemas.openid.net/secevent/risc/event-type/account-enabled':
        console.log(`[RISC] Account re-enabled for user ${googleSub || email}`);
        await reEnableGoogleSignIn(googleSub, email);
        break;
      
      // Credential change required
      case 'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required':
        console.warn(`[RISC] Credential change required for user ${googleSub || email}`);
        // Flag for suspicious activity monitoring
        break;
      
      // Test verification event
      case 'https://schemas.openid.net/secevent/risc/event-type/verification':
        console.log(`[RISC] Verification event received:`, (eventData as any)?.state);
        break;
      
      default:
        console.log(`[RISC] Unknown event type: ${eventType}`);
    }
  }
}

/**
 * Action handlers
 */
async function disableGoogleSignIn(googleSub?: string, email?: string): Promise<void> {
  if (!googleSub && !email) return;
  const where = googleSub ? 'google_id = $1' : 'email = $1';
  const value = googleSub || email;
  
  await pool.query(
    `UPDATE users SET google_signin_disabled = true, updated_at = NOW() WHERE ${where}`,
    [value]
  ).catch(err => console.error('[RISC] Failed to disable Google sign-in:', err));
}

async function reEnableGoogleSignIn(googleSub?: string, email?: string): Promise<void> {
  if (!googleSub && !email) return;
  const where = googleSub ? 'google_id = $1' : 'email = $1';
  const value = googleSub || email;
  
  await pool.query(
    `UPDATE users SET google_signin_disabled = false, updated_at = NOW() WHERE ${where}`,
    [value]
  ).catch(err => console.error('[RISC] Failed to re-enable Google sign-in:', err));
}

async function invalidateSessions(googleSub?: string, email?: string): Promise<void> {
  if (!googleSub && !email) return;
  // Invalidate all sessions for this user
  // Implementation depends on your session storage
  console.log(`[RISC] Invalidating sessions for ${googleSub || email}`);
}

async function revokeOAuthTokens(googleSub?: string, email?: string): Promise<void> {
  if (!googleSub && !email) return;
  // Delete stored OAuth refresh tokens
  console.log(`[RISC] Revoking OAuth tokens for ${googleSub || email}`);
}

/**
 * POST /api/security/risc
 * Receives security event tokens from Google
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body (JWT string)
    const token = await req.text();
    
    if (!token) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }
    
    // Validate and decode the token
    const payload = await validateSecurityEventToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }
    
    // Handle the security event (async, don't block response)
    handleSecurityEvent(payload).catch(err => {
      console.error('[RISC] Event handling error:', err);
    });
    
    // Return 202 Accepted immediately
    return new NextResponse(null, { status: 202 });
    
  } catch (error) {
    console.error('[RISC] Endpoint error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/security/risc
 * Health check for the RISC endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/security/risc',
    description: 'Google RISC (Cross-Account Protection) receiver',
    events_supported: [
      'account-disabled',
      'account-enabled',
      'sessions-revoked',
      'tokens-revoked',
      'account-credential-change-required',
      'verification',
    ],
  });
}
