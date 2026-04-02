/**
 * Dashboard Sidebar — Shared Navigation Component
 * 
 * Used across all dashboard pages. Consistent sections, icons, and active state.
 */

'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '◈' },
      { label: 'Wallet', href: '/dashboard/wallet', icon: '◎' },
    ]
  },
  {
    label: 'Agents',
    items: [
      { label: 'Team', href: '/dashboard/team', icon: '⬢' },
      { label: 'Fleet', href: '/dashboard/fleet', icon: '⬡' },
      { label: 'Colony', href: '/dashboard/colony', icon: '◆' },
    ]
  },
  {
    label: 'Platform',
    items: [
      { label: 'X402 Gateway', href: '/dashboard/x402', icon: '⟡' },
      { label: 'Borg Soul', href: 'https://borg-0-production.up.railway.app/dashboard', icon: '⬢', external: true },
    ]
  },
  {
    label: 'Account',
    items: [
      { label: 'Billing', href: '/billing', icon: '☆' },
      { label: 'Settings', href: '/settings', icon: '⚙' },
      { label: 'Marketplace', href: '/marketplace', icon: '⬡' },
    ]
  },
]

// Flat list for breadcrumb lookups
export const allNavItems = navSections.flatMap(s => s.items)

interface DashboardSidebarProps {
  userName?: string
  credits?: number
  plan?: string
  isOpen: boolean
  onToggle: () => void
}

export const DashboardSidebar = memo(function DashboardSidebar({ userName, credits = 0, plan, isOpen, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [openclawUrl, setOpenclawUrl] = useState<string | null>(null)
  const [openclawLink, setOpenclawLink] = useState<string | null>(null)

  useEffect(() => {
    // Use localStorage as a fast first paint, but always refresh from DB
    // so stale shared-gateway URLs do not linger in the user dashboard.
    try {
      const stored = localStorage.getItem('agentbot_instance')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.url) {
          const normalizedUrl = String(data.url).replace(/\/$/, '')
          setOpenclawUrl(normalizedUrl)
          setOpenclawLink(normalizedUrl)
        }
      }
    } catch {}

    fetch('/api/user/openclaw')
      .then(r => r.json())
      .then(data => {
        if (data.openclawUrl) {
          const normalizedUrl = String(data.openclawUrl).replace(/\/$/, '')
          const gatewayToken = data.gatewayToken ? String(data.gatewayToken) : ''
          const autoPairUrl = gatewayToken
            ? `${normalizedUrl}/chat?session=main#token=${encodeURIComponent(gatewayToken)}&gatewayUrl=${encodeURIComponent(`wss://${new URL(normalizedUrl).host}`)}`
            : normalizedUrl
          setOpenclawUrl(normalizedUrl)
          setOpenclawLink(autoPairUrl)
          localStorage.setItem('agentbot_instance', JSON.stringify({
            userId: data.openclawInstanceId,
            url: normalizedUrl,
          }))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col font-mono
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <button
          onClick={onToggle}
          className="md:hidden absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <nav className="flex-1 overflow-y-auto pt-16 md:pt-4 pb-4">
          {navSections.map((section, i) => (
            <div key={section.label} className={i > 0 ? 'mt-4' : ''}>
              <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-700 pl-10 pr-4 mb-1.5">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isExternal = 'external' in item && item.external
                  const isActive = !isExternal && (pathname === item.href || pathname.startsWith(item.href + '/'))
                  const cls = `flex items-center gap-2 px-4 py-2 text-xs transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                  }`
                  if (isExternal) {
                    return (
                      <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                        <span className="text-[10px] w-4 text-center opacity-60">{item.icon}</span>
                        <span>{item.label}</span>
                        <span className="text-[8px] text-zinc-700 ml-auto">↗</span>
                      </a>
                    )
                  }
                  return (
                    <Link key={item.label} href={item.href} onClick={onToggle} className={cls}>
                      <span className="text-[10px] w-4 text-center opacity-60">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* OpenClaw Dashboard Link */}
          {openclawUrl ? (
            <a
              href={openclawLink || openclawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mx-4 mt-6 border border-blue-500/30 bg-blue-500/5 p-4 hover:border-blue-500/50 transition-colors"
            >
              <div className="text-[10px] uppercase tracking-widest text-blue-500 mb-1">OpenClaw</div>
              <div className="text-sm font-bold flex items-center gap-2">
                Open Your Agent <span className="text-[10px] text-blue-500/60">↗</span>
              </div>
            </a>
          ) : (
            <a
              href="/onboard?mode=deploy"
              className="block mx-4 mt-6 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">OpenClaw</div>
              <div className="text-sm font-bold text-zinc-500">Deploy Now</div>
            </a>
          )}

          <Link href="/billing" onClick={onToggle} className="block mx-4 mt-4 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Your Plan</div>
            <div className="text-xl font-bold capitalize">{plan || 'Solo'}</div>
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white">
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm">{userName || 'User'}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">
                {credits > 0 ? `${credits} credits` : 'Agent'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const { customSignOut } = require('@/app/lib/useCustomSession')
              customSignOut()
            }}
            className="w-full flex items-center justify-center gap-2 border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
})
