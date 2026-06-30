'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type SearchCategory = 'guide' | 'docs' | 'developer' | 'dashboard' | 'blog';

type SearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: SearchCategory;
  score: number;
};

const categoryLabels: Record<SearchCategory, string> = {
  guide: 'Guide',
  docs: 'Docs',
  developer: 'Developer',
  dashboard: 'Dashboard Help',
  blog: 'Blog',
};

export function SearchPageClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/docs/search?q=${encodeURIComponent(query)}&limit=20`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!cancelled) {
          setResults(Array.isArray(data.results) ? data.results : []);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-black px-6 py-16 font-mono text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-600">
            <Link href="/learn" className="transition-colors hover:text-white">
              Learn
            </Link>
            <span>/</span>
            <span className="text-zinc-400">Search</span>
          </div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Search Agentbot Guides</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Search the user-facing help, docs, developer pages, runtime guides, and key architecture
            posts.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ffmpeg, basefm, missing dependencies, runtime, gitlawb..."
            className="w-full border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
            {['ffmpeg', 'basefm', 'runtime', 'missing dependencies', 'verify', 'gitlawb'].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="border border-zinc-800 px-2 py-1 transition-colors hover:border-zinc-600 hover:text-white"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <p className="text-sm text-zinc-500">Searching…</p>
          ) : query.trim() && results.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No matches yet. Try broader terms like `runtime`, `docs`, `stream`, or `wallet`.
            </p>
          ) : (
            <div className="grid gap-px bg-zinc-900">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.href}
                  className="bg-black p-5 transition-colors hover:bg-zinc-950"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                      {categoryLabels[result.category]}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-700">
                      {Math.round(result.score)}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-tight text-white">
                    {result.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{result.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-widest text-orange-500">
                    {result.href}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
