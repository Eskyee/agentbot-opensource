'use client'

import { useState, useEffect } from 'react'

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
  const [saving, setSaving]       = useState(false)
  const [xHandle, setXHandle]     = useState('')
  const [xSaving, setXSaving]     = useState(false)
  const [xSaved, setXSaved]       = useState(false)
  const [xError, setXError]       = useState('')

  useEffect(() => {
    fetch('/api/user/x-handle')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.handle) setXHandle(d.handle) })
      .catch(() => null)
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

  const saveXHandle = async () => {
    setXError('')
    setXSaving(true)
    const clean = xHandle.trim().replace(/^@/, '')
    const res = await fetch('/api/user/x-handle', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ handle: clean || null }),
    })
    setXSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setXError(d.error || 'Save failed')
      return
    }
    setXHandle(clean)
    setXSaved(true)
    setTimeout(() => setXSaved(false), 2000)
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
                <span className="inline-block w-4 h-4 rounded-full bg-red-500" aria-hidden="true" />
                <span className="text-red-500 font-medium">{basename}</span>
                <span className="text-zinc-500">· Base Name</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                No Basename registered.{' '}
                <a
                  href="https://www.base.org/names"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:underline"
                >
                  Get one free →
                </a>
              </p>
            )}
          </div>
        )}

        {/* X / Twitter handle */}
        <div>
          <label className="block text-sm font-medium mb-2">X (Twitter) Handle</label>
          <div className="flex gap-2 sm:max-w-md">
            <div className="flex flex-1 items-center border border-zinc-700 bg-zinc-800 focus-within:border-zinc-500">
              <span className="pl-3 text-zinc-500 text-sm select-none">@</span>
              <input
                type="text"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value.replace(/^@/, ''))}
                placeholder="yourhandle"
                className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"
              />
            </div>
            <button
              onClick={saveXHandle}
              disabled={xSaving}
              className="bg-zinc-800 border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:border-zinc-500 disabled:opacity-50 transition-colors"
            >
              {xSaving ? '…' : xSaved ? '✓' : 'Save'}
            </button>
          </div>
          {xError && <p className="mt-1 text-xs text-red-400">{xError}</p>}
          <p className="mt-1 text-xs text-zinc-500">
            Used by your agent to mention you, credit content, and surface your posts.
          </p>
        </div>

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
