'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface XMention {
  id: string
  author: string
  authorUsername: string
  text: string
  createdAt: string
  url: string
  state: string
}

interface XDraft {
  id: string
  mentionId: string | null
  sourceText: string
  draftText: string
  tone: string
  status: 'draft' | 'approved' | 'rejected' | 'published'
  createdAt: string
  updatedAt: string
  scheduledFor: string | null
  publishedPostId: string | null
  publishedUrl: string | null
}

export default function XAgentPage() {
  const [mentions, setMentions] = useState<XMention[]>([])
  const [drafts, setDrafts] = useState<XDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [draftingId, setDraftingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [xConnected, setXConnected] = useState<boolean | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, mentionsRes, draftsRes] = await Promise.all([
        fetch('/api/x/status'),
        fetch('/api/x/mentions'),
        fetch('/api/x/drafts'),
      ])

      const statusData = await statusRes.json()
      setXConnected(statusData?.user?.connected ?? false)

      if (mentionsRes.ok) {
        const data = await mentionsRes.json()
        setMentions(data.mentions || [])
      }

      if (draftsRes.ok) {
        const data = await draftsRes.json()
        setDrafts(data.drafts || [])
      }
    } catch (e) {
      console.error('Failed to fetch X data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Draft a reply to a mention
  async function handleDraftReply(mention: XMention) {
    setDraftingId(mention.id)
    try {
      const res = await fetch('/api/x/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: mention.text,
          tone: 'direct',
          mentionId: mention.id,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDrafts((prev) => {
          const existing = new Set(prev.map((d) => d.id))
          const newDrafts = (data.drafts || []).filter(
            (d: XDraft) => !existing.has(d.id)
          )
          return [...newDrafts, ...prev]
        })
      }
    } catch (e) {
      console.error('Draft failed:', e)
    } finally {
      setDraftingId(null)
    }
  }

  // Approve a draft
  async function handleApprove(draftId: string) {
    setActionLoading(draftId)
    try {
      const scheduledFor = new Date(Date.now() + 120_000).toISOString()
      const res = await fetch(`/api/x/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', scheduledFor }),
      })
      if (res.ok) {
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === draftId
              ? { ...d, status: 'approved' as const, scheduledFor }
              : d
          )
        )
      }
    } catch (e) {
      console.error('Approve failed:', e)
    } finally {
      setActionLoading(null)
    }
  }

  // Reject (delete) a draft
  async function handleReject(draftId: string) {
    setActionLoading(draftId)
    try {
      const res = await fetch(`/api/x/drafts/${draftId}`, { method: 'DELETE' })
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== draftId))
      }
    } catch (e) {
      console.error('Reject failed:', e)
    } finally {
      setActionLoading(null)
    }
  }

  // Start editing a draft
  function handleStartEdit(draft: XDraft) {
    setEditingId(draft.id)
    setEditText(draft.draftText)
  }

  // Save edited draft
  async function handleSaveEdit(draftId: string) {
    setActionLoading(draftId)
    try {
      const res = await fetch(`/api/x/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftText: editText }),
      })
      if (res.ok) {
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === draftId ? { ...d, draftText: editText } : d
          )
        )
        setEditingId(null)
        setEditText('')
      }
    } catch (e) {
      console.error('Edit failed:', e)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter drafts by status
  const queueDrafts = drafts.filter((d) => d.status === 'draft' || d.status === 'approved')
  const publishedDrafts = drafts.filter((d) => d.status === 'published')

  // Mentions that already have a draft (to disable the button)
  const mentionDraftIds = new Set(drafts.filter((d) => d.mentionId).map((d) => d.mentionId))

  // X not connected state
  if (xConnected === false) {
    return (
      <DashboardShell>
        <DashboardHeader
          title="X Agent"
          icon={<span className="text-orange-500 text-lg font-bold">𝕏</span>}
        />
        <DashboardContent className="max-w-4xl">
          <div className="border border-zinc-800 bg-zinc-950 py-20 text-center mt-6">
            <span className="text-5xl mb-4 block">𝕏</span>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-2">
              Connect Your X Account
            </h3>
            <p className="text-xs text-zinc-500 mb-6 max-w-md mx-auto">
              Your agent needs access to your X account to monitor mentions and draft replies.
            </p>
            <a
              href="/api/x/oauth/start"
              className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Connect X Account
            </a>
          </div>
        </DashboardContent>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="X Agent"
        icon={<span className="text-orange-500 text-lg font-bold">𝕏</span>}
        count={queueDrafts.length}
        action={
          <button
            onClick={fetchData}
            className="border border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-400 uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
          >
            Refresh
          </button>
        }
      />

      <DashboardContent className="max-w-6xl space-y-8">
        {/* ━━━ Mentions ━━━ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Mentions</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight mt-1">
                Recent Mentions
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{mentions.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-px">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-zinc-950 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : mentions.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 py-12 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">
                No mentions yet — your agent is watching
              </p>
            </div>
          ) : (
            <div className="space-y-px">
              {mentions.map((mention) => {
                const hasDraft = mentionDraftIds.has(mention.id)
                return (
                  <div
                    key={mention.id}
                    className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">
                            @{mention.authorUsername}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {new Date(mention.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {mention.state === 'resolved' && (
                            <span className="text-[8px] uppercase tracking-widest text-green-500 border border-green-500/30 px-1.5 py-0.5">
                              Done
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {mention.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasDraft ? (
                          <span className="text-[10px] text-zinc-600 uppercase tracking-widest px-3 py-1.5 border border-zinc-800">
                            Drafted
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDraftReply(mention)}
                            disabled={draftingId === mention.id}
                            className="text-[10px] text-orange-500 uppercase tracking-widest px-3 py-1.5 border border-orange-500/30 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
                          >
                            {draftingId === mention.id ? 'Drafting...' : 'Draft Reply'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ━━━ Draft Queue ━━━ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Draft Queue</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight mt-1">
                Awaiting Approval
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{queueDrafts.length} drafts</span>
          </div>

          {queueDrafts.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 py-12 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">
                No drafts yet — your agent will auto-draft from mentions every 15 min
              </p>
            </div>
          ) : (
            <div className="space-y-px">
              {queueDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5 hover:border-zinc-700 transition-colors"
                >
                  {/* Source mention */}
                  <div className="mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                      Replying to
                    </span>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {draft.sourceText}
                    </p>
                  </div>

                  {/* Draft text (editable) */}
                  {editingId === draft.id ? (
                    <div className="mb-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={280}
                        className="w-full bg-black border border-zinc-700 p-3 text-sm text-white font-mono resize-none focus:border-orange-500 focus:outline-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-zinc-600 font-mono">
                          {editText.length}/280
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingId(null); setEditText('') }}
                            className="text-[10px] text-zinc-500 uppercase tracking-widest px-3 py-1 border border-zinc-800 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(draft.id)}
                            disabled={actionLoading === draft.id}
                            className="text-[10px] text-white uppercase tracking-widest px-3 py-1 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black border border-zinc-800 p-3 mb-3">
                      <p className="text-sm text-white leading-relaxed">
                        {draft.draftText}
                      </p>
                    </div>
                  )}

                  {/* Status + Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 border ${
                          draft.status === 'approved'
                            ? 'text-green-500 border-green-500/30'
                            : 'text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {draft.status}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {draft.draftText.length} chars
                      </span>
                    </div>

                    {draft.status === 'draft' && editingId !== draft.id && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(draft)}
                          className="text-[10px] text-zinc-500 uppercase tracking-widest px-3 py-1.5 border border-zinc-800 hover:text-white hover:border-zinc-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleReject(draft.id)}
                          disabled={actionLoading === draft.id}
                          className="text-[10px] text-red-500 uppercase tracking-widest px-3 py-1.5 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(draft.id)}
                          disabled={actionLoading === draft.id}
                          className="text-[10px] text-green-500 uppercase tracking-widest px-3 py-1.5 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === draft.id ? 'Saving...' : 'Approve'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ━━━ Published ━━━ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Published</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight mt-1">
                Live on X
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{publishedDrafts.length} posted</span>
          </div>

          {publishedDrafts.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 py-12 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">
                Nothing published yet — approve a draft to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-px">
              {publishedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {draft.draftText}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-green-500 uppercase tracking-widest">
                          ✓ Published
                        </span>
                        {draft.publishedUrl && (
                          <a
                            href={draft.publishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors"
                          >
                            View on X →
                          </a>
                        )}
                        <span className="text-[10px] text-zinc-600">
                          {new Date(draft.updatedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </DashboardContent>
    </DashboardShell>
  )
}
