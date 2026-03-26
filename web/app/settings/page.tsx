'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useBasename, getWalletAddress } from '@/app/hooks/useBasename'

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: true },
]

function SettingsSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
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
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-blue-400">Account</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
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
      key: `demo_key_${Math.random().toString(36).substring(2, 15)}`,
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

  return (
    <div className="flex h-screen bg-black text-white">
      <SettingsSidebar userName={userName} credits={credits} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-black' 
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-xl font-semibold mb-6">Profile</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {walletAddress && (
                <div>
                  <label className="block text-sm font-medium mb-2">Wallet</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                      disabled
                      className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-gray-500 font-mono text-sm"
                    />
                  </div>
                  {basename ? (
                    <p className="mt-2 flex items-center gap-2 text-sm">
                      <span className="inline-block w-4 h-4 rounded-full bg-blue-500" aria-hidden="true" />
                      <span className="text-blue-400 font-medium">{basename}</span>
                      <span className="text-gray-500">· Base Name</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
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
                <p className="text-sm text-gray-500">Member since Feb 2026</p>
              </div>

              <button 
                onClick={saveProfile}
                disabled={saving}
                className="rounded-lg bg-white px-6 py-2 font-semibold text-black hover:bg-gray-200 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* API Keys */}
        {activeTab === 'apikeys' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">API Keys</h2>
              {agents.length > 0 && (
                <button 
                  onClick={createApiKey}
                  className="rounded-lg bg-white text-black px-4 py-2 font-semibold hover:bg-gray-200"
                >
                  + Create Key
                </button>
              )}
            </div>

            {agents.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-medium mb-2">No Agents Deployed</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                  API keys are only available once you have a live agent. 
                  Deploy your first agent from the marketplace to get started.
                </p>
                <Link href="/marketplace" className="rounded-lg bg-white text-black px-6 py-2 font-semibold hover:bg-gray-200">
                  Go to Marketplace
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Name</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Key</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Created</th>
                      <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                          No API keys created yet.
                        </td>
                      </tr>
                    ) : (
                      apiKeys.map((key) => (
                        <tr key={key.id} className="border-t border-gray-800">
                          <td className="p-4 font-medium">{key.name}</td>
                          <td className="p-4 font-mono text-sm text-gray-400">{key.key}</td>
                          <td className="p-4 text-gray-400">{key.created}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => deleteApiKey(key.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
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
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Referrals</h2>
            
            <div className="rounded-2xl border border-white/30 bg-gradient-to-r from-white/10 to-gray-200/10 p-6">
              <div className="text-sm text-gray-400 mb-2">Your referral link</div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(referralLink)}
                  className="rounded-lg bg-white text-black px-4 py-2 font-semibold hover:bg-gray-200"
                >
                  Copy
                </button>
              </div>
              <p className="mt-4 text-gray-400">
                🎉 <strong>{referralCount}</strong> people have joined using your link! You have £{referralCredits} in credits.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="font-semibold mb-4">How it works</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Share your unique referral link</li>
                <li>• They get <strong>£10 off</strong> their first month</li>
                <li>• You get <strong>£10 credit</strong> for each referral</li>
              </ul>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Security</h2>
            
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="font-semibold mb-4">Password</h3>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800"
              >
                Change Password
              </button>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
              <p className="text-gray-400 text-sm mb-4">Add an extra layer of security to your account</p>
              {twoFactorEnabled ? (
                <div className="flex items-center gap-2 text-green-400">
                  <span>✓</span>
                  <span>2FA is enabled</span>
                </div>
              ) : (
                <button 
                  onClick={enable2FA}
                  className="rounded-lg bg-white text-black px-4 py-2 font-semibold hover:bg-gray-200"
                >
                  Enable 2FA
                </button>
              )}
            </div>

            <div className="rounded-xl border border-red-900/50 bg-red-900/10 p-6">
              <h3 className="font-semibold mb-4 text-red-400">Danger Zone</h3>
              <p className="text-gray-400 text-sm mb-4">Permanently delete your account and all data</p>
              <button 
                onClick={deleteAccount}
                className="rounded-lg border border-red-600 text-red-400 px-4 py-2 hover:bg-red-900/30"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Notifications</h2>
            
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
              {[
                { key: 'email', label: 'Email notifications', desc: 'Receive email updates about your agents', enabled: notifications.email },
                { key: 'usageAlerts', label: 'Usage alerts', desc: 'Get notified when credits are low', enabled: notifications.usageAlerts },
                { key: 'productUpdates', label: 'Product updates', desc: 'News about new features', enabled: notifications.productUpdates },
                { key: 'marketing', label: 'Marketing emails', desc: 'Tips and promotions', enabled: notifications.marketing },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-400">{item.desc}</div>
                  </div>
                  <button 
                    onClick={() => toggleNotification(item.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      item.enabled ? 'bg-white' : 'bg-gray-700'
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

        {/* Agents placeholder */}
        {activeTab === 'agents' && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
            <p className="text-gray-400">Manage your agents from the Dashboard</p>
            <Link href="/dashboard" className="text-white hover:underline mt-2 inline-block">
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-white focus:outline-none"
                  />
                </div>
                
                {passwordError && (
                  <p className="text-red-400 text-sm">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-green-400 text-sm">Password changed successfully!</p>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                  className="flex-1 rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={savePassword}
                  disabled={passwordLoading || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                  className="flex-1 rounded-lg bg-white text-black px-4 py-2 font-semibold hover:bg-gray-200 disabled:opacity-50"
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
  )
}
