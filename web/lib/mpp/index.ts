/**
 * MPP (Machine Payments Protocol) Library for Agentbot
 * 
 * Dual payment layer: Stripe (existing) + Tempo MPP (new additive)
 * 
 * Exports:
 * - middleware: Server-side MPP verification and 402 response handling
 * - client: Client-side MPP request flow (402 → sign → retry)
 * - config: Tempo chain settings and verification logic
 */

// Server-side (middleware)
export {
  getPaymentMethod,
  hasMppCredential,
  parseMppCredential,
  create402Response,
  verifyMppPayment,
  PLUGIN_PRICING,
  type PaymentMethod,
  type MppChallenge,
  type MppCredential,
} from './middleware';

// Configuration
export {
  MPP_CONFIG,
  verifyMppCredential,
  formatChallengeHeader,
  type VerifyOptions,
  type VerifyResult,
} from './config';

// Client-side
export {
  mppFetch,
  checkMppSupport,
} from './client';
