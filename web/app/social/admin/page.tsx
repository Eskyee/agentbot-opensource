'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  post: { id: string; body: string } | null;
  comment: { id: string; body: string } | null;
  reporterUser: { id: string } | null;
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/social/admin/reports')
      .then(r => {
        if (r.status === 403) throw new Error('Access denied');
        return r.json();
      })
      .then(d => setReports(d.reports ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function takeAction(reportId: string, targetType: string, targetId: string, action: string) {
    setActing(reportId);
    try {
      const res = await fetch('/api/social/admin/moderation-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, action, reportId, reason: `Resolved via mod queue` }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Action failed'); return; }
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch {
      alert('Network error');
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-3xl mx-auto px-5 py-14">
        <Link href="/social" className="text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest">← Social</Link>
        <h1 className="text-2xl font-bold uppercase tracking-tighter mt-4 mb-2">Moderation Queue</h1>
        <p className="text-zinc-500 text-sm mb-10">Open reports from the community. Admin access only.</p>

        {loading && <div className="text-zinc-600 text-sm">Loading reports…</div>}

        {error && (
          <div className="border border-red-800 bg-red-950/30 px-5 py-4 text-red-400 text-sm">
            {error === 'Access denied' ? 'You do not have admin access.' : error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="border border-zinc-800 p-8 text-center text-zinc-500 text-sm">
            No open reports — the community is thriving 🎉
          </div>
        )}

        <div className="space-y-4">
          {reports.map(report => {
            const target = report.post ?? report.comment;
            const targetType = report.post ? 'post' : 'comment';
            const targetId = target?.id ?? '';

            return (
              <div key={report.id} className="border border-zinc-800 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">{report.reason}</div>
                    {target && (
                      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
                        {target.body.slice(0, 200)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  {target && (
                    <button
                      onClick={() => takeAction(report.id, targetType, targetId, `remove_${targetType}`)}
                      disabled={acting === report.id}
                      className="px-3 py-1.5 border border-red-800 text-red-400 hover:bg-red-950/30 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                      Remove {targetType}
                    </button>
                  )}
                  <button
                    onClick={() => takeAction(report.id, 'report', report.id, 'dismiss')}
                    disabled={acting === report.id}
                    className="px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
