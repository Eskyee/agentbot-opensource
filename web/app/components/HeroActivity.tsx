'use client'

import { useState, useEffect } from 'react'

const activities = [
  { channel: 'telegram', action: 'Found 3 urgent messages in your group', time: '2s ago' },
  { channel: 'whatsapp', action: 'Replied to a customer asking about the event', time: '14s ago' },
  { channel: 'discord', action: 'Posted your daily update in #announcements', time: '28s ago' },
  { channel: 'email', action: 'Drafted a reply to the venue about Saturday', time: '1m ago' },
  { channel: 'telegram', action: 'Sent you a summary of overnight messages', time: '2m ago' },
  { channel: 'whatsapp', action: 'Reminded your team about the deadline in 2 hours', time: '3m ago' },
  { channel: 'discord', action: 'Removed spam from #general', time: '4m ago' },
  { channel: 'agent', action: 'Finished your morning briefing — 4 things need attention', time: '5m ago' },
]

const channelColors: Record<string, string> = {
  telegram: 'text-blue-400',
  discord: 'text-orange-400',
  whatsapp: 'text-green-400',
  email: 'text-yellow-400',
  agent: 'text-orange-400',
}

export function HeroActivity() {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(v => (v < activities.length ? v + 1 : v))
    }, 800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mt-10 border border-zinc-800 bg-zinc-950 p-4 sm:p-5 max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-green-500 status-breathe" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">Live — your agent is working</span>
      </div>
      <div className="space-y-1 font-mono text-xs">
        {activities.slice(0, visible).map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-1.5 opacity-0"
            style={{ animation: `fade-in-stagger 0.4s ease-out ${i * 0.08}s both` }}
          >
            <span className={`w-14 shrink-0 text-right ${channelColors[a.channel]}`}>
              {a.channel}
            </span>
            <span className="text-zinc-500">→</span>
            <span className="text-zinc-300 truncate flex-1">{a.action}</span>
            <span className="text-zinc-600 shrink-0 text-[10px]">{a.time}</span>
          </div>
        ))}
      </div>
      {visible >= activities.length && (
        <div className="mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
          Your agent never stops.
        </div>
      )}
    </div>
  )
}
