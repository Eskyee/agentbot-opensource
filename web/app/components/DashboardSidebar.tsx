/**
 * Dashboard Sidebar — Shared Navigation Component
 *
 * Used across all dashboard pages. Consistent sections, icons, and active state.
 * Sections are collapsible (state persisted in localStorage).
 * Links use prefetch={false} to avoid eager-prefetching 35+ routes.
 */

'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buildOpenClawControlUrl } from '@/app/lib/openclaw-control'
import { customSignOut } from '@/app/lib/useCustomSession'

// Operator Mode nav — additive only, shown when feature flag is on
export const operatorNavSection = {
  label: 'Start Here',
  items: [
    { label: 'Get Started',  href: '/app/start',     icon: '▶' },
    { label: 'Activity',     href: '/app/activity',   icon: '◉' },
    { label: 'Templates',    href: '/app/templates',  icon: '◫' },
    { label: 'Learn',        href: '/app/tutorials',  icon: '?' },
    { label: 'Advanced',     href: '/app/advanced',   icon: '◈' },
  ],
}

export const navSections = [
  // PRIMARY: Core agent management — the "one good idea"
  {
    label: 'Agents',
    items: [
      { label: 'Dashboard',    href: '/dashboard',              icon: '◈' },
      { label: 'Team',         href: '/dashboard/team',         icon: '⬢' },
      { label: 'Fleet',        href: '/dashboard/fleet',        icon: '⬡' },
      { label: 'Colony',       href: '/dashboard/colony',       icon: '◆' },
      { label: 'Skills',       href: '/dashboard/skills',       icon: '✳' },
      { label: 'Borg Soul',    href: '/dashboard/borg',         icon: '◭' },
    ],
  },
  {
    label: 'Runtime',
    items: [
      { label: 'Verify Agent', href: '/dashboard/verify',       icon: '🛡' },
      { label: 'Maintenance',  href: '/dashboard/maintenance',  icon: '✦' },
      { label: 'Wallet',       href: '/dashboard/wallet',       icon: '◎' },
      { label: 'Workflows',    href: '/dashboard/workflows',    icon: '⊞' },
      { label: 'Daily Brief',  href: '/dashboard/daily-brief',  icon: '⇄' },
    ],
  },
  // SECONDARY: Chain, network, operations — power-user features
  {
    label: 'Chain',
    items: [
      { label: 'Bitcoin',      href: '/dashboard/bitcoin',     icon: '₿' },
      { label: 'Solana',       href: '/dashboard/solana',      icon: '◑' },
      { label: 'X402 Gateway', href: '/dashboard/x402',        icon: '⟡' },
      { label: 'Tempo DEX',    href: '/dashboard/tempo-dex',   icon: '💱' },
      { label: 'Bankr',        href: '/dashboard/trading',     icon: '◇' },
    ],
  },
  {
    label: 'Network',
    items: [
      { label: 'Community',        href: '/dashboard/community',          icon: '✦' },
      { label: 'Buddies',          href: '/buddies',                      icon: '🐚' },
      { label: 'Dreams',           href: '/dashboard/dreams',             icon: '☾' },
      { label: 'Character QA',     href: '/dashboard/character-qa',       icon: '♫' },
      { label: 'Git City',         href: '/dashboard/git-city',           icon: '⌂' },
      { label: 'Gitlawb Network',  href: '/dashboard/gitlawb-network',    icon: '◉' },
      { label: 'DJ Stream',        href: '/dashboard/dj-stream',          icon: '⏵' },
      { label: 'Mix Uploads',      href: '/dashboard/mixtape',            icon: '⏶' },
      { label: 'Jobs',             href: '/jobs',                         icon: '◈' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Signals',       href: '/dashboard/signals',       icon: '⌁' },
      { label: 'ClawMerchants', href: '/dashboard/market-intel',  icon: '▣' },
      { label: 'Metrics',       href: '/dashboard/analytics',     icon: '◌' },
      { label: 'Usage & Spend', href: '/dashboard/cost',          icon: '⬡' },
      { label: 'System Pulse',  href: '/dashboard/system-pulse',  icon: '☼' },
      { label: 'Devices',       href: '/dashboard/devices',       icon: '▪' },
      { label: 'Browser',       href: '/dashboard/browser',       icon: '🌐' },
      { label: 'Sandbox',       href: '/dashboard/sandbox',       icon: '🖥' },
      { label: 'Support',       href: '/dashboard/support',       icon: '☰' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Billing',   href: '/billing',             icon: '☆' },
      { label: 'Domains',   href: '/dashboard/domains',   icon: '🌍' },
      { label: 'Guide',     href: '/guide',               icon: '?' },
      { label: 'Feedback',  href: '/dashboard/feedback',  icon: '💬' },
      { label: 'Settings',  href: '/settings',            icon: '⚙' },
      { label: 'Showcase',  href: '/showcase',            icon: '✧' },
    ],
  },
]

// Flat list for breadcrumb lookups
export const allNavItems = navSections.flatMap(s => s.items)

const COLLAPSED_KEY = 'agentbot_sidebar_collapsed'

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
  // Start fully expanded (safe for SSR), hydrate from localStorage in effect
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  // Operator mode flag — fetched client-side so SSR doesn't break
  const [operatorEnabled, setOperatorEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/operator/mode')
      .then(r => r.json())
      .then(data => { if (data.operatorEnabled) setOperatorEnabled(true) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY)
      if (stored) {
        setCollapsed(JSON.parse(stored))
        return
      }

      if (window.innerWidth < 768) {
        const next = Object.fromEntries(
          navSections.map((section) => [
            section.label,
            !section.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/')),
          ])
        )
        try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)) } catch {}
        setCollapsed(next)
      }
    } catch {}
  }, [pathname])

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

    try {
      const stored = localStorage.getItem('agentbot_instance')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.url) setOpenclawUrl(String(data.url).replace(/\/$/, ''))
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

  const toggleSection = useCallback((label: string) => {
    setCollapsed((prev: Record<string, boolean>) => {
      const next = { ...prev, [label]: !prev[label] }
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

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
          {/* Runtime status card */}
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

          {/* Quick-access runtime links */}
          <div className="mx-4 mb-5">
            {openclawUrl ? (
              <div className="space-y-1.5">
                {[
                  { label: 'Open Chat',   href: openclawChatUrl },
                  { label: 'Open Skills', href: openclawSkillsUrl },
                  { label: 'Open Config', href: openclawConfigUrl },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href || openclawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-300 hover:border-blue-500/50 hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-blue-400/70">↗</span>
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

          {/* Operator Mode nav — additive, shown when feature flag is on */}
          {operatorEnabled && (() => {
            const operatorHasActive = operatorNavSection.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + '/')
            )
            // Never collapse the section containing the current page
            const isOperatorCollapsed = !operatorHasActive && !!collapsed[operatorNavSection.label]
            return (
            <div className="mb-3">
              <button
                onClick={() => toggleSection(operatorNavSection.label)}
                className="w-full flex items-center justify-between pl-4 pr-4 py-1 group"
                aria-expanded={!isOperatorCollapsed}
              >
                <span className="text-[9px] uppercase tracking-[0.15em] text-purple-500 group-hover:text-purple-400 transition-colors">
                  {operatorNavSection.label}
                </span>
                <span className={`text-[8px] text-purple-500 group-hover:text-purple-400 transition-all duration-200 ${isOperatorCollapsed ? '' : 'rotate-180'}`}>
                  ▲
                </span>
              </button>
              {!isOperatorCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {operatorNavSection.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        prefetch={false}
                        onClick={onToggle}
                        className={`flex items-center gap-2 px-4 py-2 text-xs transition-colors ${
                          isActive
                            ? 'bg-purple-900/20 text-purple-300'
                            : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                        }`}
                      >
                        <span className="text-[10px] w-4 text-center opacity-60">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
            )
          })()}

          {/* Nav sections */}
          {navSections.map((section, i) => {
            const sectionHasActive = section.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + '/')
            )
            // Never collapse the section containing the current page
            const isCollapsed = !sectionHasActive && !!collapsed[section.label]

            return (
              <div key={section.label} className={i > 0 ? 'mt-3' : ''}>
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between pl-4 pr-4 py-1 group"
                  aria-expanded={!isCollapsed}
                >
                  <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-700 group-hover:text-zinc-500 transition-colors">
                    {section.label}
                  </span>
                  <span className={`text-[8px] text-zinc-700 group-hover:text-zinc-500 transition-all duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
                    ▲
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
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
                        <Link
                          key={item.label}
                          href={item.href}
                          prefetch={false}
                          onClick={onToggle}
                          className={cls}
                        >
                          <span className="text-[10px] w-4 text-center opacity-60">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User footer */}
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
