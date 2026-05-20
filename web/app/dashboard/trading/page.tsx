'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, ArrowUpDown, Send, RefreshCw, Loader2, Sparkles, Key, Eye, EyeOff, Trash2, CheckCircle, User, ExternalLink, Edit3, Plus, AlertCircle } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';

interface Balance {
  symbol: string;
  balance: string;
  value?: string;
  chain: string;
}

interface Job {
  jobId?: string;
  threadId?: string;
  status?: string;
  response?: string;
}

interface AgentProfile {
  id?: string;
  projectName?: string;
  tokenAddress?: string;
  description?: string;
  twitter?: string;
  approved?: boolean;
  slug?: string;
  updates?: Array<{ id?: string; title?: string; content?: string; createdAt?: string }>;
}

export default function TradingPage() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [threadId, setThreadId] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [result, setResult] = useState<string>('');

  // Profile state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [createFields, setCreateFields] = useState({ projectName: '', tokenAddress: '', description: '', twitter: '' });
  const [editFields, setEditFields] = useState({ description: '', twitter: '' });
  const [updateFields, setUpdateFields] = useState({ title: '', content: '' });

  // API key management
  const [keyConfigured, setKeyConfigured] = useState<boolean | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Check if key is configured on mount
  useEffect(() => {
    fetch('/api/user/bankr-key')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setKeyConfigured(data.configured)
      })
      .catch(() => setKeyConfigured(false))
  }, [])

  // Profile queries
  const { data: profile, isLoading: profileLoading } = useQuery<AgentProfile | null>({
    queryKey: ['bankr-profile'],
    queryFn: async () => {
      const res = await fetch('/api/bankr/profile');
      const data = await res.json();
      if (data.needsKey) return null;
      return data.profile ?? data ?? null;
    },
    enabled: keyConfigured === true,
  });

  const createProfile = useMutation({
    mutationFn: async (fields: typeof createFields) => {
      const res = await fetch('/api/bankr/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        setProfileError(data.error);
        return;
      }
      setProfileSuccess('Profile created successfully');
      setProfileError(null);
      setShowCreateForm(false);
      setCreateFields({ projectName: '', tokenAddress: '', description: '', twitter: '' });
      queryClient.invalidateQueries({ queryKey: ['bankr-profile'] });
      setTimeout(() => setProfileSuccess(null), 3000);
    },
    onError: () => setProfileError('Failed to create profile'),
  });

  const updateProfile = useMutation({
    mutationFn: async (fields: typeof editFields) => {
      const res = await fetch('/api/bankr/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        setProfileError(data.error);
        return;
      }
      setProfileSuccess('Profile updated');
      setProfileError(null);
      setShowEditForm(false);
      queryClient.invalidateQueries({ queryKey: ['bankr-profile'] });
      setTimeout(() => setProfileSuccess(null), 3000);
    },
    onError: () => setProfileError('Failed to update profile'),
  });

  const deleteProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/bankr/profile', { method: 'DELETE' });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        setProfileError(data.error);
        return;
      }
      setProfileSuccess('Profile deleted');
      setProfileError(null);
      queryClient.invalidateQueries({ queryKey: ['bankr-profile'] });
      setTimeout(() => setProfileSuccess(null), 3000);
    },
    onError: () => setProfileError('Failed to delete profile'),
  });

  const postUpdate = useMutation({
    mutationFn: async (fields: typeof updateFields) => {
      const res = await fetch('/api/bankr/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        setProfileError(data.error);
        return;
      }
      setProfileSuccess('Update posted');
      setProfileError(null);
      setShowUpdateForm(false);
      setUpdateFields({ title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: ['bankr-profile'] });
      setTimeout(() => setProfileSuccess(null), 3000);
    },
    onError: () => setProfileError('Failed to post update'),
  });

  const saveKey = async () => {
    if (!apiKeyInput.trim()) return
    setKeySaving(true)
    setKeyError(null)
    try {
      const res = await fetch('/api/user/bankr-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      })
      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : { error: await res.text() }
      if (!res.ok) {
        setKeyError(data.error || 'Failed to save key')
      } else {
        setKeyConfigured(true)
        setShowKeyInput(false)
        setApiKeyInput('')
        refetchBalances()
      }
    } catch {
      setKeyError('Network error')
    } finally {
      setKeySaving(false)
    }
  }

  const deleteKey = async () => {
    try {
      await fetch('/api/user/bankr-key', { method: 'DELETE' })
      setKeyConfigured(false)
      setShowKeyInput(false)
    } catch {
      // ignore
    }
  }

  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances, error: balancesError } = useQuery<Balance[]>({
    queryKey: ['bankr-balances'],
    queryFn: async () => {
      const res = await fetch('/api/bankr/balances');
      const data = await res.json();
      if (data.needsKey) {
        setKeyConfigured(false)
        setShowKeyInput(true)
        return []
      }
      if (data.balances) return data.balances;
      return [];
    },
    enabled: keyConfigured !== false,
    refetchInterval: 30000,
  });

  const { mutate: sendPrompt, isPending: isSending } = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await fetch('/api/bankr/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, ...(threadId && { threadId }) }),
      });
      return res.json();
    },
    onSuccess: (data: Job) => {
      if (data.jobId) {
        setJobId(data.jobId);
        if (data.threadId) setThreadId(data.threadId);
        pollJob(data.jobId);
      }
      if (data.response) setResult(data.response);
    },
  });

  const pollJob = async (id: string) => {
    const poll = async () => {
      const res = await fetch(`/api/bankr/prompt?jobId=${id}`);
      const data: Job = await res.json();
      if (data.status === 'completed') { setResult(data.response || 'Task completed'); return; }
      if (data.status === 'failed') { setResult(`Error: ${data.response || 'Task failed'}`); return; }
      if (data.status === 'cancelled') { setResult('Task cancelled'); return; }
      setTimeout(poll, 2000);
    };
    poll();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setResult('');
    sendPrompt(prompt);
  };

  const quickActions = [
    { label: 'Check ETH', prompt: 'What is my ETH balance on Base?' },
    { label: 'Portfolio', prompt: 'Show my complete portfolio' },
    { label: 'Price Check', prompt: 'What is the current price of ETH?' },
  ];

  const totalValue = balances?.reduce((sum, b) => sum + Number(b.value || 0), 0) || 0;
  const needsKey = keyConfigured === false;

  return (
    <DashboardShell>
      <DashboardHeader title="Trading Agent" icon={<Sparkles className="h-5 w-5 text-orange-500" />} />
      <DashboardContent>

        {/* API Key Banner */}
        {needsKey && !showKeyInput && (
          <div className="border border-yellow-800 bg-zinc-950 p-6 mb-px flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-1">Bankr API Key Required</p>
              <p className="text-[11px] text-zinc-500">Connect your Bankr account to enable trading and portfolio tracking.</p>
            </div>
            <button
              onClick={() => setShowKeyInput(true)}
              className="shrink-0 border border-zinc-600 hover:border-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2"
            >
              <Key className="h-3.5 w-3.5" /> Add Key
            </button>
          </div>
        )}

        {/* API Key Input Form */}
        {showKeyInput && (
          <div className="border border-zinc-700 bg-zinc-950 p-6 mb-px">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Bankr API Key</span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4">
              Get your API key from <span className="text-zinc-300 font-mono">bankr.bot</span>. It&apos;s stored encrypted and only used for your account.
            </p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveKey()}
                  placeholder="bkr_..."
                  className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                onClick={saveKey}
                disabled={keySaving || !apiKeyInput.trim()}
                className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center gap-2"
              >
                {keySaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Save
              </button>
              <button
                onClick={() => { setShowKeyInput(false); setApiKeyInput(''); setKeyError(null); }}
                className="border border-zinc-700 hover:border-zinc-500 px-3 py-2 text-[10px] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </div>
            {keyError && <p className="text-[11px] text-red-400">{keyError}</p>}
          </div>
        )}

        {/* Key configured — show manage option */}
        {keyConfigured && !showKeyInput && (
          <div className="border border-zinc-800 bg-zinc-950 px-6 py-3 mb-px flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              Bankr API key connected
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://bankr.bot/agents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-widest text-orange-500 hover:text-orange-500 transition-colors"
              >
                Open Profiles
              </a>
              <button
                onClick={() => setShowKeyInput(true)}
                className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <Key className="h-3 w-3" /> Change
              </button>
              <button
                onClick={deleteKey}
                className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-orange-400 transition-colors flex items-center gap-1 ml-3"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        )}

        {/* Main content — only show when key is present */}
        {!needsKey && (
          <div className="grid gap-px bg-zinc-800 lg:grid-cols-3">
            {/* Portfolio + Quick Actions */}
            <div className="lg:col-span-2 space-y-px bg-zinc-800">
              <div className="bg-zinc-950 border border-zinc-800 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-orange-500" />
                      Agent Profile
                    </div>
                    <h2 className="text-sm font-bold tracking-tight uppercase">Manage Your Agent Profile</h2>
                  </div>
                </div>

                {/* Feedback */}
                {profileError && (
                  <div className="border border-red-800 bg-zinc-950 p-3 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-[11px] text-red-400">{profileError}</span>
                  </div>
                )}
                {profileSuccess && (
                  <div className="border border-green-800 bg-zinc-950 p-3 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    <span className="text-[11px] text-green-400">{profileSuccess}</span>
                  </div>
                )}

                {/* Loading state */}
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                ) : !profile ? (
                  /* No profile — create form or create button */
                  <>
                    {showCreateForm ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Project Name *</label>
                          <input
                            type="text"
                            value={createFields.projectName}
                            onChange={e => setCreateFields(f => ({ ...f, projectName: e.target.value }))}
                            placeholder="My Agent"
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Token Address *</label>
                          <input
                            type="text"
                            value={createFields.tokenAddress}
                            onChange={e => setCreateFields(f => ({ ...f, tokenAddress: e.target.value }))}
                            placeholder="0x..."
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Description</label>
                          <textarea
                            value={createFields.description}
                            onChange={e => setCreateFields(f => ({ ...f, description: e.target.value }))}
                            placeholder="Describe your agent..."
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs h-20 resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Twitter (optional)</label>
                          <input
                            type="text"
                            value={createFields.twitter}
                            onChange={e => setCreateFields(f => ({ ...f, twitter: e.target.value }))}
                            placeholder="@handle"
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => createProfile.mutate(createFields)}
                            disabled={createProfile.isPending || !createFields.projectName || !createFields.tokenAddress}
                            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center gap-2"
                          >
                            {createProfile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Create Profile
                          </button>
                          <button
                            onClick={() => { setShowCreateForm(false); setProfileError(null); }}
                            className="border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-600">You must have deployed a token through Bankr (Doppler/Clanker) or be a fee beneficiary.</p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <User className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-xs text-zinc-500 mb-4">No agent profile found. Create one to get listed on Bankr.</p>
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create Your Agent Profile
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Profile exists — show profile card */
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold tracking-tight uppercase">{profile.projectName || 'Untitled'}</h3>
                        {profile.tokenAddress && (
                          <a
                            href={`https://basescan.org/address/${profile.tokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono flex items-center gap-1 mt-1"
                          >
                            {profile.tokenAddress}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {profile.approved !== undefined && (
                          <span className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${profile.approved ? 'border-green-800 text-green-400' : 'border-yellow-800 text-yellow-400'}`}>
                            {profile.approved ? 'Approved' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>

                    {profile.description && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{profile.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      {profile.twitter && (
                        <a
                          href={`https://x.com/${profile.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-zinc-500 hover:text-white flex items-center gap-1"
                        >
                          @{profile.twitter.replace('@', '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {profile.slug && (
                        <a
                          href={`https://bankr.bot/agents/${profile.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-orange-500 hover:text-orange-400 flex items-center gap-1"
                        >
                          bankr.bot/agents/{profile.slug}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          setEditFields({ description: profile.description || '', twitter: profile.twitter || '' });
                          setShowEditForm(true);
                        }}
                        className="border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => setShowUpdateForm(v => !v)}
                        className="border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="h-3 w-3" /> Post Update
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete your agent profile? This cannot be undone.')) {
                            deleteProfile.mutate();
                          }
                        }}
                        disabled={deleteProfile.isPending}
                        className="border border-red-800 hover:border-red-600 text-red-400 px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        {deleteProfile.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Delete
                      </button>
                    </div>

                    {/* Edit form */}
                    {showEditForm && (
                      <div className="border border-zinc-800 p-4 space-y-3">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Edit Profile</div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Description</label>
                          <textarea
                            value={editFields.description}
                            onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))}
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs h-20 resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Twitter</label>
                          <input
                            type="text"
                            value={editFields.twitter}
                            onChange={e => setEditFields(f => ({ ...f, twitter: e.target.value }))}
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateProfile.mutate(editFields)}
                            disabled={updateProfile.isPending}
                            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center gap-2"
                          >
                            {updateProfile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            Save
                          </button>
                          <button
                            onClick={() => { setShowEditForm(false); setProfileError(null); }}
                            className="border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Post update form */}
                    {showUpdateForm && (
                      <div className="border border-zinc-800 p-4 space-y-3">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Post Project Update</div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Title *</label>
                          <input
                            type="text"
                            value={updateFields.title}
                            onChange={e => setUpdateFields(f => ({ ...f, title: e.target.value }))}
                            placeholder="v2 Launch"
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">Content *</label>
                          <textarea
                            value={updateFields.content}
                            onChange={e => setUpdateFields(f => ({ ...f, content: e.target.value }))}
                            placeholder="What did you ship?"
                            className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs h-20 resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => postUpdate.mutate(updateFields)}
                            disabled={postUpdate.isPending || !updateFields.title || !updateFields.content}
                            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center gap-2"
                          >
                            {postUpdate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Publish Update
                          </button>
                          <button
                            onClick={() => { setShowUpdateForm(false); setProfileError(null); }}
                            className="border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recent updates */}
                    {profile.updates && profile.updates.length > 0 && (
                      <div className="pt-3 border-t border-zinc-800">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Recent Updates</div>
                        <div className="space-y-px">
                          {profile.updates.map((u, i) => (
                            <div key={u.id || i} className="bg-zinc-950 border border-zinc-800 p-3">
                              <div className="text-xs font-bold uppercase tracking-tight">{u.title}</div>
                              <div className="text-[11px] text-zinc-500 mt-1">{u.content}</div>
                              {u.createdAt && (
                                <div className="text-[10px] text-zinc-700 mt-2">{new Date(u.createdAt).toLocaleDateString()}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Portfolio */}
              <div className="bg-zinc-950 border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <h2 className="text-sm font-bold tracking-tight uppercase">Portfolio</h2>
                  </div>
                  <button
                    onClick={() => refetchBalances()}
                    className="border border-zinc-700 hover:border-zinc-500 p-2 transition-colors"
                    disabled={balancesLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${balancesLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-px bg-zinc-800">
                  {balancesLoading ? (
                    <div className="flex items-center justify-center py-8 bg-zinc-950">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                  ) : balancesError ? (
                    <div className="bg-zinc-950 border border-zinc-800 p-6 text-center">
                      <p className="text-xs text-red-400">Failed to load balances</p>
                    </div>
                  ) : balances && balances.length > 0 ? (
                    balances.map((balance, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center">
                            <span className="text-[10px] font-bold">{balance.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold">{balance.symbol}</div>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-600">{balance.chain}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono">{Number(balance.balance).toFixed(6)}</div>
                          {balance.value && (
                            <div className="text-[10px] text-green-400">${Number(balance.value).toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-zinc-950 border border-zinc-800 p-8 text-center">
                      <p className="text-xs text-zinc-500">No balances found.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Total Value</span>
                  <span className="text-2xl font-bold tracking-tight">${totalValue.toFixed(2)}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-zinc-950 border border-zinc-800 p-6">
                <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => { setPrompt(action.prompt); sendPrompt(action.prompt); }}
                      className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 transition-colors"
                      disabled={isSending}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Command Interface */}
            <div className="space-y-px bg-zinc-800">
              <div className="bg-zinc-950 border border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="h-4 w-4 text-pink-400" />
                  <h2 className="text-sm font-bold tracking-tight uppercase">Command</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={"Ask the trading agent...\n- Buy $50 of ETH on Base\n- Swap 0.1 ETH for USDC\n- What tokens are trending?"}
                    className="w-full h-40 bg-black border border-zinc-700 p-4 text-xs focus:border-zinc-500 focus:outline-none resize-none"
                    disabled={isSending}
                  />

                  <button
                    type="submit"
                    disabled={isSending || !prompt.trim()}
                    className="w-full bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><ArrowUpDown className="h-4 w-4" /> Send Command</>
                    )}
                  </button>
                </form>
              </div>

              {result && (
                <div className="bg-zinc-950 border border-zinc-800 p-6">
                  <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Response</h2>
                  <div className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{result}</div>
                </div>
              )}

              {jobId && !result && (
                <div className="bg-zinc-950 border border-zinc-800 p-6 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  <span className="text-xs text-zinc-500">Processing job: {jobId}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </DashboardContent>
    </DashboardShell>
  );
}
