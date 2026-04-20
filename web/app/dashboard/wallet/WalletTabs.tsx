'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Simple wallet-network tab bar. Lets users switch between Base (default) and
 * Tempo wallet dashboards without losing access to either rail.
 *
 * Users can link either wallet they choose — neither is destructive to the other.
 */
export default function WalletTabs() {
  const pathname = usePathname() || ''
  const tabs = [
    { href: '/dashboard/wallet', label: 'Base' },
    { href: '/dashboard/wallet/tempo', label: 'Tempo' },
  ]

  return (
    <div className="mb-4 flex gap-2 border-b border-white/10 pb-2 text-sm">
      {tabs.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              active
                ? 'rounded-t-md bg-white/10 px-3 py-1.5 font-medium text-white'
                : 'rounded-t-md px-3 py-1.5 text-white/60 hover:bg-white/5 hover:text-white'
            }
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
