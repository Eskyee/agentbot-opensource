'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: true },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function AgentsSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
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
          <div className="text-sm text-gray-400 mb-1">Credits</div>
          <div className="text-xl font-bold">${credits.toFixed(2)}</div>
          <div className="text-xs text-blue-400 mt-2">+ Add credits</div>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-gray-400">Free Trial</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function AgentsPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Guest'

  return (
    <div className="flex h-screen bg-black text-white">
      <AgentsSidebar userName={userName} credits={0} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Agent Builder</h1>
          <p className="text-xl text-gray-400 mb-8">Create your own AI agent</p>
          
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
            <p className="text-gray-400 mb-6">Agent builder is under development</p>
            <Link href="/dashboard" className="inline-block bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
