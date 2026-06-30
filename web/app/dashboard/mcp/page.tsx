'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import {
  Plug,
  Unplug,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface McpIntegration {
  provider: string
  name: string
  description: string
  icon: string
  iconBg: string
  capabilities: string[]
  connected: boolean
  connectedAt?: string
  meta?: Record<string, string>
}

const PROVIDERS: Omit<McpIntegration, 'connected' | 'connectedAt' | 'meta'>[] = [
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Read/write messages, channels, reactions',
    icon: '💬',
    iconBg: 'bg-purple-500/10 border-purple-500/30',
    capabilities: ['Read/write messages', 'Channel management', 'Reactions', 'Threads'],
  },
  {
    provider: 'github',
    name: 'GitHub',
    description: 'Repos, PRs, issues, actions, CI',
    icon: '🐙',
    iconBg: 'bg-zinc-500/10 border-zinc-500/30',
    capabilities: ['Repos', 'Pull Requests', 'Issues', 'Actions', 'CI/CD'],
  },
  {
    provider: 'linear',
    name: 'Linear',
    description: 'Issues, projects, teams, labels',
    icon: '📋',
    iconBg: 'bg-indigo-500/10 border-indigo-500/30',
    capabilities: ['Issues', 'Projects', 'Teams', 'Labels', 'Cycles'],
  },
  {
    provider: 'sentry',
    name: 'Sentry',
    description: 'Errors, performance, releases',
    icon: '🔍',
    iconBg: 'bg-red-500/10 border-red-500/30',
    capabilities: ['Errors', 'Performance', 'Releases', 'Alerts'],
  },
  {
    provider: 'datadog',
    name: 'Datadog',
    description: 'Metrics, logs, traces, monitors',
    icon: '📊',
    iconBg: 'bg-purple-600/10 border-purple-600/30',
    capabilities: ['Metrics', 'Logs', 'Traces', 'Monitors', 'Dashboards'],
  },
  {
    provider: 'notion',
    name: 'Notion',
    description: 'Pages, databases, wikis',
    icon: '📝',
    iconBg: 'bg-zinc-500/10 border-zinc-400/30',
    capabilities: ['Pages', 'Databases', 'Wikis', 'Blocks'],
  },
  {
    provider: 'jira',
    name: 'Jira',
    description: 'Issues, sprints, boards',
    icon: '🎫',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    capabilities: ['Issues', 'Sprints', 'Boards', 'Projects'],
  },
  {
    provider: 'figma',
    name: 'Figma',
    description: 'Designs, components, prototypes',
    icon: '🎨',
    iconBg: 'bg-violet-500/10 border-violet-500/30',
    capabilities: ['Designs', 'Components', 'Prototypes', 'Comments'],
  },
]

export default function McpIntegrationsPage() {
  const [integrations, setIntegrations] = useState<McpIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp-integrations/status')
      if (!res.ok) throw new Error('Failed to load connections')
      const data = await res.json()
      const statusMap = new Map<string, any>(
        (data.connections || []).map((c: any) => [c.provider, c]),
      )
      setIntegrations(
        PROVIDERS.map((p) => ({
          ...p,
          connected: statusMap.get(p.provider)?.connected || false,
          connectedAt: statusMap.get(p.provider)?.connectedAt,
          meta: statusMap.get(p.provider)?.meta,
        })),
      )
    } catch {
      setIntegrations(
        PROVIDERS.map((p) => ({ ...p, connected: false })),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  const handleConnect = useCallback(async (provider: string) => {
    setConnecting(provider)
    try {
      const res = await fetch(`/api/mcp-integrations/${provider}/start`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to start OAuth')
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No OAuth URL returned')
      }
    } catch (err: any) {
      toast.error(err.message || 'Connection failed')
      setConnecting(null)
    }
  }, [])

  const handleDisconnect = useCallback(async (provider: string) => {
    setDisconnecting(provider)
    try {
      const res = await fetch(`/api/mcp-integrations/${provider}/disconnect`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to disconnect')
      toast.success(`Disconnected from ${provider}`)
      await fetchConnections()
    } catch (err: any) {
      toast.error(err.message || 'Disconnect failed')
    } finally {
      setDisconnecting(null)
    }
  }, [fetchConnections])

  return (
    <DashboardShell>
      <DashboardHeader
        title="MCP Integrations"
        subtitle="Connect external services to give automations access to tools, data, and actions."
        icon={<Plug className="h-5 w-5 text-orange-500" />}
      />

      <DashboardContent className="max-w-5xl space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-zinc-800 bg-zinc-950 p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.provider}
                className={cn(
                  'border bg-zinc-950/40 p-5 flex flex-col gap-4 transition-all',
                  integration.connected
                    ? 'border-green-500/30 hover:border-green-500/50'
                    : 'border-zinc-800 hover:border-zinc-600',
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 flex items-center justify-center border text-lg',
                        integration.iconBg,
                      )}
                    >
                      {integration.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                        {integration.name}
                      </h3>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  {integration.connected ? (
                    <span className="shrink-0 inline-flex items-center gap-1 border border-green-500/40 text-green-400 px-2 py-0.5 text-[9px] uppercase tracking-widest">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 border border-zinc-800 text-zinc-500 px-2 py-0.5 text-[9px] uppercase tracking-widest">
                      <AlertCircle className="h-3 w-3" />
                      Not connected
                    </span>
                  )}
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1.5">
                  {integration.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="border border-zinc-800 text-zinc-400 px-2 py-0.5 text-[9px] uppercase tracking-widest"
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                {integration.connected && integration.connectedAt && (
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Connected {new Date(integration.connectedAt).toLocaleDateString()}
                    {integration.meta?.username && (
                      <span className="text-zinc-500"> · @{integration.meta.username}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-900">
                  {integration.connected ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDisconnect(integration.provider)}
                        disabled={disconnecting === integration.provider}
                        className="flex items-center gap-1.5 border border-red-500/30 text-red-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Unplug className="h-3 w-3" />
                        {disconnecting === integration.provider
                          ? 'Disconnecting…'
                          : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() =>
                      integration.connected
                        ? window.open(
                            `/api/mcp-integrations/${integration.provider}/status`,
                            '_blank',
                          )
                        : handleConnect(integration.provider)
                    }
                    disabled={connecting === integration.provider}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50',
                      integration.connected
                        ? 'border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                        : 'border border-white bg-white text-black hover:bg-zinc-200',
                    )}
                  >
                    {connecting === integration.provider ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : integration.connected ? (
                      <ExternalLink className="h-3 w-3" />
                    ) : (
                      <Plug className="h-3 w-3" />
                    )}
                    {connecting === integration.provider
                      ? 'Connecting…'
                      : integration.connected
                        ? 'Manage'
                        : 'Connect'}
                    {!integration.connected && <ChevronRight className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
            How MCP Integrations Work
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-zinc-400">
            <div className="border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-widest text-orange-400 mb-2">1. Connect</div>
              <p className="text-xs leading-relaxed">
                Authorize Agentbot to access your account via OAuth. Tokens are encrypted with AES-256-GCM and stored per-user.
              </p>
            </div>
            <div className="border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-widest text-orange-400 mb-2">2. Automate</div>
              <p className="text-xs leading-relaxed">
                Your agent uses MCP tools to read data, create issues, post messages, and trigger workflows across all connected services.
              </p>
            </div>
            <div className="border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-widest text-orange-400 mb-2">3. Control</div>
              <p className="text-xs leading-relaxed">
                Revoke access anytime. Each integration is isolated — disconnecting one doesn&apos;t affect others.
              </p>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
