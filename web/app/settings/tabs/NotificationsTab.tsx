'use client'

import { useState } from 'react'

interface NotificationsTabProps {
  initialNotifications: {
    email: boolean
    usageAlerts: boolean
    productUpdates: boolean
    marketing: boolean
  }
}

export function NotificationsTab({ initialNotifications }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const toggleNotification = async (key: string) => {
    const newValue = !notifications[key as keyof typeof notifications]
    setNotifications({ ...notifications, [key]: newValue })

    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: { ...notifications, [key]: newValue } }),
      })
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      setNotifications({ ...notifications, [key]: !newValue })
    }
  }

  const items = [
    { key: 'email', label: 'Email notifications', desc: 'Receive email updates about your agents' },
    { key: 'usageAlerts', label: 'Usage alerts', desc: 'Get notified when credits are low' },
    { key: 'productUpdates', label: 'Product updates', desc: 'News about new features' },
    { key: 'marketing', label: 'Marketing emails', desc: 'Tips and promotions' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-base sm:text-xl font-semibold">Notifications</h2>

      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-sm text-zinc-400">{item.desc}</div>
            </div>
            <button
              onClick={() => toggleNotification(item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications[item.key as keyof typeof notifications] ? 'bg-white' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                  notifications[item.key as keyof typeof notifications] ? 'translate-x-6 bg-black' : 'translate-x-0.5 bg-white'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
