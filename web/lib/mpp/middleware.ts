/**
 * MPP (Machine Payments Protocol) Middleware for Agentbot
 * 
 * Triple payment layer: Stripe (existing) + Tempo MPP + Payment Sessions
 * Users choose payment method per request or set a default.
 * 
 * Payment flow priority:
 * 1. Session (auto-debit via voucher if active session exists)
 * 2. MPP (Tempo on-chain payment via 402 challenge)
 * 3. Stripe (existing credit card flow)
 * 
 * MPP flow:
 * 1. Client sends request
 * 2. Server responds with 402 + Challenge (price, token, recipient)
 * 3. Client pays via Tempo transaction
 * 4. Client retries with Authorization: Payment <credential>
 * 5. Server verifies on-chain, returns resource with Receipt
 * 
 * Session flow:
 * 1. User opens session, deposits pathUSD
 * 2. Agent calls auto-debit via off-chain voucher (sub-100ms)
 * 3. Server settles on-chain periodically
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMppCredential, MPP_CONFIG } from './config';

// Payment method enum
export type PaymentMethod = 'stripe' | 'mpp' | 'session';

// MPP challenge structure (402 response)
export interface MppChallenge {
  scheme: 'Payment';
  amount: string;           // Amount in USD (e.g., "0.01")
  currency: string;         // Token address (pathUSD default)
  recipient: string;        // Recipient wallet address
  description: string;      // Human-readable description
  nonce: string;            // Challenge nonce for replay protection
  expiresAt: number;        // Challenge expiration (unix timestamp)
}

// MPP credential structure (from client)
export interface MppCredential {
  scheme: 'Payment';
  transaction: string;      // Signed Tempo transaction hex
  challengeNonce: string;   // Original challenge nonce
}

// Plugin pricing (per request)
export const PLUGIN_PRICING: Record<string, { amount: string; description: string }> = {
  'agent':       { amount: '0.05', description: 'Agent orchestrator request' },
  'generate-text': { amount: '0.01', description: 'Text generation (LLM inference)' },
  'tts':         { amount: '0.03', description: 'Text-to-speech synthesis' },
  'stt':         { amount: '0.02', description: 'Speech-to-text transcription' },
};

/**
 * Check if request has valid MPP payment credential
 */
export function hasMppCredential(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Payment ')) return false;
  return true;
}

/**
 * Parse MPP credential from Authorization header
 */
export function parseMppCredential(req: NextRequest): MppCredential | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Payment ')) return null;
  
  try {
    const payload = auth.slice(8); // Remove "Payment "
    return JSON.parse(payload) as MppCredential;
  } catch {
    return null;
  }
}

/**
 * Generate 402 Payment Required response with MPP challenge
 */
export function create402Response(
  pluginName: string,
  pricing: { amount: string; description: string }
): NextResponse {
  const challenge: MppChallenge = {
    scheme: 'Payment',
    amount: pricing.amount,
    currency: MPP_CONFIG.defaultCurrency,  // pathUSD
    recipient: MPP_CONFIG.recipient,
    description: pricing.description,
    nonce: generateNonce(),
    expiresAt: Date.now() + (5 * 60 * 1000), // 5 min expiry
  };

  return new NextResponse(
    JSON.stringify({
      error: 'payment_required',
      message: `Payment required for ${pluginName}. Choose payment method: Stripe or Tempo MPP.`,
      mpp: challenge,
      stripe: {
        checkoutUrl: `/api/v1/payments/stripe/create?plugin=${pluginName}`,
        amount: pricing.amount,
        currency: 'usd',
      },
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `Payment amount="${pricing.amount}", currency="${MPP_CONFIG.defaultCurrency}", recipient="${MPP_CONFIG.recipient}"`,
      },
    }
  );
}

/**
 * MPP payment verification middleware
 * Checks credential → verifies on-chain → passes through or rejects
 */
export async function verifyMppPayment(
  req: NextRequest,
  pluginName: string
): Promise<{ valid: boolean; error?: string; receipt?: string }> {
  const credential = parseMppCredential(req);
  if (!credential) {
    return { valid: false, error: 'No MPP credential provided' };
  }

  const pricing = PLUGIN_PRICING[pluginName];
  if (!pricing) {
    return { valid: false, error: `Unknown plugin: ${pluginName}` };
  }

  // Verify the credential against Tempo chain
  const result = await verifyMppCredential(credential, {
    expectedAmount: pricing.amount,
    expectedRecipient: MPP_CONFIG.recipient,
    expectedCurrency: MPP_CONFIG.defaultCurrency,
  });

  return result;
}

/**
 * Determine payment method from request
 * Priority: session (if active) → MPP credential → stripe → default
 */
export function getPaymentMethod(req: NextRequest): PaymentMethod {
  // Check explicit header
  const header = req.headers.get('X-Payment-Method');
  if (header === 'session' || header === 'mpp' || header === 'stripe') return header;
  
  // Check if MPP credential present
  if (hasMppCredential(req)) return 'mpp';
  
  // Check for session header (set by frontend when session is active)
  const sessionHeader = req.headers.get('X-Session-Id');
  if (sessionHeader) return 'session';
  
  // Default to stripe (existing behavior)
  return 'stripe';
}

/**
 * Generate random nonce for MPP challenge
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
