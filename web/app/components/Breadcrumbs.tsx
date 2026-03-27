/**
 * Breadcrumbs — Navigation trail for dashboard pages
 * 
 * Shows: Dashboard > Wallet or Dashboard > Colony > borg-0-3
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
}

/**
 * Auto-generate breadcrumbs from pathname
 * /dashboard/wallet → [{label:'Dashboard', href:'/dashboard'}, {label:'Wallet'}]
 */
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = []

  // Always start with Dashboard
  if (pathname !== '/dashboard') {
    crumbs.push({ label: 'Dashboard', href: '/dashboard' })
  }

  // Find matching nav item for the current page
  const currentItem = allNavItems.find(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  if (currentItem && currentItem.href !== '/dashboard') {
    crumbs.push({ label: currentItem.label })
  }

  return crumbs
}

export function Breadcrumbs({ items, backHref, backLabel }: BreadcrumbsProps) {
  const pathname = usePathname()
  const crumbs = items || getBreadcrumbs(pathname)

  if (crumbs.length <= 1 && !backHref) return null

  return (
    <div className="flex items-center gap-3 mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← {backLabel || 'Back'}
        </Link>
      )}
      {!backHref && crumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-zinc-700">›</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-400">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
