'use client'

import { useEffect, useState } from 'react'

interface Invite {
  code: string
  email: string
  createdAt: string
  usedAt?: string
  status: 'active' | 'used' | 'expired'
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/admin/invites')
      const data = await res.json()
      setInvites(data.invites || [])
    } catch (err) {
      setError('Failed to fetch invites')
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) throw new Error('Failed to create invite')

      const data = await res.json()
      setSuccess(`Invite created! Share this link: ${data.inviteUrl}`)
      setEmail('')
      fetchInvites()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Invite Management</h1>

        {/* Create Invite Form */}
        <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-900/50 mb-8">
          <h2 className="text-lg font-semibold mb-4">Create New Invite</h2>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-4">
              <p className="text-green-300">{success}</p>
            </div>
          )}

          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-100 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invite'}
            </button>
          </form>
        </div>

        {/* Invites List */}
        <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-4">Active Invites ({invites.length})</h2>

          {invites.length === 0 ? (
            <p className="text-zinc-400">No invites created yet</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.code}
                  className="border border-zinc-700 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-800 transition"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                        {invite.code}
                      </code>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          invite.status === 'active'
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {invite.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Created: {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join?code=${invite.code}`
                      )
                    }
                    className="ml-4 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition"
                  >
                    Copy Link
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-zinc-700 rounded-lg p-4 text-left">
            <div className="text-2xl font-bold">{invites.length}</div>
            <div className="text-sm text-zinc-400">Total Invites</div>
          </div>
          <div className="border border-zinc-700 rounded-lg p-4 text-left">
            <div className="text-2xl font-bold">
              {invites.filter((i) => i.status === 'active').length}
            </div>
            <div className="text-sm text-zinc-400">Active</div>
          </div>
          <div className="border border-zinc-700 rounded-lg p-4 text-left">
            <div className="text-2xl font-bold">
              {invites.filter((i) => i.status === 'used').length}
            </div>
            <div className="text-sm text-zinc-400">Used</div>
          </div>
        </div>
      </div>
    </div>
  )
}
