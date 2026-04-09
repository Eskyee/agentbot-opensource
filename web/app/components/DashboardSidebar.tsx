/**
 * Dashboard Sidebar — Shared Navigation Component
 * 
 * Used across all dashboard pages. Consistent sections, icons, and active state.
 */

'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buildOpenClawControlUrl } from '@/app/lib/openclaw-control'
import { customSignOut } from '@/app/lib/useCustomSession'

export const navSections = [
  {
    label: 'Runtime',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '◈' },
      { label: 'Skills', href: '/dashboard/skills', icon: '✳' },
      { label: 'Maintenance', href: '/dashboard/maintenance', icon: '✦' },
      { label: 'Wallet', href: '/dashboard/wallet', icon: '◎' },
      { label: 'Bitcoin', href: '/dashboard/bitcoin', icon: '₿' },
      { label: 'Solana', href: '/dashboard/solana', icon: '◎' },
      { label: 'Buddies', href: '/buddies', icon: '🐚' },
      { label: 'Dreams', href: '/dashboard/dreams', icon: '☾' },
      { label: 'Character QA', href: '/dashboard/character-qa', icon: '♫' },
      { label: 'Devices', href: '/dashboard/devices', icon: '▪' },
      { label: 'Git City', href: '/dashboard/git-city', icon: '⌂' },
      { label: 'Gitlawb Network', href: '/dashboard/gitlawb-network', icon: '◉' },
      { label: 'Jobs', href: '/jobs', icon: '◈' },
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
    label: 'Operations',
    items: [
      { label: 'ClawMerchants', href: '/dashboard/market-intel', icon: '◭' },
      { label: 'Metrics', href: '/dashboard/analytics', icon: '▣' },
      { label: 'System Pulse', href: '/dashboard/system-pulse', icon: '◌' },
      { label: 'Daily Brief', href: '/dashboard/daily-brief', icon: '☼' },
      { label: 'Workflows', href: '/dashboard/workflows', icon: '⇄' },
      { label: 'Support', href: '/dashboard/support', icon: '☰' },
      { label: 'X402 Gateway', href: '/dashboard/x402', icon: '⟡' },
      { label: 'Borg Soul', href: '/dashboard/borg', icon: '⬢' },
    ]
  },
  {
    label: 'Account',
    items: [
      { label: 'Billing', href: '/billing', icon: '☆' },
      { label: 'Bankr', href: '/dashboard/trading', icon: '◈' },
      { label: 'Settings', href: '/settings', icon: '⚙' },
      { label: 'Showcase', href: '/showcase', icon: '✧' },
    ]
  },
]

// Flat list for breadcrumb lookups
export const allNavItems = navSections.flatMap(s => s.items)

interface DashboardSidebarProps {
  userName?: string
  credits?: number
  plan?: string
  runtimeUrl?: string | null
  runtimeGatewayToken?: string | null
  runtimeInstanceId?: string | null
  isOpen: boolean
  onToggle: () => void
}

export const DashboardSidebar = memo(function DashboardSidebar({
  userName,
  credits = 0,
  plan,
  runtimeUrl,
  runtimeGatewayToken,
  runtimeInstanceId,
  isOpen,
  onToggle,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [openclawUrl, setOpenclawUrl] = useState<string | null>(null)
  const [gatewayToken, setGatewayToken] = useState<string | null>(null)

  useEffect(() => {
    if (runtimeUrl) {
      const normalizedUrl = String(runtimeUrl).replace(/\/$/, '')
      setOpenclawUrl(normalizedUrl)
      setGatewayToken(runtimeGatewayToken || null)
      localStorage.setItem('agentbot_instance', JSON.stringify({
        userId: runtimeInstanceId,
        url: normalizedUrl,
      }))
      return
    }

    // Use localStorage as a fast first paint, but always refresh from DB
    // so stale shared-gateway URLs do not linger in the user dashboard.
    try {
      const stored = localStorage.getItem('agentbot_instance')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.url) {
          const normalizedUrl = String(data.url).replace(/\/$/, '')
          setOpenclawUrl(normalizedUrl)
        }
      }
    } catch {}

    fetch('/api/user/openclaw')
      .then(r => r.json())
      .then(data => {
        if (data.openclawUrl) {
          const normalizedUrl = String(data.openclawUrl).replace(/\/$/, '')
          const nextGatewayToken = data.gatewayToken ? String(data.gatewayToken) : ''
          setOpenclawUrl(normalizedUrl)
          setGatewayToken(nextGatewayToken || null)
          localStorage.setItem('agentbot_instance', JSON.stringify({
            userId: data.openclawInstanceId,
            url: normalizedUrl,
          }))
        }
      })
      .catch(() => {})
  }, [runtimeGatewayToken, runtimeInstanceId, runtimeUrl])

  const runtimeStatus = openclawUrl ? (gatewayToken ? 'paired' : 'live') : 'undeployed'
  const runtimeTone = runtimeStatus === 'paired'
    ? 'text-green-400'
    : runtimeStatus === 'live'
      ? 'text-yellow-400'
      : 'text-zinc-500'
  const runtimeDot = runtimeStatus === 'paired'
    ? 'bg-green-400'
    : runtimeStatus === 'live'
      ? 'bg-yellow-400'
      : 'bg-zinc-700'
  let runtimeHost: string | null = null
  try { if (openclawUrl) runtimeHost = new URL(openclawUrl).host } catch {}
  const openclawConfigUrl = openclawUrl
    ? buildOpenClawControlUrl({ view: 'config', gatewayUrl: openclawUrl, gatewayToken })
    : null
  const openclawChatUrl = openclawUrl
    ? buildOpenClawControlUrl({ view: 'chat', gatewayUrl: openclawUrl, gatewayToken, session: 'main' })
    : null
  const openclawSkillsUrl = openclawUrl
    ? buildOpenClawControlUrl({ view: 'skills', gatewayUrl: openclawUrl, gatewayToken })
    : null

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
          <div className="mx-4 mb-5 border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">OpenClaw Runtime</div>
                <div className={`mt-1 text-xs font-bold uppercase tracking-widest ${runtimeTone}`}>
                  {runtimeStatus}
                </div>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${runtimeDot}`} />
            </div>
            <div className="mt-3 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-zinc-700">Plan</div>
              <div className="text-sm font-bold capitalize text-white">{plan || 'Solo'}</div>
              <div className="text-[10px] font-mono text-zinc-500 break-all">
                {runtimeHost || 'No agent deployed yet'}
              </div>
            </div>
          </div>

          <div className="mx-4 mb-5">
            {openclawUrl ? (
              <div className="space-y-1.5">
                {[
                  { label: 'Open Chat', href: openclawChatUrl, icon: '↗' },
                  { label: 'Open Skills', href: openclawSkillsUrl, icon: '↗' },
                  { label: 'Open Config', href: openclawConfigUrl, icon: '↗' },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href || openclawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-300 hover:border-blue-500/50 hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-blue-400/70">{item.icon}</span>
                  </a>
                ))}
              </div>
            ) : (
              <a
                href="/onboard?mode=deploy"
                className="block border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">OpenClaw</div>
                <div className="text-sm font-bold text-zinc-500">Deploy Now</div>
              </a>
            )}
          </div>

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
            onClick={() => customSignOut()}
            className="w-full flex items-center justify-center gap-2 border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
})
