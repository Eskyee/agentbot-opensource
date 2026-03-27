/**
 * MPP Payment Sessions — Off-chain Billing
 * 
 * Payment sessions allow per-call billing without on-chain transactions.
 * Users deposit funds, sign off-chain vouchers, and we settle periodically.
 * 
 * Flow:
 * 1. User opens session → deposits pathUSD into escrow
 * 2. Agent call → user signs voucher (off-chain, sub-100ms)
 * 3. We accumulate vouchers server-side
 * 4. Settle on-chain periodically (batch)
 * 5. User closes session → remaining funds returned
 * 
 * Based on Tempo MPP pay-as-you-go model.
 */

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { tempo, tempoTestnet } from 'viem/chains'
import { tempoActions } from 'viem/tempo'

// Config
const useTestnet = process.env.TEMPO_TESTNET === 'true'
const chain = useTestnet ? tempoTestnet : tempo
const rpcUrl = useTestnet
  ? 'https://rpc.moderato.tempo.xyz'
  : 'https://rpc.tempo.xyz'

// Operator wallet
const OPERATOR_KEY = process.env.TEMPO_FEE_PAYER_KEY as `0x${string}` | undefined
const OPERATOR_ADDRESS = '0xYOUR_WALLET_ADDRESS_HERE' as Address

// pathUSD
const PATH_USD = '0x20c0000000000000000000000000000000000000' as Address

// Session config
const SESSION_CONFIG = {
  minDeposit: '1.00',      // Minimum $1 to open session
  maxDeposit: '100.00',    // Maximum $100 per session
  settleThreshold: '5.00', // Settle after $5 accumulated
  settleInterval: 3600,    // Settle every hour (seconds)
}

// Voucher structure (off-chain signed message)
export interface Voucher {
  sessionId: string
  userAddress: Address
  amount: string           // Amount in USD (e.g., "0.01")
  plugin: string           // Which plugin was called
  nonce: string            // Unique per voucher
  timestamp: number
  signature: `0x${string}` // User's signature
}

// Session structure
export interface Session {
  id: string
  userAddress: Address
  deposit: string          // Total deposited
  spent: string            // Total spent via vouchers
  remaining: string        // Remaining balance
  vouchers: Voucher[]      // Pending vouchers (not yet settled)
  status: 'active' | 'settling' | 'closed'
  createdAt: number
  lastSettledAt: number
}

// In-memory session store (replace with Redis in production)
const sessions = new Map<string, Session>()

/**
 * Create a new payment session
 */
export function createSession(
  userAddress: Address,
  depositAmount: string
): Session {
  const deposit = parseFloat(depositAmount)
  if (deposit < parseFloat(SESSION_CONFIG.minDeposit)) {
    throw new Error(`Minimum deposit is $${SESSION_CONFIG.minDeposit}`)
  }
  if (deposit > parseFloat(SESSION_CONFIG.maxDeposit)) {
    throw new Error(`Maximum deposit is $${SESSION_CONFIG.maxDeposit}`)
  }

  const id = generateSessionId()
  const now = Date.now()

  const session: Session = {
    id,
    userAddress,
    deposit: depositAmount,
    spent: '0.00',
    remaining: depositAmount,
    vouchers: [],
    status: 'active',
    createdAt: now,
    lastSettledAt: now,
  }

  sessions.set(id, session)
  console.log(`[Session] Created ${id} for ${userAddress} with $${depositAmount}`)

  return session
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): Session | null {
  return sessions.get(sessionId) || null
}

/**
 * Get active session for user
 */
export function getUserSession(userAddress: Address): Session | null {
  for (const session of sessions.values()) {
    if (
      session.userAddress.toLowerCase() === userAddress.toLowerCase() &&
      session.status === 'active'
    ) {
      return session
    }
  }
  return null
}

/**
 * Process a voucher (off-chain debit)
 */
export function processVoucher(voucher: Voucher): { success: boolean; session: Session; error?: string } {
  const session = sessions.get(voucher.sessionId)
  if (!session) {
    return { success: false, session: null as any, error: 'Session not found' }
  }

  if (session.status !== 'active') {
    return { success: false, session, error: `Session is ${session.status}` }
  }

  if (session.userAddress.toLowerCase() !== voucher.userAddress.toLowerCase()) {
    return { success: false, session, error: 'Address mismatch' }
  }

  // Check balance
  const remaining = parseFloat(session.remaining)
  const amount = parseFloat(voucher.amount)
  if (amount > remaining) {
    return { success: false, session, error: 'Insufficient balance' }
  }

  // Deduct
  session.spent = (parseFloat(session.spent) + amount).toFixed(2)
  session.remaining = (remaining - amount).toFixed(2)
  session.vouchers.push(voucher)

  console.log(`[Session] Voucher processed: $${amount} for ${voucher.plugin}. Remaining: $${session.remaining}`)

  // Check if we should settle
  const pendingTotal = session.vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0)
  if (pendingTotal >= parseFloat(SESSION_CONFIG.settleThreshold)) {
    console.log(`[Session] Settle threshold reached for ${session.id}`)
    // Trigger async settlement
    settleSession(session.id).catch(console.error)
  }

  return { success: true, session }
}

/**
 * Settle session — batch vouchers into on-chain transaction
 */
export async function settleSession(sessionId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const session = sessions.get(sessionId)
  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  if (session.vouchers.length === 0) {
    return { success: true } // Nothing to settle
  }

  session.status = 'settling'

  try {
    // Calculate total from pending vouchers
    const total = session.vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0)
    console.log(`[Session] Settling ${session.vouchers.length} vouchers worth $${total}`)

    // In production: batch transfer from user's deposit to operator
    // For now: log the settlement
    // TODO: Use viem/tempo batch transfer
    // const client = createWalletClient({
    //   account: privateKeyToAccount(OPERATOR_KEY!),
    //   chain,
    //   transport: http(rpcUrl),
    // }).extend(tempoActions())
    //
    // const hash = await client.token.transferSync({
    //   token: PATH_USD,
    //   to: OPERATOR_ADDRESS,
    //   amount: parseUnits(total.toFixed(6), 6),
    // })

    // Clear settled vouchers
    const settledCount = session.vouchers.length
    session.vouchers = []
    session.lastSettledAt = Date.now()
    session.status = 'active'

    console.log(`[Session] Settled ${settledCount} vouchers for session ${sessionId}`)
    return { success: true }
  } catch (error) {
    session.status = 'active' // Revert
    return { success: false, error: String(error) }
  }
}

/**
 * Close session — return remaining funds to user
 */
export async function closeSession(sessionId: string): Promise<{ success: boolean; returned?: string; error?: string }> {
  const session = sessions.get(sessionId)
  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  try {
    // Settle any pending vouchers first
    if (session.vouchers.length > 0) {
      await settleSession(sessionId)
    }

    const returned = session.remaining
    console.log(`[Session] Closing ${sessionId}, returning $${returned} to ${session.userAddress}`)

    // In production: transfer remaining funds back to user
    // TODO: viem/tempo transfer

    session.status = 'closed'
    sessions.delete(sessionId)

    return { success: true, returned }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * List all sessions for a user
 */
export function listUserSessions(userAddress: Address): Session[] {
  const userSessions: Session[] = []
  for (const session of sessions.values()) {
    if (session.userAddress.toLowerCase() === userAddress.toLowerCase()) {
      userSessions.push(session)
    }
  }
  return userSessions
}

// Utils
function generateSessionId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return 'ses_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}
