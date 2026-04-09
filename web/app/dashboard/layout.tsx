/**
 * Dashboard Layout — Shared sidebar + navbar for all dashboard pages
 */

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { TrialBanner } from '@/app/components/TrialBanner'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { SidebarContext } from './sidebar-context'

const WalletProvider = dynamic(() => import('@/app/components/WalletProvider'))

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
    return <WalletProvider>{children}</WalletProvider>
  }

  return (
    <WalletProvider>
    <SidebarContext.Provider value={{ isOpen: sidebarOpen, toggle: () => setSidebarOpen(!sidebarOpen) }}>
      <div className="flex min-h-screen bg-black font-mono">
        <DashboardSidebar
          userName={session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
          plan={(session?.user as any)?.plan || 'solo'}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TrialBanner />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
    </WalletProvider>
  )
}
