'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/social/notifications')
      .then((r) => r.json())
      .then((data) => {
        const notifications = data.notifications ?? []
        const count = Array.isArray(notifications)
          ? notifications.filter((n: { readAt: string | null }) => !n.readAt).length
          : 0
        setUnreadCount(count)
      })
      .catch(() => {})
  }, [])

  return (
    <Link
      href="/social/notifications"
      className="relative text-zinc-400 hover:text-white transition-colors"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-label="Notifications"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
