'use client'

import { useState } from 'react'

interface SecurityTabProps {
  twoFactorEnabled: boolean
}

export function SecurityTab({ twoFactorEnabled }: SecurityTabProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

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
          newPassword: passwordForm.new,
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
    } catch {
      setPasswordError('Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const enable2FA = async () => {
    alert('2FA setup is coming soon! This will require scanning a QR code with an authenticator app like Google Authenticator or Authy.')
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

  return (
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
                  onKeyDown={(e) => e.key === 'Enter' && savePassword()}
                />
              </div>
              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
              {passwordSuccess && <p className="text-green-400 text-xs">Password changed successfully!</p>}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePassword}
                  disabled={passwordLoading}
                  className="flex-1 bg-white text-black px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {passwordLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
