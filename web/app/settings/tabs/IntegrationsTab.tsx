'use client'

import { useEffect, useState } from 'react'

interface XStatus {
  app: {
    bearerTokenConfigured: boolean
    oauthClientConfigured: boolean
    appKeyConfigured: boolean
    callbackUrl: string | null
  }
  user: {
    connected: boolean
    account: {
      username: string | null
      accountId: string | null
      scopes: string[] | null
    } | null
  }
}

function Pill({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
        on ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'
      }`}
    >
      {label}: {on ? 'ok' : 'missing'}
    </span>
  )
}

export function IntegrationsTab() {
  const [status, setStatus] = useState<XStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  async function refresh() {
    try {
      const res = await fetch('/api/x/status', { cache: 'no-store' })
      if (res.ok) setStatus(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const params = new URLSearchParams(window.location.search)
    if (params.get('x_connected')) {
      setFlash({ kind: 'ok', msg: 'X account connected.' })
    } else if (params.get('x_error')) {
      setFlash({ kind: 'err', msg: `X connection failed: ${params.get('x_error')}` })
    }
  }, [])

  async function disconnect() {
    if (!confirm('Disconnect this X account? You can reconnect anytime.')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/x/oauth/disconnect', { method: 'POST' })
      if (res.ok) {
        setFlash({ kind: 'ok', msg: 'X account disconnected.' })
        await refresh()
      } else {
        setFlash({ kind: 'err', msg: 'Disconnect failed.' })
      }
    } finally {
      setDisconnecting(false)
    }
  }

  const appReady = status?.app.oauthClientConfigured && Boolean(status?.app.callbackUrl)
  const connected = status?.user.connected

  return (
    <div className="space-y-6">
      <div className="border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-tight mb-1">X (Twitter)</h2>
            <p className="text-[11px] text-zinc-500">
              Connect your X account so Signals can read mentions, draft posts, and publish on your behalf.
            </p>
          </div>
          {connected && (
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 border border-emerald-500/30 text-emerald-400">
              Connected
            </span>
          )}
        </div>

        {flash && (
          <div
            className={`mb-4 text-[11px] px-3 py-2 border ${
              flash.kind === 'ok'
                ? 'border-emerald-500/30 text-emerald-400'
                : 'border-red-500/30 text-red-400'
            }`}
          >
            {flash.msg}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <Pill label="OAuth Client" on={Boolean(status?.app.oauthClientConfigured)} />
          <Pill label="App Key" on={Boolean(status?.app.appKeyConfigured)} />
          <Pill label="Bearer Token" on={Boolean(status?.app.bearerTokenConfigured)} />
          <Pill label="Callback URL" on={Boolean(status?.app.callbackUrl)} />
        </div>

        {loading ? (
          <div className="text-[11px] text-zinc-500">Loading…</div>
        ) : connected ? (
          <div className="space-y-3">
            <div className="text-[11px] text-zinc-400">
              Connected as{' '}
              <span className="text-white font-mono">
                @{status?.user.account?.username || 'unknown'}
              </span>
            </div>
            {status?.user.account?.scopes && status.user.account.scopes.length > 0 && (
              <div className="text-[10px] text-zinc-500 font-mono">
                scopes: {status.user.account.scopes.join(' ')}
              </div>
            )}
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="text-[10px] uppercase tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2 disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect X'}
            </button>
          </div>
        ) : appReady ? (
          <a
            href="/api/x/oauth/start"
            className="inline-block text-[10px] uppercase tracking-widest bg-white text-black px-4 py-2 font-bold hover:bg-zinc-200"
          >
            Connect X
          </a>
        ) : (
          <div className="text-[11px] text-amber-400">
            X OAuth is not fully configured on the server. Ask an admin to set
            <span className="font-mono"> X_API_CLIENT_ID</span>,
            <span className="font-mono"> X_API_CLIENT_SECRET</span>, and
            <span className="font-mono"> X_API_CALLBACK_URL</span>.
          </div>
        )}
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="text-sm font-bold uppercase tracking-tight mb-1">More integrations</h2>
        <p className="text-[11px] text-zinc-500">
          Bankr, Notion, Slack, and GitHub bot tokens are configured per-agent from each agent&apos;s OpenClaw
          runtime. Visit an agent&apos;s page to manage those.
        </p>
      </div>
    </div>
  )
}
