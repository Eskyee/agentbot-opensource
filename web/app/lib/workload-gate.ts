import { createHash, randomUUID } from 'crypto'
import { redis } from './redis'

/**
 * Lua script that atomically increments budget counters AND grants a
 * concurrency slot in a single round-trip. The previous implementation did
 * incrby → hlen → hset across 4+ separate Redis commands, which had two
 * bugs:
 *
 *   1. Denied requests still incremented the per-minute budget. A user being
 *      throttled by concurrency would deplete their per-minute budget for a
 *      request they never got to make.
 *   2. TOCTOU on concurrency: two callers could each observe hlen<limit and
 *      both hset their token. The atomic Lua block is the standard fix.
 *
 * KEYS:
 *   1 = activeUser hash       (concurrency tracker, expires at ttlSeconds)
 *   2 = activeGlobal hash     (concurrency tracker, expires at ttlSeconds)
 *   3 = budgetUser counter    (1-minute window)
 *   4 = budgetGlobal counter  (1-minute window)
 * ARGV:
 *   1 = userConcurrency       2 = globalConcurrency
 *   3 = userBudget            4 = globalBudget
 *   5 = ttlSeconds            6 = cost
 *   7 = token                 8 = expiresAtMs
 *
 * Returns:
 *   {1, token}                  on success
 *   {0, reason}                 on rejection (concurrency_user / concurrency_global / budget_user / budget_global)
 *
 * Budget counters are only incremented after concurrency checks pass, so a
 * concurrency-throttled request does not eat per-minute budget.
 */
const ACQUIRE_LUA = `
local active_u = KEYS[1]
local active_g = KEYS[2]
local budget_u = KEYS[3]
local budget_g = KEYS[4]

local limit_uc = tonumber(ARGV[1])
local limit_gc = tonumber(ARGV[2])
local limit_ub = tonumber(ARGV[3])
local limit_gb = tonumber(ARGV[4])
local ttl      = tonumber(ARGV[5])
local cost     = tonumber(ARGV[6])
local token    = ARGV[7]
local expires  = ARGV[8]

-- Concurrency check first (so denials don't burn budget).
local uc = tonumber(redis.call('HLEN', active_u) or 0)
if uc >= limit_uc then return {0, 'concurrency_user'} end
local gc = tonumber(redis.call('HLEN', active_g) or 0)
if gc >= limit_gc then return {0, 'concurrency_global'} end

-- Budget reservation. INCRBY returns the new total, then we check the cap.
-- If we exceed, decrement back so other callers aren't penalised.
local ub = tonumber(redis.call('INCRBY', budget_u, cost) or 0)
if ub == cost then redis.call('EXPIRE', budget_u, 60) end
if ub > limit_ub then
  redis.call('DECRBY', budget_u, cost)
  return {0, 'budget_user'}
end
local gb = tonumber(redis.call('INCRBY', budget_g, cost) or 0)
if gb == cost then redis.call('EXPIRE', budget_g, 60) end
if gb > limit_gb then
  redis.call('DECRBY', budget_u, cost)
  redis.call('DECRBY', budget_g, cost)
  return {0, 'budget_global'}
end

redis.call('HSET', active_u, token, expires)
redis.call('HSET', active_g, token, expires)
redis.call('EXPIRE', active_u, ttl)
redis.call('EXPIRE', active_g, ttl)
return {1, token}
`

// One-time warning when we silently fall back to in-memory state. In a
// multi-replica deploy this means rate limits and concurrency caps are NOT
// enforced across replicas — each pod has its own counters. The warning
// fires once per process so logs aren't flooded.
let memoryFallbackWarned = false
function warnMemoryFallback(reason: string) {
  if (memoryFallbackWarned) return
  memoryFallbackWarned = true
  console.warn(
    `[workload-gate] Falling back to in-memory state (${reason}). On a multi-replica deploy ` +
      `(e.g. Vercel serverless or multiple Node instances) limits will NOT be enforced across ` +
      `replicas. Set REDIS_URL / KV_REST_API_URL to enable shared state.`
  )
}

