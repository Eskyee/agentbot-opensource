'use client';

import { useState } from 'react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import { SectionHeader } from '@/app/components/shared/SectionHeader';
import StatusPill from '@/app/components/shared/StatusPill';

type Platform = 'all' | 'reddit' | 'twitter' | 'hacker-news' | 'discord';
type Relevance = 'all' | 'high' | 'medium' | 'low';

interface Signal {
  id: string;
  platform: Exclude<Platform, 'all'>;
  author: string;
  content: string;
  url: string;
  upvotes: number;
  comments: number;
  date: string;
  relevance: Exclude<Relevance, 'all'>;
  tags: string[];
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
    content: 'Using Agentbot for my DJ set management — it tracks bookings, prepares set lists based on venue vibe, and even handles WhatsApp replies while I\'m in the booth.',
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
];

const PLATFORM_META: Record<Exclude<Platform, 'all'>, { label: string; color: string }> = {
  reddit:        { label: 'Reddit',  color: 'text-orange-400' },
  twitter:       { label: 'X',       color: 'text-sky-400' },
  'hacker-news': { label: 'HN',     color: 'text-yellow-400' },
  discord:       { label: 'Discord', color: 'text-blue-400' },
};

export default function SignalsPage() {
  const [platform, setPlatform] = useState<Platform>('all');
  const [relevance, setRelevance] = useState<Relevance>('all');

  const filtered = SIGNALS
    .filter(s => platform === 'all' || s.platform === platform)
    .filter(s => relevance === 'all' || s.relevance === relevance)
    .sort((a, b) => b.upvotes - a.upvotes);

  return (
    <DashboardShell>
      <DashboardHeader
        title="Signals"
        icon={
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        }
        count={filtered.length}
      />

      <DashboardContent>
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-px mb-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-3 self-center">Platform</span>
            {(['all', 'reddit', 'twitter', 'hacker-news', 'discord'] as Platform[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  platform === p
                    ? 'bg-white text-black border-white'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {p === 'hacker-news' ? 'HN' : p}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-px">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-3 self-center">Relevance</span>
            {(['all', 'high', 'medium', 'low'] as Relevance[]).map(r => (
              <button
                key={r}
                onClick={() => setRelevance(r)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  relevance === r
                    ? 'bg-white text-black border-white'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Signals grid */}
        <div className="space-y-px bg-zinc-800">
          {filtered.map(signal => {
            const pmeta = PLATFORM_META[signal.platform];
            return (
              <div key={signal.id} className="bg-black p-5">
                {/* Meta row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${pmeta.color}`}>
                    {pmeta.label}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">{signal.author}</span>
                  <span className="text-[10px] text-zinc-700 font-mono ml-auto">{signal.date}</span>
                </div>

                {/* Content */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  &ldquo;{signal.content}&rdquo;
                </p>

                {/* Footer */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest">
                    <span>{signal.upvotes.toLocaleString()} upvotes</span>
                    <span>{signal.comments} replies</span>
                  </div>
                  <div className="flex gap-1 ml-auto">
                    {signal.tags.map(t => (
                      <span key={t} className="text-[10px] text-zinc-600 border border-zinc-800 px-1.5 py-0.5 uppercase tracking-widest">
                        {t}
                      </span>
                    ))}
                  </div>
                  <StatusPill
                    status={signal.relevance === 'high' ? 'active' : signal.relevance === 'medium' ? 'idle' : 'offline'}
                    label={signal.relevance}
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
            <p className="text-zinc-600 text-xs">No signals match your filters.</p>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
