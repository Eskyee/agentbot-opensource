'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, DollarSign, Hash, Bot, LayoutGrid, Dna, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrganismCanvas } from '@/components/dashboard/constellation/OrganismCanvas';
import { ExecutionTrace } from '@/components/dashboard/fleet/ExecutionTrace';
import { CloneButton } from '@/app/components/shared/CloneButton';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'

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

  const FleetIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Mission Control: Fleet"
        icon={<FleetIcon />}
        action={
          <div className="flex items-center gap-4">
            {/* Tab toggle */}
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              <button
                onClick={() => setActiveTab('organism')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
                  activeTab === 'organism' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                )}
              >
                <Dna className="h-3 w-3" /> Constellation
              </button>
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
                  activeTab === 'hierarchy' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                )}
              >
                <LayoutGrid className="h-3 w-3" /> Hierarchy
              </button>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Active Agents</span>
                <div className="text-xs font-mono">{agents.length} / 10</div>
              </div>
              <StatusPill status="active" label="Operational" size="sm" />
            </div>
          </div>
        }
      />

      {/* Main Content Area — special layout for canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Constellation / Graph */}
        <div className="flex-1 relative bg-[#050505]">
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
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{selectedAgent.type}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-zinc-800 text-[10px]">
                <div className="bg-zinc-950 p-3">
                  <div className="text-zinc-600 uppercase tracking-widest mb-1">Health</div>
                  <div className="text-green-400 font-bold">100%</div>
                </div>
                <div className="bg-zinc-950 p-3">
                  <div className="text-zinc-600 uppercase tracking-widest mb-1">Latency</div>
                  <div className="text-white font-bold">42ms</div>
                </div>
              </div>
              <div className="mt-4">
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