type WorkloadLane = 'deploy' | 'chat' | 'gateway_chat'

type LaneConfig = {
  userConcurrency: number
  globalConcurrency: number
  userBudgetPerMinute: number
  globalBudgetPerMinute: number
  ttlSeconds: number
}

type ActiveEntry = {
  expiresAt: number
}

type AcquireParams = {
  lane: WorkloadLane
  userId?: string | null
  ip?: string | null
  cost?: number
}

export type WorkloadTicket = {
  lane: WorkloadLane
  token: string
  userKey: string
  globalKey: string
  source: 'redis' | 'memory'
}

export type WorkloadAcquireResult =
  | { ok: true; ticket: WorkloadTicket }
  | { ok: false; reason: string; retryAfterSeconds: number }

const LANE_CONFIG: Record<WorkloadLane, LaneConfig> = {
  deploy: {
    userConcurrency: 1,
    globalConcurrency: 4,
    userBudgetPerMinute: 6,
    globalBudgetPerMinute: 20,
    ttlSeconds: 180,
  },
  chat: {
    userConcurrency: 2,
    globalConcurrency: 20,
    userBudgetPerMinute: 20,
    globalBudgetPerMinute: 200,
    ttlSeconds: 45,
  },
  gateway_chat: {
    userConcurrency: 1,
    globalConcurrency: 8,
    userBudgetPerMinute: 6,
    globalBudgetPerMinute: 60,
    ttlSeconds: 45,
  },
}

const memoryActive = new Map<string, Map<string, ActiveEntry>>()
const memoryBudget = new Map<string, { count: number; expiresAt: number }>()

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

function cleanupMemoryActive(key: string): Map<string, ActiveEntry> {
  const now = Date.now()
  const bucket = memoryActive.get(key) || new Map<string, ActiveEntry>()
  for (const [token, entry] of bucket.entries()) {
    if (entry.expiresAt <= now) {
      bucket.delete(token)
    }
  }
  memoryActive.set(key, bucket)
  return bucket
}

function getActorId(params: AcquireParams): string {
  if (params.userId) {
    return `user:${params.userId}`
  }
  if (params.ip) {
    return `ip:${hashValue(params.ip)}`
  }
  return 'anonymous'
}

function minuteWindow(): string {
  return Math.floor(Date.now() / 60_000).toString()
}

function getKeys(params: AcquireParams) {
  const actorId = getActorId(params)
  const lane = params.lane
  const minute = minuteWindow()

  return {
    activeUser: `gate:${lane}:active:user:${actorId}`,
    activeGlobal: `gate:${lane}:active:global`,
    budgetUser: `gate:${lane}:budget:user:${actorId}:${minute}`,
    budgetGlobal: `gate:${lane}:budget:global:${minute}`,
  }
}

function reject(reason: string): WorkloadAcquireResult {
  return { ok: false, reason, retryAfterSeconds: 30 }
}

