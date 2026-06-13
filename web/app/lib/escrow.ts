/**
 * USDC escrow — the trust layer of the agent economy.
 *
 * The bare x402 gate makes a payer authorize funds *to* an agent before it works.
 * Escrow inverts the risk: the payer's USDC authorization is *held* against a
 * task, the hired agent does the work and submits it, and the payer releases the
 * hold only once the milestone is approved (or refunds if it isn't). This is what
 * lets two agents who've never met transact safely — the thing no pure-SaaS
 * platform offers, because none of them sit on on-chain rails.
 *
 * State machine:
 *   funded ──submit──▶ submitted ──release──▶ released   (payee paid)
 *      │                   │
 *      └──refund───────────┴──refund──▶ refunded         (payer made whole)
 *      └──dispute──────────┴──dispute─▶ disputed         (needs arbitration)
 *
 * Storage: durable Redis (no TTL — this is money state, not ephemeral task
 * state), with per-agent index sets for listing. Falls back to an in-memory map
 * when Redis isn't configured (dev/preview, single instance only).
 *
 * Settlement note: we capture and verify the x402 authorization at open time
 * (structural + target + amount, via lib/x402-verify). `release` is the point
 * where that captured authorization should be settled on-chain through a
 * facilitator — that single on-chain step is the documented gap. Until it's
 * wired, `release` records the agreed outcome and the payer settles the held
 * authorization; `refund` simply never settles it, so no funds move. The state
 * machine and authorization capture are production-shaped around that upgrade.
 */
import { createHash, randomBytes } from 'crypto'
import { redis } from './redis'

export type EscrowState = 'funded' | 'submitted' | 'released' | 'refunded' | 'disputed'

export type Escrow = {
  id: string
  /** the hired agent (payee) — receives funds on release */
  payeeAgentId: string
  /** payer wallet address (from the x402 authorization `from`) */
  payerAddress: string
  /** payee wallet address (the agent owner's wallet, where funds land) */
  payeeAddress: string
  /**
   * If the hold was opened by a signed-in Agentbot user (the buyer), their user
   * id — lets that owner release/refund from the dashboard without juggling the
   * one-time token. Absent for anonymous/external payers (token-only).
   */
  payerOwnerId?: string
  amount: string // smallest unit (USDC = 6 decimals), stored as string for JSON safety
  asset: string
  network: string
  state: EscrowState
  /** human description of the milestone being escrowed */
  milestone: string
  /** the captured x402 authorization payload (held funds proof; settled on release) */
  authorization: string
  /** SHA-256 of the release token; the raw token is returned once to the payer */
  releaseTokenHash: string
  createdAt: string
  updatedAt: string
  /** payee's submission note, set on submit */
  submission?: string
  /** terminal reason, set on release/refund/dispute */
  resolution?: string
  /** on-chain settlement tx hash, set when release settles via the facilitator */
  settlementTx?: string
  settledAt?: string
}

/** Public projection — never leaks the authorization blob or token hash. */
export type EscrowPublic = Omit<Escrow, 'authorization' | 'releaseTokenHash'>

const mem = new Map<string, Escrow>()
const memIndex = new Map<string, Set<string>>()
const memOwnerIndex = new Map<string, Set<string>>()

function key(id: string): string {
  return `escrow:${id}`
}
function payeeIndexKey(agentId: string): string {
  return `escrow:byPayee:${agentId}`
}
function payerOwnerIndexKey(userId: string): string {
  return `escrow:byPayerOwner:${userId}`
}

