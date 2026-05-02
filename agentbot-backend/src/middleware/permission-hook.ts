/**
 * Permission Hook Middleware — Pre-Tool-Use Interceptor
 *
 * Plugs into the Express API to intercept tool calls from Docker agents.
 * Routes through tiered classifier before execution.
 *
 * Flow:
 * 1. Agent makes tool call → hits /api/agent/:agentId/tool-call
 * 2. Classifier checks tier (safe/dangerous/destructive)
 * 3. Safe → pass through immediately
 * 4. Dangerous → store request, return pending status
 * 5. Destructive → block, return error
 * 6. Dashboard polls /api/permissions for pending requests
 * 7. User approves → request re-executes
 *
 * STATE: pending requests are stored in `agent_permission_requests` (Postgres),
 * not an in-memory Map. The previous in-memory implementation diverged across
 * Express replicas and vanished on restart, leaving callers stuck waiting on
 * requests the new process knew nothing about — directly contradicting the
 * project's "DB-backed state (no in-memory stores — survives restarts)" rule.
 */

import { Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import { classifyToolCall } from '../lib/permissions'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export interface PendingRequest {
  id: string
  agentId: string
  userId: string
  toolName: string
  toolInput: Record<string, unknown>
  tier: string
  reason: string
  timestamp: number
  status: 'pending' | 'approved' | 'rejected'
}

interface DbRow {
  id: string
  agent_id: string | null
  user_id: string | null
  tool_name: string
  tool_input: Record<string, unknown> | null
  reason: string | null
  status: string
  created_at: Date
}

function fromRow(row: DbRow, tier = 'dangerous'): PendingRequest {
  return {
    id: row.id,
    agentId: row.agent_id ?? 'unknown',
    userId: row.user_id ?? 'unknown',
    toolName: row.tool_name,
    toolInput: row.tool_input ?? {},
    tier,
    reason: row.reason ?? '',
    timestamp: row.created_at instanceof Date ? row.created_at.getTime() : Date.parse(String(row.created_at)),
    status:
      row.status === 'approved' || row.status === 'denied'
        ? row.status === 'denied' ? 'rejected' : 'approved'
        : 'pending',
  }
}

/**
 * Pre-tool-use hook — call before executing any agent tool.
 * Persists dangerous-tier requests so the dashboard (potentially served from
 * a different replica) can read and decide on them.
 */
export async function preToolUseHook(
  agentId: string,
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<{ allow: boolean; requestId?: string; tier: string; reason: string }> {
  const classification = classifyToolCall(toolName, toolInput)

  if (classification.autoApprove) {
    return { allow: true, tier: classification.tier, reason: classification.reason }
  }

  if (classification.tier === 'destructive') {
    return { allow: false, tier: 'destructive', reason: `Blocked: ${classification.reason}` }
  }

  // Dangerous: persist a pending request.
  const requestId = `perm_${Date.now()}_${randomBytes(6).toString('hex')}`
  try {
    await pool.query(
      `INSERT INTO agent_permission_requests
         (id, agent_id, user_id, tool_name, tool_input, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [requestId, agentId, userId, toolName, JSON.stringify(toolInput ?? {}), classification.reason]
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PermissionHook] Failed to persist pending request:', message)
    // Fail closed — block the tool call rather than silently allowing it
    // through with no record of the approval check.
    return {
      allow: false,
      tier: 'dangerous',
      reason: 'Approval store unavailable; request rejected (fail-closed)',
    }
  }

  return {
    allow: false,
    requestId,
    tier: 'dangerous',
    reason: `Queued for approval: ${classification.reason}`,
  }
}

/** Express middleware — intercepts agent tool call requests. */
export async function permissionHookMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only intercept agent tool-call endpoints.
  if (!req.path.includes('/tool-call') && !req.path.includes('/execute')) {
    return next()
  }

  const agentId = req.params.agentId || req.body?.agentId || 'unknown'
  const userId = req.userId || 'unknown'
  const toolName = req.body?.toolName || 'unknown'
  const toolInput = req.body?.toolInput || {}

  const result = await preToolUseHook(agentId, userId, toolName, toolInput)

  if (result.allow) {
    return next()
  }

  return res.status(result.tier === 'destructive' ? 403 : 202).json({
    allowed: false,
    tier: result.tier,
    reason: result.reason,
    requestId: result.requestId,
  })
}

/** Get pending requests for a user (for dashboard polling). */
export async function getPendingForUser(userId: string): Promise<PendingRequest[]> {
  try {
    const result = await pool.query<DbRow>(
      `SELECT id, agent_id, user_id, tool_name, tool_input, reason, status, created_at
         FROM agent_permission_requests
        WHERE user_id = $1 AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 200`,
      [userId]
    )
    return result.rows.map((r) => fromRow(r))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PermissionHook] getPendingForUser failed:', message)
    return []
  }
}

/** Get pending requests for an agent. */
export async function getPendingForAgent(agentId: string): Promise<PendingRequest[]> {
  try {
    const result = await pool.query<DbRow>(
      `SELECT id, agent_id, user_id, tool_name, tool_input, reason, status, created_at
         FROM agent_permission_requests
        WHERE agent_id = $1 AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 200`,
      [agentId]
    )
    return result.rows.map((r) => fromRow(r))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PermissionHook] getPendingForAgent failed:', message)
    return []
  }
}

/**
 * Process a decision from the dashboard.
 *
 * Atomic: only the first decision wins. The WHERE clause guarantees we don't
 * flip an already-decided request, so concurrent dashboard clicks (or stale
 * websocket events) don't override each other.
 */
export async function processPermissionDecision(
  requestId: string,
  decision: 'approve' | 'reject' | 'approve_always',
  decidedBy?: string
): Promise<PendingRequest | null> {
  const dbStatus = decision === 'reject' ? 'denied' : 'approved'
  try {
    const result = await pool.query<DbRow>(
      `UPDATE agent_permission_requests
          SET status = $2, decided_by = $3, decided_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
       RETURNING id, agent_id, user_id, tool_name, tool_input, reason, status, created_at`,
      [requestId, dbStatus, decidedBy ?? null]
    )
    if (result.rowCount === 0) return null
    return fromRow(result.rows[0])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PermissionHook] processPermissionDecision failed:', message)
    return null
  }
}
