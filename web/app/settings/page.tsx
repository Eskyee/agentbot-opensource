'use client'

import { useState, useEffect, useMemo, useCallback, startTransition, memo, lazy, Suspense } from 'react'
import Link from 'next/link'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useBasename, getWalletAddress } from '@/app/hooks/useBasename'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { Loader2 } from 'lucide-react'

// ─── Lazy-loaded tab panels ───
const ProfileTab = lazy(() => import('./tabs/ProfileTab'))
const AgentsTab = lazy(() => import('./tabs/AgentsTab'))
const ApiKeysTab = lazy(() => import('./tabs/ApiKeysTab'))
const ReferralsTab = lazy(() => import('./tabs/ReferralsTab'))
const SecurityTab = lazy(() => import('./tabs/SecurityTab'))
const NotificationsTab = lazy(() => import('./tabs/NotificationsTab'))

const TabSkeleton = memo(function TabSkeleton() {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 p-6 animate-pulse space-y-4">
      <div className="h-6 bg-zinc-800 w-1/3" />
      <div className="h-10 bg-zinc-800" />
      <div className="h-10 bg-zinc-800" />
      <div className="h-10 bg-zinc-800 w-1/2" />
    </div>
  )
})

const tabs = [
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
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [credits, setCredits] = useState(0)
  const [notifications, setNotifications] = useState({
    email: true,
    usageAlerts: true,
    productUpdates: false,
    marketing: false
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created: string }[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [referralLink, setReferralLink] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [referralCredits, setReferralCredits] = useState(0)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, agentsRes, referralRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/agents'),
          fetch('/api/referral')
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          startTransition(() => {
            setDisplayName(data.name || '')
            setEmail(data.email || '')
            setCredits(data.credits || 0)
            setTwoFactorEnabled(data.twoFactorEnabled || false)
          })
        }

        if (agentsRes.ok) {
          const data = await agentsRes.json()
          startTransition(() => setAgents(data.agents || []))
        }

        if (referralRes.ok) {
          const data = await referralRes.json()
          startTransition(() => {
            setReferralLink(`https://agentbot.raveculture.xyz/signup?ref=${data.referralCode || ''}`)
            setReferralCount(data.referralCount || 0)
            setReferralCredits(data.creditEarned || 0)
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        startTransition(() => setLoading(false))
      }
    }
    fetchSettings()
  }, [])

  // ─── Callbacks ───
  const handleTabChange = useCallback((tabId: string) => {
    startTransition(() => setActiveTab(tabId))
  }, [])

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const saveProfile = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName }),
      })
      if (res.ok) {
        alert('Profile updated successfully')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }, [displayName])

  const toggleNotification = useCallback(async (key: string) => {
    const current = notifications[key as keyof typeof notifications]
    const newValue = !current
    startTransition(() => setNotifications(prev => ({ ...prev, [key]: newValue })))

    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: { ...notifications, [key]: newValue } })
      })
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      startTransition(() => setNotifications(prev => ({ ...prev, [key]: !newValue })))
    }
  }, [notifications])

  const handleAgentRename = useCallback((id: string, name: string) => {
    startTransition(() => setAgents(prev => prev.map(a => a.id === id ? { ...a, name } : a)))
  }, [])

  const handleSetDisplayName = useCallback((v: string) => setDisplayName(v), [])

  const handleOpenPasswordModal = useCallback(() => startTransition(() => setShowPasswordModal(true)), [])
  const handleClosePasswordModal = useCallback(() => startTransition(() => setShowPasswordModal(false)), [])

  const enable2FA = useCallback(async () => {
    alert('2FA setup is coming soon! This will require scanning a QR code with an authenticator app like Google Authenticator or Authy.')
  }, [])

  const deleteAccount = useCallback(async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return
    try {
      await fetch('/api/settings', { method: 'DELETE' })
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account')
    }
  }, [])

  const createApiKey = useCallback(async () => {
    const name = prompt('Enter a name for this API key:')
    if (!name) return
    const newKey = {
      id: Date.now().toString(),
      name,
      key: `ab_key_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0]
    }
    startTransition(() => setApiKeys(prev => [...prev, newKey]))
    alert(`API Key created: ${newKey.key}`)
  }, [])

  const deleteApiKey = useCallback((id: string) => {
    if (!confirm('Delete this API key?')) return
    startTransition(() => setApiKeys(prev => prev.filter(k => k.id !== id)))
  }, [])

  const handleCopyReferral = useCallback(() => {
    navigator.clipboard.writeText(referralLink)
  }, [referralLink])

  // ─── Shared props for tabs ───
  const profileProps = useMemo(() => ({
    displayName, email, walletAddress, basename, loading, saving,
    onDisplayNameChange: handleSetDisplayName,
    onSave: saveProfile,
  }), [displayName, email, walletAddress, basename, loading, saving, handleSetDisplayName, saveProfile])

  const agentsProps = useMemo(() => ({
    agents,
    onRename: handleAgentRename,
  }), [agents, handleAgentRename])

  const apiKeysProps = useMemo(() => ({
    apiKeys, agents,
    onCreateKey: createApiKey,
    onDeleteKey: deleteApiKey,
  }), [apiKeys, agents, createApiKey, deleteApiKey])

  const referralsProps = useMemo(() => ({
    referralLink, referralCount, referralCredits,
    onCopy: handleCopyReferral,
  }), [referralLink, referralCount, referralCredits, handleCopyReferral])

  const securityProps = useMemo(() => ({
    twoFactorEnabled, showPasswordModal,
    onOpenPasswordModal: handleOpenPasswordModal,
    onClosePasswordModal: handleClosePasswordModal,
    onEnable2FA: enable2FA,
    onDeleteAccount: deleteAccount,
  }), [twoFactorEnabled, showPasswordModal, handleOpenPasswordModal, handleClosePasswordModal, enable2FA, deleteAccount])

  const notificationsProps = useMemo(() => ({
    notifications,
    onToggle: toggleNotification,
  }), [notifications, toggleNotification])

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar
        userName={userName}
        plan="Solo"
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />

      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSidebarToggle}
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
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
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

            {/* Lazy-loaded tab content */}
            <Suspense fallback={<TabSkeleton />}>
              {activeTab === 'profile' && <ProfileTab {...profileProps} />}
              {activeTab === 'agents' && <AgentsTab {...agentsProps} />}
              {activeTab === 'apikeys' && <ApiKeysTab {...apiKeysProps} />}
              {activeTab === 'referrals' && <ReferralsTab {...referralsProps} />}
              {activeTab === 'security' && <SecurityTab {...securityProps} />}
              {activeTab === 'notifications' && <NotificationsTab {...notificationsProps} />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
