'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sendLiveSignal } from '@/lib/agentbot/signals'

const PRESET_SIGNALS = [
  'focus_research',
  'boost_output',
  'request_summary',
  'enter_silent_mode',
  'increase_urgency',
]

export default function LiveRoomPage({
  params,
}: {
  params: { roomId: string }
}) {
  const { roomId } = params
  const [signal, setSignal] = useState('')
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [events, setEvents] = useState<Array<{ time: string; text: string }>>([])

  // Poll colony status for live events
  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const res = await fetch('/api/colony/status?action=tree')
        if (!res.ok || !active) return
        const tree = await res.json()
        if (tree.root?.soul?.active_plan) {
          const plan = tree.root.soul.active_plan
          setEvents((prev) => [
            {
              time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              text: `Plan step ${plan.current_step}/${plan.total_steps} — ${plan.status}`,
            },
            ...prev.slice(0, 19),
          ])
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 15000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  async function handleSend(sig: string) {
    setSending(true)
    try {
      await sendLiveSignal(roomId, sig)
      setLastSent(sig)
      setEvents((prev) => [
        { time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: `Signal sent: ${sig}` },
        ...prev.slice(0, 19),
      ])
      setSignal('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
            <Link href="/colony" className="hover:text-zinc-400 transition-colors">Colony</Link>
            <span>/</span>
            <span className="text-zinc-500">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
            <span className="text-[10px] uppercase tracking-widest text-amber-500 font-mono">Live</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold uppercase tracking-tighter text-white mb-1">
          Colony Room — {roomId}
        </h1>
        <p className="text-xs text-zinc-600 font-mono mb-8 uppercase tracking-widest">
          Watch the colony operate. Send signals to influence behaviour.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Event feed */}
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 font-mono">Live events</h2>
            {events.length === 0 ? (
              <p className="text-xs text-zinc-700 font-mono">Waiting for colony activity…</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[10px] font-mono text-zinc-700 shrink-0">{e.time}</span>
                    <span className="text-xs text-zinc-400">{e.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signal panel */}
          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 font-mono">Send signal</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_SIGNALS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={sending}
                  className="border border-zinc-800 text-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest font-mono hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={signal}
                onChange={(e) => setSignal(e.target.value)}
                placeholder="custom signal…"
                className="flex-1 bg-black border border-zinc-800 text-white text-xs font-mono px-3 py-2 placeholder-zinc-700 focus:outline-none focus:border-amber-600"
                onKeyDown={(e) => { if (e.key === 'Enter' && signal.trim()) handleSend(signal.trim()) }}
              />
              <button
                onClick={() => signal.trim() && handleSend(signal.trim())}
                disabled={sending || !signal.trim()}
                className="border border-zinc-700 text-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-40"
              >
                {sending ? '…' : 'Send'}
              </button>
            </div>

            {lastSent && (
              <p className="text-[10px] font-mono text-zinc-600 mt-3">
                Last signal: <span className="text-zinc-400">{lastSent}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/colony/friday-alpha"
            className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors font-mono"
          >
            ← Colony dashboard
          </Link>
          <Link
            href="/dreams"
            className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors font-mono"
          >
            Agent dreams →
          </Link>
        </div>

      </div>
    </div>
  )
}
