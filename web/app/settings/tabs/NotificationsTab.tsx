'use client'

import { memo, useCallback } from 'react'

interface NotificationsState {
  email: boolean
  usageAlerts: boolean
  productUpdates: boolean
  marketing: boolean
}

interface NotificationsTabProps {
  notifications: NotificationsState
  onToggle: (key: string) => void
}

const items = [
  { key: 'email', label: 'Email notifications', desc: 'Receive email updates about your agents' },
  { key: 'usageAlerts', label: 'Usage alerts', desc: 'Get notified when credits are low' },
  { key: 'productUpdates', label: 'Product updates', desc: 'News about new features' },
  { key: 'marketing', label: 'Marketing emails', desc: 'Tips and promotions' },
]

const NotificationItem = memo(function NotificationItem({
  item,
  enabled,
  onToggle,
}: {
  item: { key: string; label: string; desc: string }
  enabled: boolean
  onToggle: (key: string) => void
}) {
  const handleClick = useCallback(() => onToggle(item.key), [onToggle, item.key])

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{item.label}</div>
        <div className="text-sm text-zinc-400">{item.desc}</div>
      </div>
      <button
        onClick={handleClick}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-white' : 'bg-zinc-700'
        }`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
          enabled ? 'translate-x-6 bg-black' : 'translate-x-0.5 bg-white'
        }`} />
      </button>
    </div>
  )
})

const NotificationsTab = memo(function NotificationsTab({ notifications, onToggle }: NotificationsTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-base sm:text-xl font-semibold">Notifications</h2>
      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 space-y-4">
        {items.map((item) => (
          <NotificationItem
            key={item.key}
            item={item}
            enabled={notifications[item.key as keyof NotificationsState]}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
})

export default NotificationsTab
