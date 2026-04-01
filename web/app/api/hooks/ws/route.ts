/**
 * WebSocket endpoint for real-time permission notifications
 *
 * Dashboard connects here to receive instant approval requests
 * instead of polling /api/permissions every 5s.
 *
 * Protocol:
 *   Dashboard → WS /api/hooks/ws?userId=xxx
 *   Server → { type: "permission_request", data: { id, command, tier, reason } }
 *   Dashboard → { type: "decision", data: { requestId, decision } }
 *   Server → { type: "decision_ack", data: { requestId, decision } }
 *
 * Note: Next.js App Router doesn't natively support WebSocket.
 * This file documents the protocol. Actual WS server runs via
 * a separate Express upgrade handler in the backend.
 */

export const WS_PROTOCOL = {
  // Server → Dashboard
  PERMISSION_REQUEST: 'permission_request',
  DECISION_ACK: 'decision_ack',
  HEARTBEAT: 'heartbeat',

  // Dashboard → Server
  DECISION: 'decision',
  SUBSCRIBE: 'subscribe',
  PING: 'ping',
} as const

export interface WSMessage {
  type: string
  data: Record<string, unknown>
}

/**
 * Example usage in Dashboard:
 *
 * const ws = new WebSocket(`wss://agentbot-prod-production.up.railway.app/ws/permissions?userId=${userId}`)
 *
 * ws.onmessage = (event) => {
 *   const msg = JSON.parse(event.data)
 *   if (msg.type === 'permission_request') {
 *     // Show approval UI
 *     showPermissionDialog(msg.data)
 *   }
 * }
 *
 * // Send decision
 * ws.send(JSON.stringify({
 *   type: 'decision',
 *   data: { requestId: 'hook_xxx', decision: 'approve' }
 * }))
 */
