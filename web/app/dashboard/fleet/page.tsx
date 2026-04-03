'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, DollarSign, Hash, Bot, LayoutGrid, Dna, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { CloneButton } from '@/app/components/shared/CloneButton';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'

const OrganismCanvas = dynamic(
  () => import('@/components/dashboard/constellation/OrganismCanvas').then(m => ({ default: m.OrganismCanvas })),
  { ssr: false, loading: () => <div className="absolute inset-0 flex items-center justify-center"><div className="animate-pulse text-xs text-zinc-500 uppercase tracking-widest">Loading fleet...</div></div> }
);
const ExecutionTrace = dynamic(
  () => import('@/components/dashboard/fleet/ExecutionTrace').then(m => ({ default: m.ExecutionTrace })),
  { ssr: false }
);

export default function FleetPage() {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'organism'>('organism');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Fetch Fleet Graph from our new Mission Control API
  const { data: graph, isLoading: graphLoading } = useQuery({
    queryKey: ['fleet-graph'],
    queryFn: async () => {
      const res = await fetch('/api/mission-control/fleet/graph');
      return res.json();
    },
    refetchInterval: 5000 // Real-time pulse
  });

  // Fetch execution traces
  const { data: traces } = useQuery({
    queryKey: ['fleet-traces'],
    queryFn: async () => {
      const res = await fetch('/api/mission-control/fleet/traces');
      return res.json();
    },
    refetchInterval: 2000
  });

  const agents = graph?.nodes ?? [];
  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId);
  const totalAgents = graph?.stats?.totalAgents ?? agents.length;
  const activeAgents = graph?.stats?.activeAgents ?? agents.filter((a: any) => a.status === 'active').length;
  const idleAgents = graph?.stats?.idleAgents ?? agents.filter((a: any) => a.status === 'idle').length;
  const operationalStatus = activeAgents > 0 ? 'active' : idleAgents > 0 || graphLoading ? 'idle' : 'offline';
  const dashboardUrl = graph?.dashboardUrl;
  const serviceUrl = graph?.serviceUrl;
  const graphDetail = graph?.detail;
  const graphSourceLabel = graph?.degraded ? 'Fallback feed' : 'Live feed';

  const FleetIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )

  return (
    <DashboardShell className="flex flex-col h-screen overflow-hidden">
      <DashboardHeader
        title="Fleet"
        icon={<FleetIcon />}
        action={
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Tab toggle */}
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              <button
                onClick={() => setActiveTab('organism')}
                className={cn(
                  'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
                  activeTab === 'organism' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                )}
              >
                <Dna className="h-3 w-3" /> <span className="hidden sm:inline">Constellation</span><span className="sm:hidden">Map</span>
              </button>
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={cn(
                  'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
                  activeTab === 'hierarchy' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                )}
              >
                <LayoutGrid className="h-3 w-3" /> <span className="hidden sm:inline">Hierarchy</span><span className="sm:hidden">List</span>
              </button>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Active Agents</span>
                <div className="text-xs font-mono">{activeAgents} / {Math.max(totalAgents, 1)}</div>
              </div>
              <StatusPill status={operationalStatus} label={operationalStatus === 'active' ? 'Operational' : operationalStatus === 'idle' ? 'Warming' : 'Offline'} size="sm" />
            </div>
          </div>
        }
      />

      {/* Main Content Area — special layout for canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Constellation / Graph */}
        <div className="flex-1 min-w-0 relative bg-[#050505]">
          {serviceUrl && (
            <div className="absolute left-4 top-4 z-10 max-w-[420px] border border-zinc-800 bg-black/70 px-3 py-2 backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">{graphSourceLabel}</div>
              <div className="mt-1 truncate text-[11px] font-mono text-zinc-300">{serviceUrl}</div>
              {graphDetail && <div className="mt-1 text-[10px] text-amber-400">{graphDetail}</div>}
            </div>
          )}
          {graphLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-xs text-zinc-500 uppercase tracking-widest">Loading fleet...</div>
            </div>
          ) : (
            <OrganismCanvas 
              nodes={graph?.nodes ?? []} 
              edges={graph?.edges ?? []} 
              onNodeClick={(node: any) => setSelectedAgentId(node.id)}
              isLive={true}
            />
          )}
        </div>

        {/* Right: Traces & Details */}
        <div className="hidden lg:flex w-[400px] border-l border-zinc-800 flex-col bg-[#0a0a0a]">
          {/* Trace Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Live Traces</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">v2.1.0-alpha</span>
          </div>

          {/* Execution Trace Feed */}
          <div className="flex-1 overflow-y-auto">
            <ExecutionTrace tasks={traces ?? []} />
          </div>

          {/* Selected Agent Quick View */}
          {selectedAgent && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <Bot className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight uppercase">{selectedAgent.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{selectedAgent.role ?? selectedAgent.type}</div>
                </div>
              </div>
              {selectedAgent.url && (
                <a
                  href={selectedAgent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 block text-[10px] font-mono text-blue-400 underline-offset-2 hover:underline truncate"
                >
                  {selectedAgent.url}
                </a>
              )}
              <div className="grid grid-cols-2 gap-px bg-zinc-800 text-[10px]">
                <div className="bg-zinc-950 p-3">
                  <div className="text-zinc-600 uppercase tracking-widest mb-1">Status</div>
                  <div className="font-bold uppercase text-white">{selectedAgent.status ?? 'unknown'}</div>
                </div>
                <div className="bg-zinc-950 p-3">
                  <div className="text-zinc-600 uppercase tracking-widest mb-1">Fitness</div>
                  <div className="font-bold text-white">{selectedAgent.fitness != null ? `${selectedAgent.fitness}%` : '—'}</div>
                </div>
                <div className="bg-zinc-950 p-3">
                  <div className="text-zinc-600 uppercase tracking-widest mb-1">Cycles</div>
                  <div className="font-bold text-white">{selectedAgent.cycles ?? '—'}</div>
                </div>
                <div className="bg-zinc-950 p-3">
                  <div className="text-zinc-600 uppercase tracking-widest mb-1">Endpoints</div>
                  <div className="font-bold text-white">{selectedAgent.endpoints ?? '—'}</div>
                </div>
              </div>
              <div className="mt-4">
                {dashboardUrl && (
                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 flex items-center justify-center border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:border-blue-500"
                  >
                    Open Borg Dashboard
                  </a>
                )}
                <CloneButton
                  agent={{
                    id: selectedAgent.id,
                    name: selectedAgent.name,
                    specialization: selectedAgent.type || 'general',
                    generation: selectedAgent.generation || 1,
                    fitness: selectedAgent.fitness || 0,
                    children: selectedAgent.children || 0,
                    walletAddress: selectedAgent.walletAddress || '0x0000000000000000000000000000000000000000',
                  }}
                  onSuccess={(newAgent: any) => {
                    console.log('Clone created:', newAgent);
                    // Refetch fleet graph
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
