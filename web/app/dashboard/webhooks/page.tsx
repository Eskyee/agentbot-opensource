'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Webhook,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  Github,
  CreditCard,
  MessageSquare,
  Globe,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell';

interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  provider: string;
  icon: typeof Zap;
  color: string;
  event: string;
  payload: string;
  docsUrl: string;
}

interface UserWebhook {
  id: string;
  name: string;
  templateId: string | null;
  url: string;
  event: string;
  enabled: boolean;
  lastTriggered: string | null;
  lastStatus: number | null;
  createdAt: string;
}

const templates: WebhookTemplate[] = [
  {
    id: 'stripe-payment',
    name: 'Stripe Payment',
    description:
      'Trigger your agent when a payment succeeds or fails. Auto-respond to customers, update records, send notifications.',
    provider: 'Stripe',
    icon: CreditCard,
    color: 'text-orange-400',
    event: 'payment_intent.succeeded',
    payload:
      '{"event": "payment_intent.succeeded", "data": {"amount": 2000, "currency": "gbp", "customer": "cus_xxx"}}',
    docsUrl: 'https://stripe.com/docs/webhooks',
  },
  {
    id: 'github-push',
    name: 'GitHub Push',
    description:
      'Agent reacts to code pushes. Auto-review, deploy notifications, changelog generation, or issue updates.',
    provider: 'GitHub',
    icon: Github,
    color: 'text-zinc-300',
    event: 'push',
    payload:
      '{"ref": "refs/heads/main", "commits": [{"message": "feat: new feature", "author": {"name": "dev"}}]}',
    docsUrl: 'https://docs.github.com/en/webhooks',
  },
  {
    id: 'github-issue',
    name: 'GitHub Issue',
    description:
      'Agent triages new issues, assigns labels, or responds with helpful context when issues are opened.',
    provider: 'GitHub',
    icon: Github,
    color: 'text-zinc-300',
    event: 'issues.opened',
    payload: '{"action": "opened", "issue": {"title": "Bug report", "body": "..."}}',
    docsUrl: 'https://docs.github.com/en/webhooks',
  },
  {
    id: 'discord-message',
    name: 'Discord Event',
    description:
      'Trigger on Discord events — new messages, reactions, member joins. Route to your agent for automated responses.',
    provider: 'Discord',
    icon: MessageSquare,
    color: 'text-indigo-400',
    event: 'message.create',
    payload: '{"content": "Hello!", "author": {"username": "user"}, "channel_id": "xxx"}',
    docsUrl: 'https://discord.com/developers/docs/topics/webhooks',
  },
  {
    id: 'twitter-mention',
    name: 'Twitter Mention',
    description:
      'Agent monitors mentions and replies automatically. Social media automation on autopilot.',
    provider: 'Twitter/X',
    icon: Globe,
    color: 'text-sky-400',
    event: 'mention',
    payload: '{"tweet": {"text": "@agentbot help me", "author": "user123"}}',
    docsUrl: 'https://developer.twitter.com/en/docs/webhooks',
  },
  {
    id: 'custom',
    name: 'Custom Webhook',
    description:
      'Build your own integration. Point any service at your agent endpoint with a custom payload.',
    provider: 'Custom',
    icon: Zap,
    color: 'text-orange-400',
    event: 'custom.event',
    payload: '{"event": "your_event", "data": {}}',
    docsUrl: '/documentation',
  },
];

