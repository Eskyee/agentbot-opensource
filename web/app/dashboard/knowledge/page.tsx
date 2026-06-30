'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Upload,
  Trash2,
  FileText,
  Search,
  Plus,
  Brain,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell';

interface KnowledgeDoc {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
  status: 'processing' | 'ready' | 'error';
  agentId: string | null;
  agentName: string | null;
  uploadedAt: string;
}

interface SearchResult {
  docName: string;
  chunk: string;
  score: number;
  metadata: Record<string, unknown> | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const { data: documents, isLoading } = useQuery<KnowledgeDoc[]>({
    queryKey: ['knowledge-docs'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/knowledge');
      if (!res.ok) throw new Error('Failed to load documents');
      return res.json();
    },
  });

  const { data: agents } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['user-agents-list'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.agents ?? [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedAgent !== 'all') formData.append('agentId', selectedAgent);
      const res = await fetch('/api/dashboard/knowledge', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-docs'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/knowledge?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-docs'] });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (selectedAgent !== 'all') params.set('agentId', selectedAgent);
      const res = await fetch(`/api/dashboard/knowledge/search?${params}`);
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } finally {
      setIsSearching(false);
    }
  };

  const docs = documents ?? [];
  const totalChunks = docs.reduce((s, d) => s + d.chunks, 0);
  const totalSize = docs.reduce((s, d) => s + d.size, 0);
  const readyDocs = docs.filter((d) => d.status === 'ready').length;

  return (
    <DashboardShell>
      <DashboardHeader
        title="Knowledge Base"
        subtitle="Upload documents for RAG — your agents ground on your data"
        icon={<BookOpen className="h-5 w-5 text-orange-400" />}
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-black border border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-widest px-3 py-1.5 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">All Agents</option>
              {agents?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-[11px] bg-white text-black px-4 py-1.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              <Upload className="h-3 w-3" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.jsonl"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  Array.from(files).forEach((f) => uploadMutation.mutate(f));
                  e.target.value = '';
                }
              }}
            />
          </div>
        }
      />

      <DashboardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900">
          {[
            { label: 'Documents', value: docs.length, icon: FileText, color: 'text-orange-400' },
            {
              label: 'Chunks',
              value: totalChunks.toLocaleString(),
              icon: Database,
              color: 'text-orange-400',
            },
            {
              label: 'Total Size',
              value: formatBytes(totalSize),
              icon: Brain,
              color: 'text-blue-400',
            },
            {
              label: 'Ready',
              value: `${readyDocs}/${docs.length}`,
              icon: CheckCircle,
              color: 'text-emerald-400',
            },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-950 p-5 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                <s.icon className={cn('h-3 w-3', s.color)} />
                {s.label}
              </div>
              <div className={cn('text-2xl font-mono font-bold', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Semantic search */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Semantic Search
          </h2>
          <div className="flex gap-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
              placeholder="Search your knowledge base..."
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className={cn(
                'flex items-center gap-2 text-[11px] px-4 py-2 border transition-colors',
                'border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500',
                (!searchQuery.trim() || isSearching) && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Search className="h-3 w-3" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults && (
            <div className="mt-4 space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No results found.</p>
              ) : (
                searchResults.map((r, i) => (
                  <div key={i} className="border border-zinc-800 bg-black p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{r.docName}</span>
                      <span className="text-[10px] font-mono text-orange-400">
                        {(r.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{r.chunk}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Document list */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Documents ({docs.length})
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📚</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">
                No documents yet
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Upload PDFs, markdown, or text files. Your agents will use them to answer questions.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] border border-zinc-700 text-zinc-300 px-5 py-2 uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
              >
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-zinc-800 bg-black p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors"
                >
                  <FileText className="h-5 w-5 text-zinc-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{doc.name}</span>
                      <span
                        className={cn(
                          'text-[9px] uppercase tracking-widest px-1.5 py-0.5',
                          doc.status === 'ready'
                            ? 'text-emerald-400 border border-emerald-400/20'
                            : doc.status === 'processing'
                              ? 'text-amber-400 border border-amber-400/20'
                              : 'text-red-400 border border-red-400/20'
                        )}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                      <span className="font-mono">{doc.type.toUpperCase()}</span>
                      <span>{formatBytes(doc.size)}</span>
                      <span>{doc.chunks} chunks</span>
                      {doc.agentName && <span>→ {doc.agentName}</span>}
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    title="Delete document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supported formats */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-3">
            Supported Formats
          </h2>
          <div className="flex flex-wrap gap-2">
            {['PDF', 'Markdown', 'Text', 'CSV', 'JSON', 'JSONL', 'DOCX'].map((fmt) => (
              <span
                key={fmt}
                className="px-3 py-1.5 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest"
              >
                {fmt}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-3">
            Documents are chunked, embedded, and stored in a vector database for semantic retrieval.
            Each agent gets isolated knowledge — only the agent you assign sees its documents.
          </p>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
