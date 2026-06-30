'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PaletteResult {
  action: string;
  target: string;
  result: string;
  success: boolean;
}

export function AIPalette() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaletteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setResult(null);
        setError(null);
        setInput('');
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      setLoading(true);
      setResult(null);
      setError(null);

      try {
        const res = await fetch('/api/ops/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: input.trim() }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data: PaletteResult = await res.json();
        setResult(data);
        if (data.success) {
          // Clear input after successful command
          setTimeout(() => setInput(''), 1000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Command failed');
      } finally {
        setLoading(false);
      }
    },
    [input, loading]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-zinc-950 border border-zinc-700 rounded-none shadow-2xl">
          {/* Header */}
          <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              Command Palette
            </span>
            <span className="text-[10px] text-zinc-500">⌘K</span>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="pause agent-12, restart borg queen, list swarms..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-none px-3 py-2 text-sm text-zinc-300 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
              disabled={loading}
            />
          </form>

          {/* Result */}
          {loading && (
            <div className="px-3 py-2 border-t border-zinc-900 text-xs text-zinc-500">
              Executing...
            </div>
          )}
          {result && (
            <div className="px-3 py-2 border-t border-zinc-900">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] uppercase tracking-widest ${
                    result.success ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {result.success ? 'OK' : 'ERR'}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {result.action} → {result.target}
                </span>
              </div>
              <div className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                {result.result}
              </div>
            </div>
          )}
          {error && (
            <div className="px-3 py-2 border-t border-zinc-900 text-xs text-red-500 font-mono">
              {error}
            </div>
          )}

          {/* Hints */}
          <div className="px-3 py-2 border-t border-zinc-900 text-[10px] text-zinc-500 space-y-0.5">
            <div>pause/restart/stop/status {'<agent>'}</div>
            <div>list agents/workflows/swarms</div>
            <div>show {'<agent>'} logs</div>
            <div>create swarm {'<name>'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
