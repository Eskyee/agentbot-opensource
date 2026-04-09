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
import { buildAppUrl } from '@/app/lib/app-url'

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
  const [showcaseOptIn, setShowcaseOptIn] = useState(false)
  const [showcaseDescription, setShowcaseDescription] = useState('')
  const [showcaseAgentId, setShowcaseAgentId] = useState('')
  const [showcaseSaving, setShowcaseSaving] = useState(false)
  const [showcaseSaved, setShowcaseSaved] = useState(false)
  const [showcaseError, setShowcaseError] = useState('')
  const [openclawInfo, setOpenclawInfo] = useState<{
    managed: boolean
    instanceId: string | null
    url: string | null
  } | null>(null)
  const effectiveAgents = agents.length > 0
    ? agents
    : openclawInfo?.instanceId
      ? [{
          id: openclawInfo.instanceId,
          name: 'Managed OpenClaw Runtime',
          status: openclawInfo.url ? 'running' : 'provisioning',
        }]
      : []

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab')
    if (requestedTab && TABS.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab)
    }
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, agentsRes, referralRes, showcaseRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/agents'),
          fetch('/api/referral'),
          fetch('/api/agents/showcase'),
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setDisplayName(data.name || '')
          setEmail(data.email || '')
          setCredits(data.credits || 0)
          setTwoFactorEnabled(data.twoFactorEnabled || false)
          setOpenclawInfo(data.openclaw || { managed: true, instanceId: null, url: null })
          if (data.notifications) setNotifications(data.notifications)
        }

        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(data.agents || [])
        }

        if (referralRes.ok) {
          const data = await referralRes.json()
          setReferralLink(buildAppUrl(`/signup?ref=${data.referralCode || ''}`))
          setReferralCount(data.referralCount || 0)
          setReferralCredits(data.creditEarned || 0)
        }

        if (showcaseRes.ok) {
          const data = await showcaseRes.json()
          setShowcaseOptIn(data.showcaseOptIn ?? false)
          setShowcaseDescription(data.showcaseDescription ?? '')
          setShowcaseAgentId(data.agentId ?? '')
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
              <div className="space-y-6">
                <AgentsTab
                  agents={effectiveAgents}
                  onRename={(id, name) => {
                    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
                  }}
                  onDelete={(id) => {
                    setAgents((prev) => prev.filter((a) => a.id !== id))
                  }}
                />

                {showcaseAgentId && (
                  <div id="showcase" className="border border-zinc-800 bg-zinc-950 p-5 scroll-mt-24">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-tight mb-1">Agent Showcase</h2>
                        <p className="text-[11px] text-zinc-500">List your agent on the public showcase at <a href="/showcase" className="text-purple-400 hover:text-purple-300">/showcase</a></p>
                      </div>
                      <button
                        onClick={() => setShowcaseOptIn(!showcaseOptIn)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          showcaseOptIn ? 'bg-purple-600' : 'bg-zinc-700'
                        }`}
                        role="switch"
                        aria-checked={showcaseOptIn}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                          showcaseOptIn ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {showcaseOptIn && (
                      <div className="mt-3">
                        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                          Short bio for the showcase (280 chars max)
                        </label>
                        <textarea
                          value={showcaseDescription}
                          onChange={(e) => setShowcaseDescription(e.target.value)}
                          maxLength={280}
                          rows={2}
                          placeholder="e.g., Underground techno agent. Curates sets, scouts tracks, runs my Telegram channel."
                          className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs px-3 py-2 focus:outline-none focus:border-zinc-500 resize-none font-mono"
                        />
                        <p className="text-[10px] text-zinc-600 mt-1">{showcaseDescription.length}/280</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={async () => {
                          if (!showcaseAgentId) return
                          setShowcaseSaving(true)
                          setShowcaseError('')
                          try {
                            const res = await fetch('/api/agents/showcase', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ agentId: showcaseAgentId, showcaseOptIn, showcaseDescription }),
                            })
                            if (!res.ok) {
                              const errData = await res.json().catch(() => ({}))
                              setShowcaseError(errData?.error || `Save failed (${res.status})`)
                            } else {
                              setShowcaseSaved(true)
                              setTimeout(() => setShowcaseSaved(false), 2000)
                            }
                          } catch {
                            setShowcaseError('Network error — please try again')
                          } finally {
                            setShowcaseSaving(false)
                          }
                        }}
                        disabled={showcaseSaving}
                        className="text-[10px] uppercase tracking-widest bg-white text-black px-4 py-2 font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                      >
                        {showcaseSaving ? 'Saving...' : showcaseSaved ? 'Saved ✓' : 'Save'}
                      </button>
                      {showcaseError && (
                        <span className="text-[10px] text-red-400">{showcaseError}</span>
                      )}
                      {showcaseOptIn && !showcaseError && (
                        <a href="/showcase" target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-400 hover:text-purple-300 uppercase tracking-widest">
                          View showcase →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-tight mb-1">OpenClaw Runtime</h2>
                      <p className="text-[11px] text-zinc-500">
                        Managed by Agentbot. Users should open their agent from the dashboard, not configure raw OpenClaw URLs manually.
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-1 border border-emerald-500/30 text-emerald-400">
                      Managed
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Instance ID</div>
                      <div className="text-xs font-mono text-zinc-400 break-all">
                        {openclawInfo?.instanceId || 'Not provisioned yet'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Access</div>
                      {openclawInfo?.url ? (
                        <a
                          href={openclawInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-blue-400 hover:text-blue-300 break-all"
                        >
                          Open managed instance →
                        </a>
                      ) : (
                        <div className="text-xs text-zinc-500">Provisioning required</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-zinc-800 pt-4 text-[11px] text-zinc-500">
                    If you need a custom OpenClaw runtime later, add it as an advanced override. The default user path should stay managed to reduce broken configs and support load.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'apikeys' && <ApiKeysTab agents={effectiveAgents} />}

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
