/**
 * A2A task store — Redis-backed state for async A2A tasks.
 *
 * Synchronous message/send is bound by the function's 60s limit. For long work,
 * a client sends with `configuration.blocking: false`: we persist a `submitted`
 * task, return its id immediately, run the work in the background (Next after()),
 * and write the result back here. The client polls `tasks/get` until completed.
 *
 * Falls back to an in-memory map when Redis isn't configured (dev/preview); that
 * only works within a single instance, which is fine for local use.
 *
 * Note: background work via after() is still bounded by maxDuration. For truly
 * unbounded tasks, swap `runner` for an enqueue onto the backend bus worker —
 * the store API stays the same.
 */
import { redis } from './redis'

export type A2ATaskState = 'submitted' | 'working' | 'completed' | 'failed'

export type A2ATask = {
  id: string
  contextId: string
  state: A2ATaskState
  createdAt: string
  updatedAt: string
  /** result message text once completed */
  result?: string
  error?: string
}

const TTL_SECONDS = 3600
const mem = new Map<string, A2ATask>()

function key(id: string): string {
  return `a2a:task:${id}`
}

export function newTaskId(): string {
  return `task-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`
}

export async function putTask(task: A2ATask): Promise<void> {
  task.updatedAt = new Date().toISOString()
  if (redis) {
    try {
      await redis.set(key(task.id), JSON.stringify(task), { ex: TTL_SECONDS })
      return
    } catch {
      /* fall through to memory */
    }
  }
  mem.set(task.id, task)
}

export async function getTask(id: string): Promise<A2ATask | null> {
  if (redis) {
    try {
      const raw = await redis.get<string>(key(id))
      if (!raw) return null
      return typeof raw === 'string' ? (JSON.parse(raw) as A2ATask) : (raw as A2ATask)
    } catch {
      /* fall through to memory */
    }
  }
  return mem.get(id) ?? null
}

export async function createTask(contextId: string): Promise<A2ATask> {
  const now = new Date().toISOString()
  const task: A2ATask = {
    id: newTaskId(),
    contextId,
    state: 'submitted',
    createdAt: now,
    updatedAt: now,
  }
  await putTask(task)
  return task
}

export async function markWorking(id: string): Promise<void> {
  const t = await getTask(id)
  if (t) await putTask({ ...t, state: 'working' })
}

export async function completeTask(id: string, result: string): Promise<void> {
  const t = await getTask(id)
  if (t) await putTask({ ...t, state: 'completed', result })
}

export async function failTask(id: string, error: string): Promise<void> {
  const t = await getTask(id)
  if (t) await putTask({ ...t, state: 'failed', error })
}

/** Shape a stored task as an A2A Task object for JSON-RPC responses. */
export function toA2ATask(task: A2ATask) {
  return {
    id: task.id,
    contextId: task.contextId,
    status: { state: task.state, timestamp: task.updatedAt },
    history: [],
    artifacts: [],
    ...(task.state === 'completed' && task.result
      ? {
          message: {
            role: 'agent',
            parts: [{ kind: 'text', text: task.result }],
            messageId: `msg-${task.id}`,
          },
        }
      : {}),
    ...(task.state === 'failed' && task.error ? { error: task.error } : {}),
    kind: 'task',
  }
}
