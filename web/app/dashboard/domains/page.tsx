'use client'

import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2, CheckCircle2, Clock, Loader2, Copy, Check, Shield } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Domain {
  domain: string
  verified: boolean
  createdAt: string
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [plan, setPlan] = useState('')
  const [maxDomains, setMaxDomains] = useState(0)
  const [subdomainUrl, setSubdomainUrl] = useState('')
  const [verificationInfo, setVerificationInfo] = useState<{ domain: string; token: string; instructions: string[] } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains')
      const data = await res.json()
      if (res.ok) {
        setDomains(data.domains || [])
        setPlan(data.plan)
        setMaxDomains(data.maxDomains)
        setSubdomainUrl(data.subdomainUrl)
      } else {
        setError(data.error || 'Failed to load domains')
      }
    } catch {
      setError('Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) return
    setAdding(true)
    setError('')

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim(), action: 'add' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add domain')
        return
      }
      setVerificationInfo({ domain: data.domain, token: data.verificationToken, instructions: data.instructions })
      setNewDomain('')
      fetchDomains()
    } catch {
      setError('Network error')
    } finally {
      setAdding(false)
    }
  }

  const removeDomain = async (domain: string) => {
    try {
      await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, action: 'remove' }),
      })
      fetchDomains()
    } catch {
      setError('Failed to remove domain')
    }
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Custom Domains"
        icon={<Globe className="h-5 w-5 text-orange-400" />}
        count={domains.length}
        action={
          <div className="flex items-center gap-2">
            {plan && (
              <span className="text-[10px] uppercase tracking-widest text-orange-400 bg-red-900/20 border border-red-800 rounded px-2 py-0.5 font-mono">
                {plan}
              </span>
            )}
          </div>
        }
      />

      <DashboardContent className="max-w-5xl space-y-8">
        {error && (
          <div className="border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        {/* Subdomain */}
        {subdomainUrl && (
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Your Subdomain</div>
            <div className="flex items-center gap-3">
              <code className="text-orange-400 font-mono text-sm flex-1">{subdomainUrl}</code>
              <button
                onClick={() => copyText(`https://${subdomainUrl}`)}
                className="p-1.5 border border-zinc-800 hover:border-zinc-600"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">Your agent is accessible at this subdomain. No setup needed.</p>
          </div>
        )}

        {/* Add Domain */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Custom Domain</div>
              <p className="text-xs text-zinc-500 mt-1">
                Point your own domain to your agent. {maxDomains > 0 && `${domains.length}/${maxDomains} used.`}
              </p>
            </div>
            {plan === 'free' && (
              <span className="text-[10px] text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded px-2 py-0.5 font-mono">
                Upgrade required
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              placeholder="agent.yourdomain.com"
              className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
              disabled={domains.length >= maxDomains}
            />
            <button
              onClick={addDomain}
              disabled={adding || !newDomain.trim() || domains.length >= maxDomains}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600/10 border border-red-500/30 text-orange-400 text-xs font-bold hover:bg-red-600/20 disabled:opacity-30 transition-colors"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
        </div>

        {/* Verification Instructions */}
        {verificationInfo && (
          <div className="border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-3">DNS Setup for {verificationInfo.domain}</div>
            <ol className="text-sm text-zinc-300 space-y-2 list-decimal pl-4">
              {verificationInfo.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ol>
            <div className="mt-3 p-3 bg-zinc-900 border border-zinc-800 rounded">
              <div className="text-[10px] text-zinc-500 mb-1">Verification Token</div>
              <code className="text-xs text-orange-400 font-mono">{verificationInfo.token}</code>
            </div>
          </div>
        )}

        {/* Domain List */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-bold">Your Domains</div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : domains.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
              <Shield className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 font-mono">No custom domains</p>
              <p className="text-[10px] text-zinc-700 font-mono mt-1">Add a domain above to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {domains.map(d => (
                <div key={d.domain} className="border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {d.verified ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-400" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{d.domain}</div>
                      <div className="text-[10px] text-zinc-500">
                        {d.verified ? 'Verified · SSL active' : 'Pending verification'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDomain(d.domain)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