const statusIcon = (status: number | null) => {
  if (!status) return <Clock className="h-3 w-3 text-zinc-500" />;
  if (status >= 200 && status < 300) return <CheckCircle className="h-3 w-3 text-emerald-400" />;
  return <XCircle className="h-3 w-3 text-red-400" />;
};

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WebhookTemplate | null>(null);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const { data: webhooks, isLoading } = useQuery<UserWebhook[]>({
    queryKey: ['user-webhooks'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/webhooks');
      if (!res.ok) throw new Error('Failed to load webhooks');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; templateId: string; url: string; event: string }) => {
      const res = await fetch('/api/dashboard/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create webhook');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-webhooks'] });
      setShowCreate(false);
      setSelectedTemplate(null);
      setWebhookName('');
      setWebhookUrl('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/webhooks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-webhooks'] });
    },
  });

  const userWebhooks = webhooks ?? [];

  return (
    <DashboardShell>
      <DashboardHeader
        title="Webhooks"
        subtitle="Zapier-style integrations — trigger your agent from external events"
        icon={<Webhook className="h-5 w-5 text-orange-400" />}
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 text-[11px] bg-white text-black px-4 py-1.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            <Plus className="h-3 w-3" />
            New Webhook
          </button>
        }
      />

      <DashboardContent className="space-y-6">
        {/* Create form */}
        {showCreate && (
          <div className="border border-orange-500/30 bg-zinc-950 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-tight mb-4">
              {selectedTemplate ? `Create: ${selectedTemplate.name}` : 'Choose a Template'}
            </h2>

            {!selectedTemplate ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplate(t);
                        setWebhookName(t.name);
                      }}
                      className="border border-zinc-800 bg-black p-4 text-left hover:border-zinc-600 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={cn('h-4 w-4', t.color)} />
                        <span className="text-xs font-bold text-white">{t.name}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Name
                  </label>
                  <input
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
                    placeholder="My Stripe Webhook"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Agent Endpoint URL
                  </label>
                  <input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
                    placeholder="https://YOUR_SERVICE_URL/webhook/incoming"
                  />
                </div>
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                    Event
                  </div>
                  <code className="text-xs text-orange-400 font-mono">
                    {selectedTemplate.event}
                  </code>
                </div>
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                    Example Payload
                  </div>
                  <pre className="text-[10px] text-zinc-500 font-mono overflow-x-auto">
                    {selectedTemplate.payload}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      createMutation.mutate({
                        name: webhookName,
                        templateId: selectedTemplate.id,
                        url: webhookUrl,
                        event: selectedTemplate.event,
                      });
                    }}
                    disabled={!webhookName || !webhookUrl || createMutation.isPending}
                    className={cn(
                      'text-[11px] bg-white text-black px-5 py-2 font-bold uppercase tracking-widest transition-colors',
                      !webhookName || !webhookUrl
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-zinc-200'
                    )}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setShowCreate(false);
                    }}
                    className="text-[11px] border border-zinc-700 text-zinc-400 px-5 py-2 uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {selectedTemplate.docsUrl && (
                  <a
                    href={selectedTemplate.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-orange-400 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {selectedTemplate.provider} webhook docs
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active webhooks */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Active Webhooks ({userWebhooks.length})
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : userWebhooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔗</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">
                No webhooks yet
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Connect external services to trigger your agent.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-[11px] border border-zinc-700 text-zinc-300 px-5 py-2 uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
              >
                Create Your First Webhook
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {userWebhooks.map((wh) => {
                const template = templates.find((t) => t.id === wh.templateId);
                const Icon = template?.icon ?? Zap;
                const color = template?.color ?? 'text-orange-400';
                return (
                  <div
                    key={wh.id}
                    className="border border-zinc-800 bg-black p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors"
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{wh.name}</span>
                        <span
                          className={cn(
                            'text-[9px] uppercase tracking-widest px-1.5 py-0.5',
                            wh.enabled
                              ? 'text-emerald-400 border border-emerald-400/20'
                              : 'text-zinc-500 border border-zinc-800'
                          )}
                        >
                          {wh.enabled ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                        {wh.url}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Event
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">{wh.event}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Last
                        </div>
                        <div className="flex items-center gap-1">
                          {statusIcon(wh.lastStatus)}
                          <span className="text-[10px] font-mono text-zinc-500">
                            {wh.lastTriggered
                              ? new Date(wh.lastTriggered).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(wh.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Template gallery (always visible) */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Integration Templates
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {templates.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.id} className="bg-zinc-950 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('h-4 w-4', t.color)} />
                    <span className="text-xs font-bold text-white uppercase tracking-tight">
                      {t.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">{t.description}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-[9px] font-mono text-zinc-500 bg-black px-2 py-0.5 border border-zinc-800">
                      {t.event}
                    </code>
                    {t.docsUrl && (
                      <a
                        href={t.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-zinc-500 hover:text-orange-400 transition-colors"
                      >
                        Docs →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
