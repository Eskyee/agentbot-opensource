'use client';

import { useState, useRef, useCallback } from 'react';

interface AICoachProps {
  context?: { agentId?: string; fleetData?: unknown } | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AICoach({ context }: AICoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      const userMessage = input.trim();
      setInput('');
      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setLoading(true);

      try {
        const res = await fetch('/api/ops/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, context }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 50);
      }
    },
    [input, loading, context, scrollToBottom]
  );

  return (
    <div
      className="bg-zinc-950 border border-zinc-800 flex flex-col"
      style={{ height: 'min(500px, 60vh)' }}
    >
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">AI Coach</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && !loading && (
          <div className="text-xs text-zinc-500 text-center py-8">
            {context?.agentId
              ? 'Ask about the selected agent...'
              : 'Select an agent or fleet instance to get contextual insights'}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs font-mono ${
              msg.role === 'user' ? 'text-zinc-400' : 'text-zinc-300'
            }`}
          >
            <span
              className={`text-[10px] uppercase tracking-widest mr-2 ${
                msg.role === 'user' ? 'text-blue-500' : 'text-green-500'
              }`}
            >
              {msg.role === 'user' ? '>' : '◄'}
            </span>
            <span className="whitespace-pre-wrap">{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-zinc-500">
            <span className="text-[10px] uppercase tracking-widest text-green-500 mr-2">◄</span>
            Processing...
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500">
            <span className="text-[10px] uppercase tracking-widest text-red-500 mr-2">!</span>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-900 p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={context?.agentId ? 'Ask about this agent...' : 'Ask about your fleet...'}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-none px-2 py-1.5 text-xs text-zinc-300 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-none text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
