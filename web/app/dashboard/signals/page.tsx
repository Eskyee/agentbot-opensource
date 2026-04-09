'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';
import { RefreshCw } from 'lucide-react';

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

interface SignalsData {
  generatedAt: string;
  sources: string[];
  total: number;
  signals: Signal[];
}

const PLATFORM_META: Record<Exclude<Platform, 'all'>, { label: string; color: string }> = {
  reddit:        { label: 'Reddit',  color: 'text-orange-400' },
  twitter:       { label: 'X',       color: 'text-sky-400' },
  'hacker-news': { label: 'HN',     color: 'text-yellow-400' },
  discord:       { label: 'Discord', color: 'text-blue-400' },
};

export default function SignalsPage() {
  const [data, setData] = useState<SignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform>('all');
  const [relevance, setRelevance] = useState<Relevance>('all');
  const [lastGenerated, setLastGenerated] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/signals');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
      setLastGenerated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Signals fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = (data?.signals || [])
    .filter(s => platform === 'all' || s.platform === platform)
    .filter(s => relevance === 'all' || s.relevance === relevance);

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
        action={
          <button
            onClick={fetchData}
            disabled={loading}
            className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <DashboardContent>
        {lastGenerated && (
          <p className="text-[10px] text-zinc-600 font-mono mb-4">
            Live from {data?.sources?.join(' + ')} · {lastGenerated}
          </p>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-px mb-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-3 self-center">Platform</span>
            {(['all', 'hacker-news', 'reddit'] as Platform[]).map(p => (
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

        {/* Loading */}
        {loading && !data ? (
          <div className="flex flex-col py-20 gap-4 items-center">
            <RefreshCw className="h-6 w-5 text-zinc-500 animate-spin" />
            <p className="text-zinc-600 text-xs uppercase tracking-widest">Scanning signals…</p>
          </div>
        ) : (
          <>
            {/* Signals grid */}
            <div className="space-y-px bg-zinc-800">
              {filtered.map(signal => {
                const pmeta = PLATFORM_META[signal.platform] || { label: signal.platform, color: 'text-zinc-400' };
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
                    <a href={signal.url} target="_blank" rel="noopener noreferrer" className="block">
                      <p className="text-sm text-zinc-400 leading-relaxed mb-4 hover:text-zinc-300 transition-colors">
                        {signal.content}
                      </p>
                    </a>

                    {/* Footer */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest">
                        <span>{signal.upvotes.toLocaleString()} upvotes</span>
                        <span>{signal.comments} replies</span>
                      </div>
                      <div className="flex gap-1 ml-auto flex-wrap">
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
          </>
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
