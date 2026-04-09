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
 */

import { Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'
import { classifyToolCall } from '../lib/permissions'

// Pending request store (in-memory; replace with Redis in production)
interface PendingRequest {
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

const pendingRequests = new Map<string, PendingRequest>()

/**
 * Pre-tool-use hook — call before executing any agent tool
 * Returns the classification and whether to allow/block
 */
export function preToolUseHook(
  agentId: string,
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>
): { allow: boolean; requestId?: string; tier: string; reason: string } {
  const classification = classifyToolCall(toolName, toolInput)

  // Safe commands pass through
  if (classification.autoApprove) {
    return {
      allow: true,
      tier: classification.tier,
      reason: classification.reason,
    }
  }

  // Destructive commands block
  if (classification.tier === 'destructive') {
    return {
      allow: false,
      tier: 'destructive',
      reason: `Blocked: ${classification.reason}`,
    }
  }

  // Dangerous commands queue for approval
  const requestId = `perm_${Date.now()}_${randomBytes(6).toString('hex')}`
  pendingRequests.set(requestId, {
    id: requestId,
    agentId,
    userId,
    toolName,
    toolInput,
    tier: classification.tier,
    reason: classification.reason,
    timestamp: Date.now(),
    status: 'pending',
  })

  return {
    allow: false,
    requestId,
    tier: 'dangerous',
    reason: `Queued for approval: ${classification.reason}`,
  }
}

/**
 * Express middleware — intercepts agent tool call requests
 */
export function permissionHookMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only intercept agent tool-call endpoints
  if (!req.path.includes('/tool-call') && !req.path.includes('/execute')) {
    return next()
  }

  const agentId = req.params.agentId || req.body?.agentId || 'unknown'
  const userId = req.userId || 'unknown'
  const toolName = req.body?.toolName || 'unknown'
  const toolInput = req.body?.toolInput || {}

  const result = preToolUseHook(agentId, userId, toolName, toolInput)

  if (result.allow) {
    // Safe — pass through
    return next()
  }

  // Block or queue
  return res.status(result.tier === 'destructive' ? 403 : 202).json({
    allowed: false,
    tier: result.tier,
    reason: result.reason,
    requestId: result.requestId,
  })
}

/**
 * Get pending requests for a user (for dashboard polling)
 */
export function getPendingForUser(userId: string): PendingRequest[] {
  return Array.from(pendingRequests.values())
    .filter(r => r.userId === userId && r.status === 'pending')
}

/**
 * Get pending requests for an agent
 */
export function getPendingForAgent(agentId: string): PendingRequest[] {
  return Array.from(pendingRequests.values())
    .filter(r => r.agentId === agentId && r.status === 'pending')
}

/**
 * Process a decision from the dashboard
 */
export function processPermissionDecision(
  requestId: string,
  decision: 'approve' | 'reject' | 'approve_always'
): PendingRequest | null {
  const request = pendingRequests.get(requestId)
  if (!request) return null

  request.status = decision === 'reject' ? 'rejected' : 'approved'
  pendingRequests.delete(requestId)
  return request
}
