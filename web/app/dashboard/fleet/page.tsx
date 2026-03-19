'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, DollarSign, Hash, Bot, LayoutGrid, Dna, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrganismCanvas } from '@/components/dashboard/constellation/OrganismCanvas';
import { ExecutionTrace } from '@/components/dashboard/fleet/ExecutionTrace';

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

  return (
    <div className="mt-[4rem] h-[calc(100vh-4rem)] flex bg-black text-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Mission Control: Fleet</h1>
            <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1">
              <button
                onClick={() => setActiveTab('organism')}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'organism' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
                )}
              >
                <Dna className="h-4 w-4" /> Constellation
              </button>
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'hierarchy' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
                )}
              >
                <LayoutGrid className="h-4 w-4" /> Hierarchy
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Active Agents</span>
              <span className="text-sm font-mono">{agents.length} / 10</span>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase font-bold">System Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-mono text-green-500">OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Constellation / Graph */}
          <div className="flex-1 relative bg-[#050505]">
            {graphLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin text-4xl">🦞</div>
              </div>
            ) : (
              <OrganismCanvas 
                nodes={graph?.nodes ?? []} 
                edges={graph?.edges ?? []} 
                onNodeClick={(node) => setSelectedAgentId(node.id)}
                isLive={true}
              />
            )}
          </div>

          {/* Right: Traces & Details (35% width) */}
          <div className="w-[400px] border-l border-gray-800 flex flex-col bg-[#0a0a0a]">
            {/* Trace Header */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Live Traces</span>
              </div>
              <span className="text-[10px] font-mono text-gray-600">v2.1.0-alpha</span>
            </div>

            {/* Execution Trace Feed */}
            <div className="flex-1 overflow-y-auto">
              <ExecutionTrace tasks={traces ?? []} />
            </div>

            {/* Selected Agent Quick View */}
            {selectedAgent && (
              <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selectedAgent.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase">{selectedAgent.type}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-black/30 p-2 rounded border border-white/5">
                    <div className="text-gray-500 mb-1">HEALTH</div>
                    <div className="text-green-400 font-bold">100%</div>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-white/5">
                    <div className="text-gray-500 mb-1">LATENCY</div>
                    <div className="text-white font-bold">42ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
