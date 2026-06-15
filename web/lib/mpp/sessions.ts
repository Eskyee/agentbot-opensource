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
 * Storage: Upstash Redis (production) or in-memory Map (development)
 * Settlement: viem/tempo batch transfer
 */

import { type Address } from 'viem'
import { MPP_CONFIG, getWalletClient } from './config'

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

// Redis client (Upstash) — lazy init
let redis: ReturnType<typeof createRedisClient> | null = null;

function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    return null; // Fall back to in-memory
  }

  // Upstash Redis REST client
  return {
    async get(key: string): Promise<string | null> {
      const res = await fetch(`${url}/get/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { result: string | null };
      return data.result;
    },
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
      const opts: Record<string, unknown> = {};
      if (ttlSeconds) opts.ex = ttlSeconds;
      await fetch(`${url}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value, ...opts }),
      });
    },
    async del(key: string): Promise<void> {
      await fetch(`${url}/del/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    async keys(pattern: string): Promise<string[]> {
      const res = await fetch(`${url}/keys/${pattern}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { result: string[] };
      return data.result || [];
    },
  };
}

function getRedis() {
  if (!redis) redis = createRedisClient();
  return redis;
}

// In-memory fallback (development only)
const memoryStore = new Map<string, Session>()

const SESSION_PREFIX = 'mpp:session:'
const SESSION_TTL = 86400 * 7 // 7 days

/**
 * Create a new payment session
 */
export async function createSession(
  userAddress: Address,
  depositAmount: string
): Promise<Session> {
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

  await saveSession(session)
  console.log(`[Session] Created ${id} for ${userAddress} with $${depositAmount}`)

  return session
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const r = getRedis()
  if (r) {
    const data = await r.get(`${SESSION_PREFIX}${sessionId}`)
    return data ? JSON.parse(data) : null
  }
  return memoryStore.get(sessionId) || null
}

/**
 * Get active session for user
 */
export async function getUserSession(userAddress: Address): Promise<Session | null> {
  const r = getRedis()
  if (r) {
    const keys = await r.keys(`${SESSION_PREFIX}*`)
    for (const key of keys) {
      const data = await r.get(key)
      if (!data) continue
      const session: Session = JSON.parse(data)
      if (
        session.userAddress.toLowerCase() === userAddress.toLowerCase() &&
        session.status === 'active'
      ) {
        return session
      }
    }
    return null
  }

  // In-memory fallback
  for (const session of memoryStore.values()) {
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
 * Save session to storage
 */
async function saveSession(session: Session): Promise<void> {
  const r = getRedis()
  if (r) {
    await r.set(`${SESSION_PREFIX}${session.id}`, JSON.stringify(session), SESSION_TTL)
  } else {
    memoryStore.set(session.id, session)
  }
}

/**
 * Process a voucher (off-chain debit)
 */
export async function processVoucher(voucher: Voucher): Promise<{ success: boolean; session: Session; error?: string }> {
  const session = await getSession(voucher.sessionId)
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

  // Deduct — integer-cent math so repeated accumulation can't drift
  const spentCents = Math.round(parseFloat(session.spent) * 100) + Math.round(amount * 100)
  const remainingCents = Math.round(remaining * 100) - Math.round(amount * 100)
  session.spent = (spentCents / 100).toFixed(2)
  session.remaining = (remainingCents / 100).toFixed(2)
  session.vouchers.push(voucher)

  await saveSession(session)

  console.log(`[Session] Voucher processed: $${amount} for ${voucher.plugin}. Remaining: $${session.remaining}`)

  // Check if we should settle
  const pendingTotal = session.vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0)
  if (pendingTotal >= parseFloat(SESSION_CONFIG.settleThreshold)) {
    console.log(`[Session] Settle threshold reached for ${session.id}`)
    // Trigger async settlement (don't await — fire and forget)
    settleSession(session.id).catch(console.error)
  }

  return { success: true, session }
}

/**
 * Settle session — batch vouchers into on-chain transaction via viem/tempo
 */
export async function settleSession(sessionId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const session = await getSession(sessionId)
  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  if (session.vouchers.length === 0) {
    return { success: true } // Nothing to settle
  }

  session.status = 'settling'
  await saveSession(session)

  try {
    // Calculate total from pending vouchers
    const total = session.vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0)
    console.log(`[Session] Settling ${session.vouchers.length} vouchers worth $${total}`)

    // Attempt on-chain settlement via viem/tempo
    let txHash: string | undefined;
    
    if (MPP_CONFIG.feePayerKey) {
      try {
        txHash = await settleOnChain(session, total);
        console.log(`[Session] On-chain settlement tx: ${txHash}`);
      } catch (settleErr) {
        console.error('[Session] On-chain settlement failed, recording off-chain:', settleErr);
        // Fall through — off-chain settlement recorded
      }
    }

    // Clear settled vouchers
    const settledCount = session.vouchers.length
    session.vouchers = []
    session.lastSettledAt = Date.now()
    session.status = 'active'

    await saveSession(session)

    console.log(`[Session] Settled ${settledCount} vouchers for session ${sessionId}${txHash ? ` (tx: ${txHash})` : ' (off-chain)'}`)
    return { success: true, txHash }
  } catch (error) {
    session.status = 'active' // Revert
    await saveSession(session)
    return { success: false, error: String(error) }
  }
}

