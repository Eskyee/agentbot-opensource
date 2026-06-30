'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type TokenPnl = { realizedPnl: number; unrealizedPnl: number; totalPnl: number; averageEntryPrice: number }
type TokenBalance = { symbol: string; name: string; balance: number; balanceUSD: number; price: number; pnl?: TokenPnl }
type ChainData = { chain: string; nativeBalance: string; nativeUsd: string; tokens: TokenBalance[]; total: string }
type NFT = { name: string; tokenId: string; collection: { name: string; address: string }; chain: string }
type PortfolioData = { evmAddress?: string; solAddress?: string; chains: ChainData[]; nfts: NFT[] }
type Message = { role: 'user' | 'agent'; text: string; upgrade?: boolean }
type WalletAddress = { chain: string; address: string }
type SocialAccount = { platform: string; username: string }
type WalletInfo = {
  success?: boolean
  wallets?: WalletAddress[]
  socialAccounts?: SocialAccount[]
  refCode?: string
  bankrClub?: { active: boolean; subscriptionType?: string; renewOrCancelOn?: number }
  leaderboard?: { score: number; rank: number }
}
type TeamMember = { name: string; role: string; links?: { type: string; url: string }[] }
type Product = { name: string; description: string; url?: string }
type RevenueSource = { name: string; description: string }
type ProjectUpdate = { title: string; content: string; createdAt?: string }
type AgentProfile = {
  id?: string
  slug?: string
  projectName: string
  description?: string
  approved?: boolean
  tokenAddress: string
  tokenChainId?: string
  tokenSymbol?: string
  website?: string
  teamMembers?: TeamMember[]
  products?: Product[]
  revenueSources?: RevenueSource[]
  projectUpdates?: ProjectUpdate[]
  createdAt?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UPGRADE_PHRASES = ['bankr club', 'max mode', 'membership', 'upgrade', 'subscription']
function isUpgradeMsg(text: string) {
  return UPGRADE_PHRASES.some(p => text.toLowerCase().includes(p))
}

function truncate(addr: string) {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] text-zinc-400">{value}</span>
    </div>
  )
}