async function acquireWithRedis(params: AcquireParams, config: LaneConfig): Promise<WorkloadAcquireResult> {
  if (!redis) {
    warnMemoryFallback('redis client not configured')
    return acquireWithMemory(params, config)
  }

  const keys = getKeys(params)
  const token = randomUUID()
  const cost = Math.max(1, params.cost || 1)
  const expiresAt = (Date.now() + config.ttlSeconds * 1000).toString()

  // Single round-trip atomic acquire — see ACQUIRE_LUA above. Falls back to
  // memory if EVAL fails (e.g. Upstash REST shim that doesn't support eval).
  let result: unknown
  try {
    // The Upstash @upstash/redis client typings vary; cast to a permissive
    // shape so we don't have to ship per-version type stubs.
    const client = redis as unknown as {
      eval(script: string, keys: string[], args: string[]): Promise<unknown>
    }
    result = await client.eval(
      ACQUIRE_LUA,
      [keys.activeUser, keys.activeGlobal, keys.budgetUser, keys.budgetGlobal],
      [
        String(config.userConcurrency),
        String(config.globalConcurrency),
        String(config.userBudgetPerMinute),
        String(config.globalBudgetPerMinute),
        String(config.ttlSeconds),
        String(cost),
        token,
        expiresAt,
      ]
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    warnMemoryFallback(`redis eval failed: ${message}`)
    return acquireWithMemory(params, config)
  }

  // Redis EVAL returns an array tuple [ok, payload].
  if (!Array.isArray(result) || result.length < 2) {
    warnMemoryFallback('redis eval returned unexpected shape')
    return acquireWithMemory(params, config)
  }
  const okFlag = Number((result as unknown[])[0])
  const payload = String((result as unknown[])[1])

  if (okFlag !== 1) {
    const reason =
      payload === 'concurrency_user' ? 'User concurrency exceeded'
      : payload === 'concurrency_global' ? 'Global concurrency exceeded'
      : payload === 'budget_user' ? 'User budget exceeded'
      : payload === 'budget_global' ? 'Global budget exceeded'
      : `Workload denied: ${payload}`
    return reject(reason)
  }

  return {
    ok: true,
    ticket: {
      lane: params.lane,
      token,
      userKey: keys.activeUser,
      globalKey: keys.activeGlobal,
      source: 'redis',
    },
  }
}

function acquireWithMemory(params: AcquireParams, config: LaneConfig): WorkloadAcquireResult {
  const keys = getKeys(params)
  const cost = Math.max(1, params.cost || 1)
  const now = Date.now()

  for (const budgetKey of [keys.budgetUser, keys.budgetGlobal]) {
    const entry = memoryBudget.get(budgetKey)
    if (!entry || entry.expiresAt <= now) {
      memoryBudget.set(budgetKey, { count: 0, expiresAt: now + 60_000 })
    }
  }

  const userBudget = memoryBudget.get(keys.budgetUser)!
  const globalBudget = memoryBudget.get(keys.budgetGlobal)!

  userBudget.count += cost
  globalBudget.count += cost

  if (userBudget.count > config.userBudgetPerMinute) {
    return reject('User budget exceeded')
  }
  if (globalBudget.count > config.globalBudgetPerMinute) {
    return reject('Global budget exceeded')
  }

  const userBucket = cleanupMemoryActive(keys.activeUser)
  const globalBucket = cleanupMemoryActive(keys.activeGlobal)

  if (userBucket.size >= config.userConcurrency) {
    return reject('User concurrency exceeded')
  }
  if (globalBucket.size >= config.globalConcurrency) {
    return reject('Global concurrency exceeded')
  }

  const token = randomUUID()
  const expiresAt = now + config.ttlSeconds * 1000
  userBucket.set(token, { expiresAt })
  globalBucket.set(token, { expiresAt })

  return {
    ok: true,
    ticket: {
      lane: params.lane,
      token,
      userKey: keys.activeUser,
      globalKey: keys.activeGlobal,
      source: 'memory',
    },
  }
}

export async function acquireWorkloadSlot(params: AcquireParams): Promise<WorkloadAcquireResult> {
  const config = LANE_CONFIG[params.lane]
  return acquireWithRedis(params, config)
}

export async function releaseWorkloadSlot(ticket: WorkloadTicket | null | undefined): Promise<void> {
  if (!ticket) {
    return
  }

  if (ticket.source === 'redis' && redis) {
    await Promise.all([
      redis.hdel(ticket.userKey, ticket.token),
      redis.hdel(ticket.globalKey, ticket.token),
    ]).catch(() => {})
    return
  }

  memoryActive.get(ticket.userKey)?.delete(ticket.token)
  memoryActive.get(ticket.globalKey)?.delete(ticket.token)
}
