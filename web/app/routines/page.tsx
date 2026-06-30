'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomSession } from '@/app/lib/useCustomSession';
import { useRouter } from 'next/navigation';

interface Routine {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  model: string;
  status: string;
  triggers: any[];
  lastRunAt: string | null;
  runCount: number;
  createdAt: string;
  _count: { runs: number };
}

interface RoutineRun {
  id: string;
  status: string;
  trigger: string;
  input: string | null;
  output: string | null;
  error: string | null;
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
}

const TRIGGER_TYPES = [
  { id: 'schedule', label: 'Schedule', icon: '⏰', description: 'Run on a recurring cadence' },
  { id: 'api', label: 'API', icon: '🔌', description: 'Trigger via HTTP POST' },
  { id: 'github', label: 'GitHub', icon: '🐙', description: 'Run on repo events' },
];

const TEMPLATES = [
  {
    name: 'PR Reviewer',
    icon: '🔍',
    description: 'Reviews pull requests for security, performance, and style issues',
    prompt:
      'Review all open pull requests. For each PR:\n1. Check for security vulnerabilities (SQL injection, XSS, hardcoded secrets)\n2. Check for performance issues (N+1 queries, unnecessary re-renders, large bundle imports)\n3. Check for code style (naming, formatting, error handling)\n4. Leave inline comments with specific suggestions\n5. Add a summary comment with overall assessment',
    triggers: [{ type: 'github', event: 'pull_request.opened' }],
    model: 'anthropic/claude-sonnet-4',
  },
  {
    name: 'Deploy Checker',
    icon: '🚀',
    description: 'Verifies deployments and checks for regressions',
    prompt:
      'After a production deploy:\n1. Run the test suite\n2. Check error logs for new issues\n3. Verify key endpoints respond correctly\n4. Check performance metrics\n5. Report go/no-go with specific findings',
    triggers: [{ type: 'api' }],
    model: 'openai/gpt-4o',
  },
  {
    name: 'Backlog Groomer',
    icon: '📋',
    description: 'Organizes and labels issues in your backlog',
    prompt:
      'Review issues opened in the last 24 hours:\n1. Add appropriate labels (bug, feature, enhancement, documentation)\n2. Assign priority (P0-P3) based on impact\n3. Tag the right team member based on the area of code\n4. Close duplicates and link related issues\n5. Post a summary to Slack with the groomed queue',
    triggers: [{ type: 'schedule', cron: '0 9 * * 1-5' }],
    model: 'openai/gpt-4o-mini',
  },
  {
    name: 'Security Scanner',
    icon: '🛡️',
    description: 'Scans codebase for vulnerabilities and exposed secrets',
    prompt:
      'Run a security scan:\n1. Check for hardcoded secrets, API keys, or credentials\n2. Scan for known vulnerabilities in dependencies\n3. Check for SQL injection, XSS, and CSRF vulnerabilities\n4. Verify authentication and authorization patterns\n5. Generate a security report with severity levels',
    triggers: [{ type: 'schedule', cron: '0 2 * * *' }],
    model: 'anthropic/claude-sonnet-4',
  },
  {
    name: 'Doc Syncer',
    icon: '📚',
    description: 'Keeps documentation in sync with code changes',
    prompt:
      'Check documentation drift:\n1. Find PRs merged since last run\n2. Identify API changes, new features, or breaking changes\n3. Check if relevant docs were updated\n4. Open PRs to update documentation for any gaps\n5. Flag documentation that references deprecated APIs',
    triggers: [{ type: 'schedule', cron: '0 10 * * 1' }],
    model: 'openai/gpt-4o-mini',
  },
  {
    name: 'Issue Triager',
    icon: '🎯',
    description: 'Automatically categorizes and prioritizes new issues',
    prompt:
      'Triage new issues:\n1. Read the issue title and description\n2. Classify as bug, feature request, question, or enhancement\n3. Add appropriate labels\n4. Check for duplicates and link them\n5. Set priority based on impact and urgency\n6. Assign to the right team member or label for review',
    triggers: [{ type: 'github', event: 'issues.opened' }],
    model: 'openai/gpt-4o-mini',
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-500/10',
  paused: 'text-yellow-400 bg-yellow-500/10',
  error: 'text-red-400 bg-red-500/10',
};

const RUN_STATUS_COLORS: Record<string, string> = {
  running: 'text-blue-400 bg-blue-500/10',
  completed: 'text-green-400 bg-green-500/10',
  failed: 'text-red-400 bg-red-500/10',
};

export default function RoutinesPage() {
  const { data: session, status } = useCustomSession();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [runs, setRuns] = useState<RoutineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTriggers, setNewTriggers] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') {
      fetchRoutines();
    } else {
      setLoading(false);
    }
  }, [status]);

  const fetchRoutines = async () => {
    try {
      const res = await fetch('/api/routines');
      const data = await res.json();
      setRoutines(data.routines || []);
    } catch (err) {
      console.error('Failed to fetch routines:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async (routineId: string) => {
    try {
      const res = await fetch(`/api/routines/${routineId}`);
      const data = await res.json();
      setRuns(data.routine?.runs || []);
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    }
  };

  const createRoutine = async () => {
    if (!newName || !newPrompt) return;
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          prompt: newPrompt,
          description: newDescription,
          triggers: newTriggers,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName('');
        setNewPrompt('');
        setNewDescription('');
        setNewTriggers([]);
        fetchRoutines();
      }
    } catch (err) {
      console.error('Failed to create routine:', err);
    } finally {
      setCreating(false);
    }
  };

  const triggerRoutine = async (routineId: string) => {
    try {
      await fetch(`/api/routines/${routineId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual' }),
      });
      fetchRuns(routineId);
    } catch (err) {
      console.error('Failed to trigger routine:', err);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    if (!confirm('Delete this routine?')) return;
    try {
      await fetch(`/api/routines/${routineId}`, { method: 'DELETE' });
      setSelectedRoutine(null);
      fetchRoutines();
    } catch (err) {
      console.error('Failed to delete routine:', err);
    }
  };

  const toggleRoutineStatus = async (routine: Routine) => {
    const newStatus = routine.status === 'active' ? 'paused' : 'active';
    await fetch(`/api/routines/${routine.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchRoutines();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Routines</h1>
            <p className="text-xs text-orange-500/70">
              Automate work with scheduled, API, and GitHub triggers
            </p>
          </div>
          <button
            onClick={() => {
              if (status !== 'authenticated') {
                router.push('/login');
                return;
              }
              setShowCreate(true);
            }}
            className="bg-white text-black px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            + New Routine
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* How it works */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {TRIGGER_TYPES.map((type) => (
            <div key={type.id} className="border border-zinc-800 bg-zinc-950 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{type.icon}</span>
                <span className="text-sm font-bold">{type.label}</span>
              </div>
              <p className="text-xs text-zinc-500">{type.description}</p>
            </div>
          ))}
        </div>

        {/* Quick start templates */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">
            Quick Start Templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.name}
                onClick={() => {
                  if (status !== 'authenticated') {
                    router.push('/login');
                    return;
                  }
                  setNewName(template.name);
                  setNewPrompt(template.prompt);
                  setNewTriggers(template.triggers);
                  setShowCreate(true);
                }}
                className="text-left border border-zinc-800 bg-zinc-950 p-4 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{template.icon}</span>
                  <span className="text-sm font-bold group-hover:text-white transition-colors">
                    {template.name}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{template.description}</p>
                <div className="flex items-center gap-2">
                  {template.triggers.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400"
                    >
                      {t.type}
                    </span>
                  ))}
                  <span className="text-[10px] text-zinc-600">{template.model}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Create form modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4">Create Routine</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Daily PR Review"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Reviews PRs every night at 9am"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Prompt</label>
                    <textarea
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="Review all open PRs and leave comments on security, performance, and style issues..."
                      rows={4}
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">Triggers</label>
                    <div className="flex flex-wrap gap-2">
                      {TRIGGER_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => {
                            const exists = newTriggers.find((t) => t.type === type.id);
                            if (exists) {
                              setNewTriggers(newTriggers.filter((t) => t.type !== type.id));
                            } else {
                              setNewTriggers([...newTriggers, { type: type.id }]);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                            newTriggers.find((t) => t.type === type.id)
                              ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                              : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                          }`}
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createRoutine}
                    disabled={creating || !newName || !newPrompt}
                    className="flex-1 bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Routines list */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading routines...</div>
        ) : routines.length === 0 ? (
          <div className="text-center py-12 border border-zinc-800 rounded-xl bg-zinc-950">
            <p className="text-zinc-500 mb-4">
              {status !== 'authenticated'
                ? 'Log in to create and manage routines'
                : 'No routines yet'}
            </p>
            {status !== 'authenticated' ? (
              <button
                onClick={() => router.push('/login')}
                className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Log in
              </button>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Create your first routine
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="border border-zinc-800 bg-zinc-950 rounded-lg p-4 hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedRoutine(routine);
                  fetchRuns(routine.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm truncate">{routine.name}</h3>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          STATUS_COLORS[routine.status] || 'text-zinc-400 bg-zinc-800'
                        }`}
                      >
                        {routine.status}
                      </span>
                    </div>
                    {routine.description && (
                      <p className="text-xs text-zinc-500 mb-2">{routine.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-600">
                      <span>Runs: {routine._count.runs}</span>
                      <span>Last: {formatDate(routine.lastRunAt)}</span>
                      <span>Triggers: {routine.triggers?.length || 0}</span>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => triggerRoutine(routine.id)}
                      className="px-2 py-1 text-[10px] bg-orange-500 text-black rounded hover:bg-orange-400 transition-colors"
                    >
                      Run
                    </button>
                    <button
                      onClick={() => toggleRoutineStatus(routine)}
                      className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                        routine.status === 'active'
                          ? 'border-zinc-700 text-zinc-400 hover:text-yellow-400'
                          : 'border-zinc-700 text-zinc-400 hover:text-green-400'
                      }`}
                    >
                      {routine.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteRoutine(routine.id)}
                      className="px-2 py-1 text-[10px] border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/40 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Run history panel */}
        {selectedRoutine && (
          <div className="mt-6 border border-zinc-800 bg-zinc-950 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">{selectedRoutine.name} — Runs</h2>
              <button
                onClick={() => setSelectedRoutine(null)}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
            {runs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4">No runs yet</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center gap-3 text-xs py-2 border-b border-zinc-900 last:border-0"
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        RUN_STATUS_COLORS[run.status] || 'text-zinc-400 bg-zinc-800'
                      }`}
                    >
                      {run.status}
                    </span>
                    <span className="text-zinc-500">{run.trigger}</span>
                    <span className="text-zinc-600">{formatDate(run.startedAt)}</span>
                    {run.duration && <span className="text-zinc-600">{run.duration}ms</span>}
                    {run.error && <span className="text-red-400 truncate flex-1">{run.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
