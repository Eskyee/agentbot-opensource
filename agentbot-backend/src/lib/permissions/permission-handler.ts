/**
 * Permission Handler — Routes dangerous commands to dashboard
 *
 * Integrates with Docker agent hook system (pre-tool-use).
 * Safe commands auto-approve, dangerous/destructive route to user dashboard.
 */

import { classifyCommand, classifyToolCall, type ClassificationResult, type PermissionTier } from './tiered-classifier'

export interface PermissionRequest {
  id: string
  agentId: string
  userId: string
  tier: PermissionTier
  command: string
  reason: string
  confidence: string
  timestamp: number
  status: 'pending' | 'approved' | 'rejected'
  feedback?: string
}

export interface PermissionDecision {
  requestId: string
  decision: 'approve' | 'reject' | 'approve_always'
  feedback?: string
  modifiedInput?: string
}

// In-memory store for pending requests (replace with Redis in production)
const pendingRequests = new Map<string, PermissionRequest>()

/**
 * Handle a pre-tool-use hook from Docker agent
 * Returns: { allow: boolean, modifiedInput?: string, reason: string }
 */
export async function handlePreToolUse(
  agentId: string,
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<{ allow: boolean; modifiedInput?: string; reason: string }> {
  
  const classification = classifyToolCall(toolName, toolInput)
  
  // Safe commands auto-approve
  if (classification.autoApprove) {
    return {
      allow: true,
      reason: classification.reason,
    }
  }
  
  // Destructive commands block by default
  if (classification.tier === 'destructive') {
    return {
      allow: false,
      reason: `Blocked: ${classification.reason}. This command is destructive and requires explicit user approval via dashboard.`,
    }
  }
  
  // Dangerous commands route to dashboard
  const requestId = generateRequestId()
  const request: PermissionRequest = {
    id: requestId,
    agentId,
    userId,
    tier: classification.tier,
    command: classification.command,
    reason: classification.reason,
    confidence: classification.confidence,
    timestamp: Date.now(),
    status: 'pending',
  }
  
  pendingRequests.set(requestId, request)
  
  // TODO: Send notification to dashboard via WebSocket/SSE
  // notifyDashboard(userId, request)
  
  // For now, block and wait for dashboard response
  // In production, this would be async with WebSocket
  return {
    allow: false,
    reason: `Pending approval: ${classification.reason}. Check dashboard for approval.`,
  }
}

/**
 * Process a permission decision from the dashboard
 */
export function processDecision(decision: PermissionDecision): PermissionRequest | null {
  const request = pendingRequests.get(decision.requestId)
  if (!request) return null
  
  request.status = decision.decision === 'reject' ? 'rejected' : 'approved'
  request.feedback = decision.feedback
  
  // If approve_always, add to user's auto-approve list
  if (decision.decision === 'approve_always') {
    // TODO: Persist to user settings
    // addToAutoApprove(request.userId, request.command)
  }
  
  pendingRequests.delete(decision.requestId)
  return request
}

/**
 * Get pending requests for a user
 */
export function getPendingRequests(userId: string): PermissionRequest[] {
  return Array.from(pendingRequests.values())
    .filter(r => r.userId === userId && r.status === 'pending')
}

/**
 * Get pending requests for an agent
 */
export function getAgentPendingRequests(agentId: string): PermissionRequest[] {
  return Array.from(pendingRequests.values())
    .filter(r => r.agentId === agentId && r.status === 'pending')
}

function generateRequestId(): string {
  return `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
