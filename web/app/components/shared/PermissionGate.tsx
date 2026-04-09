'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PermissionRequest {
  id: string
  agentId: string
  tier: 'safe' | 'dangerous' | 'destructive'
  command: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  timestamp: number
}

interface PermissionGateProps {
  agentId?: string
  onRequestHandled?: (requestId: string, decision: string) => void
}

export function PermissionGate({ agentId, onRequestHandled }: PermissionGateProps) {
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch pending from REST API (initial load + fallback)
  const fetchPending = useCallback(async () => {
    try {
      const params = agentId ? `?agentId=${agentId}` : ''
      const res = await fetch(`/api/permissions${params}`)
      const data = await res.json()
      setRequests(data.pending || [])
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }, [agentId])

  // WebSocket connection for real-time notifications
  useEffect(() => {
    // Initial fetch
    fetchPending()

    // Connect WebSocket
    const userId = agentId || 'default'
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/permissions?userId=${encodeURIComponent(userId)}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        console.log('[PermissionGate] WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'permission_request') {
            setRequests(prev => {
              // Deduplicate
              if (prev.find(r => r.id === msg.data.id)) return prev
              return [...prev, { ...msg.data, timestamp: msg.data.timestamp || Date.now() }]
            })
          } else if (msg.type === 'decision_ack') {
            setRequests(prev => prev.filter(r => r.id !== msg.data.requestId))
          }
        } catch (err) {
          console.error('[PermissionGate] WS parse error:', err)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        console.log('[PermissionGate] WebSocket disconnected, falling back to polling')
      }

      ws.onerror = () => {
        setConnected(false)
      }

      return () => {
        ws.close()
        wsRef.current = null
      }
    } catch {
      // WebSocket not available, fall back to polling
      const interval = setInterval(fetchPending, 5000)
      return () => clearInterval(interval)
    }
  }, [agentId, fetchPending])

  const handleDecision = async (
    requestId: string,
    decision: 'approve' | 'reject' | 'approve_always'
  ) => {
    setLoading(true)
    try {
      await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, decision }),
      })
      setRequests(prev => prev.filter(r => r.id !== requestId))
      onRequestHandled?.(requestId, decision)
    } catch (err) {
      console.error('Failed to process decision:', err)
    } finally {
      setLoading(false)
    }
  }

  if (requests.length === 0) return null

  return (
    <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-yellow-500">
          Permission Required
        </h3>
        <Badge variant="outline" className="ml-auto text-xs">
          {requests.length} pending
        </Badge>
      </div>

      {requests.map((req) => (
        <PermissionCard
          key={req.id}
          request={req}
          loading={loading}
          onDecision={handleDecision}
        />
      ))}
    </div>
  )
}

function PermissionCard({
  request,
  loading,
  onDecision,
}: {
  request: PermissionRequest
  loading: boolean
  onDecision: (id: string, d: 'approve' | 'reject' | 'approve_always') => void
}) {
  const tierColors = {
    safe: 'bg-green-500/10 text-green-400 border-green-500/30',
    dangerous: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    destructive: 'bg-red-500/10 text-red-400 border-red-500/30',
  }

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge className={`text-xs font-mono ${tierColors[request.tier]}`}>
          {request.tier}
        </Badge>
        <span className="text-xs text-zinc-500 font-mono">
          {new Date(request.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <code className="block text-sm font-mono bg-zinc-800/50 p-2 rounded text-zinc-300 break-all">
        {request.command}
      </code>

      <p className="text-xs text-zinc-500">{request.reason}</p>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs font-mono border-green-500/30 text-green-400 hover:bg-green-500/10"
          disabled={loading}
          onClick={() => onDecision(request.id, 'approve')}
        >
          ✓ Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs font-mono border-red-500/30 text-red-400 hover:bg-red-500/10"
          disabled={loading}
          onClick={() => onDecision(request.id, 'reject')}
        >
          ✗ Reject
        </Button>
        {request.tier === 'dangerous' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
            disabled={loading}
            onClick={() => onDecision(request.id, 'approve_always')}
          >
            ✓ Always
          </Button>
        )}
      </div>
    </div>
  )
}
