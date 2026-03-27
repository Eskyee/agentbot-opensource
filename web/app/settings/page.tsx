'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useBasename, getWalletAddress } from '@/app/hooks/useBasename'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'

// ─── Agents Tab (inline rename) ──────────────────────────────────────────────
function AgentsTab({
  agents,
  onRename,
}: {
  agents: { id: string; name: string; status: string }[]
  onRename: (id: string, name: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startEdit = (agent: { id: string; name: string }) => {
    setEditingId(agent.id)
    setDraft(agent.name)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft('')
    setError('')
  }

  const saveRename = async (id: string) => {
    const name = draft.trim()
    if (!name) { setError('Name cannot be empty'); return }
    if (name.length > 64) { setError('Max 64 chars'); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to rename'); return }
      onRename(id, name)
      setEditingId(null)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (agents.length === 0) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <p className="text-zinc-400 text-sm mb-4">No agents deployed yet.</p>
        <Link
          href="/marketplace"
          className="inline-block bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
        >
          Deploy from Marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-xl font-semibold">Your Agents</h2>
        <Link
          href="/marketplace"
          className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
        >
          + Deploy New
        </Link>
      </div>

      {agents.map((agent) => (
        <div key={agent.id} className="border border-zinc-800 bg-zinc-900/50 p-4">
          {editingId === agent.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError('') }}
                maxLength={64}
                autoFocus
                className="w-full border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(agent.id)
                  if (e.key === 'Escape') cancelEdit()
                }}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => saveRename(agent.id)}
                  disabled={saving}
                  className="bg-white text-black px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="border border-zinc-700 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <span className="font-mono font-bold text-sm text-white truncate block">{agent.name}</span>
                <span className={`text-[10px] uppercase tracking-widest mt-0.5 block ${
                  agent.status === 'running' || agent.status === 'active' ? 'text-green-400' :
                  agent.status === 'error' || agent.status === 'failed' ? 'text-red-400' :
                  'text-zinc-500'
                }`}>{agent.status}</span>
              </div>
              <button
                onClick={() => startEdit(agent)}
                className="border border-zinc-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-white hover:text-white transition-colors shrink-0"
              >
                Rename
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useCustomSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'
  const walletAddress = getWalletAddress(session?.user?.email)
  const { basename } = useBasename(walletAddress)
  const [activeTab, setActiveTab] = useState('profile')
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
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

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
          setDisplayName(data.name || '')
          setEmail(data.email || '')
          setCredits(data.credits || 0)
          setTwoFactorEnabled(data.twoFactorEnabled || false)
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

  const saveProfile = async () => {
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
  }

  const savePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('New passwords do not match')
      return
    }
    if (passwordForm.new.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: passwordForm.current, 
          newPassword: passwordForm.new 
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordSuccess(true)
        setPasswordForm({ current: '', new: '', confirm: '' })
        setTimeout(() => {
          setShowPasswordModal(false)
          setPasswordSuccess(false)
        }, 2000)
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setPasswordError('Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const toggleNotification = async (key: string) => {
    const newValue = !notifications[key as keyof typeof notifications]
    setNotifications({ ...notifications, [key]: newValue })
    
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: { ...notifications, [key]: newValue } })
      })
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      setNotifications({ ...notifications, [key]: !newValue })
    }
  }

  const enable2FA = async () => {
    // In a real implementation, this would:
    // 1. Generate QR code with secret
    // 2. Show QR code to user
    // 3. Ask user to scan with authenticator app
    // 4. Verify code from authenticator
    // For now, we'll show a coming soon message
    alert('2FA setup is coming soon! This will require scanning a QR code with an authenticator app like Google Authenticator or Authy.')
    return
    
    // Commented out for now:
    // setTwoFactorEnabled(true)
    // try {
    //   await fetch('/api/settings', {
    //     method: 'PATCH',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ twoFactorEnabled: true })
    //   })
    //   alert('2FA enabled successfully')
    // } catch (error) {
    //   console.error('Failed to enable 2FA:', error)
    //   setTwoFactorEnabled(false)
    // }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return
    try {
      await fetch('/api/settings', { method: 'DELETE' })
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account')
    }
  }

  const createApiKey = async () => {
    const name = prompt('Enter a name for this API key:')
    if (!name) return
    
    const newKey = {
      id: Date.now().toString(),
      name,
      key: `ab_key_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0]
    }
    
    setApiKeys([...apiKeys, newKey])
    alert(`API Key created: ${newKey.key}`)
  }

  const deleteApiKey = (id: string) => {
    if (!confirm('Delete this API key?')) return
    setApiKeys(apiKeys.filter(k => k.id !== id))
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'apikeys', label: 'API Keys', icon: '🔑' },
    { id: 'referrals', label: 'Referrals', icon: '🎁' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ]

  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          {tabs.map((tab) => (
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

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-semibold mb-4 sm:mb-6">Profile</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full sm:max-w-md border border-zinc-700 bg-zinc-800 px-4 py-2 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full sm:max-w-md border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-zinc-500"
                />
                <p className="mt-1 text-xs text-zinc-500">Email cannot be changed</p>
              </div>

              {walletAddress && (
                <div>
                  <label className="block text-sm font-medium mb-2">Wallet</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                      disabled
                      className="w-full sm:max-w-md border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-zinc-500 font-mono text-sm"
                    />
                  </div>
                  {basename ? (
                    <p className="mt-2 flex items-center gap-2 text-sm">
                      <span className="inline-block w-4 h-4 rounded-full bg-blue-500" aria-hidden="true" />
                      <span className="text-blue-400 font-medium">{basename}</span>
                      <span className="text-zinc-500">· Base Name</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">
                      No Basename registered.{' '}
                      <a
                        href="https://www.base.org/names"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Get one free →
                      </a>
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-zinc-500">Member since Feb 2026</p>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full sm:w-auto bg-white px-6 py-2.5 font-bold text-[10px] uppercase tracking-widest text-black hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* API Keys */}
        {activeTab === 'apikeys' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base sm:text-xl font-semibold">API Keys</h2>
              {agents.length > 0 && (
                <button
                  onClick={createApiKey}
                  className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  + Create Key
                </button>
              )}
            </div>

            {agents.length === 0 ? (
              <div className="border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 text-left">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-base sm:text-lg font-medium mb-2">No Agents Deployed</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  API keys are only available once you have a live agent.
                  Deploy your first agent from the marketplace to get started.
                </p>
                <Link href="/marketplace" className="inline-block bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                  Go to Marketplace
                </Link>
              </div>
            ) : (
              <div className="border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead className="bg-zinc-800/50">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Name</th>
                      <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Key</th>
                      <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Created</th>
                      <th className="text-right p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 sm:p-8 text-left text-zinc-500 text-sm">
                          No API keys created yet.
                        </td>
                      </tr>
                    ) : (
                      apiKeys.map((key) => (
                        <tr key={key.id} className="border-t border-zinc-800">
                          <td className="p-3 sm:p-4 text-sm font-medium">{key.name}</td>
                          <td className="p-3 sm:p-4 font-mono text-xs text-zinc-400 max-w-[140px] truncate">{key.key}</td>
                          <td className="p-3 sm:p-4 text-xs text-zinc-400">{key.created}</td>
                          <td className="p-3 sm:p-4 text-right">
                            <button
                              onClick={() => deleteApiKey(key.id)}
                              className="text-red-400 hover:text-red-300 text-xs uppercase tracking-widest font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Referrals */}
        {activeTab === 'referrals' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-xl font-semibold">Referrals</h2>

            <div className="border border-zinc-700 bg-zinc-900 p-4 sm:p-6">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Your referral link</div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 min-w-0 border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-300 text-xs font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(referralLink)}
                  className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors shrink-0"
                >
                  Copy
                </button>
              </div>
              <p className="mt-4 text-zinc-400 text-sm">
                🎉 <strong>{referralCount}</strong> people have joined using your link! You have £{referralCredits} in credits.
              </p>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4">How it works</h3>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li>• Share your unique referral link</li>
                <li>• They get <strong>£10 off</strong> their first month</li>
                <li>• You get <strong>£10 credit</strong> for each referral</li>
              </ul>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-xl font-semibold">Security</h2>

            <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4">Password</h3>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors"
              >
                Change Password
              </button>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-3">Two-Factor Authentication</h3>
              <p className="text-zinc-400 text-sm mb-4">Add an extra layer of security to your account</p>
              {twoFactorEnabled ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <span>✓</span>
                  <span>2FA is enabled</span>
                </div>
              ) : (
                <button
                  onClick={enable2FA}
                  className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Enable 2FA
                </button>
              )}
            </div>

            <div className="border border-red-900/50 bg-red-900/10 p-4 sm:p-6">
              <h3 className="text-[10px] uppercase tracking-widest text-red-400 mb-3">Danger Zone</h3>
              <p className="text-zinc-400 text-sm mb-4">Permanently delete your account and all data</p>
              <button
                onClick={deleteAccount}
                className="border border-red-600 text-red-400 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-red-900/30 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-xl font-semibold">Notifications</h2>

            <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 space-y-4">
              {[
                { key: 'email', label: 'Email notifications', desc: 'Receive email updates about your agents', enabled: notifications.email },
                { key: 'usageAlerts', label: 'Usage alerts', desc: 'Get notified when credits are low', enabled: notifications.usageAlerts },
                { key: 'productUpdates', label: 'Product updates', desc: 'News about new features', enabled: notifications.productUpdates },
                { key: 'marketing', label: 'Marketing emails', desc: 'Tips and promotions', enabled: notifications.marketing },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-zinc-400">{item.desc}</div>
                  </div>
                  <button 
                    onClick={() => toggleNotification(item.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      item.enabled ? 'bg-white' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                      item.enabled ? 'translate-x-6 bg-black' : 'translate-x-0.5 bg-white'
                    }`} 
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agents */}
        {activeTab === 'agents' && (
          <AgentsTab agents={agents} onRename={(id, name) => {
            setAgents(prev => prev.map(a => a.id === id ? { ...a, name } : a))
          }} />
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 p-5 sm:p-6 w-full max-w-md">
              <h3 className="text-base font-bold uppercase tracking-tight mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full border border-zinc-700 bg-zinc-800 px-4 py-2 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full border border-zinc-700 bg-zinc-800 px-4 py-2 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full border border-zinc-700 bg-zinc-800 px-4 py-2 focus:border-white focus:outline-none"
                  />
                </div>

                {passwordError && (
                  <p className="text-red-400 text-xs">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-green-400 text-xs">Password changed successfully!</p>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                  className="flex-1 border border-zinc-700 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePassword}
                  disabled={passwordLoading || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                  className="flex-1 bg-white text-black px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        </main>
      </div>
    </div>
  )
}
