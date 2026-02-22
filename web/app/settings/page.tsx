'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [displayName, setDisplayName] = useState('Atlas')
  const [email] = useState('demo@agentbot.com')
  const [apiKeys] = useState([
    { id: '1', name: 'Production Key', key: 'sk_live_...x4a2', created: '2026-02-15' },
    { id: '2', name: 'Development Key', key: 'sk_test_...b3c1', created: '2026-02-10' },
  ])
  const [referralLink] = useState('https://agentbot.raveculture.xyz/ref/user123')
  const [referrals] = useState(5)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'apikeys', label: 'API Keys', icon: '🔑' },
    { id: 'referrals', label: 'Referrals', icon: '🎁' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold">Agentbot</span>
          </Link>
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link>
            <Link href="/agents" className="text-gray-400 hover:text-white">Agents</Link>
            <Link href="/docs" className="text-gray-400 hover:text-white">Docs</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-lobster-500 text-white' 
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
                  className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-lobster-500 focus:outline-none"
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

              <div>
                <p className="text-sm text-gray-500">Member since Feb 2026</p>
              </div>

              <button className="rounded-lg bg-lobster-500 px-6 py-2 font-semibold hover:bg-lobster-400">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* API Keys */}
        {activeTab === 'apikeys' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">API Keys</h2>
              <button className="rounded-lg bg-lobster-500 px-4 py-2 font-semibold hover:bg-lobster-400">
                + Create Key
              </button>
            </div>

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
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="border-t border-gray-800">
                      <td className="p-4 font-medium">{key.name}</td>
                      <td className="p-4 font-mono text-sm text-gray-400">{key.key}</td>
                      <td className="p-4 text-gray-400">{key.created}</td>
                      <td className="p-4 text-right">
                        <button className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Referrals */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Referrals</h2>
            
            <div className="rounded-2xl border border-lobster-500/30 bg-gradient-to-r from-lobster-600/10 to-purple-600/10 p-6">
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
                  className="rounded-lg bg-lobster-500 px-4 py-2 font-semibold hover:bg-lobster-400"
                >
                  Copy
                </button>
              </div>
              <p className="mt-4 text-gray-400">
                🎉 <strong>{referrals}</strong> people have joined using your link!
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="font-semibold mb-4">How it works</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Share your unique referral link</li>
                <li>• They get <strong>£30 off</strong> their first month</li>
                <li>• You get <strong>£30 credit</strong> for each referral</li>
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
              <button className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800">
                Change Password
              </button>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
              <p className="text-gray-400 text-sm mb-4">Add an extra layer of security to your account</p>
              <button className="rounded-lg bg-lobster-500 px-4 py-2 font-semibold hover:bg-lobster-400">
                Enable 2FA
              </button>
            </div>

            <div className="rounded-xl border border-red-900/50 bg-red-900/10 p-6">
              <h3 className="font-semibold mb-4 text-red-400">Danger Zone</h3>
              <p className="text-gray-400 text-sm mb-4">Permanently delete your account and all data</p>
              <button className="rounded-lg border border-red-600 text-red-400 px-4 py-2 hover:bg-red-900/30">
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
                { label: 'Email notifications', desc: 'Receive email updates about your agents', enabled: true },
                { label: 'Usage alerts', desc: 'Get notified when credits are low', enabled: true },
                { label: 'Product updates', desc: 'News about new features', enabled: false },
                { label: 'Marketing emails', desc: 'Tips and promotions', enabled: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-400">{item.desc}</div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full transition-colors ${
                      item.enabled ? 'bg-lobster-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      item.enabled ? 'translate-x-6' : 'translate-x-0.5'
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
            <Link href="/dashboard" className="text-lobster-400 hover:underline mt-2 inline-block">
              Go to Dashboard →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
