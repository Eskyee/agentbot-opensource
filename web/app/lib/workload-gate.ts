import { Redis } from '@upstash/redis'
import { createHash, randomUUID } from 'crypto'

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

let redis: Redis | null = null
try {
  const restUrl = process.env.KV_REST_API_URL
  const restToken = process.env.KV_REST_API_TOKEN
  if (restUrl && restToken && !restUrl.includes('localhost')) {
    redis = new Redis({ url: restUrl, token: restToken })
  }
} catch {
  redis = null
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
    return acquireWithMemory(params, config)
  }

  const keys = getKeys(params)
  const token = randomUUID()
  const cost = Math.max(1, params.cost || 1)

  const [userBudget, globalBudget] = await Promise.all([
    redis.incrby(keys.budgetUser, cost),
    redis.incrby(keys.budgetGlobal, cost),
  ])

  if (userBudget === cost) {
    await redis.expire(keys.budgetUser, 60)
  }
  if (globalBudget === cost) {
    await redis.expire(keys.budgetGlobal, 60)
  }

  if (userBudget > config.userBudgetPerMinute) {
    return reject('User budget exceeded')
  }
  if (globalBudget > config.globalBudgetPerMinute) {
    return reject('Global budget exceeded')
  }

  const [userCount, globalCount] = await Promise.all([
    redis.hlen(keys.activeUser),
    redis.hlen(keys.activeGlobal),
  ])

  if (userCount >= config.userConcurrency) {
    return reject('User concurrency exceeded')
  }
  if (globalCount >= config.globalConcurrency) {
    return reject('Global concurrency exceeded')
  }

  const expiresAt = Date.now() + config.ttlSeconds * 1000
  await Promise.all([
    redis.hset(keys.activeUser, { [token]: expiresAt.toString() }),
    redis.hset(keys.activeGlobal, { [token]: expiresAt.toString() }),
    redis.expire(keys.activeUser, config.ttlSeconds),
    redis.expire(keys.activeGlobal, config.ttlSeconds),
  ])

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
