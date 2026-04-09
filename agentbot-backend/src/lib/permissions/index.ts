/**
 * Permissions Module — Tiered Permission System
 *
 * Exports:
 * - classifyCommand: Runtime command classifier
 * - classifyToolCall: Tool call classifier for Docker agent hooks
 * - handlePreToolUse: Pre-tool-use hook handler
 * - processDecision: Dashboard decision processor
 */

export {
  classifyCommand,
  classifyToolCall,
  type ClassificationResult,
  type PermissionTier,
} from './tiered-classifier'

export {
  handlePreToolUse,
  processDecision,
  getPendingRequests,
  getAgentPendingRequests,
  type PermissionRequest,
  type PermissionDecision,
} from './permission-handler'
