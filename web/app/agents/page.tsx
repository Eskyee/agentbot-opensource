'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: true },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function AgentsSidebar({ userName, className = '' }: { userName: string; className?: string }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
        <Link href="/billing" className="block mt-8 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-sm text-blue-400 mb-1">View Plans</div>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-blue-400">Sign up</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function AgentsPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <AgentsSidebar userName={userName} className="mb-6" />
      </div>

      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Agent Builder</h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-6">Create your own AI agent</p>
          
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-800 text-center">
            <div className="text-4xl sm:text-5xl mb-3">🤖</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Coming Soon</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-5">Agent builder is under development</p>
            <Link href="/dashboard" className="w-full sm:w-auto inline-block bg-white text-black hover:bg-gray-200 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
