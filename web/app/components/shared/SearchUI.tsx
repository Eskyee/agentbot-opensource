'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SearchResult {
  id: string;
  type: 'agent' | 'skill' | 'workflow' | 'memory';
  name: string;
  description: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface SearchResponse {
  query: string;
  mode: string;
  count: number;
  results: SearchResult[];
  error?: string;
}

type SearchMode = 'hybrid' | 'fts' | 'vector';

interface SearchUIProps {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  defaultMode?: SearchMode;
  showModeToggle?: boolean;
  entityTypes?: Array<'agent' | 'skill' | 'workflow' | 'memory'>;
}

const typeColors: Record<string, string> = {
  agent: '#22c55e',
  skill: '#3b82f6',
  workflow: '#a855f7',
  memory: '#f59e0b',
};

export default function SearchUI({
  onSelect,
  placeholder = 'Search agents, skills, workflows...',
  defaultMode = 'hybrid',
  showModeToggle = true,
  entityTypes,
}: SearchUIProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>(defaultMode);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotalCount(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          mode,
          limit: '20',
        });

        if (entityTypes?.length) {
          params.set('type', entityTypes.join(','));
        }

        const res = await fetch(`/api/query?${params}`);
        const data: SearchResponse = await res.json();

        if (!res.ok) {
          setError(data.error || 'Search failed');
          setResults([]);
          return;
        }

        setResults(data.results);
        setTotalCount(data.count);
      } catch {
        setError('Search request failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [mode, entityTypes]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '14px',
            background: '#0a0a0a',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: '#fafafa',
            outline: 'none',
          }}
        />
        {loading && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#71717a',
              fontSize: '12px',
            }}
          >
            Searching...
          </div>
        )}
      </div>

      {showModeToggle && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {(['hybrid', 'fts', 'vector'] as SearchMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: mode === m ? '1px solid #3b82f6' : '1px solid #27272a',
                borderRadius: '4px',
                background: mode === m ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: mode === m ? '#3b82f6' : '#71717a',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '6px',
            color: '#ef4444',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            border: '1px solid #27272a',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: '#0a0a0a',
              borderBottom: '1px solid #27272a',
              fontSize: '12px',
              color: '#71717a',
            }}
          >
            {totalCount} result{totalCount !== 1 ? 's' : ''} ({mode})
          </div>
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => onSelect?.(result)}
              style={{
                padding: '12px',
                borderBottom: '1px solid #18181b',
                cursor: onSelect ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#18181b')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: '3px',
                    background: `${typeColors[result.type]}20`,
                    color: typeColors[result.type],
                  }}
                >
                  {result.type}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#fafafa' }}>
                  {result.name}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#52525b' }}>
                  {(result.score * 100).toFixed(0)}%
                </span>
              </div>
              {result.description && (
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '13px',
                    color: '#a1a1aa',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && !error && (
        <div
          style={{
            marginTop: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#52525b',
            fontSize: '13px',
          }}
        >
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
