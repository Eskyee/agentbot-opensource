'use client'

import { useEffect, useState } from 'react'

type XStatus = {
  app?: {
    bearerTokenConfigured?: boolean
    oauthClientConfigured?: boolean
    appKeyConfigured?: boolean
    callbackUrl?: string | null
  }
  user?: {
    connected?: boolean
    account?: {
      username?: string | null
      accountId?: string | null
      scopes?: string[] | null
    } | null
  }
}

type GitHubBotStatus = {
  configured: boolean
  account?: {
    username?: string
    email?: string
    repoAllowlist?: string[] | null
  } | null
}

export function IntegrationsTab() {
  const [loading, setLoading] = useState(true)
  const [xStatus, setXStatus] = useState<XStatus | null>(null)
  const [githubStatus, setGitHubStatus] = useState<GitHubBotStatus | null>(null)

  const [xForm, setXForm] = useState({
    accessToken: '',
    refreshToken: '',
    username: '',
    accountId: '',
    scopes: '',
  })
  const [githubForm, setGitHubForm] = useState({
    token: '',
    username: '',
    email: '',
    repoAllowlist: '',
  })

  const [xSaving, setXSaving] = useState(false)
  const [ghSaving, setGhSaving] = useState(false)
  const [xError, setXError] = useState('')
  const [ghError, setGhError] = useState('')
  const [xSaved, setXSaved] = useState(false)
  const [ghSaved, setGhSaved] = useState(false)

  const load = async () => {
    try {
      const [xStatusRes, ghRes] = await Promise.all([
        fetch('/api/x/status', { cache: 'no-store' }),
        fetch('/api/user/github-bot', { cache: 'no-store' }),
      ])

      if (xStatusRes.ok) {
        const x = await xStatusRes.json()
        setXStatus(x)
      }

      if (ghRes.ok) {
        const gh = await ghRes.json()
        setGitHubStatus(gh)
        if (gh?.account) {
          setGitHubForm((prev) => ({
            ...prev,
            username: gh.account.username || '',
            email: gh.account.email || '',
            repoAllowlist: Array.isArray(gh.account.repoAllowlist) ? gh.account.repoAllowlist.join('\n') : '',
          }))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [])

  const saveX = async () => {
    setXError('')
    setXSaving(true)
    try {
      const res = await fetch('/api/user/x-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: xForm.accessToken,
          refreshToken: xForm.refreshToken || null,
          username: xForm.username || null,
          accountId: xForm.accountId || null,
          scopes: xForm.scopes
            .split(/[\n, ]/)
            .map((scope) => scope.trim())
            .filter(Boolean),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save X account')
      setXSaved(true)
      setXForm((prev) => ({ ...prev, accessToken: '', refreshToken: '' }))
      await load()
      setTimeout(() => setXSaved(false), 2000)
    } catch (error) {
      setXError(error instanceof Error ? error.message : 'Failed to save X account')
    } finally {
      setXSaving(false)
    }
  }

  const saveGitHub = async () => {
    setGhError('')
    setGhSaving(true)
    try {
      const res = await fetch('/api/user/github-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(githubForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save GitHub bot')
      setGhSaved(true)
      setGitHubForm((prev) => ({ ...prev, token: '' }))
      await load()
      setTimeout(() => setGhSaved(false), 2000)
    } catch (error) {
      setGhError(error instanceof Error ? error.message : 'Failed to save GitHub bot')
    } finally {
      setGhSaving(false)
    }
  }

  const removeX = async () => {
    await fetch('/api/user/x-account', { method: 'DELETE' })
    await load()
  }

  const removeGitHub = async () => {
    await fetch('/api/user/github-bot', { method: 'DELETE' })
    setGitHubForm({ token: '', username: '', email: '', repoAllowlist: '' })
    await load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base sm:text-xl font-semibold">Integrations</h2>

      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">X Publishing</h3>
            <p className="text-sm text-zinc-500">
              Store a user-level X access token so your agent can monitor mentions, draft replies, and publish approved posts.
            </p>
          </div>
          <div className="text-right text-[10px] uppercase tracking-widest">
            <div className={xStatus?.app?.appKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}>
              App Credentials: {xStatus?.app?.appKeyConfigured ? 'Ready' : 'Missing'}
            </div>
            <div className={xStatus?.app?.oauthClientConfigured ? 'text-emerald-400 mt-1' : 'text-amber-400 mt-1'}>
              OAuth: {xStatus?.app?.oauthClientConfigured ? 'Ready' : 'Missing'}
            </div>
            <div className={xStatus?.user?.connected ? 'text-emerald-400 mt-1' : 'text-zinc-500 mt-1'}>
              Account: {xStatus?.user?.connected ? `@${xStatus.user?.account?.username || 'connected'}` : 'Not connected'}
            </div>
          </div>
        </div>

        {xStatus?.app?.callbackUrl ? (
          <p className="mb-4 text-[10px] text-zinc-600 font-mono break-all">{xStatus.app.callbackUrl}</p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="password"
            value={xForm.accessToken}
            onChange={(e) => setXForm({ ...xForm, accessToken: e.target.value })}
            placeholder="X user access token"
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
          <input
            type="password"
            value={xForm.refreshToken}
            onChange={(e) => setXForm({ ...xForm, refreshToken: e.target.value })}
            placeholder="X refresh token (optional)"
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
          <input
            type="text"
            value={xForm.username}
            onChange={(e) => setXForm({ ...xForm, username: e.target.value.replace(/^@/, '') })}
            placeholder="Username"
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
          <input
            type="text"
            value={xForm.accountId}
            onChange={(e) => setXForm({ ...xForm, accountId: e.target.value })}
            placeholder="Account ID"
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </div>
        <textarea
          value={xForm.scopes}
          onChange={(e) => setXForm({ ...xForm, scopes: e.target.value })}
          placeholder="tweet.read users.read tweet.write offline.access"
          rows={2}
          className="w-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
        />

        {xError ? <p className="mt-2 text-xs text-red-400">{xError}</p> : null}
        {xSaved ? <p className="mt-2 text-xs text-emerald-400">X account saved.</p> : null}

        <div className="mt-4 flex gap-3">
          <button
            onClick={saveX}
            disabled={xSaving}
            className="bg-white text-black px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {xSaving ? 'Saving...' : 'Save X Account'}
          </button>
          {xStatus?.user?.connected ? (
            <button
              onClick={removeX}
              className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">GitHub Bot Account</h3>
            <p className="text-sm text-zinc-500">
              Use a dedicated bot account with a fine-grained PAT. Agentbot will expose it through the managed vault so agents can use GitHub safely.
            </p>
          </div>
          <div className="text-right text-[10px] uppercase tracking-widest">
            <div className={githubStatus?.configured ? 'text-emerald-400' : 'text-zinc-500'}>
              GitHub Bot: {githubStatus?.configured ? 'Configured' : 'Not configured'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="password"
            value={githubForm.token}
            onChange={(e) => setGitHubForm({ ...githubForm, token: e.target.value })}
            placeholder="github_pat_... or ghp_..."
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
          <input
            type="text"
            value={githubForm.username}
            onChange={(e) => setGitHubForm({ ...githubForm, username: e.target.value })}
            placeholder="Bot username"
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
          <input
            type="email"
            value={githubForm.email}
            onChange={(e) => setGitHubForm({ ...githubForm, email: e.target.value })}
            placeholder="bot@example.com"
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
          <textarea
            value={githubForm.repoAllowlist}
            onChange={(e) => setGitHubForm({ ...githubForm, repoAllowlist: e.target.value })}
            placeholder="owner/repo-one&#10;owner/repo-two"
            rows={3}
            className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </div>

        {ghError ? <p className="mt-2 text-xs text-red-400">{ghError}</p> : null}
        {ghSaved ? <p className="mt-2 text-xs text-emerald-400">GitHub bot saved.</p> : null}

        <div className="mt-4 flex gap-3">
          <button
            onClick={saveGitHub}
            disabled={ghSaving}
            className="bg-white text-black px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {ghSaving ? 'Saving...' : 'Save GitHub Bot'}
          </button>
          {githubStatus?.configured ? (
            <button
              onClick={removeGitHub}
              className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">GitLawb</h3>
        <p className="text-sm text-zinc-500">
          GitLawb identities are agent-level rather than user-level secrets. Use the GitLawb Network and agent controls after provisioning to attach decentralized repo identity alongside GitHub.
        </p>
        <a href="/dashboard/gitlawb-network" className="inline-flex mt-4 border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors">
          Open GitLawb Network
        </a>
      </div>
    </div>
  )
}
