'use client'

import { useState, useEffect } from 'react'

interface ByokTabProps {
  agents: { id: string; name: string; status: string }[]
}

export function ByokTab({ agents }: ByokTabProps) {
  const [status, setStatus] = useState<{ byokEnabled: boolean; hasKey: boolean } | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/user/byok')
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus({ byokEnabled: false, hasKey: false })
    }
  }

  const registerKey = async () => {
    if (!apiKey.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/user/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('✅ ' + data.message)
        setApiKey('')
        fetchStatus()
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch {
      setMessage('❌ Failed to register key')
    }
    setLoading(false)
  }

  const removeKey = async () => {
    if (!confirm('Remove your MiMo API key? Revert to platform-managed keys?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/user/byok', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setMessage('✅ ' + data.message)
        fetchStatus()
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch {
      setMessage('❌ Failed to remove key')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-xl font-semibold mb-2">Bring Your Own Key (BYOK)</h2>
        <p className="text-zinc-400 text-sm">
          Connect your own Xiaomi MiMo subscription for zero-cost inference. Your requests
          use your subscription directly — no platform credits consumed.
        </p>
      </div>

      {/* Status Card */}
      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">MiMo Subscription Status</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {status?.byokEnabled
                ? '✅ Your MiMo key is active — requests use your subscription'
                : '○ Using platform-managed keys'}
            </p>
          </div>
          <div
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
              status?.byokEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {status?.byokEnabled ? 'ACTIVE' : 'PLATFORM'}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-medium">MiMo API Key</h3>
        <p className="text-xs text-zinc-500">
          Get your key from{' '}
          <a
            href="https://mimo.xiaomi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline hover:text-zinc-300"
          >
            mimo.xiaomi.com
          </a>
          . Supports the Max Monthly Plan (82B credits, all models).
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="tp-ebz5le..."
            className="flex-1 bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/30"
          />
          <button
            onClick={registerKey}
            disabled={loading || !apiKey.trim()}
            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Register'}
          </button>
        </div>
        {status?.byokEnabled && (
          <button
            onClick={removeKey}
            disabled={loading}
            className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest"
          >
            Remove Key & Revert to Platform
          </button>
        )}
      </div>

      {/* Models Info */}
      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h3 className="text-sm font-medium mb-3">Available Models (MiMo Subscription)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'mimo-v2.5-pro', desc: 'Best reasoning, 1M context' },
            { id: 'mimo-v2.5', desc: 'Multimodal (images + text), 256K context' },
          ].map((m) => (
            <div key={m.id} className="flex items-center gap-2 p-2 bg-zinc-800/50 border border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">○</span>
              <div>
                <span className="text-xs font-mono">{m.id}</span>
                <span className="text-[10px] text-zinc-500 ml-2">{m.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-3">
          82B credits/month • 20% off 9AM–5PM PDT • TTS models free
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="text-sm p-3 border border-zinc-800 bg-zinc-900/50">{message}</div>
      )}
    </div>
  )
}
