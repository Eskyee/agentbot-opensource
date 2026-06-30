'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Bot,
  DollarSign,
  MessageSquare,
  Wrench,
  Globe,
  Lock,
  Unlock,
  Save,
  Plus,
  AlertTriangle,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell';

interface AgentPolicy {
  agentId: string;
  agentName: string;
  agentStatus: string;
  permissions: {
    canUseTools: boolean;
    canAccessInternet: boolean;
    canSendMessages: boolean;
    canModifyConfig: boolean;
    canAccessWallet: boolean;
    canExecuteCode: boolean;
  };
  limits: {
    maxTokensPerDay: number;
    maxCostPerDay: number;
    maxToolCallsPerHour: number;
    maxMessageLength: number;
  };
  channels: string[];
  allowedTools: string[];
  blockedTools: string[];
}

const defaultPermissions = {
  canUseTools: true,
  canAccessInternet: true,
  canSendMessages: true,
  canModifyConfig: false,
  canAccessWallet: false,
  canExecuteCode: true,
};

const defaultLimits = {
  maxTokensPerDay: 500000,
  maxCostPerDay: 5,
  maxToolCallsPerHour: 100,
  maxMessageLength: 4000,
};

const permissionLabels: Record<
  keyof typeof defaultPermissions,
  { label: string; desc: string; icon: typeof Shield; risk: 'low' | 'medium' | 'high' }
> = {
  canUseTools: {
    label: 'Use Tools',
    desc: 'Allow agent to call installed skills and tools',
    icon: Wrench,
    risk: 'medium',
  },
  canAccessInternet: {
    label: 'Internet Access',
    desc: 'Allow web search, URL fetching, and API calls',
    icon: Globe,
    risk: 'medium',
  },
  canSendMessages: {
    label: 'Send Messages',
    desc: 'Allow agent to send messages on connected channels',
    icon: MessageSquare,
    risk: 'medium',
  },
  canModifyConfig: {
    label: 'Modify Config',
    desc: 'Allow agent to change its own configuration',
    icon: Lock,
    risk: 'high',
  },
  canAccessWallet: {
    label: 'Wallet Access',
    desc: 'Allow agent to view and transact with crypto wallets',
    icon: DollarSign,
    risk: 'high',
  },
  canExecuteCode: {
    label: 'Execute Code',
    desc: 'Allow agent to run code in sandboxed environments',
    icon: Bot,
    risk: 'high',
  },
};

const riskColors = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

