'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface XStatusResponse {
  app?: {
    bearerTokenConfigured?: boolean;
    oauthClientConfigured?: boolean;
    appKeyConfigured?: boolean;
    callbackUrl?: string | null;
  };
  user?: {
    connected?: boolean;
    account?: {
      username?: string | null;
      accountId?: string | null;
      scopes?: string[] | null;
    } | null;
  };
}

interface XDraft {
  id: string;
  sourceText: string;
  draftText: string;
  tone: string;
  status: 'draft' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedPostId?: string | null;
  publishedUrl?: string | null;
}

interface ManagedAgentEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

interface ManagedSession {
  id: string;
  title: string;
  type: string;
  workflowRunId?: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatManagedEventLabel(type: string) {
  return type.replace(/\./g, ' ');
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
  const [xStatus, setXStatus] = useState<XStatusResponse | null>(null);
  const [drafts, setDrafts] = useState<XDraft[]>([]);
  const [draftSourceText, setDraftSourceText] = useState('');
  const [draftTone, setDraftTone] = useState('direct');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [managedSessionId, setManagedSessionId] = useState<string | null>(null);
  const [managedRunId, setManagedRunId] = useState<string | null>(null);
  const [managedEvents, setManagedEvents] = useState<ManagedAgentEvent[]>([]);
  const [managedTailing, setManagedTailing] = useState(false);
  const [managedSessions, setManagedSessions] = useState<ManagedSession[]>([]);
  const [platform, setPlatform] = useState<Platform>('all');
  const [relevance, setRelevance] = useState<Relevance>('all');
  const [lastGenerated, setLastGenerated] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    const loadXStatus = async () => {
      try {
        const res = await fetch('/api/x/status', { cache: 'no-store' });
        if (!res.ok) return;
        setXStatus(await res.json());
      } catch (e) {
        console.error('X status fetch failed:', e);
      }
    };

    loadXStatus();
  }, []);

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('/api/x/drafts', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
      } catch (e) {
        console.error('X drafts fetch failed:', e);
      }
    };

    loadDrafts();
  }, []);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/x/drafts', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
    } catch (e) {
      console.error('X drafts fetch failed:', e);
    }
  }, []);

  const loadManagedSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/managed-agents/session', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setManagedSessions(Array.isArray(json?.sessions) ? json.sessions : []);
    } catch (e) {
      console.error('Managed sessions fetch failed:', e);
    }
  }, []);

  const connectToStream = useCallback((runId: string) => {
    eventSourceRef.current?.close();

    const es = new EventSource(`/api/readable/${runId}`);
    eventSourceRef.current = es;
    setManagedTailing(true);

    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as ManagedAgentEvent;
        if (seenIdsRef.current.has(event.id)) return;
        seenIdsRef.current.add(event.id);
        setManagedEvents((prev) => [...prev, event]);

        if (event.type === 'approval.required' || event.type === 'draft.generated') {
          void loadDrafts();
        }
      } catch (error) {
        console.error('Managed event parse failed:', error);
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setManagedTailing(false);
    };
  }, [loadDrafts]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    loadManagedSessions();
  }, [loadManagedSessions]);

  const openManagedSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/managed-agents/transcript?sessionId=${sessionId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load managed transcript');

      setManagedSessionId(json.id);
      setManagedRunId(json.workflowRunId || null);
      const events = Array.isArray(json?.events)
        ? json.events.map((event: any) => ({
            id: event.eventId || event.id,
            type: event.type,
            payload: event.payload || {},
            occurredAt: event.occurredAt,
          }))
        : [];
      setManagedEvents(events);
      seenIdsRef.current = new Set(events.map((event) => event.id));

      if (json.workflowRunId) {
        connectToStream(json.workflowRunId);
      }
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Failed to open managed session');
    }
  };

  const deleteManagedSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/managed-agents/session?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete managed session');

      if (managedSessionId === sessionId) {
        setManagedSessionId(null);
        setManagedRunId(null);
        setManagedEvents([]);
        seenIdsRef.current = new Set();
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        setManagedTailing(false);
      }

      await loadManagedSessions();
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Failed to delete managed session');
    }
  };

  const filtered = (data?.signals || [])
    .filter(s => platform === 'all' || s.platform === platform)
    .filter(s => relevance === 'all' || s.relevance === relevance);

  const generateDraft = async () => {
    if (!draftSourceText.trim()) return;
    setDraftLoading(true);
    setDraftError('');
    try {
      if (!managedSessionId || !managedRunId) {
        const res = await fetch('/api/managed-agents/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: draftSourceText, tone: draftTone }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to create managed session');
        setManagedSessionId(json.id);
        setManagedRunId(json.runId);
        setManagedEvents([]);
        seenIdsRef.current = new Set();
        connectToStream(json.runId);
        void loadManagedSessions();
      } else {
        const res = await fetch('/api/managed-agents/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: managedSessionId, text: draftSourceText, tone: draftTone }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to resume managed session');
        connectToStream(managedRunId);
      }

      setDraftSourceText('');
      void loadDrafts();
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Failed to generate draft');
    } finally {
      setDraftLoading(false);
    }
  };

  const updateDraftStatus = async (draftId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/x/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update draft');
      setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Failed to update draft');
    }
  };

  const publishDraft = async (draftId: string) => {
    setPublishingDraftId(draftId);
    setDraftError('');
    try {
      const res = await fetch(`/api/x/drafts/${draftId}/publish`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to publish draft');
      setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Failed to publish draft');
    } finally {
      setPublishingDraftId(null);
    }
  };

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

        <div className="grid gap-px bg-zinc-800 grid-cols-1 sm:grid-cols-3 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">X App Credentials</div>
            <StatusPill
              status={xStatus?.app?.appKeyConfigured ? 'active' : 'offline'}
              label={xStatus?.app?.appKeyConfigured ? 'Configured' : 'Missing'}
              size="sm"
            />
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">X OAuth</div>
            <StatusPill
              status={xStatus?.app?.oauthClientConfigured ? 'active' : 'offline'}
              label={xStatus?.app?.oauthClientConfigured ? 'Ready' : 'Missing'}
              size="sm"
            />
            {xStatus?.app?.callbackUrl ? (
              <p className="mt-2 text-[10px] text-zinc-600 font-mono break-all">{xStatus.app.callbackUrl}</p>
            ) : null}
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Connected X Account</div>
            <StatusPill
              status={xStatus?.user?.connected ? 'active' : 'offline'}
              label={xStatus?.user?.connected ? 'Connected' : 'Not Connected'}
              size="sm"
            />
            {xStatus?.user?.account?.username ? (
              <p className="mt-2 text-[10px] text-zinc-600 font-mono">@{xStatus.user.account.username}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-px bg-zinc-800 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mb-8">
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">X Draft Generator</div>
            {managedSessions.length > 0 ? (
              <div className="mb-4 border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Managed Sessions</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {managedSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`w-full border px-3 py-3 transition-colors ${
                        managedSessionId === session.id
                          ? 'border-white text-white'
                          : 'border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <button
                        onClick={() => openManagedSession(session.id)}
                        className="w-full text-left"
                      >
                        <div className="text-[10px] uppercase tracking-widest">{session.type}</div>
                        <div className="mt-1 text-xs font-mono">{session.title}</div>
                      </button>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => deleteManagedSession(session.id)}
                          className="border border-red-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:border-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <textarea
              value={draftSourceText}
              onChange={(e) => setDraftSourceText(e.target.value)}
              placeholder="Paste a mention, signal, or idea to turn into an X draft..."
              className="w-full min-h-28 bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 font-mono resize-none"
            />
            <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <select
                value={draftTone}
                onChange={(e) => setDraftTone(e.target.value)}
                className="bg-black border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-white focus:outline-none focus:border-zinc-600 font-mono"
              >
                <option value="direct">Direct</option>
                <option value="operator">Operator</option>
                <option value="founder">Founder</option>
                <option value="protocol">Protocol</option>
              </select>
              <button
                onClick={generateDraft}
                disabled={draftLoading || !draftSourceText.trim()}
                className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
              >
                {draftLoading ? 'Generating' : 'Generate Draft'}
              </button>
            </div>
            {draftError ? (
              <div className="mt-3 border border-red-500/30 p-3 text-red-400 text-xs">
                {draftError}
              </div>
            ) : null}
            <div className="mt-4 border border-zinc-800 bg-black p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">Managed Session</div>
                <StatusPill
                  status={managedTailing ? 'active' : managedRunId ? 'idle' : 'offline'}
                  label={managedTailing ? 'Streaming' : managedRunId ? 'Paused' : 'Not Started'}
                  size="sm"
                />
              </div>
              {managedSessionId ? (
                <p className="mt-3 text-[10px] text-zinc-600 font-mono break-all">Session: {managedSessionId}</p>
              ) : null}
              {managedRunId ? (
                <p className="mt-2 text-[10px] text-zinc-600 font-mono break-all">Run: {managedRunId}</p>
              ) : null}
            </div>
            {managedEvents.length > 0 ? (
              <div className="mt-4 border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Event Timeline</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {managedEvents.map((event) => (
                    <div key={event.id} className="border border-zinc-800 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-300">{formatManagedEventLabel(event.type)}</span>
                        <span className="text-[10px] text-zinc-700 font-mono">{new Date(event.occurredAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                        {typeof event.payload?.draft === 'string' ? (
                          <p>{event.payload.draft}</p>
                        ) : typeof event.payload?.text === 'string' ? (
                          <p>{event.payload.text}</p>
                        ) : event.payload?.url ? (
                          <a href={String(event.payload.url)} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                            {String(event.payload.url)}
                          </a>
                        ) : (
                          <pre className="whitespace-pre-wrap break-words text-[10px] text-zinc-500">{JSON.stringify(event.payload, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Approval Queue</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-700">{drafts.length} drafts</div>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {drafts.map((draft) => (
                <div key={draft.id} className="border border-zinc-800 bg-black p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <StatusPill
                      status={
                        draft.status === 'approved' || draft.status === 'published'
                          ? 'active'
                          : draft.status === 'rejected'
                            ? 'error'
                            : 'idle'
                      }
                      label={draft.status}
                      size="sm"
                    />
                    <span className="text-[10px] text-zinc-700 font-mono">{new Date(draft.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Source</p>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">{draft.sourceText}</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Draft</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{draft.draftText}</p>
                  {draft.status === 'draft' ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => updateDraftStatus(draft.id, 'approved')}
                        className="border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateDraftStatus(draft.id, 'rejected')}
                        className="border border-red-500/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:border-red-500 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                  {draft.status === 'approved' ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => publishDraft(draft.id)}
                        disabled={publishingDraftId === draft.id}
                        className="bg-white text-black px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                      >
                        {publishingDraftId === draft.id ? 'Publishing' : 'Publish To X'}
                      </button>
                    </div>
                  ) : null}
                  {draft.status === 'published' && draft.publishedUrl ? (
                    <div className="mt-4 text-xs text-zinc-500">
                      Published: <a href={draft.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline hover:text-white">{draft.publishedUrl}</a>
                    </div>
                  ) : null}
                </div>
              ))}
              {drafts.length === 0 ? (
                <div className="border border-zinc-800 bg-black p-4 text-xs text-zinc-500">
                  No X drafts yet. Generate one from a signal or incoming mention.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-px mb-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-3 self-center">Platform</span>
            {(['all', 'twitter', 'hacker-news', 'reddit'] as Platform[]).map(p => (
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
                      <button
                        onClick={() => setDraftSourceText(signal.content)}
                        className="border border-zinc-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
                      >
                        Use Signal
                      </button>
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
