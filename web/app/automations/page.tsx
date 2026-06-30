'use client';

import { useState, useEffect } from 'react';
import { useCustomSession } from '@/app/lib/useCustomSession';
import { useRouter } from 'next/navigation';

const TRIGGER_SOURCES = [
  { id: 'slack', icon: '💬', label: 'Slack', events: ['Message', 'Reaction'] },
  {
    id: 'github',
    icon: '🐙',
    label: 'GitHub',
    events: ['PR opened', 'CI failure', 'Issue comment', 'Push'],
  },
  {
    id: 'linear',
    icon: '📋',
    label: 'Linear',
    events: ['Issue created', 'Label added', 'Status changed'],
  },
  { id: 'schedule', icon: '⏰', label: 'Schedule', events: ['Recurring', 'One-off'] },
  { id: 'webhook', icon: '🔌', label: 'Webhook', events: ['HTTP POST'] },
];

const ACTION_TYPES = [
  {
    id: 'start_session',
    icon: '🚀',
    label: 'Start Session',
    description: 'Create a new agent session with your prompt',
  },
  {
    id: 'message_session',
    icon: '💬',
    label: 'Message Session',
    description: 'Send to an existing long-running session',
  },
  {
    id: 'triage',
    icon: '🎯',
    label: 'Triage Monitor',
    description: 'Persistent agent that monitors and spawns sub-agents',
  },
  {
    id: 'email',
    icon: '📧',
    label: 'Email Notification',
    description: 'Send email on run success or failure',
  },
];

const TEMPLATES = [
  {
    name: 'CI Failure Auto-Fix',
    icon: '🔧',
    description: 'When CI fails on a PR, agent fixes the issue and pushes a fix',
    category: 'CI/CD',
    trigger: { source: 'github', event: 'check_run' },
    action: {
      type: 'start_session',
      prompt:
        'CI check failed. Analyze the failure, fix the code, and push a commit to the same branch.',
    },
  },
  {
    name: '/agent Issue Fix',
    icon: '🐛',
    description: 'Responds to /agent comments on GitHub issues with a fix PR',
    category: 'CI/CD',
    trigger: { source: 'github', event: 'issue_comment' },
    action: {
      type: 'start_session',
      prompt: 'Read the issue and the /agent comment. Implement the requested fix and open a PR.',
    },
  },
  {
    name: 'Daily Sentry Error Sweep',
    icon: '🔍',
    description: 'Pulls top Sentry errors daily and opens fix PRs',
    category: 'Monitoring',
    trigger: { source: 'schedule', event: 'daily 9am' },
    action: {
      type: 'start_session',
      prompt:
        'Query Sentry for top unresolved errors. For each, analyze the stack trace and open a fix PR.',
    },
    mcp: ['sentry'],
  },
  {
    name: 'Slack Bug Triage',
    icon: '🎯',
    description: 'Monitors #bugs channel and auto-triages incoming reports',
    category: 'Triage',
    trigger: { source: 'slack', event: '#bugs channel' },
    action: {
      type: 'triage',
      prompt:
        'Triage incoming bug reports. Classify severity, assign labels, and create Linear tickets.',
    },
    mcp: ['slack', 'linear'],
  },
  {
    name: 'Weekly Dependency Updates',
    icon: '📦',
    description: 'Scans for outdated packages and opens update PRs',
    category: 'Maintenance',
    trigger: { source: 'schedule', event: 'Monday 10am' },
    action: {
      type: 'start_session',
      prompt:
        'Check for outdated dependencies. Update non-breaking versions and open a PR with the changes.',
    },
  },
  {
    name: 'Datadog Alert Investigation',
    icon: '📊',
    description: 'Investigates Datadog alerts posted to Slack',
    category: 'Monitoring',
    trigger: { source: 'slack', event: '#alerts channel' },
    action: {
      type: 'start_session',
      prompt:
        'Investigate the Datadog alert. Pull metrics and traces, find root cause, and post analysis.',
    },
    mcp: ['datadog', 'slack'],
  },
  {
    name: 'Security Vulnerability Scan',
    icon: '🛡️',
    description: 'Weekly CVE scan with fix PRs for critical vulnerabilities',
    category: 'Security',
    trigger: { source: 'schedule', event: 'Monday 3am' },
    action: {
      type: 'start_session',
      prompt:
        'Scan dependencies for known CVEs. For critical vulnerabilities, update packages and open a fix PR.',
    },
  },
  {
    name: 'Stale PR Cleanup',
    icon: '🧹',
    description: 'Flags PRs with no recent activity and checks for conflicts',
    category: 'Maintenance',
    trigger: { source: 'schedule', event: 'Friday 9am' },
    action: {
      type: 'start_session',
      prompt:
        'Find PRs with no activity for 7+ days. Comment on each asking if still needed. Close abandoned ones.',
    },
  },
  {
    name: 'Webhook Alert Handler',
    icon: '🔔',
    description: 'Receives webhooks from PagerDuty/Sentry/Datadog and investigates',
    category: 'Monitoring',
    trigger: { source: 'webhook', event: 'HTTP POST' },
    action: {
      type: 'start_session',
      prompt:
        'Analyze the incoming alert payload. Investigate the issue, check logs, and provide a root cause analysis.',
    },
  },
];

