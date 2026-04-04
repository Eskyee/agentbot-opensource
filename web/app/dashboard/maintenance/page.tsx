'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, RefreshCw, Wrench, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'
import { OPENCLAW_CONTROLS_ENABLED } from '@/app/lib/openclaw-control'

interface HealthData {
  instanceId?: string
  railwayUrl?: string
  healthy: boolean
  ready: boolean
  version?: string | null
  uptime?: string | null
  status: string
}

const MATRIX_STEPS = [
  {
    cmd: 'openclaw update',
    description: 'Fetches the latest version and runs doctor automatically.',
  },
  {
    cmd: 'openclaw doctor --fix',
    description: 'Migrates Matrix state, creates a recovery snapshot, and repairs config.',
  },
  {
    cmd: 'openclaw gateway restart',
    description: 'Restarts the gateway so startup-phase Matrix migration completes.',
  },
  {
    cmd: 'openclaw matrix verify status',
    description: 'Checks verification and backup state.',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="text-[10px] uppercase tracking-widest border border-zinc-700 hover:border-zinc-500 px-2 py-0.5 transition-colors shrink-0"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function MaintenancePage() {
  const controlsEnabled = OPENCLAW_CONTROLS_ENABLED
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [restarting, setRestarting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [restartMsg, setRestartMsg] = useState<string | null>(null)
  const [showMatrix, setShowMatrix] = useState(false)
  const [showDocker, setShowDocker] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/openclaw/maintenance')
      if (res.ok) setHealth(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  const runMaintenance = async () => {
    if (restarting || !controlsEnabled) return
    setRestarting(true)
    setRestartMsg(null)
    try {
      const res = await fetch('/api/openclaw/maintenance', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setRestartMsg('Agent restarting… doctor & migrations run automatically on startup.')
        setTimeout(fetchHealth, 8000)
      } else {
        setRestartMsg(`Error: ${data.error || 'Restart failed'}`)
      }
    } catch {
      setRestartMsg('Network error — could not reach maintenance endpoint')
    } finally {
      setRestarting(false)
    }
  }

  const factoryReset = async () => {
    if (resetting || !controlsEnabled) return
    if (!confirm('Factory reset your agent to the configured stable OpenClaw image? This updates the image, rewrites env vars, and restarts the runtime.')) return
    setResetting(true)
    setRestartMsg(null)
    try {
      const res = await fetch('/api/openclaw/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'factory-reset' }),
      })
      const data = await res.json()
      if (res.ok) {
        setRestartMsg(`Factory reset complete — pinned to ${data.image || 'configured image'}. Agent restarting with doctor --fix.`)
        setTimeout(fetchHealth, 15000)
      } else {
        setRestartMsg(`Error: ${data.error || 'Factory reset failed'}`)
      }
    } catch {
      setRestartMsg('Network error — could not reach maintenance endpoint')
    } finally {
      setResetting(false)
    }
  }

  const deleteAgent = async () => {
    if (deleting) return
    if (!health?.instanceId) return
    if (!confirm('Permanently delete your agent? This removes the container and all data. This cannot be undone.')) return
    setDeleting(true)
    setRestartMsg(null)
    try {
      const res = await fetch(`/api/agents/${health.instanceId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setRestartMsg('Agent deleted. Redirecting…')
        setTimeout(() => { window.location.href = '/dashboard' }, 2000)
      } else {
        setRestartMsg(`Error: ${data.error || 'Delete failed'}`)
      }
    } catch {
      setRestartMsg('Network error — could not reach delete endpoint')
    } finally {
      setDeleting(false)
    }
  }

  const statusLabel = health?.status === 'healthy' ? 'Healthy'
    : health?.status === 'starting' ? 'Starting'
    : health?.status === 'no_agent' ? 'No Agent'
    : 'Unreachable'

  const statusVariant: 'active' | 'idle' | 'error' = health?.status === 'healthy' ? 'active'
    : health?.status === 'starting' ? 'idle'
    : 'error'

  return (
    <DashboardShell>
      <DashboardHeader
        title="Maintenance"
        icon={<Wrench className="h-5 w-5 text-zinc-500" />}
      />

      <DashboardContent className="space-y-px max-w-2xl">

        {/* Health Card */}
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1">Agent Health</p>
              {health?.instanceId && (
                <p className="text-[10px] text-zinc-600 font-mono">{health.instanceId}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="border border-zinc-700 hover:border-zinc-500 p-2 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {health && health.status !== 'no_agent' && (
                <StatusPill status={statusVariant} label={statusLabel} />
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Activity className="h-4 w-4 animate-pulse" /> Checking health…
            </div>
          ) : health?.status === 'no_agent' ? (
            <p className="text-xs text-zinc-500">No agent deployed yet. Deploy from the dashboard to get started.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Liveness
                </p>
                <div className="flex items-center gap-1.5">
                  {health?.healthy
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-sm">{health?.healthy ? 'Live' : 'Down'}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Readiness</p>
                <div className="flex items-center gap-1.5">
                  {health?.ready
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <Clock className="h-4 w-4 text-yellow-500" />}
                  <span className="text-sm">{health?.ready ? 'Ready' : 'Not ready'}</span>
                </div>
              </div>
              {health?.version && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Version</p>
                  <p className="text-sm font-mono">{health.version}</p>
                </div>
              )}
              {health?.uptime && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Uptime</p>
                  <p className="text-sm font-mono">{health.uptime}</p>
                </div>
              )}
            </div>
          )}

          {/* Run Maintenance button */}
          {health && health.status !== 'no_agent' && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runMaintenance}
                  disabled={restarting || resetting || !controlsEnabled}
                  className="bg-white text-black px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center gap-2"
                >
                  {restarting ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Restarting…</>
                  ) : (
                    <><Wrench className="h-3.5 w-3.5" /> Run Maintenance</>
                  )}
                </button>
                <button
                  onClick={factoryReset}
                  disabled={restarting || resetting || !controlsEnabled}
                  className="border border-red-800 text-red-400 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-red-900/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {resetting ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Resetting…</>
                  ) : (
                    <><AlertTriangle className="h-3.5 w-3.5" /> Factory Reset</>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 mt-3">
                <strong>Run Maintenance:</strong> Restarts agent, runs <span className="font-mono">openclaw doctor --fix</span> on startup.
              </p>
              <p className="text-[10px] text-zinc-600 mt-1">
                <strong>Factory Reset:</strong> Pins OpenClaw to the configured stable image, reconfigures env vars, and restarts. Use if your agent broke after an update.
              </p>
              {!controlsEnabled && (
                <div className="mt-3 border border-zinc-800 bg-zinc-900/70 p-3 text-[11px] text-zinc-400">
                  Managed maintenance actions are disabled until the Railway control path is fully verified. Health data above remains live.
                </div>
              )}
              <div className="pt-4 mt-4 border-t border-zinc-800">
                <button
                  onClick={deleteAgent}
                  disabled={restarting || resetting || deleting}
                  className="border border-red-900 text-red-600 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-red-950 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {deleting ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Deleting…</>
                  ) : (
                    <><AlertTriangle className="h-3.5 w-3.5" /> Delete Agent</>
                  )}
                </button>
                <p className="text-[10px] text-zinc-700 mt-2">
                  <strong>Delete Agent:</strong> Permanently removes the container and all data. Cannot be undone.
                </p>
              </div>
              {restartMsg && (
                <div className={`mt-3 border p-3 text-[11px] ${restartMsg.startsWith('Error') ? 'border-red-800 text-red-400' : 'border-green-900 text-green-400'}`}>
                  {restartMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Matrix Migration Guide */}
        <div className="border border-zinc-800 bg-zinc-950">
          <button
            onClick={() => setShowMatrix(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Matrix Migration Guide</span>
            </div>
            {showMatrix ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
          </button>

          {showMatrix && (
            <div className="px-6 pb-6 border-t border-zinc-800 pt-5 space-y-4">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                If your Matrix channel is not connecting after an OpenClaw update, the migration may need to complete. Click <strong>Run Maintenance</strong> above — it restarts the agent and automatically applies all Matrix migrations on startup.
              </p>
              <p className="text-[11px] text-zinc-500">If issues persist, run these commands manually in your container:</p>

              <div className="space-y-3">
                {MATRIX_STEPS.map((step, i) => (
                  <div key={i} className="border border-zinc-800 bg-black p-4">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <code className="text-xs text-green-400 font-mono">{step.cmd}</code>
                      <CopyButton text={step.cmd} />
                    </div>
                    <p className="text-[10px] text-zinc-500">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">If encrypted history is missing</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  If you have a Matrix recovery key, run:
                </p>
                <div className="mt-2 flex items-center justify-between border border-zinc-700 bg-black p-3">
                  <code className="text-xs text-green-400 font-mono">openclaw matrix verify backup restore --recovery-key &quot;&lt;your-recovery-key&gt;&quot;</code>
                  <CopyButton text='openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"' />
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">
                  To start fresh (losing unrecoverable old history): <code className="font-mono">openclaw matrix verify backup reset --yes</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Docker / Container Guide */}
        <div className="border border-zinc-800 bg-zinc-950">
          <button
            onClick={() => setShowDocker(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest">Container Health Checks</span>
            </div>
            {showDocker ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
          </button>

          {showDocker && (
            <div className="px-6 pb-6 border-t border-zinc-800 pt-5 space-y-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Your agent container exposes two health endpoints (no auth required):
              </p>
              <div className="space-y-2">
                {[
                  { path: '/healthz', label: 'Liveness — container is alive', color: 'text-green-400' },
                  { path: '/readyz', label: 'Readiness — container is accepting traffic', color: 'text-blue-400' },
                ].map(({ path, label, color }) => (
                  <div key={path} className="border border-zinc-800 bg-black p-3 flex items-center justify-between gap-3">
                    <div>
                      <code className={`text-xs font-mono ${color}`}>{path}</code>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
                    </div>
                    {health?.railwayUrl && (
                      <CopyButton text={`curl -fsS ${health.railwayUrl}${path}`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">
                If both checks pass but the agent still isn&apos;t responding, click <strong>Run Maintenance</strong> to restart and rerun doctor.
              </p>
            </div>
          )}
        </div>

      </DashboardContent>
    </DashboardShell>
  )
}
