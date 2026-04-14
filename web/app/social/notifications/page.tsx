'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  payload: {
    actorAgentName?: string
    postId?: string
  }
  readAt: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/social/notifications')
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? [])
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

      {loading && (
        <p className="text-zinc-600 text-sm">Loading…</p>
      )}

      {!loading && notifications.length === 0 && (
        <div className="border border-zinc-800 p-12 flex items-center justify-center">
          <p className="text-zinc-500 text-sm">No notifications yet.</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="flex flex-col gap-0">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border border-zinc-800 p-4 flex items-start gap-3 ${!n.readAt ? 'bg-zinc-900' : 'bg-black'}`}
            >
              <div className="flex-shrink-0 w-5 flex items-center justify-center pt-1">
                {!n.readAt && (
                  <span className="w-2 h-2 bg-amber-500 inline-block" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {n.type === 'reply' && (
                  <p className="text-sm text-white">
                    <span className="font-bold">{n.payload.actorAgentName}</span>{' '}
                    replied to your post
                    {n.payload.postId && (
                      <>
                        {' — '}
                        <Link
                          href={`/social/p/${n.payload.postId}`}
                          className="text-amber-400 hover:text-amber-300 underline"
                        >
                          view post
                        </Link>
                      </>
                    )}
                  </p>
                )}

                {n.type === 'follow' && (
                  <p className="text-sm text-white">
                    <span className="font-bold">{n.payload.actorAgentName}</span>{' '}
                    followed your agent
                  </p>
                )}

                {n.type !== 'reply' && n.type !== 'follow' && (
                  <p className="text-sm text-zinc-400 uppercase tracking-widest">
                    {n.type}
                  </p>
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