function Input({
  label, value, onChange, placeholder, mono,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}

function Textarea({
  label, value, onChange, placeholder, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none"
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NoKey() {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="text-[10px] uppercase tracking-widest text-orange-500">Bankr</div>
      <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tighter">Connect your Bankr key</h1>
      <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
        Add your Bankr API key in Settings to access balances, trades, and your portfolio.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/settings"
          className="inline-flex items-center justify-center bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
        >
          Go to Settings →
        </Link>
        <a
          href="https://bankr.bot/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border border-zinc-800 px-8 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
        >
          Get API Key
        </a>
      </div>
    </div>
  )
}


function WalletCard({ info }: { info: WalletInfo }) {
  const club = info.bankrClub
  const renewDate = club?.renewOrCancelOn
    ? new Date(club.renewOrCancelOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-orange-500">Wallet</div>
        {club?.active && (
          <span className="text-[9px] uppercase tracking-widest bg-orange-500 text-black px-1.5 py-0.5">Club</span>
        )}
      </div>

      {(info.wallets ?? []).map(w => (
        <div key={w.chain} className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{w.chain}</span>
          <span className="text-[10px] text-zinc-300 font-mono" title={w.address}>{truncate(w.address)}</span>
        </div>
      ))}

      {(info.socialAccounts ?? []).length > 0 && (
        <div className="pt-1 border-t border-zinc-900 space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-700">Social</div>
          {(info.socialAccounts ?? []).map(s => (
            <div key={s.platform} className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 capitalize">{s.platform}</span>
              <span className="text-[10px] text-zinc-400">@{s.username}</span>
            </div>
          ))}
        </div>
      )}

      {club && (
        <div className="pt-1 border-t border-zinc-900 space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-700">Bankr Club</div>
          {club.subscriptionType && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 capitalize">Plan</span>
              <span className="text-[10px] text-zinc-400 capitalize">{club.subscriptionType}</span>
            </div>
          )}
          {renewDate && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">{club.active ? 'Renews' : 'Cancels'}</span>
              <span className="text-[10px] text-zinc-400">{renewDate}</span>
            </div>
          )}
        </div>
      )}

      {info.leaderboard && (
        <div className="pt-1 border-t border-zinc-900 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Rank</span>
          <span className="text-[10px] text-zinc-400">#{info.leaderboard.rank} · {info.leaderboard.score.toLocaleString()} pts</span>
        </div>
      )}

      {info.refCode && (
        <div className="pt-1 border-t border-zinc-900 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Ref code</span>
          <span className="text-[10px] text-zinc-400 font-mono">{info.refCode}</span>
        </div>
      )}
    </div>
  )
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // form state
  const [projectName, setProjectName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [website, setWebsite] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([])

  // new entry inputs
  const [newMember, setNewMember] = useState({ name: '', role: '' })
  const [newProduct, setNewProduct] = useState({ name: '', description: '', url: '' })
  const [newRevenue, setNewRevenue] = useState({ name: '', description: '' })

  // project update
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateContent, setUpdateContent] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bankr/profile')
      const data = await res.json()
      if (data.profile === null || data.id === undefined && !data.projectName) {
        setProfile(null)
        setEditing(true)
      } else {
        setProfile(data)
        populateForm(data)
      }
    } catch {
      setProfile(null)
      setEditing(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function populateForm(p: AgentProfile) {
    setProjectName(p.projectName ?? '')
    setSlug(p.slug ?? '')
    setDescription(p.description ?? '')
    setTokenAddress(p.tokenAddress ?? '')
    setWebsite(p.website ?? '')
    setTeamMembers(p.teamMembers ?? [])
    setProducts(p.products ?? [])
    setRevenueSources(p.revenueSources ?? [])
  }

  function startEdit() {
    if (profile) populateForm(profile)
    setEditing(true)
    setError(null)
    setSuccess(null)
  }

  async function save() {
    // Fall back to existing profile values if form fields were cleared
    const finalProjectName = projectName.trim() || profile?.projectName?.trim() || ''
    const finalTokenAddress = tokenAddress.trim() || profile?.tokenAddress?.trim() || ''

    if (!finalProjectName || !finalTokenAddress) {
      setError('Project name and token address are required.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    const body = {
      projectName: finalProjectName,
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      tokenAddress: finalTokenAddress,
      website: website.trim() || undefined,
      teamMembers,
      products,
      revenueSources,
    }
    try {
      const method = profile ? 'PUT' : 'POST'
      const res = await fetch('/api/bankr/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? data.message ?? `Bankr returned ${res.status}`)
      } else {
        setSuccess(profile ? 'Profile updated.' : 'Profile created.')
        await load()
        setEditing(false)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function postUpdate() {
    if (!updateTitle.trim() || !updateContent.trim()) return
    setPostingUpdate(true)
    setError(null)
    try {
      const res = await fetch('/api/bankr/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: updateTitle, content: updateContent }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to post update.')
      } else {
        setSuccess('Update posted.')
        setUpdateTitle('')
        setUpdateContent('')
        await load()
      }
    } catch {
      setError('Network error.')
    } finally {
      setPostingUpdate(false)
    }
  }

  if (loading) {
    return <div className="text-[10px] uppercase tracking-widest text-zinc-600 animate-pulse py-12 text-center">Loading profile…</div>
  }

  // ── View mode ───────────────────────────────────────────────────────────────
  if (!editing && profile) {
    return (
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold uppercase tracking-tight">{profile.projectName}</h2>
              {profile.tokenSymbol && (
                <span className="text-[10px] text-orange-500 border border-orange-500 px-1.5 py-0.5 uppercase tracking-widest">{profile.tokenSymbol}</span>
              )}
              <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 ${profile.approved ? 'bg-green-900 text-green-400' : 'bg-zinc-900 text-zinc-500'}`}>
                {profile.approved ? 'Approved' : 'Pending'}
              </span>
            </div>
            {profile.slug && <div className="text-[10px] text-zinc-600 mt-1">bankr.bot/{profile.slug}</div>}
          </div>
          <button
            onClick={startEdit}
            className="text-[10px] uppercase tracking-widest border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors shrink-0"
          >
            Edit
          </button>
        </div>

        {/* Fields */}
        <div className="border border-zinc-900 bg-zinc-950 p-5 space-y-3">
          {profile.description && <Field label="Description" value={profile.description} />}
          <Field label="Token Address" value={profile.tokenAddress} />
          {profile.tokenChainId && <Field label="Chain" value={profile.tokenChainId} />}
          {profile.website && <Field label="Website" value={profile.website} />}
          {profile.createdAt && (
            <Field label="Created" value={new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          )}
        </div>

        {/* Team */}
        {(profile.teamMembers ?? []).length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Team</div>
            {(profile.teamMembers ?? []).map((m, i) => (
              <div key={i} className="border border-zinc-900 bg-zinc-950 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{m.name}</div>
                  <div className="text-[10px] text-zinc-500">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products */}
        {(profile.products ?? []).length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Products</div>
            {(profile.products ?? []).map((p, i) => (
              <div key={i} className="border border-zinc-900 bg-zinc-950 px-4 py-3">
                <div className="text-xs font-bold text-white">{p.name}</div>
                {p.description && <div className="text-[10px] text-zinc-500 mt-0.5">{p.description}</div>}
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-500 hover:text-orange-400 mt-1 block">{p.url}</a>}
              </div>
            ))}
          </div>
        )}

        {/* Revenue */}
        {(profile.revenueSources ?? []).length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Revenue Sources</div>
            {(profile.revenueSources ?? []).map((r, i) => (
              <div key={i} className="border border-zinc-900 bg-zinc-950 px-4 py-3">
                <div className="text-xs font-bold text-white">{r.name}</div>
                {r.description && <div className="text-[10px] text-zinc-500 mt-0.5">{r.description}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Project Updates */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600">Post Update</div>
          <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
            <Input label="Title" value={updateTitle} onChange={setUpdateTitle} placeholder="v2 Launch" />
            <Textarea label="Content" value={updateContent} onChange={setUpdateContent} placeholder="Shipped…" rows={3} />
            {error && <p className="text-[10px] text-red-500">{error}</p>}
            {success && <p className="text-[10px] text-green-500">{success}</p>}
            <button
              onClick={postUpdate}
              disabled={postingUpdate || !updateTitle.trim() || !updateContent.trim()}
              className="bg-white text-black px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-40"
            >
              {postingUpdate ? 'Posting…' : 'Post Update'}
            </button>
          </div>

          {(profile.projectUpdates ?? []).length > 0 && (
            <div className="space-y-3">
              {(profile.projectUpdates ?? []).slice(0, 5).map((u, i) => (
                <div key={i} className="border border-zinc-900 bg-zinc-950 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{u.title}</span>
                    {u.createdAt && (
                      <span className="text-[10px] text-zinc-600">
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{u.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Edit / Create mode ──────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-orange-500">
          {profile ? 'Edit Profile' : 'Create Profile'}
        </div>
        {profile && (
          <button onClick={() => setEditing(false)} className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="border border-red-900 bg-red-950 px-4 py-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="border border-green-900 bg-green-950 px-4 py-3">
          <p className="text-xs text-green-400">{success}</p>
        </div>
      )}

      {/* Core fields */}
      <div className="border border-zinc-900 bg-zinc-950 p-5 space-y-4">
        <Input label="Project Name *" value={projectName} onChange={setProjectName} placeholder="My Agent" />
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-zinc-600">Slug</label>
          <div className="flex items-center border border-zinc-800 focus-within:border-zinc-600 bg-black">
            <span className="px-3 text-[10px] text-zinc-600 select-none">bankr.bot/</span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="agentbot"
              className="flex-1 bg-transparent px-0 py-2 pr-3 text-xs text-white placeholder:text-zinc-700 focus:outline-none"
            />
          </div>
        </div>
        <Input label="Token Address *" value={tokenAddress} onChange={setTokenAddress} placeholder="0x1234…abcd" mono />
        <Textarea label="Description" value={description} onChange={setDescription} placeholder="AI trading agent" />
        <Input label="Website" value={website} onChange={setWebsite} placeholder="https://myagent.com" />
        <p className="text-[10px] text-zinc-700 leading-relaxed">
          Token chain, symbol, and linked Twitter are populated automatically by Bankr.
        </p>
      </div>

      {/* Team Members */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Team Members</div>
        {teamMembers.map((m, i) => (
          <div key={i} className="border border-zinc-900 bg-zinc-950 px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-white">{m.name}</div>
              <div className="text-[10px] text-zinc-500">{m.role}</div>
            </div>
            <button
              onClick={() => setTeamMembers(prev => prev.filter((_, j) => j !== i))}
              className="text-[10px] text-zinc-600 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={newMember.name} onChange={v => setNewMember(p => ({ ...p, name: v }))} placeholder="Alice" />
            <Input label="Role" value={newMember.role} onChange={v => setNewMember(p => ({ ...p, role: v }))} placeholder="Lead Dev" />
          </div>
          <button
            onClick={() => {
              if (!newMember.name.trim() || !newMember.role.trim()) return
              setTeamMembers(p => [...p, { name: newMember.name, role: newMember.role }])
              setNewMember({ name: '', role: '' })
            }}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5 hover:border-zinc-600"
          >
            + Add Member
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Products</div>
        {products.map((p, i) => (
          <div key={i} className="border border-zinc-900 bg-zinc-950 px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-white">{p.name}</div>
              {p.description && <div className="text-[10px] text-zinc-500">{p.description}</div>}
              {p.url && <div className="text-[10px] text-orange-500">{p.url}</div>}
            </div>
            <button
              onClick={() => setProducts(prev => prev.filter((_, j) => j !== i))}
              className="text-[10px] text-zinc-600 hover:text-red-500 transition-colors shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
          <Input label="Name" value={newProduct.name} onChange={v => setNewProduct(p => ({ ...p, name: v }))} placeholder="Swap Engine" />
          <Input label="Description" value={newProduct.description} onChange={v => setNewProduct(p => ({ ...p, description: v }))} placeholder="Optimized DEX routing" />
          <Input label="URL (optional)" value={newProduct.url} onChange={v => setNewProduct(p => ({ ...p, url: v }))} placeholder="https://myagent.com/swap" />
          <button
            onClick={() => {
              if (!newProduct.name.trim() || !newProduct.description.trim()) return
              setProducts(p => [...p, { name: newProduct.name, description: newProduct.description, url: newProduct.url || undefined }])
              setNewProduct({ name: '', description: '', url: '' })
            }}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5 hover:border-zinc-600"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Revenue Sources */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Revenue Sources</div>
        {revenueSources.map((r, i) => (
          <div key={i} className="border border-zinc-900 bg-zinc-950 px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-white">{r.name}</div>
              {r.description && <div className="text-[10px] text-zinc-500">{r.description}</div>}
            </div>
            <button
              onClick={() => setRevenueSources(prev => prev.filter((_, j) => j !== i))}
              className="text-[10px] text-zinc-600 hover:text-red-500 transition-colors shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
          <Input label="Name" value={newRevenue.name} onChange={v => setNewRevenue(p => ({ ...p, name: v }))} placeholder="Trading fees" />
          <Input label="Description" value={newRevenue.description} onChange={v => setNewRevenue(p => ({ ...p, description: v }))} placeholder="0.3% on each swap" />
          <button
            onClick={() => {
              if (!newRevenue.name.trim() || !newRevenue.description.trim()) return
              setRevenueSources(p => [...p, { name: newRevenue.name, description: newRevenue.description }])
              setNewRevenue({ name: '', description: '' })
            }}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5 hover:border-zinc-600"
          >
            + Add Revenue Source
          </button>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-40"
      >
        {saving ? 'Saving…' : profile ? 'Save Changes' : 'Create Profile'}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BankrPage() {
  const [loading, setLoading] = useState(true)
  const [noKey, setNoKey] = useState(false)
  const [tab, setTab] = useState<'trade' | 'profile'>('trade')
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [balanceUnavailable, setBalanceUnavailable] = useState(false)
  const [showPnl, setShowPnl] = useState(false)
  const [showNfts, setShowNfts] = useState(false)
  const [showLowValue, setShowLowValue] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendRecipient, setSendRecipient] = useState('')
  const [sendToken, setSendToken] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendNative, setSendNative] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [sendLoading, setSendLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | undefined>(undefined)
  const [processingStatus, setProcessingStatus] = useState<string>('Bankr is working…')
  const [threadId, setThreadId] = useState<string | undefined>(undefined)
  const bottomRef = useRef<HTMLDivElement>(null)

  function parsePortfolio(d: Record<string, unknown>): PortfolioData {
    const raw = (d.balances ?? {}) as Record<string, {
      nativeBalance?: string; nativeUsd?: string; total?: string;
      tokenBalances?: { token?: { balance?: number; balanceUSD?: number; baseToken?: { symbol?: string; name?: string; price?: number }; pnl?: TokenPnl } }[]
    }>
    const chains: ChainData[] = Object.entries(raw).map(([chain, cd]) => ({
      chain,
      nativeBalance: cd.nativeBalance ?? '0',
      nativeUsd: cd.nativeUsd ?? '0',
      total: cd.total ?? '0',
      tokens: (cd.tokenBalances ?? []).map(tb => ({
        symbol: tb.token?.baseToken?.symbol ?? '?',
        name: tb.token?.baseToken?.name ?? '',
        balance: tb.token?.balance ?? 0,
        balanceUSD: tb.token?.balanceUSD ?? 0,
        price: tb.token?.baseToken?.price ?? 0,
        pnl: tb.token?.pnl,
      })),
    }))
    return {
      evmAddress: d.evmAddress as string | undefined,
      solAddress: d.solAddress as string | undefined,
      chains,
      nfts: (d.nfts ?? []) as NFT[],
    }
  }

  async function fetchPortfolio() {
    setPortfolioLoading(true)
    const include: string[] = []
    if (showPnl) include.push('pnl')
    if (showNfts) include.push('nfts')
    const params = new URLSearchParams()
    if (include.length) params.set('include', include.join(','))
    if (showLowValue) params.set('showLowValueTokens', 'true')
    const qs = params.toString()
    try {
      const res = await fetch(`/api/bankr/balances${qs ? `?${qs}` : ''}`)
      const d = await res.json()
      if (d.needsKey) { setNoKey(true); return }
      if (d.error) { setBalanceUnavailable(true) }
      else { setPortfolio(parsePortfolio(d)); setBalanceUnavailable(false) }
    } catch {
      setBalanceUnavailable(true)
    } finally {
      setPortfolioLoading(false)
    }
  }

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/bankr/wallet-info').then(r => r.json()),
      fetch('/api/bankr/balances').then(r => r.json()),
    ]).then(([walletRes, balancesRes]) => {
      if (walletRes.status === 'fulfilled') {
        const d = walletRes.value
        if (d.needsKey) { setNoKey(true); return }
        if (!d.error) setWalletInfo(d)
      }

      if (balancesRes.status === 'fulfilled') {
        const d = balancesRes.value
        if (d.needsKey) { setNoKey(true); return }
        if (d.error) { setBalanceUnavailable(true) }
        else { setPortfolio(parsePortfolio(d)) }
      }
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) fetchPortfolio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPnl, showNfts, showLowValue])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendTransfer() {
    if (!sendRecipient.trim() || !sendAmount.trim()) return
    if (!sendNative && !sendToken.trim()) { setSendError('Token address required for ERC20 transfers.'); return }
    setSendLoading(true)
    setSendError(null)
    setSendResult(null)
    try {
      const res = await fetch('/api/bankr/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: sendNative ? '0x0000000000000000000000000000000000000000' : sendToken,
          recipientAddress: sendRecipient,
          amount: sendAmount,
          isNativeToken: sendNative,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setSendError(data.error ?? `Error ${res.status}`)
      } else {
        setSendResult(data.txHash ?? data.transactionHash ?? 'Transaction submitted.')
        setSendRecipient('')
        setSendToken('')
        setSendAmount('')
      }
    } catch {
      setSendError('Network error.')
    } finally {
      setSendLoading(false)
    }
  }

  async function cancelJob() {
    if (!activeJobId) return
    try {
      await fetch(`/api/bankr/cancel?jobId=${activeJobId}`, { method: 'POST' })
    } catch { /* ignore */ }
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text }])
    setSending(true)
    setProcessingStatus('Bankr is working…')
    setActiveJobId(undefined)

    try {
      const res = await fetch('/api/bankr/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, threadId }),
      })
      const data = await res.json()

      if (data.needsKey) { setNoKey(true); return }

      // 429 rate limit — show reset time if available
      if (res.status === 429 || data.error?.toLowerCase().includes('limit')) {
        const resetAt: number | undefined = data.resetAt
        const resetMsg = resetAt
          ? ` Resets at ${new Date(resetAt).toLocaleTimeString()}.`
          : ''
        setMessages(m => [...m, { role: 'agent', text: `Daily message limit reached.${resetMsg} Upgrade at bankr.bot for 1,000/day.`, upgrade: true }])
        return
      }

      if (data.error) {
        setMessages(m => [...m, { role: 'agent', text: data.error, upgrade: isUpgradeMsg(data.error) }])
        return
      }

      const jobId: string = data.jobId ?? data.job_id
      const newThreadId: string | undefined = data.threadId ?? data.thread_id

      if (newThreadId) setThreadId(newThreadId)
      if (jobId) setActiveJobId(jobId)

      if (!jobId) {
        const reply = data.result ?? data.message ?? data.response ?? JSON.stringify(data)
        const replyText = typeof reply === 'string' ? reply : JSON.stringify(reply)
        setMessages(m => [...m, { role: 'agent', text: replyText, upgrade: isUpgradeMsg(replyText) }])
        return
      }

      let attempts = 0
      let lastUpdateCount = 0
      const poll = async () => {
        if (attempts++ > 150) {
          setMessages(m => [...m, { role: 'agent', text: 'Request timed out. Please try again.' }])
          return
        }
        const r = await fetch(`/api/bankr/prompt?jobId=${jobId}`)
        const d = await r.json()

        // Show new status updates
        const updates: { message: string }[] = d.statusUpdates ?? []
        if (updates.length > lastUpdateCount) {
          const latest = updates[updates.length - 1]?.message
          if (latest) setProcessingStatus(latest)
          lastUpdateCount = updates.length
        }

        if (d.status === 'completed' || d.status === 'done' || d.result) {
          setActiveJobId(undefined)
          const reply = d.result ?? d.response ?? d.message ?? JSON.stringify(d)
          const replyText = typeof reply === 'string' ? reply : JSON.stringify(reply, null, 2)
          setMessages(m => [...m, { role: 'agent', text: replyText, upgrade: isUpgradeMsg(replyText) }])
        } else if (d.status === 'failed' || d.status === 'error') {
          setActiveJobId(undefined)
          const replyText = d.error ?? 'Something went wrong.'
          setMessages(m => [...m, { role: 'agent', text: replyText, upgrade: isUpgradeMsg(replyText) }])
        } else if (d.status === 'cancelled') {
          setActiveJobId(undefined)
          setMessages(m => [...m, { role: 'agent', text: 'Job cancelled.' }])
        } else {
          setTimeout(poll, 2000)
        }
      }
      await poll()
    } catch {
      setMessages(m => [...m, { role: 'agent', text: 'Network error. Please try again.' }])
    } finally {
      setSending(false)
      setActiveJobId(undefined)
      setProcessingStatus('Bankr is working…')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 animate-pulse">Loading Bankr…</div>
      </div>
    )
  }

  if (noKey) return <NoKey />

  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10">

        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-zinc-900 mb-8">
          {(['trade', 'profile'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-[10px] uppercase tracking-widest transition-colors ${
                tab === t
                  ? 'text-white border-b border-white -mb-px'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {t === 'trade' ? 'Trade' : 'Agent Profile'}
            </button>
          ))}
        </div>

        {tab === 'trade' ? (
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-4">
              {walletInfo && <WalletCard info={walletInfo} />}

              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">Portfolio</div>
                {portfolioLoading && <div className="text-[9px] text-zinc-700 animate-pulse">Loading…</div>}
              </div>

              {/* Portfolio toggles */}
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'pnl', label: 'PnL', val: showPnl, toggle: () => setShowPnl(v => !v) },
                    { key: 'nfts', label: 'NFTs', val: showNfts, toggle: () => setShowNfts(v => !v) },
                    { key: 'low', label: 'Low Value', val: showLowValue, toggle: () => setShowLowValue(v => !v) },
                  ] as { key: string; label: string; val: boolean; toggle: () => void }[]
                ).map(({ key, label, val, toggle }) => (
                  <button
                    key={key}
                    onClick={toggle}
                    className={`text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors ${
                      val ? 'border-orange-500 text-orange-500' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {balanceUnavailable ? (
                <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-2">
                  <p className="text-[10px] text-zinc-600 leading-relaxed">Portfolio data not available. Add your personal Bankr key in Settings for full access.</p>
                  <a href="https://bankr.bot" target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-500 hover:text-orange-400 transition-colors">bankr.bot →</a>
                </div>
              ) : !portfolio || portfolio.chains.length === 0 ? (
                <p className="text-xs text-zinc-600">No balances found.</p>
              ) : (
                portfolio.chains
                .filter(c => parseFloat(c.total || '0') >= 0.01)
                .map(c => (
                  <div key={c.chain} className="border border-zinc-900 bg-zinc-950 p-4 space-y-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] uppercase tracking-widest text-orange-500">{c.chain}</div>
                      <div className="text-[10px] text-zinc-500">${parseFloat(c.total || '0').toLocaleString()}</div>
                    </div>

                    {/* Native balance */}
                    {parseFloat(c.nativeBalance) > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Native</span>
                        <div className="text-right">
                          <div className="text-[10px] text-zinc-300">{parseFloat(c.nativeBalance).toFixed(4)}</div>
                          <div className="text-[9px] text-zinc-600">${parseFloat(c.nativeUsd || '0').toLocaleString()}</div>
                        </div>
                      </div>
                    )}

                    {/* Token balances */}
                    {c.tokens.length === 0 ? (
                      <p className="text-[10px] text-zinc-700 pt-2">No tokens</p>
                    ) : (
                      c.tokens.map(t => (
                        <div key={t.symbol} className="py-1.5 border-b border-zinc-900 last:border-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white">{t.symbol}</span>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-300">{t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                              <div className="text-[9px] text-zinc-600">${t.balanceUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                            </div>
                          </div>
                          {showPnl && t.pnl && (
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[9px] text-zinc-700">PnL</span>
                              <span className={`text-[9px] ${t.pnl.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {t.pnl.totalPnl >= 0 ? '+' : ''}${t.pnl.totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ))
              )}

              {/* NFTs */}
              {showNfts && portfolio && portfolio.nfts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">NFTs</div>
                  {portfolio.nfts.map((n, i) => (
                    <div key={i} className="border border-zinc-900 bg-zinc-950 px-3 py-2">
                      <div className="text-[10px] text-white">{n.name}</div>
                      <div className="text-[9px] text-zinc-600">{n.collection.name} · {n.chain}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Send */}
              <button
                onClick={() => { setSendOpen(o => !o); setSendError(null); setSendResult(null) }}
                className={`w-full text-center border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors ${
                  sendOpen ? 'border-orange-500 text-orange-500' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
                }`}
              >
                {sendOpen ? 'Cancel Send' : 'Send →'}
              </button>

              {sendOpen && (
                <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">Transfer (Base)</div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendNative}
                        onChange={e => setSendNative(e.target.checked)}
                        className="accent-orange-500"
                      />
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Native ETH</span>
                    </label>
                  </div>

                  {!sendNative && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-600">Token Address</label>
                      <input
                        value={sendToken}
                        onChange={e => setSendToken(e.target.value)}
                        placeholder="0x833589…"
                        className="w-full bg-black border border-zinc-800 px-3 py-2 text-[10px] text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600">Recipient</label>
                    <input
                      value={sendRecipient}
                      onChange={e => setSendRecipient(e.target.value)}
                      placeholder="0x1234…"
                      className="w-full bg-black border border-zinc-800 px-3 py-2 text-[10px] text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600">Amount</label>
                    <input
                      value={sendAmount}
                      onChange={e => setSendAmount(e.target.value)}
                      placeholder="100"
                      className="w-full bg-black border border-zinc-800 px-3 py-2 text-[10px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  {sendError && <p className="text-[9px] text-red-500">{sendError}</p>}
                  {sendResult && (
                    <p className="text-[9px] text-green-500 font-mono break-all">
                      {sendResult.startsWith('0x') ? `tx: ${sendResult}` : sendResult}
                    </p>
                  )}

                  <button
                    onClick={sendTransfer}
                    disabled={sendLoading || !sendRecipient.trim() || !sendAmount.trim()}
                    className="w-full bg-white text-black py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-40"
                  >
                    {sendLoading ? 'Sending…' : 'Confirm Send'}
                  </button>
                </div>
              )}

              <Link
                href="/settings"
                className="block text-center border border-zinc-800 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
              >
                Manage Key
              </Link>
            </aside>

            {/* Chat panel */}
            <section className="flex flex-col border border-zinc-900 bg-zinc-950">
              <div className="border-b border-zinc-900 px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-orange-500">Bankr</div>
                  <div className="text-sm font-bold uppercase tracking-tight mt-0.5">Natural Language Wallet</div>
                </div>
                <button
                  onClick={() => { setMessages([]); setThreadId(undefined) }}
                  className="text-[9px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  New Thread
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[340px] max-h-[520px]">
                {messages.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">Try asking:</p>
                    {[
                      "What's my ETH balance on Base?",
                      'Buy $20 of USDC on Base',
                      'Show my full portfolio',
                      'Swap 0.01 ETH for USDC',
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="block text-left text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-900 hover:border-zinc-700 px-3 py-2 w-full"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-zinc-800 text-white' : 'border border-zinc-800 text-zinc-300'
                    }`}>
                      {m.role === 'agent' && (
                        <div className="text-[9px] uppercase tracking-widest text-orange-500 mb-1">Bankr</div>
                      )}
                      {m.text}
                      {m.upgrade && (
                        <a
                          href="https://bankr.bot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-1 text-[10px] uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
                        >
                          Upgrade at bankr.bot →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="border border-zinc-800 px-4 py-3 space-y-2">
                      <div className="text-[10px] text-zinc-600 animate-pulse">{processingStatus}</div>
                      {activeJobId && (
                        <button
                          onClick={cancelJob}
                          className="text-[9px] uppercase tracking-widest text-zinc-700 hover:text-red-500 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-zinc-900 p-4 flex gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Buy $50 of ETH on Base…"
                  disabled={sending}
                  className="flex-1 bg-black border border-zinc-800 px-4 py-3 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="bg-white text-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </section>
          </div>
        ) : (
          <ProfileTab />
        )}
      </div>
    </main>
  )
}
