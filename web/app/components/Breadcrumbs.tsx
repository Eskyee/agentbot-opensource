/**
 * Breadcrumbs — Navigation trail for dashboard pages
 *
 * Auto-generates a full trail from the pathname:
 *   /dashboard/team/abc123 → Dashboard › Team › abc123…
 *
 * Labels come from the sidebar nav items first, then a segment label map,
 * then title-cased fallback. Long dynamic segments (ids) are truncated.
 * Rendered automatically by the dashboard layout — pages can still pass
 * custom `items` or a `backHref` for bespoke trails.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { allNavItems } from './DashboardSidebar'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  backHref?: string
  backLabel?: string
  className?: string
}

/** Labels for segments that don't title-case cleanly */
const SEGMENT_LABELS: Record<string, string> = {
  rbac: 'Permissions',
  'dj-stream': 'DJ Dashboard',
  x402: 'x402',
  x: 'X (Twitter)',
  'tempo-dex': 'Tempo DEX',
  'gitlawb-network': 'GitLawb Network',
  'git-city': 'Git City',
  'character-qa': 'Character QA',
  'system-pulse': 'System Pulse',
  'market-intel': 'Market Intel',
  'tech-updates': 'Tech Updates',
  'daily-brief': 'Daily Brief',
  'venue-finder': 'Venue Finder',
  'pricing-model': 'Pricing Models',
  clawbank: 'ClawBank',
  voice: 'Voice & TTS',
  invoice: 'Invoices',
  time: 'Time Tracking',
  wallet: 'Agentic Wallet',
  knowledge: 'Knowledge Base',
  ops: 'Ops',
  keys: 'API Keys',
}

/** Build href → label map from the sidebar nav (highest-priority labels) */
const NAV_LABELS: Record<string, string> = Object.fromEntries(
  allNavItems.map((item) => [item.href, item.label])
)

/** Segments that look like ids/hashes get truncated for display */
function displayLabel(segment: string): string {
  const decoded = decodeURIComponent(segment)
  if (SEGMENT_LABELS[decoded]) return SEGMENT_LABELS[decoded]
  // Long opaque ids: truncate rather than title-case
  if (decoded.length > 18 && !decoded.includes('-')) {
    return `${decoded.slice(0, 8)}…`
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(decoded)) {
    return `${decoded.slice(0, 8)}…`
  }
  return decoded
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

/**
 * Auto-generate the full breadcrumb trail from pathname.
 * /dashboard/team/abc → [Dashboard, Team, abc…] (all but last linked)
 */
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return []

  const crumbs: BreadcrumbItem[] = []
  let path = ''

  segments.forEach((segment, i) => {
    path += `/${segment}`
    const isLast = i === segments.length - 1
    const label = NAV_LABELS[path] || displayLabel(segment)
    crumbs.push({ label, href: isLast ? undefined : path })
  })

  return crumbs
}

export function Breadcrumbs({ items, backHref, backLabel, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const crumbs = items || getBreadcrumbs(pathname)

  if (crumbs.length <= 1 && !backHref) return null

  if (backHref) {
    return (
      <div className={`flex items-center gap-3 ${className ?? 'mb-6'}`}>
        <Link
          href={backHref}
          className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← {backLabel || 'Back'}
        </Link>
      </div>
    )
  }

  return (
    <nav aria-label="Breadcrumb" className={className ?? 'mb-6'}>
      <ol className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[10px] uppercase tracking-widest">
        {crumbs.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden className="text-zinc-700">
                ›
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                prefetch={false}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-zinc-300">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