function PermissionToggle({
  permissionKey,
  enabled,
  onChange,
}: {
  permissionKey: keyof typeof defaultPermissions;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  const meta = permissionLabels[permissionKey];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        'border p-4 flex items-center gap-4 cursor-pointer transition-all',
        enabled ? 'border-zinc-700 bg-zinc-950' : 'border-zinc-800 bg-black opacity-60'
      )}
      onClick={() => onChange(!enabled)}
    >
      <Icon className={cn('h-5 w-5 shrink-0', enabled ? riskColors[meta.risk] : 'text-zinc-500')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">{meta.label}</span>
          <span className={cn('text-[9px] uppercase tracking-widest', riskColors[meta.risk])}>
            {meta.risk} risk
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5">{meta.desc}</p>
      </div>
      <div
        className={cn(
          'w-10 h-5 rounded-full relative transition-colors',
          enabled ? 'bg-orange-500' : 'bg-zinc-800'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </div>
    </div>
  );
}

export default function RBACPage() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [editedPolicy, setEditedPolicy] = useState<Partial<AgentPolicy>>({});

  const { data: agents } = useQuery<{ id: string; name: string; status: string }[]>({
    queryKey: ['rbac-agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.agents ?? [];
    },
  });

  const { data: policies, isLoading } = useQuery<AgentPolicy[]>({
    queryKey: ['rbac-policies'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/rbac');
      if (!res.ok) throw new Error('Failed to load policies');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (policy: Partial<AgentPolicy> & { agentId: string }) => {
      const res = await fetch('/api/dashboard/rbac', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-policies'] });
      setEditedPolicy({});
    },
  });

  const policyList = policies ?? [];
  const activePolicy = policyList.find((p) => p.agentId === selectedAgent);
  const currentPolicy = activePolicy ? { ...activePolicy, ...editedPolicy } : null;

  return (
    <DashboardShell className="flex flex-col h-screen overflow-hidden">
      <DashboardHeader
        title="Agent Permissions"
        subtitle="Per-agent RBAC — control tools, channels, spend limits, and capabilities"
        icon={<Shield className="h-5 w-5 text-orange-400" />}
        action={
          currentPolicy && Object.keys(editedPolicy).length > 0 ? (
            <button
              onClick={() =>
                saveMutation.mutate(editedPolicy as Partial<AgentPolicy> & { agentId: string })
              }
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 text-[11px] bg-white text-black px-4 py-1.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              <Save className="h-3 w-3" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          ) : null
        }
      />

      <DashboardContent className="flex-1 overflow-hidden min-h-0">
        <div className="flex gap-px bg-zinc-900 h-full">
          {/* Left: agent list */}
          <div className="w-64 bg-zinc-950 border-r border-zinc-800 overflow-y-auto shrink-0">
            <div className="px-4 py-3 border-b border-zinc-800">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Agents ({policyList.length})
              </span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : policyList.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500">No agents yet.</p>
              </div>
            ) : (
              policyList.map((p) => (
                <div
                  key={p.agentId}
                  onClick={() => {
                    setSelectedAgent(p.agentId);
                    setEditedPolicy({});
                  }}
                  className={cn(
                    'px-4 py-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900/30 transition-colors',
                    selectedAgent === p.agentId && 'bg-zinc-900/50 border-l-2 border-l-orange-500'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs font-bold text-white">{p.agentName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        'text-[9px] uppercase tracking-widest',
                        p.agentStatus === 'active' ? 'text-emerald-400' : 'text-zinc-500'
                      )}
                    >
                      {p.agentStatus}
                    </span>
                    <span className="text-[9px] text-zinc-500">·</span>
                    <span className="text-[9px] text-zinc-500">
                      ${p.limits.maxCostPerDay}/day limit
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: policy editor */}
          <div className="flex-1 bg-black overflow-y-auto">
            {currentPolicy ? (
              <div className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Agent header */}
                <div className="flex items-center gap-3">
                  <Bot className="h-6 w-6 text-orange-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                      {currentPolicy.agentName}
                    </h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      Permission policy
                    </p>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
                    Permissions
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(
                      Object.keys(defaultPermissions) as Array<keyof typeof defaultPermissions>
                    ).map((key) => (
                      <PermissionToggle
                        key={key}
                        permissionKey={key}
                        enabled={currentPolicy.permissions?.[key] ?? defaultPermissions[key]}
                        onChange={(val) => {
                          setEditedPolicy({
                            ...editedPolicy,
                            agentId: currentPolicy.agentId,
                            permissions: {
                              ...(currentPolicy.permissions ?? defaultPermissions),
                              [key]: val,
                            },
                          });
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Spend limits */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
                    Spend Limits
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      {
                        key: 'maxTokensPerDay',
                        label: 'Max Tokens/Day',
                        suffix: 'tokens',
                        icon: Zap,
                      },
                      {
                        key: 'maxCostPerDay',
                        label: 'Max Cost/Day',
                        suffix: '$',
                        icon: DollarSign,
                      },
                      {
                        key: 'maxToolCallsPerHour',
                        label: 'Tool Calls/Hour',
                        suffix: 'calls',
                        icon: Wrench,
                      },
                      {
                        key: 'maxMessageLength',
                        label: 'Max Message Length',
                        suffix: 'chars',
                        icon: MessageSquare,
                      },
                    ].map((field) => {
                      const Icon = field.icon;
                      return (
                        <div key={field.key} className="border border-zinc-800 bg-zinc-950 p-4">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                            <Icon className="h-3 w-3" />
                            {field.label}
                          </div>
                          <input
                            type="number"
                            value={
                              currentPolicy.limits?.[field.key as keyof typeof defaultLimits] ??
                              defaultLimits[field.key as keyof typeof defaultLimits]
                            }
                            onChange={(e) => {
                              setEditedPolicy({
                                ...editedPolicy,
                                agentId: currentPolicy.agentId,
                                limits: {
                                  ...(currentPolicy.limits ?? defaultLimits),
                                  [field.key]: Number(e.target.value),
                                },
                              });
                            }}
                            className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blocked tools */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
                    Tool Restrictions
                  </h3>
                  <div className="border border-zinc-800 bg-zinc-950 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                      Blocked Tools (comma-separated)
                    </div>
                    <input
                      value={currentPolicy.blockedTools?.join(', ') ?? ''}
                      onChange={(e) => {
                        setEditedPolicy({
                          ...editedPolicy,
                          agentId: currentPolicy.agentId,
                          blockedTools: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        });
                      }}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
                      placeholder="e.g. exec, sign_transaction, send_email"
                    />
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Tools listed here will be blocked for this agent regardless of other
                      permissions.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">
                    Select an Agent
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Choose an agent from the list to configure its permissions, spend limits, and
                    tool access.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
