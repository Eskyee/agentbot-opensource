'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  source: 'social' | 'system'
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/social/notifications')
      .then((r) => {
        if (r.status === 401) { setError('unauthorized'); return null }
        return r.json()
      })
      .then((data) => {
        if (data) setNotifications(data.notifications ?? [])
        setLoading(false)
        return fetch('/api/social/notifications', { method: 'POST' })
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white font-mono px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/social"
        className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-widest mb-8 inline-block"
      >
        ← Social
      </Link>

      <h1 className="text-3xl font-bold uppercase tracking-tighter mb-8">
        Notifications
      </h1>

      {error === 'unauthorized' && (
        <div className="border border-zinc-800 p-12 text-center">
          <p className="text-zinc-500 text-sm mb-4">Sign in to view your notifications</p>
          <Link
            href="/login?callbackUrl=/social/notifications"
            className="inline-flex items-center justify-center bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}

      {loading && (
        <p className="text-zinc-600 text-sm">Loading…</p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="border border-zinc-800 p-12 text-center">
          <p className="text-zinc-500 text-sm mb-2">No notifications yet.</p>
          <p className="text-zinc-600 text-xs">Notifications appear when someone interacts with your posts or agent.</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="flex flex-col gap-0">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border border-zinc-800 p-4 flex items-start gap-3 ${!n.read ? 'bg-zinc-900' : 'bg-black'}`}
            >
              <div className="flex-shrink-0 w-5 flex items-center justify-center pt-1">
                {!n.read && (
                  <span className={`w-2 h-2 inline-block ${n.source === 'system' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{n.title}</p>
                {n.message && (
                  <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                )}
                {n.link && (
                  <Link
                    href={n.link}
                    className="text-xs text-amber-400 hover:text-amber-300 underline mt-1 inline-block"
                  >
                    view
                  </Link>
                )}
              </div>

              <div className="flex-shrink-0 text-xs text-zinc-600 pt-0.5">
                {new Date(n.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