export function newEscrowId(): string {
  return `esc-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Constant-time-ish compare on equal-length hex digests. */
export function tokenMatches(token: string, hash: string): boolean {
  const a = hashToken(token)
  if (a.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ hash.charCodeAt(i)
  return diff === 0
}

export function toPublic(e: Escrow): EscrowPublic {
  const { authorization: _a, releaseTokenHash: _h, ...rest } = e
  return rest
}

async function put(e: Escrow): Promise<void> {
  e.updatedAt = new Date().toISOString()
  if (redis) {
    try {
      await redis.set(key(e.id), JSON.stringify(e))
      await redis.sadd(payeeIndexKey(e.payeeAgentId), e.id)
      if (e.payerOwnerId) await redis.sadd(payerOwnerIndexKey(e.payerOwnerId), e.id)
      return
    } catch {
      /* fall through to memory */
    }
  }
  mem.set(e.id, e)
  const set = memIndex.get(e.payeeAgentId) ?? new Set<string>()
  set.add(e.id)
  memIndex.set(e.payeeAgentId, set)
  if (e.payerOwnerId) {
    const oset = memOwnerIndex.get(e.payerOwnerId) ?? new Set<string>()
    oset.add(e.id)
    memOwnerIndex.set(e.payerOwnerId, oset)
  }
}

export async function getEscrow(id: string): Promise<Escrow | null> {
  if (redis) {
    try {
      const raw = await redis.get<string>(key(id))
      if (!raw) return null
      return typeof raw === 'string' ? (JSON.parse(raw) as Escrow) : (raw as Escrow)
    } catch {
      /* fall through to memory */
    }
  }
  return mem.get(id) ?? null
}

export async function listEscrowsByPayee(agentId: string, limit = 50): Promise<EscrowPublic[]> {
  let ids: string[] = []
  if (redis) {
    try {
      ids = (await redis.smembers(payeeIndexKey(agentId))) as string[]
    } catch {
      ids = []
    }
  }
  if (ids.length === 0) ids = Array.from(memIndex.get(agentId) ?? [])

  const records = await Promise.all(ids.slice(0, limit).map((id) => getEscrow(id)))
  return records
    .filter((r): r is Escrow => Boolean(r))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublic)
}

/** Escrows opened *by* a signed-in buyer (the hiring side of the dashboard). */
export async function listEscrowsByPayerOwner(userId: string, limit = 50): Promise<EscrowPublic[]> {
  let ids: string[] = []
  if (redis) {
    try {
      ids = (await redis.smembers(payerOwnerIndexKey(userId))) as string[]
    } catch {
      ids = []
    }
  }
  if (ids.length === 0) ids = Array.from(memOwnerIndex.get(userId) ?? [])

  const records = await Promise.all(ids.slice(0, limit).map((id) => getEscrow(id)))
  return records
    .filter((r): r is Escrow => Boolean(r))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublic)
}

/** Record on-chain settlement on a released escrow (tx hash from the facilitator). */
export async function recordSettlement(id: string, txHash: string): Promise<void> {
  const e = await getEscrow(id)
  if (!e) return
  await put({ ...e, settlementTx: txHash, settledAt: new Date().toISOString() })
}

export type CreateEscrowInput = {
  payeeAgentId: string
  payerAddress: string
  payeeAddress: string
  amount: string
  asset: string
  network: string
  milestone: string
  authorization: string
  /** set when the buyer is a signed-in user, so they can release from the dashboard */
  payerOwnerId?: string
}

/** Open a funded escrow. Returns the record plus the one-time release token. */
export async function createEscrow(
  input: CreateEscrowInput,
): Promise<{ escrow: Escrow; releaseToken: string }> {
  const releaseToken = randomBytes(24).toString('hex')
  const now = new Date().toISOString()
  const escrow: Escrow = {
    id: newEscrowId(),
    payeeAgentId: input.payeeAgentId,
    payerAddress: input.payerAddress,
    payeeAddress: input.payeeAddress,
    ...(input.payerOwnerId ? { payerOwnerId: input.payerOwnerId } : {}),
    amount: input.amount,
    asset: input.asset,
    network: input.network,
    state: 'funded',
    milestone: input.milestone,
    authorization: input.authorization,
    releaseTokenHash: hashToken(releaseToken),
    createdAt: now,
    updatedAt: now,
  }
  await put(escrow)
  return { escrow, releaseToken }
}

/** Payee marks the milestone work submitted (funded → submitted). */
export async function submitWork(id: string, submission: string): Promise<Escrow | { error: string }> {
  const e = await getEscrow(id)
  if (!e) return { error: 'escrow not found' }
  if (e.state !== 'funded' && e.state !== 'disputed') {
    return { error: `cannot submit from state '${e.state}'` }
  }
  const next: Escrow = { ...e, state: 'submitted', submission: submission.slice(0, 2000) }
  await put(next)
  return next
}

/** Payer releases the hold to the payee (funded|submitted → released). */
export async function releaseEscrow(id: string, resolution?: string): Promise<Escrow | { error: string }> {
  const e = await getEscrow(id)
  if (!e) return { error: 'escrow not found' }
  if (e.state === 'released') return e // idempotent
  if (e.state !== 'funded' && e.state !== 'submitted' && e.state !== 'disputed') {
    return { error: `cannot release from state '${e.state}'` }
  }
  const next: Escrow = { ...e, state: 'released', resolution: resolution?.slice(0, 500) }
  await put(next)
  return next
}

/** Payer refunds — the hold is never settled, payer keeps funds. */
export async function refundEscrow(id: string, resolution?: string): Promise<Escrow | { error: string }> {
  const e = await getEscrow(id)
  if (!e) return { error: 'escrow not found' }
  if (e.state === 'refunded') return e // idempotent
  if (e.state === 'released') return { error: 'escrow already released' }
  const next: Escrow = { ...e, state: 'refunded', resolution: resolution?.slice(0, 500) }
  await put(next)
  return next
}

/** Flag for arbitration (either side). Non-terminal; can still resolve. */
export async function disputeEscrow(id: string, reason: string): Promise<Escrow | { error: string }> {
  const e = await getEscrow(id)
  if (!e) return { error: 'escrow not found' }
  if (e.state === 'released' || e.state === 'refunded') {
    return { error: `escrow already ${e.state}` }
  }
  const next: Escrow = { ...e, state: 'disputed', resolution: reason.slice(0, 500) }
  await put(next)
  return next
}
