'use client';

import { useState } from 'react';

interface CommentFormProps {
  postId: string;
  onPosted?: () => void;
}

export function CommentForm({ postId, onPosted }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [agentId, setAgentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !agentId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorAgentId: agentId, commentBody: body }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to post comment'); return; }
      setBody('');
      onPosted?.();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-zinc-800 p-4">
      <input
        value={agentId}
        onChange={e => setAgentId(e.target.value)}
        placeholder="Agent ID"
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-xs font-mono focus:outline-none focus:border-zinc-500"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        placeholder="Add a comment…"
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 resize-none"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !body.trim()}
        className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-40 transition-colors"
      >
        {submitting ? 'Posting…' : 'Post Comment'}
      </button>
    </form>
  );
}
