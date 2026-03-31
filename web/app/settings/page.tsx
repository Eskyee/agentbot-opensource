'use client'

import { useState, useEffect } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useBasename, getWalletAddress } from '@/app/hooks/useBasename'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import {
  ProfileTab,
  SecurityTab,
  NotificationsTab,
  ApiKeysTab,
  ReferralsTab,
  AgentsTab,
} from './tabs'

const TABS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
  { id: 'apikeys', label: 'API Keys', icon: '🔑' },
  { id: 'referrals', label: 'Referrals', icon: '🎁' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
]

export default function SettingsPage() {
  const { data: session } = useCustomSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'
  const walletAddress = getWalletAddress(session?.user?.email)
  const { basename } = useBasename(walletAddress)

  const [activeTab, setActiveTab] = useState('profile')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Shared state fetched once
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [agents, setAgents] = useState<any[]>([])
  const [credits, setCredits] = useState(0)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    usageAlerts: true,
    productUpdates: false,
    marketing: false,
  })
  const [referralLink, setReferralLink] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [referralCredits, setReferralCredits] = useState(0)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, agentsRes, referralRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/agents'),
          fetch('/api/referral'),
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setDisplayName(data.name || '')
          setEmail(data.email || '')
          setCredits(data.credits || 0)
          setTwoFactorEnabled(data.twoFactorEnabled || false)
          if (data.notifications) setNotifications(data.notifications)
        }

        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(data.agents || [])
        }

        if (referralRes.ok) {
          const data = await referralRes.json()
          setReferralLink(`https://agentbot.raveculture.xyz/signup?ref=${data.referralCode || ''}`)
          setReferralCount(data.referralCount || 0)
          setReferralCredits(data.creditEarned || 0)
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar
        userName={userName}
        plan="Solo"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
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
            <span className="text-sm font-bold uppercase tracking-tighter">⚙ Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
              Dashboard
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Account</span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mt-1">Settings</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 mb-6 sm:mb-8 overflow-x-auto pb-2 border-b border-zinc-800 -mx-4 sm:mx-0 px-4 sm:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-[9px] sm:text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content — each tab manages its own state */}
            {activeTab === 'profile' && (
              <ProfileTab
                displayName={displayName}
                email={email}
                walletAddress={walletAddress}
                basename={basename}
                onDisplayNameChange={setDisplayName}
              />
            )}

            {activeTab === 'agents' && (
              <AgentsTab
                agents={agents}
                onRename={(id, name) => {
                  setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
                }}
              />
            )}

            {activeTab === 'apikeys' && <ApiKeysTab agents={agents} />}

            {activeTab === 'referrals' && (
              <ReferralsTab
                referralLink={referralLink}
                referralCount={referralCount}
                referralCredits={referralCredits}
              />
            )}

            {activeTab === 'security' && <SecurityTab twoFactorEnabled={twoFactorEnabled} />}

            {activeTab === 'notifications' && <NotificationsTab initialNotifications={notifications} />}
          </div>
        </main>
      </div>
    </div>
  )
}
