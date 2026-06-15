'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Loader2, CheckCircle2, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Feedback {
  timestamp: string
  type: string
  original: string
  correction: string
  category: string
}

const CATEGORIES = [
  { id: 'tone', label: 'Tone', desc: 'Too formal, too casual, wrong voice' },
  { id: 'accuracy', label: 'Accuracy', desc: 'Wrong facts, missing sources' },
  { id: 'format', label: 'Format', desc: 'Wrong structure, too long, too short' },
  { id: 'behavior', label: 'Behavior', desc: 'Did the wrong thing, missed context' },
  { id: 'general', label: 'General', desc: 'Other feedback' },
]

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [correction, setCorrection] = useState('')
  const [category, setCategory] = useState('general')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedback')
      const data = await res.json()
      setFeedbacks(data.feedbacks || [])
    } catch { /* silent */ }
    setLoading(false)
  }

  const submitFeedback = async () => {
    if (!message.trim() || !correction.trim()) return
    setSending(true)

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          correction: correction.trim(),
          category,
          type: 'correction',
        }),
      })
      setMessage('')
      setCorrection('')
      setSent(true)
      setTimeout(() => setSent(false), 3000)
      fetchFeedbacks()
    } catch { /* silent */ }
    setSending(false)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Feedback"
        icon={<MessageSquare className="h-5 w-5 text-yellow-400" />}
        count={feedbacks.length}
        action={
          <div className="text-[10px] text-zinc-600 font-mono">
            Corrective prompt-engineering
          </div>
        }
      />

      <DashboardContent className="max-w-5xl space-y-8">
        {/* How it works */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">How Feedback Works</div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Tell your agent what it did wrong and what it should do instead. 
            The agent stores corrections in memory and improves over time.
            &quot;Kelly&apos;s first drafts were full of emojis. I told her: no emojis. 
            She updated her memory. After a week, she nailed it.&quot;
          </p>
        </div>

        {/* Submit feedback */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-bold">Submit Correction</div>
          
          {/* Category */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`text-[10px] px-3 py-1.5 border transition-colors ${
                  category === cat.id
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">What the agent did</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                placeholder="The agent sent a tweet with 5 emojis and 3 hashtags..."
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">What it should do instead</label>
              <textarea
                value={correction}
                onChange={e => setCorrection(e.target.value)}
                rows={2}
                placeholder="No emojis. No hashtags in body. Short punchy sentences. One idea per tweet."
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>
            <button
              onClick={submitFeedback}
              disabled={sending || !message.trim() || !correction.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold hover:bg-yellow-600/20 disabled:opacity-30 transition-colors"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : sent ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {sent ? 'Saved!' : 'Submit Correction'}
            </button>
          </div>
        </div>

        {/* Feedback history */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-bold">Correction History</div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
              <MessageSquare className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 font-mono">No corrections yet</p>
              <p className="text-[10px] text-zinc-700 font-mono mt-1">Your agent is learning from your feedback</p>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbacks.map((fb, i) => (
                <div key={i} className="border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsDown className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] text-zinc-500 font-mono">{fb.category}</span>
                    <span className="text-[10px] text-zinc-700 font-mono">
                      {new Date(fb.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-red-400/70 mb-1">✗ {fb.original}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <ThumbsUp className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div className="text-xs text-emerald-400/70">✓ {fb.correction}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
