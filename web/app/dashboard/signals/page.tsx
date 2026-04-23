'use client';

import Link from 'next/link';
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
  mentionId?: string | null;
  sourceText: string;
  draftText: string;
  tone: string;
  status: 'draft' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string | null;
  publishedPostId?: string | null;
  publishedUrl?: string | null;
}

interface XMention {
  id: string;
  author: string;
  authorUsername: string;
  text: string;
  createdAt: string;
  conversationId: string | null;
  inReplyToUserId: string | null;
  publicMetrics: {
    likeCount: number;
    replyCount: number;
    repostCount: number;
  };
  url: string;
  state?: 'open' | 'resolved';
  assignedTo?: string | null;
}

interface XAnalyticsPost {
  id: string;
  text: string;
  createdAt: string;
  publicMetrics: {
    likeCount: number;
    replyCount: number;
    repostCount: number;
    quoteCount: number;
  };
  url: string;
}

interface XAnalyticsResponse {
  posts: XAnalyticsPost[];
  summary: {
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
  };
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
  twitter:       { label: 'X',       color: 'text-orange-400' },
  'hacker-news': { label: 'HN',     color: 'text-yellow-400' },
  discord:       { label: 'Discord', color: 'text-orange-400' },
};

export default function SignalsPage() {
  const [data, setData] = useState<SignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [xStatus, setXStatus] = useState<XStatusResponse | null>(null);
  const [drafts, setDrafts] = useState<XDraft[]>([]);
  const [mentions, setMentions] = useState<XMention[]>([]);
  const [mentionsError, setMentionsError] = useState('');
  const [analytics, setAnalytics] = useState<XAnalyticsResponse | null>(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [communityPosts, setCommunityPosts] = useState<Array<{
    id: string;
    author: string;
    authorUsername: string;
    text: string;
    createdAt: string;
    publicMetrics: { likeCount: number; replyCount: number; repostCount: number };
    url: string;
  }>>([]);
  const [communityId, setCommunityId] = useState('2031495203002134740');
  const [communityError, setCommunityError] = useState('');
  const [draftSourceText, setDraftSourceText] = useState('');
  const [draftTone, setDraftTone] = useState('direct');
  const [draftScheduleFor, setDraftScheduleFor] = useState('');
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

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetch('/api/signals'),
        fetch('/api/x/status', { cache: 'no-store' }),
        fetch('/api/x/drafts', { cache: 'no-store' }),
        fetch('/api/x/mentions', { cache: 'no-store' }),
        fetch('/api/x/analytics', { cache: 'no-store' }),
        fetch(`/api/x/community?communityId=${encodeURIComponent(communityId)}`, { cache: 'no-store' }),
      ]);

      // 1. Core Signals
      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        setData(await results[0].value.json());
      }
      // 2. X Status
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        setXStatus(await results[1].value.json());
      }
      // 3. Drafts
      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const json = await results[2].value.json();
        setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
      }
      // 4. Mentions
      if (results[3].status === 'fulfilled') {
        const res = results[3].value;
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setMentions(Array.isArray(json?.mentions) ? json.mentions : []);
          setMentionsError('');
        } else {
          setMentionsError(json?.error || 'Failed to load X mentions');
        }
      }
      // 5. Analytics
      if (results[4].status === 'fulfilled') {
        const res = results[4].value;
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setAnalytics(json);
          setAnalyticsError('');
        } else {
          setAnalyticsError(json?.error || 'Failed to load X analytics');
        }
      }
      // 6. Community
      if (results[5].status === 'fulfilled') {
        const res = results[5].value;
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setCommunityPosts(Array.isArray(json?.posts) ? json.posts : []);
          setCommunityError('');
        } else {
          setCommunityError(json?.error || 'Failed to load community feed');
        }
      }

      setLastGenerated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Initial data load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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

  const loadMentions = useCallback(async () => {
    try {
      const res = await fetch('/api/x/mentions', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setMentionsError(typeof json?.error === 'string' ? json.error : 'Failed to load X mentions');
        return;
      }
      setMentions(Array.isArray(json?.mentions) ? json.mentions : []);
      setMentionsError('');
    } catch (e) {
      console.error('X mentions fetch failed:', e);
      setMentionsError('Failed to load X mentions');
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/x/analytics', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setAnalyticsError(typeof json?.error === 'string' ? json.error : 'Failed to load X analytics');
        return;
      }
      setAnalytics(json);
      setAnalyticsError('');
    } catch (e) {
      console.error('X analytics fetch failed:', e);
      setAnalyticsError('Failed to load X analytics');
    }
  }, []);

  const loadCommunity = useCallback(async () => {
    try {
      const res = await fetch(`/api/x/community?communityId=${encodeURIComponent(communityId)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setCommunityError(typeof json?.error === 'string' ? json.error : 'Failed to load community feed');
        return;
      }
      setCommunityPosts(Array.isArray(json?.posts) ? json.posts : []);
      setCommunityError('');
    } catch (e) {
      console.error('X community fetch failed:', e);
      setCommunityError('Failed to load community feed');
    }
  }, [communityId]);

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
          body: JSON.stringify({ text: draftSourceText, tone: draftTone, scheduledFor: draftScheduleFor || null }),
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
          body: JSON.stringify({ sessionId: managedSessionId, text: draftSourceText, tone: draftTone, scheduledFor: draftScheduleFor || null }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to resume managed session');
        connectToStream(managedRunId);
      }

      setDraftSourceText('');
      setDraftScheduleFor('');
      void loadDrafts();
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Failed to generate draft');
    } finally {
      setDraftLoading(false);
    }
  };

  const useMentionForReply = (mention: XMention) => {
    const replySeed = [
      `Reply to @${mention.authorUsername}:`,
      mention.text,
      '',
      'Write a concise reply in the selected tone. Keep it native to X and grounded in the mention context.',
    ].join('\n');
    setDraftSourceText(replySeed);
  };

  const updateMentionState = async (mentionId: string, status: 'open' | 'resolved', assignedTo?: string | null) => {
    try {
      const res = await fetch('/api/x/mentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentionId, status, assignedTo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update mention state');
      await loadMentions();
    } catch (e) {
      setMentionsError(e instanceof Error ? e.message : 'Failed to update mention state');
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

  const scheduleDraft = async (draftId: string, scheduledFor: string | null) => {
    try {
      const res = await fetch(`/api/x/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to schedule draft');
      setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Failed to schedule draft');
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
            onClick={loadInitialData}
            disabled={loading}
            className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <DashboardContent>
        <div className="mb-8 border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">X Workflow</div>
              <p className="mt-2 text-sm text-zinc-400">
                Use this dashboard to monitor X signals, generate drafts, approve them, and publish from a connected X account.
              </p>
            </div>
            <Link href="/learn/developers/x-agentbot" className="text-xs uppercase tracking-widest text-orange-400 hover:text-white">
              Read the X guide →
            </Link>
          </div>
        </div>

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

        <div className="grid gap-px bg-zinc-800 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Recent Likes</div>
            <div className="text-xl font-bold text-white">{analytics?.summary.likes ?? '—'}</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Recent Replies</div>
            <div className="text-xl font-bold text-white">{analytics?.summary.replies ?? '—'}</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Recent Reposts</div>
            <div className="text-xl font-bold text-white">{analytics?.summary.reposts ?? '—'}</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Recent Quotes</div>
            <div className="text-xl font-bold text-white">{analytics?.summary.quotes ?? '—'}</div>
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
              <input
                type="datetime-local"
                value={draftScheduleFor}
                onChange={(e) => setDraftScheduleFor(e.target.value)}
                className="bg-black border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-white focus:outline-none focus:border-zinc-600 font-mono"
              />
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
                  {draft.scheduledFor ? (
                    <div className="mt-3 text-[10px] uppercase tracking-widest text-orange-400">
                      Scheduled: {new Date(draft.scheduledFor).toLocaleString()}
                    </div>
                  ) : null}
                  {draft.status !== 'published' ? (
                    <div className="mt-3">
                      <input
                        type="datetime-local"
                        defaultValue={draft.scheduledFor ? draft.scheduledFor.slice(0, 16) : ''}
                        onBlur={(e) => {
                          const value = e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : null;
                          void scheduleDraft(draft.id, value);
                        }}
                        className="bg-zinc-950 border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-white focus:outline-none focus:border-zinc-600 font-mono"
                      />
                    </div>
                  ) : null}
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

        <div className="grid gap-px bg-zinc-800 grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] mb-8">
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Mentions Queue</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-700">{mentions.length} mentions</div>
            </div>
            {mentionsError ? (
              <div className="border border-red-500/30 p-3 text-red-400 text-xs mb-3">
                {mentionsError}
              </div>
            ) : null}
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {mentions.map((mention) => (
                <div key={mention.id} className="border border-zinc-800 bg-black p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-orange-400">Mention</div>
                      <div className="mt-1 text-xs text-zinc-400 font-mono">@{mention.authorUsername}</div>
                    </div>
                    <span className="text-[10px] text-zinc-700 font-mono">{new Date(mention.createdAt).toLocaleString()}</span>
                  </div>
                  <a href={mention.url} target="_blank" rel="noopener noreferrer" className="block">
                    <p className="text-sm text-zinc-300 leading-relaxed hover:text-white transition-colors">
                      {mention.text}
                    </p>
                  </a>
                  <div className="mt-3 flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-600">
                    <span>{mention.publicMetrics.likeCount} likes</span>
                    <span>{mention.publicMetrics.replyCount} replies</span>
                    <span>{mention.publicMetrics.repostCount} reposts</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => useMentionForReply(mention)}
                      className="border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      Generate Reply Draft
                    </button>
                    <a
                      href={mention.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors"
                    >
                      Open on X
                    </a>
                    <button
                      onClick={() => updateMentionState(mention.id, mention.state === 'resolved' ? 'open' : 'resolved', mention.assignedTo || null)}
                      className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors"
                    >
                      {mention.state === 'resolved' ? 'Reopen' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => updateMentionState(mention.id, mention.state || 'open', mention.assignedTo ? null : 'me')}
                      className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors"
                    >
                      {mention.assignedTo ? 'Unassign' : 'Assign Me'}
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2 text-[10px] uppercase tracking-widest">
                    <StatusPill status={mention.state === 'resolved' ? 'active' : 'idle'} label={mention.state || 'open'} size="sm" />
                    {mention.assignedTo ? <StatusPill status="idle" label={`assigned:${mention.assignedTo}`} size="sm" /> : null}
                  </div>
                </div>
              ))}
              {mentions.length === 0 ? (
                <div className="border border-zinc-800 bg-black p-4 text-xs text-zinc-500">
                  No recent mentions found for the connected X account.
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">How To Use This</div>
              <button
                onClick={() => void loadMentions()}
                className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors"
              >
                Reload Mentions
              </button>
            </div>
            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <p>1. Connect an X account in your current X workflow.</p>
              <p>2. This queue pulls recent mentions for that account using the stored user access token.</p>
              <p>3. Click <span className="text-white">Generate Reply Draft</span> to turn a mention into an approval-gated reply seed.</p>
              <p>4. The draft still goes through the existing approval and publish flow. Nothing auto-posts.</p>
              <p>5. Use the existing draft statuses to approve, reject, and publish safely.</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Recent Published Posts</div>
            <button
              onClick={() => void loadAnalytics()}
              className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors"
            >
              Reload Analytics
            </button>
          </div>
          {analyticsError ? (
            <div className="border border-red-500/30 p-3 text-red-400 text-xs mb-3">{analyticsError}</div>
          ) : null}
          <div className="space-y-3">
            {(analytics?.posts || []).map((post) => (
              <div key={post.id} className="border border-zinc-800 bg-black p-4">
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
                  <p className="text-sm text-zinc-300 hover:text-white transition-colors">{post.text}</p>
                </a>
                <div className="mt-3 flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-zinc-600">
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                  <span>{post.publicMetrics.likeCount} likes</span>
                  <span>{post.publicMetrics.replyCount} replies</span>
                  <span>{post.publicMetrics.repostCount} reposts</span>
                  <span>{post.publicMetrics.quoteCount} quotes</span>
                </div>
              </div>
            ))}
            {!analytics?.posts?.length ? (
              <div className="border border-zinc-800 bg-black p-4 text-xs text-zinc-500">
                No recent published posts found for the connected X account.
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-5 mb-8">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Community Feed</div>
              <a
                href={`https://x.com/i/communities/${communityId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-400 font-mono"
              >
                x.com/i/communities/{communityId}
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Community ID"
                className="border border-zinc-800 bg-black px-3 py-2 text-xs text-white font-mono focus:border-zinc-600 focus:outline-none w-48"
              />
              <button
                onClick={() => void loadCommunity()}
                className="border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
          {communityError ? (
            <div className="border border-red-500/30 p-3 text-red-400 text-xs mb-3">{communityError}</div>
          ) : null}
          <div className="space-y-3">
            {communityPosts.map((post) => (
              <div key={post.id} className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-white">{post.author}</span>
                  <span className="text-xs text-zinc-500">@{post.authorUsername}</span>
                </div>
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
                  <p className="text-sm text-zinc-300 hover:text-white transition-colors">{post.text}</p>
                </a>
                <div className="mt-3 flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-zinc-600">
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                  <span>{post.publicMetrics.likeCount} likes</span>
                  <span>{post.publicMetrics.replyCount} replies</span>
                  <span>{post.publicMetrics.repostCount} reposts</span>
                </div>
              </div>
            ))}
            {!communityPosts.length && !communityError ? (
              <div className="border border-zinc-800 bg-black p-4 text-xs text-zinc-500">
                No recent community posts. Make sure your X account is a member of the community and the ID is correct.
              </div>
            ) : null}
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