const MCP_CATALOG = [
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Read/write messages, channels, reactions',
    authType: 'oauth',
    webhookUrl: '/api/webhooks/slack',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Repos, PRs, issues, actions, CI',
    authType: 'oauth',
    webhookUrl: '/api/webhooks/github',
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: '📋',
    description: 'Issues, projects, teams, labels',
    authType: 'oauth',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    icon: '🔍',
    description: 'Errors, performance, releases',
    authType: 'token',
  },
  {
    id: 'datadog',
    name: 'Datadog',
    icon: '📊',
    description: 'Metrics, logs, traces, monitors',
    authType: 'token',
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Pages, databases, wikis',
    authType: 'oauth',
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: '🎫',
    description: 'Issues, sprints, boards',
    authType: 'oauth',
  },
  {
    id: 'figma',
    name: 'Figma',
    icon: '🎨',
    description: 'Designs, components, prototypes',
    authType: 'oauth',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'CI/CD': 'bg-blue-500/20 text-blue-400',
  Monitoring: 'bg-purple-500/20 text-purple-400',
  Triage: 'bg-orange-500/20 text-orange-400',
  Maintenance: 'bg-green-500/20 text-green-400',
  Security: 'bg-red-500/20 text-red-400',
};

interface Automation {
  id: string;
  name: string;
  description: string | null;
  status: string;
  triggers: any[];
  action: any;
  mcpServers: any[];
  fireCount: number;
  lastFiredAt: string | null;
  _count: { runs: number };
}

interface McpServer {
  id: string;
  name: string;
  type: string;
  status: string;
  config: any;
}

