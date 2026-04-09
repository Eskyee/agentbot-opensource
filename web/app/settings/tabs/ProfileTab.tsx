'use client'

import { useState } from 'react'

interface ProfileTabProps {
  displayName: string
  email: string
  walletAddress: string | null
  basename: string | null
  onDisplayNameChange: (name: string) => void
}

export function ProfileTab({
  displayName,
  email,
  walletAddress,
  basename,
  onDisplayNameChange,
}: ProfileTabProps) {
  const [saving, setSaving] = useState(false)

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

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
      <h2 className="text-base sm:text-xl font-semibold mb-4 sm:mb-6">Profile</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
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
  )
}
