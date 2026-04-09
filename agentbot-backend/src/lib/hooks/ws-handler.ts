/**
 * WebSocket Handler — Real-time Permission Notifications
 *
 * Runs alongside Express HTTP server. Upgrades HTTP connections
 * to WebSocket for instant permission approval alerts.
 *
 * Integration:
 *   import { setupWebSocket } from './lib/hooks/ws-handler'
 *   const server = app.listen(PORT)
 *   setupWebSocket(server)
 *
 * Protocol:
 *   Client connects: ws://host/ws/permissions?userId=xxx
 *   Server sends: { type: "permission_request", data: { id, command, tier, reason } }
 *   Client sends: { type: "decision", data: { requestId, decision } }
 *   Server sends: { type: "decision_ack", data: { requestId, decision } }
 */

import { Server as HTTPServer } from 'http'
import WebSocket from 'ws'
const WebSocketServer = WebSocket.Server
import { URL } from 'url'

interface WSClient {
  ws: WebSocket
  userId: string
  subscribedAt: number
}

// Connected clients indexed by userId
const clients = new Map<string, Set<WSClient>>()

/**
 * Set up WebSocket server on existing HTTP server
 */
export function setupWebSocket(server: HTTPServer): InstanceType<typeof WebSocketServer> {
  const wss = new WebSocketServer({ server, path: '/ws/permissions' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      ws.close(4001, 'Missing userId')
      return
    }

    const client: WSClient = { ws, userId, subscribedAt: Date.now() }

    // Add to clients map
    if (!clients.has(userId)) {
      clients.set(userId, new Set())
    }
    clients.get(userId)!.add(client)

    console.log(`[WS] Client connected: ${userId} (total: ${getClientCount()})`)

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      data: { userId, timestamp: Date.now() },
    }))

    // Handle incoming messages
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        handleClientMessage(client, msg)
      } catch {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid JSON' } }))
      }
    })

    // Clean up on disconnect
    ws.on('close', () => {
      const userClients = clients.get(userId)
      if (userClients) {
        userClients.delete(client)
        if (userClients.size === 0) {
          clients.delete(userId)
        }
      }
      console.log(`[WS] Client disconnected: ${userId} (total: ${getClientCount()})`)
    })

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', data: { timestamp: Date.now() } }))
      }
    }, 30000)

    ws.on('close', () => clearInterval(heartbeat))
  })

  console.log('[WS] Permission WebSocket server ready at /ws/permissions')
  return wss
}

/**
 * Handle messages from dashboard client
 */
function handleClientMessage(client: WSClient, msg: { type: string; data: Record<string, unknown> }) {
  switch (msg.type) {
    case 'decision':
      // Forward decision to permission handler
      const { requestId, decision } = msg.data
      if (requestId && decision) {
        // TODO: Call processPermissionDecision from permission-hook.ts
        // processPermissionDecision(requestId as string, decision as string)

        // Acknowledge
        client.ws.send(JSON.stringify({
          type: 'decision_ack',
          data: { requestId, decision, timestamp: Date.now() },
        }))

        console.log(`[WS] Decision from ${client.userId}: ${requestId} → ${decision}`)
      }
      break

    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', data: { timestamp: Date.now() } }))
      break
  }
}

/**
 * Broadcast a permission request to all connected clients for a user
 */
export function broadcastPermissionRequest(userId: string, request: {
  id: string
  command: string
  tier: string
  reason: string
  agentId: string
}): void {
  const userClients = clients.get(userId)
  if (!userClients || userClients.size === 0) return

  const message = JSON.stringify({
    type: 'permission_request',
    data: request,
  })

  for (const client of userClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message)
    }
  }

  console.log(`[WS] Broadcast to ${userId}: ${request.id} (${userClients.size} clients)`)
}

/**
 * Get total connected client count
 */
function getClientCount(): number {
  let count = 0
  for (const userClients of clients.values()) {
    count += userClients.size
  }
  return count
}

/**
 * Get connected users (for health check)
 */
export function getConnectedUsers(): string[] {
  return Array.from(clients.keys())
}
