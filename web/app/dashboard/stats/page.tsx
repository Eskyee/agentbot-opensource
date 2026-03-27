'use client';

import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Clock, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';

interface SystemStats {
  cpu: number;
  memory: number;
  uptime: number;
  messages: number;
  errors: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const healthStatus = (health: string): 'active' | 'idle' | 'error' | 'offline' => {
    switch (health) {
      case 'healthy': return 'active';
      case 'degraded': return 'idle';
      case 'unhealthy': return 'error';
      default: return 'offline';
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <DashboardHeader title="System Stats" icon={<Activity className="h-5 w-5 text-blue-400" />} />
        <DashboardContent>
          <div className="text-xs text-zinc-500">Loading...</div>
        </DashboardContent>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader title="System Stats" icon={<Activity className="h-5 w-5 text-blue-400" />} />
      <DashboardContent>
        {error && (
          <div className="border border-red-500/30 bg-zinc-950 p-4 mb-6">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {stats ? (
          <>
            {/* Health Banner */}
            <div className="border border-zinc-800 bg-zinc-950 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">System Health</span>
                  <h2 className="text-sm font-bold tracking-tight uppercase">Overall Status</h2>
                </div>
                <StatusPill status={healthStatus(stats.health)} label={stats.health} />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-px bg-zinc-800 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* CPU */}
              <div className="bg-zinc-950 border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">CPU Usage</span>
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{stats.cpu.toFixed(1)}%</div>
                <div className="w-full bg-zinc-800 h-1.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full ${stats.cpu < 50 ? 'bg-green-500' : stats.cpu < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(stats.cpu, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-600 mt-2">
                  {stats.cpu < 50 ? 'Optimal' : stats.cpu < 80 ? 'Moderate' : 'High Load'}
                </div>
              </div>

              {/* Memory */}
              <div className="bg-zinc-950 border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">Memory Usage</span>
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{stats.memory.toFixed(1)}%</div>
                <div className="w-full bg-zinc-800 h-1.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full ${stats.memory < 50 ? 'bg-green-500' : stats.memory < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(stats.memory, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-600 mt-2">
                  {stats.memory < 50 ? 'Optimal' : stats.memory < 80 ? 'Moderate' : 'High Usage'}
                </div>
              </div>

              {/* Uptime */}
              <div className="bg-zinc-950 border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-zinc-600" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Uptime</span>
                </div>
                <div className="text-2xl font-bold tracking-tight">{formatUptime(stats.uptime)}</div>
                <div className="text-[10px] text-zinc-600 mt-2">System running</div>
              </div>

              {/* Messages */}
              <div className="bg-zinc-950 border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-zinc-600" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Messages</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-green-400">{stats.messages.toLocaleString()}</div>
                <div className="text-[10px] text-zinc-600 mt-2">Processed total</div>
              </div>

              {/* Errors */}
              <div className="bg-zinc-950 border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-zinc-600" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Errors</span>
                </div>
                <div className={`text-2xl font-bold tracking-tight ${stats.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {stats.errors}
                </div>
                <div className="text-[10px] text-zinc-600 mt-2">Recent errors</div>
              </div>

              {/* Last Updated */}
              <div className="bg-zinc-950 border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="h-4 w-4 text-zinc-600" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Last Updated</span>
                </div>
                <div className="text-sm font-mono">{new Date(stats.timestamp).toLocaleTimeString()}</div>
                <div className="text-[10px] text-zinc-600 mt-2">Refreshes every 5s</div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Performance Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-xs text-zinc-500">CPU Status</span>
                  <StatusPill
                    status={stats.cpu < 50 ? 'active' : stats.cpu < 80 ? 'idle' : 'error'}
                    label={stats.cpu < 50 ? 'Optimal' : stats.cpu < 80 ? 'Normal' : 'High Load'}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-xs text-zinc-500">Memory Status</span>
                  <StatusPill
                    status={stats.memory < 50 ? 'active' : stats.memory < 80 ? 'idle' : 'error'}
                    label={stats.memory < 50 ? 'Optimal' : stats.memory < 80 ? 'Normal' : 'High Usage'}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-xs text-zinc-500">Error Rate</span>
                  <StatusPill
                    status={stats.errors === 0 ? 'active' : 'error'}
                    label={stats.errors === 0 ? 'No Errors' : `${stats.errors} Error(s)`}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-zinc-500">System Health</span>
                  <StatusPill status={healthStatus(stats.health)} label={stats.health} size="sm" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12">
            <p className="text-xs text-zinc-500">No stats available</p>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