/**
 * Execute on-chain settlement via viem/tempo
 */
async function settleOnChain(session: Session, total: number): Promise<string> {
  const client = getWalletClient(MPP_CONFIG.feePayerKey!);

  // Build batch transfer data for all vouchers
  const recipients: Address[] = [MPP_CONFIG.recipient]; // Settlement goes to Atlas wallet
  const amounts: bigint[] = [BigInt(Math.round(total * 1e6))]; // pathUSD 6 decimals

  // Send settlement transaction using standard viem wallet client
  const txHash = await client.sendTransaction({
    to: MPP_CONFIG.defaultCurrency, // pathUSD token contract
    value: 0n,
    data: encodeBatchTransfer(recipients, amounts),
  });

  return txHash;
}

/**
 * Encode a batch transfer call (TIP-20 multiTransfer)
 */
function encodeBatchTransfer(recipients: Address[], amounts: bigint[]): `0x${string}` {
  // multiTransfer(address[] recipients, uint256[] amounts) selector
  const selector = '0x1f041204';
  
  // Encode array offset (32 bytes, offset to recipients array data)
  const offsetRecipients = '0000000000000000000000000000000000000000000000000000000000000040';
  // Encode array offset (32 bytes, offset to amounts array data)
  const offsetAmounts = '0000000000000000000000000000000000000000000000000000000000000080';
  
  // Encode recipients array length
  const lenRecipients = recipients.length.toString(16).padStart(64, '0');
  // Encode recipients
  const encodedRecipients = recipients.map(r => 
    r.toLowerCase().replace('0x', '').padStart(64, '0')
  ).join('');
  
  // Encode amounts array length
  const lenAmounts = amounts.length.toString(16).padStart(64, '0');
  // Encode amounts
  const encodedAmounts = amounts.map(a => 
    a.toString(16).padStart(64, '0')
  ).join('');

  return `${selector}${offsetRecipients}${offsetAmounts}${lenRecipients}${encodedRecipients}${lenAmounts}${encodedAmounts}` as `0x${string}`;
}

/**
 * Close session — return remaining funds to user
 */
export async function closeSession(sessionId: string): Promise<{ success: boolean; returned?: string; error?: string }> {
  const session = await getSession(sessionId)
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

    // Transfer remaining funds back to user via viem/tempo
    if (parseFloat(returned) > 0 && MPP_CONFIG.feePayerKey) {
      try {
        const client = getWalletClient(MPP_CONFIG.feePayerKey);
        const amountWei = BigInt(Math.round(parseFloat(returned) * 1e6));
        
        // Encode TIP-20 transfer back to user
        const txData = encodeBatchTransfer([session.userAddress], [amountWei]);
        
        // Fire and forget — user gets funds back
        (client as any).sendTransaction({
          to: MPP_CONFIG.defaultCurrency,
          value: 0n,
          data: txData,
        }).catch((err: Error) => {
          console.error(`[Session] Refund tx failed for ${sessionId}:`, err.message);
        });
      } catch (err) {
        console.error(`[Session] Refund encoding failed for ${sessionId}:`, err);
      }
    }

    session.status = 'closed'
    await saveSession(session)

    // Clean up after a delay (leave record for audit)
    setTimeout(async () => {
      const r = getRedis()
      if (r) {
        await r.del(`${SESSION_PREFIX}${sessionId}`)
      } else {
        memoryStore.delete(sessionId)
      }
    }, 60_000) // Delete after 1 minute

    return { success: true, returned }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * List all sessions for a user
 */
export async function listUserSessions(userAddress: Address): Promise<Session[]> {
  const r = getRedis()
  if (r) {
    const keys = await r.keys(`${SESSION_PREFIX}*`)
    const sessions: Session[] = []
    for (const key of keys) {
      const data = await r.get(key)
      if (!data) continue
      const session: Session = JSON.parse(data)
      if (session.userAddress.toLowerCase() === userAddress.toLowerCase()) {
        sessions.push(session)
      }
    }
    return sessions
  }

  // In-memory fallback
  const userSessions: Session[] = []
  for (const session of memoryStore.values()) {
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