export default function AutomationsPage() {
  const { data: session, status } = useCustomSession();
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'automations' | 'templates' | 'mcp'>('automations');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newTriggerSource, setNewTriggerSource] = useState('');
  const [newTriggerEvent, setNewTriggerEvent] = useState('');
  const [newActionType, setNewActionType] = useState('start_session');
  const [newMcpServers, setNewMcpServers] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showWebhookUrl, setShowWebhookUrl] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/automations')
          .then((r) => r.json())
          .catch(() => ({ automations: [] })),
        fetch('/api/mcp')
          .then((r) => r.json())
          .catch(() => ({ servers: [] })),
      ]).then(([autoData, mcpData]) => {
        setAutomations(autoData.automations || []);
        setMcpServers(mcpData.servers || []);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [status]);

  const createAutomation = async () => {
    if (!newName || !newPrompt) return;
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        description: newDescription,
        triggers: [{ source: newTriggerSource, event: newTriggerEvent }],
        action: { type: newActionType, prompt: newPrompt },
        mcpServers: newMcpServers,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      resetForm();
      fetchData();
    }
  };

  const createFromTemplate = (t: (typeof TEMPLATES)[0]) => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setNewName(t.name);
    setNewDescription(t.description);
    setNewPrompt(t.action.prompt);
    setNewTriggerSource(t.trigger.source);
    setNewTriggerEvent(t.trigger.event);
    setNewActionType(t.action.type);
    setNewMcpServers(t.mcp || []);
    setShowCreate(true);
    setView('automations');
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewPrompt('');
    setNewTriggerSource('');
    setNewTriggerEvent('');
    setNewActionType('start_session');
    setNewMcpServers([]);
  };

  const fetchData = () => {
    fetch('/api/automations')
      .then((r) => r.json())
      .then((d) => setAutomations(d.automations || []));
    fetch('/api/mcp')
      .then((r) => r.json())
      .then((d) => setMcpServers(d.servers || []));
  };

  const toggleAutomation = async (a: Automation) => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    await fetch(`/api/automations/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: a.status === 'active' ? 'paused' : 'active' }),
    });
    fetchData();
  };

  const deleteAutomation = async (id: string) => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    if (!confirm('Delete this automation?')) return;
    await fetch(`/api/automations/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const connectMcpServer = async (type: string) => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setConnecting(type);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: type, type, config: {} }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.server?.id) {
          // Initiate connection
          const connectRes = await fetch(`/api/mcp/${data.server.id}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const connectData = await connectRes.json();
          if (connectData.oauthUrl) {
            // Open OAuth popup
            window.open(connectData.oauthUrl, '_blank', 'width=600,height=700');
          }
        }
        fetchData();
      }
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setConnecting(null);
    }
  };

  const disconnectMcpServer = async (serverId: string) => {
    await fetch(`/api/mcp/${serverId}/connect`, { method: 'DELETE' });
    fetchData();
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
      <header className="border-b border-zinc-800 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Automations</h1>
            <p className="text-xs text-orange-500/70">
              Event-driven workflows with MCP integrations
            </p>
          </div>
          <button
            onClick={() => {
              if (status !== 'authenticated') {
                router.push('/login');
                return;
              }
              resetForm();
              setShowCreate(true);
            }}
            className="bg-white text-black px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            + New
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {(['automations', 'templates', 'mcp'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                view === v ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {v === 'mcp' ? 'MCP Integrations' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {view === 'automations' &&
          (loading ? (
            <p className="text-zinc-500 text-sm py-8">Loading...</p>
          ) : automations.length === 0 ? (
            <div className="text-center py-12 border border-zinc-800 rounded-xl bg-zinc-950">
              <p className="text-zinc-500 mb-2">
                {status !== 'authenticated'
                  ? 'Log in to create and manage automations'
                  : 'No automations yet'}
              </p>
              <p className="text-xs text-zinc-600 mb-4">
                Create one from scratch or use a template
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
                  onClick={() => setView('templates')}
                  className="text-orange-500 text-sm hover:text-orange-400"
                >
                  Browse templates →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((a) => (
                <div
                  key={a.id}
                  className="border border-zinc-800 bg-zinc-950 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate">{a.name}</h3>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            a.status === 'active'
                              ? 'text-green-400 bg-green-500/10'
                              : 'text-yellow-400 bg-yellow-500/10'
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      {a.description && (
                        <p className="text-xs text-zinc-500 mb-2">{a.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-[10px] text-zinc-600">
                        {a.triggers?.map((t: any, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-zinc-800 rounded">
                            {t.source}: {t.event}
                          </span>
                        ))}
                        {a.mcpServers?.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                            {a.mcpServers.length} MCP
                          </span>
                        )}
                        <span>Fired: {a.fireCount}×</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleAutomation(a)}
                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                          a.status === 'active'
                            ? 'border-zinc-700 text-zinc-400 hover:text-yellow-400'
                            : 'border-zinc-700 text-zinc-400 hover:text-green-400'
                        }`}
                      >
                        {a.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => deleteAutomation(a.id)}
                        className="px-2 py-1 text-[10px] border border-zinc-700 text-zinc-400 hover:text-red-400 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {view === 'templates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => createFromTemplate(t)}
                className="text-left border border-zinc-800 bg-zinc-950 p-4 rounded-lg hover:border-zinc-600 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-sm font-bold group-hover:text-white transition-colors">
                    {t.name}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      CATEGORY_COLORS[t.category] || 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {t.category}
                  </span>
                  <span className="text-[10px] text-zinc-600">{t.trigger.source}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {view === 'mcp' && (
          <div>
            <p className="text-xs text-zinc-500 mb-4">
              Connect external services to give automations access to tools, data, and actions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MCP_CATALOG.map((mcp) => {
                const connected = mcpServers.find(
                  (s) => s.type === mcp.id && s.status === 'connected'
                );
                return (
                  <div
                    key={mcp.id}
                    className={`border rounded-lg p-4 ${
                      connected
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{mcp.icon}</span>
                        <span className="text-sm font-bold">{mcp.name}</span>
                      </div>
                      {connected && <span className="text-[10px] text-green-400">Connected</span>}
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">{mcp.description}</p>
                    {mcp.webhookUrl && connected && (
                      <div className="mb-3">
                        <button
                          onClick={() =>
                            setShowWebhookUrl(showWebhookUrl === mcp.id ? null : mcp.id)
                          }
                          className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                        >
                          {showWebhookUrl === mcp.id ? 'Hide' : 'Show'} webhook URL
                        </button>
                        {showWebhookUrl === mcp.id && (
                          <div className="mt-2 p-2 bg-zinc-900 rounded text-[10px] font-mono text-zinc-400 break-all">
                            {`${typeof window !== 'undefined' ? window.location.origin : ''}${
                              mcp.webhookUrl
                            }`}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() =>
                        connected ? disconnectMcpServer(connected.id) : connectMcpServer(mcp.id)
                      }
                      disabled={connecting === mcp.id}
                      className={`w-full text-xs py-1.5 rounded transition-colors ${
                        connected
                          ? 'bg-zinc-800 text-zinc-400 hover:text-red-400'
                          : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      } disabled:opacity-50`}
                    >
                      {connecting === mcp.id
                        ? 'Connecting...'
                        : connected
                          ? 'Disconnect'
                          : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4">Create Automation</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="CI Failure Auto-Fix"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Auto-fixes failing CI checks"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">Trigger Source</label>
                    <div className="flex flex-wrap gap-2">
                      {TRIGGER_SOURCES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setNewTriggerSource(s.id);
                            setNewTriggerEvent(s.events[0]);
                          }}
                          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                            newTriggerSource === s.id
                              ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                              : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                          }`}
                        >
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {newTriggerSource && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Event</label>
                      <select
                        value={newTriggerEvent}
                        onChange={(e) => setNewTriggerEvent(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                      >
                        {TRIGGER_SOURCES.find((s) => s.id === newTriggerSource)?.events.map(
                          (ev) => (
                            <option key={ev} value={ev}>
                              {ev}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">Action</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACTION_TYPES.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setNewActionType(a.id)}
                          className={`text-left p-2 rounded border transition-colors ${
                            newActionType === a.id
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{a.icon}</span>
                            <span className="text-xs font-bold">{a.label}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500">{a.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Prompt</label>
                    <textarea
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="What should the agent do when this triggers?"
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">MCP Integrations</label>
                    <div className="flex flex-wrap gap-2">
                      {MCP_CATALOG.slice(0, 4).map((mcp) => (
                        <button
                          key={mcp.id}
                          onClick={() =>
                            setNewMcpServers(
                              newMcpServers.includes(mcp.id)
                                ? newMcpServers.filter((s) => s !== mcp.id)
                                : [...newMcpServers, mcp.id]
                            )
                          }
                          className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                            newMcpServers.includes(mcp.id)
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                              : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                          }`}
                        >
                          {mcp.icon} {mcp.name}
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
                    onClick={createAutomation}
                    disabled={!newName || !newPrompt}
                    className="flex-1 bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
