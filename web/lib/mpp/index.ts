/**
 * MPP (Machine Payments Protocol) Library for Agentbot
 * 
 * Triple payment layer: Stripe (existing) + Tempo MPP + Payment Sessions
 * 
 * Exports:
 * - config: Tempo chain settings, verification, wallet clients
 * - middleware: Server-side MPP verification and 402 response handling
 * - client: Client-side MPP request flow (402 → sign → retry)
 * - sessions: Off-chain billing with Redis-backed storage
 * - session-fetch: Client session-aware fetch wrapper
 */

// Configuration + verification
export {
  MPP_CONFIG,
  getPublicClient,
  getWalletClient,
  verifyMppCredential,
  formatChallengeHeader,
  type VerifyOptions,
  type VerifyResult,
} from './config';

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

// Client-side
export {
  mppFetch,
  checkMppSupport,
} from './client';

// Sessions (off-chain billing)
export {
  createSession,
  getSession,
  getUserSession,
  processVoucher,
  settleSession,
  closeSession,
  listUserSessions,
  type Session,
  type Voucher,
} from './sessions';
