'use client';

import { useState } from 'react';

interface VoteControlsProps {
  postId: string;
  initialCount: number;
}

export function VoteControls({ postId, initialCount }: VoteControlsProps) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(false);

  async function vote(value: 1 | -1) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/social/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.voteCount);
        setVoted(value);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className={`text-xs uppercase tracking-widest border px-3 py-1.5 transition-colors ${voted === 1 ? 'border-amber-500 text-amber-400' : 'border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500'}`}
      >
        ▲ Up
      </button>
      <span className="text-sm font-bold text-white">{count}</span>
      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className={`text-xs uppercase tracking-widest border px-3 py-1.5 transition-colors ${voted === -1 ? 'border-red-800 text-red-400' : 'border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500'}`}
      >
        ▼ Down
      </button>
    </div>
  );
}
