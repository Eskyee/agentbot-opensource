'use client'

import { useState } from 'react'
import { Radio, MessageSquare, ThumbsUp, ExternalLink, Filter } from 'lucide-react'

type Platform = 'all' | 'reddit' | 'twitter' | 'hacker-news' | 'discord'
type Relevance = 'all' | 'high' | 'medium' | 'low'

interface Signal {
  id: string
  platform: Exclude<Platform, 'all'>
  author: string
  content: string
  url: string
  upvotes: number
  comments: number
  date: string
  relevance: Exclude<Relevance, 'all'>
  tags: string[]
}

const SIGNALS: Signal[] = [
  {
    id: '1', platform: 'reddit', author: 'u/agentic_dev',
    content: 'Just switched my AI agent stack to OpenClaw-style architecture. The constellation view for managing 10+ agents is exactly what I needed. Anyone else doing this for creative workflows?',
    url: '#', upvotes: 847, comments: 63, date: '2026-03-14',
    relevance: 'high', tags: ['agents', 'workflow'],
  },
  {
    id: '2', platform: 'hacker-news', author: 'practitioner42',
    content: 'MCP (Model Context Protocol) is quietly becoming the standard for agent tooling. If you\'re building a SaaS on top of LLMs and not designing for MCP compatibility, you\'re already behind.',
    url: '#', upvotes: 412, comments: 89, date: '2026-03-13',
    relevance: 'high', tags: ['mcp', 'protocols'],
  },
  {
    id: '3', platform: 'twitter', author: '@ai_practitioner',
    content: 'Hot take: the next wave of AI products won\'t be chatbots. They\'ll be persistent background agents with memory, specialisation, and autonomy. The UX is still being invented.',
    url: '#', upvotes: 2841, comments: 203, date: '2026-03-13',
    relevance: 'high', tags: ['product', 'ux'],
  },
  {
    id: '4', platform: 'discord', author: 'basefm_listener',
    content: 'Using Agentbot for my DJ set management is 🔥 — it tracks bookings, prepares set lists based on venue vibe, and even handles WhatsApp replies while I\'m in the booth.',
    url: '#', upvotes: 156, comments: 28, date: '2026-03-12',
    relevance: 'high', tags: ['dj', 'testimonial'],
  },
  {
    id: '5', platform: 'reddit', author: 'u/ml_infra_eng',
    content: 'Serious question: what\'s the right database for agent memory? I\'ve tried pgvector, Pinecone, Weaviate. None feel right for session-scoped facts + long-term personality.',
    url: '#', upvotes: 391, comments: 74, date: '2026-03-12',
    relevance: 'medium', tags: ['memory', 'infra'],
  },
  {
    id: '6', platform: 'hacker-news', author: 'curious_coder',
    content: 'The "agent tax" is real — every API call through an AI agent costs 3–5x more than a direct call due to context overhead. Memory management is the core problem nobody\'s solved.',
    url: '#', upvotes: 623, comments: 112, date: '2026-03-11',
    relevance: 'medium', tags: ['cost', 'memory'],
  },
  {
    id: '7', platform: 'twitter', author: '@base_builder',
    content: 'SIWE + Base smart wallets for AI agent auth is an underrated idea. Your agent can hold crypto, sign transactions, and prove identity without a traditional password. This is the future.',
    url: '#', upvotes: 1203, comments: 87, date: '2026-03-10',
    relevance: 'high', tags: ['web3', 'auth'],
  },
  {
    id: '8', platform: 'discord', author: 'openclaw_user',
    content: 'The fleet constellation view is probably the most intuitive way I\'ve seen to visualise multi-agent systems. Feels like mission control.',
    url: '#', upvotes: 89, comments: 14, date: '2026-03-09',
    relevance: 'medium', tags: ['fleet', 'ux'],
  },
]

const PLATFORM_META: Record<Exclude<Platform, 'all'>, { label: string; color: string; bg: string }> = {
  reddit:       { label: 'Reddit',       color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/40' },
  twitter:      { label: 'Twitter/X',    color: 'text-sky-400',    bg: 'bg-sky-900/20 border-sky-800/40' },
  'hacker-news': { label: 'HN',          color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800/40' },
  discord:      { label: 'Discord',      color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800/40' },
}

const RELEVANCE_COLOR: Record<Exclude<Relevance, 'all'>, string> = {
  high:   'text-green-400 bg-green-900/20 border-green-800',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-800',
  low:    'text-gray-400 bg-gray-800 border-gray-700',
}

export default function SignalsPage() {
  const [platform, setPlatform] = useState<Platform>('all')
  const [relevance, setRelevance] = useState<Relevance>('all')

  const filtered = SIGNALS
    .filter(s => platform === 'all' || s.platform === platform)
    .filter(s => relevance === 'all' || s.relevance === relevance)
    .sort((a, b) => b.upvotes - a.upvotes)

  return (
    <div className="mt-[4rem] min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center gap-3">
        <Radio className="h-5 w-5 text-pink-400" />
        <h1 className="text-xl font-bold tracking-tight">Practitioner Signals</h1>
        <span className="text-xs text-gray-500 bg-gray-900 border border-gray-700 rounded-full px-3 py-0.5">{filtered.length} signals</span>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">Platform</span>
          </div>
          {(['all', 'reddit', 'twitter', 'hacker-news', 'discord'] as Platform[]).map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                platform === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {p === 'hacker-news' ? 'HN' : p}
            </button>
          ))}
          <div className="ml-4 flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">Relevance</span>
          </div>
          {(['all', 'high', 'medium', 'low'] as Relevance[]).map(r => (
            <button
              key={r}
              onClick={() => setRelevance(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                relevance === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Signals */}
        <div className="space-y-3">
          {filtered.map(signal => {
            const pmeta = PLATFORM_META[signal.platform]
            return (
              <div key={signal.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${pmeta.bg} ${pmeta.color}`}>{pmeta.label}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{signal.author}</span>
                      <span className="text-[10px] text-gray-600 font-mono ml-auto">{signal.date}</span>
                    </div>
                    {/* Content */}
                    <p className="text-sm text-gray-200 leading-relaxed mb-3">&ldquo;{signal.content}&rdquo;</p>
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{signal.upvotes.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{signal.comments}</span>
                      </div>
                      <div className="flex gap-1.5 ml-2 flex-wrap">
                        {signal.tags.map(t => (
                          <span key={t} className="text-[10px] text-gray-500 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">{t}</span>
                        ))}
                      </div>
                      <span className={`ml-auto text-[10px] font-semibold border rounded px-2 py-0.5 ${RELEVANCE_COLOR[signal.relevance]}`}>{signal.relevance}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
