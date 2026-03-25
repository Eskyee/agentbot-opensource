/**
 * Dashboard Layout — Shared sidebar + navbar for all dashboard pages
 */

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { useCustomSession } from '@/app/lib/useCustomSession'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useCustomSession()
  const pathname = usePathname()

  // Skip layout for main dashboard page (it has its own sidebar)
  if (pathname === '/dashboard') {
    return <>{children}</>
  }

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1] || 'dashboard'
    return lastSegment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="flex min-h-screen bg-black pt-14">
      <DashboardSidebar
        userName={session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
        plan="Solo"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        <header className="sticky top-14 z-30 bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold uppercase tracking-tighter">{getPageTitle()}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
              Dashboard
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
