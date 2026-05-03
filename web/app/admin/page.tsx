'use client';

import { useCustomSession } from '@/app/lib/useCustomSession';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Users, 
  Database, 
  Trash2, 
  Terminal, 
  ShieldAlert, 
  RefreshCw, 
  Search,
  ExternalLink,
  Lock,
  UserPlus
} from 'lucide-react';
import { StatusBadge } from '@/app/components/shared/StatusBadge';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  plan: string;
  subscriptionStatus: string;
}

interface AgentInstance {
  id: string;
  userId: string;
  name: string;
  status: string;
  model: string | null;
  websocketUrl: string | null;
}

interface DBHealth {
  summary: {
    status: string;
    databaseEngine: string;
    totalTables: number;
  };
  counts: {
    users: number;
    agents: number;
    activeDeployments: number;
  };
  drift: {
    hasLegacyUsers: boolean;
    hasLegacyAgents: boolean;
    ghostTables: number;
    ghostTableNames: string[];
  };
  recommendation: string;
}

interface AdminStats {
  userBase: number;
  totalAgents: number;
  instances: any[];
  count: number;
  backendStatus: string;
}

type AdminTab = 'agents' | 'users' | 'integrity';

export default function AdminPage() {
  const { data: session, status } = useCustomSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<AgentInstance[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dbHealth, setDbHealth] = useState<DBHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('agents');

  const handleTabChange = (tab: AdminTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };
  const [searchTerm, setSearchTerm] = useState('')
  const [activities, setActivities] = useState<Array<{type: string; message: string; timestamp: string; status?: string}>>([]);
  const [summary, setSummary] = useState<any>(null);
  const [mimoLoading, setMimoLoading] = useState(false);
  const [mimoResult, setMimoResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const performSync = async () => {
    if (!confirm('CAUTION: This will reconcile plural backend tables with singular Prisma tables. Proceed?')) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/db-health', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Sync Complete!\nUsers: ${data.results.usersSynced}\nAgents: ${data.results.agentsSynced}`);
        startTransition(() => {
          fetchData();
        });
      } else {
        alert(`Sync Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, agentsRes, healthRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/agents/showcase'), 
        fetch('/api/admin/db-health'),
        fetch('/api/admin/stats'),
      ]);

      const summaryRes = await fetch('/api/admin/summary');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
      
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setUsers(userData.users || []);
      }
      
      if (agentsRes.ok) {
        const agentData = await agentsRes.json();
        setAgents(agentData.agents || []);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbHealth(healthData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        if (statsData.activities) setActivities(statsData.activities);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="animate-pulse uppercase tracking-[0.2em] text-[10px] text-zinc-500">Initializing Admin_Session...</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-orange-500 selection:text-black">
      {/* ─── Admin Top Bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-1.5 rounded-sm">
              <Lock className="w-4 h-4 text-black" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest leading-none">Ops Command Center</h1>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-tighter">Root_Access // {session?.user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="SEARCH_THE_MATRIX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 py-1.5 pl-9 pr-4 text-[10px] w-64 focus:outline-none focus:border-orange-500/50 focus:bg-zinc-900/50 transition-all uppercase tracking-widest placeholder:text-zinc-700"
              />
            </div>
            <button 
              onClick={fetchData}
              className="p-2 border border-zinc-800 hover:border-orange-500/40 text-zinc-500 hover:text-orange-500 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 flex gap-8">
        
        {/* ─── Sidebar Navigation ────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 space-y-1">
          <TabButton 
            active={activeTab === 'agents'} 
            onClick={() => handleTabChange('agents')} 
            icon={<Activity className="w-4 h-4" />}
            label="Fleet_Control"
            count={stats?.totalAgents ?? agents.length}
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => handleTabChange('users')} 
            icon={<Users className="w-4 h-4" />}
            label="User_Base"
            count={stats?.userBase ?? users.length}
          />
          <TabButton 
            active={activeTab === 'integrity'} 
            onClick={() => handleTabChange('integrity')} 
            icon={<Database className="w-4 h-4" />}
            label="DB_Integrity"
            status={dbHealth?.summary.status === 'healthy' ? 'ok' : 'drift'}
          />
        </div>
          <div className="pt-8 space-y-4">
            <div className="px-4 py-2 border border-dashed border-zinc-800 rounded-sm">
              <div className="text-[10px] text-zinc-600 uppercase mb-2">Platform_Health</div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${stats?.backendStatus === 'OK' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                <span className="text-[10px] uppercase font-bold text-zinc-400">Railway_API: {stats?.backendStatus || '...'}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] uppercase font-bold text-zinc-400">Gitlawb_Node: OK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dbHealth?.summary.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-[10px] uppercase font-bold text-zinc-400">DB_Status: {dbHealth?.summary.status === 'healthy' ? 'Synced' : dbHealth?.summary.status === 'legacy_present' ? 'Legacy OK' : 'Drift'}</span>
              </div>
            </div>

            <Link href="/admin/invites" className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 hover:bg-zinc-900/50 transition-all group">
              <UserPlus className="w-4 h-4 text-zinc-500 group-hover:text-orange-500" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 group-hover:text-white">Issue_Invites</span>
            </Link>

            {/* Activity Feed */}
            <div className="px-4 py-3 border border-dashed border-zinc-800 rounded-sm">
              <div className="text-[10px] text-zinc-600 uppercase mb-3">Recent_Activity</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="text-[10px] text-zinc-700">No activity yet</div>
                ) : (
                  activities.slice(0, 8).map((act, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                        act.type === 'agent_created' ? 'bg-green-500' :
                        act.type === 'user_signup' ? 'bg-blue-500' :
                        act.status === 'ok' ? 'bg-green-500' :
                        act.status === 'error' ? 'bg-red-500' :
                        'bg-zinc-600'
                      }`} />
                      <div className="min-w-0">
                        <div className="text-[10px] text-zinc-400 truncate">{act.message}</div>
                        <div className="text-[9px] text-zinc-700">{new Date(act.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        {/* ─── Main Content Area ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          
          {/* TAB: AGENTS */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total_Agents" value={stats?.totalAgents ?? agents.length} />
                <StatCard label="Active_Runtimes" value={agents.filter(a => a.status === 'active' || a.status === 'running').length} color="text-green-400" />
                <StatCard label="Railway_Instances" value={stats?.count ?? 0} color="text-orange-500" />
                <StatCard label="Backend_Health" value={stats?.backendStatus || '...'} color={stats?.backendStatus === 'OK' ? 'text-green-400' : 'text-red-400'} isString />
              </div>

              {/* Service Health */}
              {summary?.serviceHealth && (
                <div className="grid grid-cols-3 gap-4">
                  {summary.serviceHealth.map((s: any) => (
                    <div key={s.name} className="bg-zinc-950 border border-zinc-800 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{s.name}</span>
                        <div className={`w-2 h-2 rounded-full ${s.status === 'ok' ? 'bg-green-500' : s.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      </div>
                      <div className="text-xs font-bold uppercase text-white">{s.status === 'ok' ? 'Operational' : s.status === 'degraded' ? 'Degraded' : 'Down'}</div>
                      {s.detail && <div className="text-[10px] text-zinc-500 mt-1">{s.detail}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Trials */}
              {summary?.trial && (
                <div className="bg-zinc-950 border border-zinc-800 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Trials</div>
                  <div className="text-2xl font-bold text-white">{summary.trial.active ?? 0}</div>
                  <div className="text-[10px] text-zinc-500">Active 7-day trials</div>
                  {summary.trial.expiringSoon?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {summary.trial.expiringSoon.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400 truncate">{t.email}</span>
                          <span className="text-yellow-400">{t.daysLeft}d left</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-zinc-950 border border-zinc-800 rounded-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 uppercase tracking-widest text-zinc-500 font-bold">
                        <th className="px-6 py-3">Agent_ID / Name</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Model</th>
                        <th className="px-6 py-3">Host_Provider</th>
                        <th className="px-6 py-3 text-right">Ops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {filteredAgents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-zinc-900/40 group transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white uppercase">{agent.name}</div>
                            <div className="text-[10px] text-zinc-600 mt-0.5">{agent.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={agent.status} />
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px]">
                              {agent.model || 'DEFAULT'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-zinc-500">
                              {agent.websocketUrl?.includes('railway.app') ? (
                                <span className="text-orange-500">RAILWAY</span>
                              ) : agent.websocketUrl ? (
                                <span className="text-zinc-400 font-mono italic text-[9px] truncate max-w-[120px]">{agent.websocketUrl}</span>
                              ) : (
                                <span>SELF_HOST</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 hover:bg-zinc-800 rounded-sm text-zinc-400 hover:text-white" title="View Logs">
                                <Terminal className="w-3.5 h-3.5" />
                              </button>
                              <button className="p-2 hover:bg-orange-950/30 rounded-sm text-zinc-400 hover:text-orange-400" title="Force Shutdown">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 uppercase tracking-widest text-zinc-500 font-bold">
                      <th className="px-6 py-3">Identity / Context</th>
                      <th className="px-6 py-3">Plan_Tier</th>
                      <th className="px-6 py-3">Sub_Status</th>
                      <th className="px-6 py-3 text-right">Admin_Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-900/40 group transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white uppercase">{user.name || 'ANON_USER'}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold uppercase ${user.plan !== 'free' ? 'text-orange-500' : 'text-zinc-600'}`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-[10px] uppercase font-bold ${user.subscriptionStatus === 'active' ? 'text-green-500' : 'text-zinc-600'}`}>
                            {user.subscriptionStatus}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-500 border border-orange-500/20 px-3 py-1 bg-orange-500/5 hover:bg-orange-500/10 transition-all">
                            IMPERSONATE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: INTEGRITY */}
          {activeTab === 'integrity' && dbHealth && (
            <div className="space-y-6">
              <div className={`p-6 border-l-4 rounded-r-sm ${dbHealth.summary.status === 'critical_drift' ? 'bg-red-950/20 border-orange-500' : dbHealth.summary.status === 'legacy_present' ? 'bg-yellow-950/20 border-yellow-500' : 'bg-green-950/20 border-green-500'}`}>
                <div className="flex items-start gap-4">
                  <ShieldAlert className={`w-8 h-8 ${dbHealth.summary.status === 'critical_drift' ? 'text-orange-500' : 'text-green-500'}`} />
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-white mb-2">Schema Integrity Report</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">{dbHealth.recommendation}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-6">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] border-b border-zinc-900 pb-2">Active_Models (Prisma)</h4>
                  <div className="space-y-4">
                    <IntegrityItem label="User_Model" value={dbHealth.counts.users} />
                    <IntegrityItem label="Agent_Model" value={dbHealth.counts.agents} />
                    <IntegrityItem label="Active_Deployments" value={dbHealth.counts.activeDeployments} />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-6">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] border-b border-zinc-900 pb-2">Legacy_Drift (Postgres)</h4>
                  <div className="space-y-4">
                    <DriftItem label="Legacy_Users_Table" detected={dbHealth.drift.hasLegacyUsers} />
                    <DriftItem label="Legacy_Agents_Table" detected={dbHealth.drift.hasLegacyAgents} />
                    <IntegrityItem label="Ghost_Tables_Detected" value={dbHealth.drift.ghostTables} />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-dashed border-zinc-800 p-6 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-1">Infrastructure Reconciliation</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sync the hot-tier (Postgres) with the warm-tier (Gitlawb facts).</p>
                </div>
                <button 
                  onClick={performSync}
                  disabled={syncing}
                  className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors disabled:opacity-50"
                >
                  {syncing ? 'SYNCING...' : 'Force_Global_Sync'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Component Primitives ──────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, count, status }: { 
  active: boolean, 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string, 
  count?: number,
  status?: 'ok' | 'drift'
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
        active 
          ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(239,111,46,0.2)]' 
          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? 'text-black' : 'text-zinc-600'}>{icon}</span>
        {label}
      </div>
      {count !== undefined && <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${active ? 'bg-black/20' : 'bg-zinc-800 text-zinc-500'}`}>{count}</span>}
      {status === 'ok' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
      {status === 'drift' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
    </button>
  );
}

function StatCard({ label, value, color = "text-white", isString = false }: { label: string, value: string | number, color?: string, isString?: boolean }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-sm shadow-sm hover:border-zinc-700 transition-colors">
      <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-[0.2em] mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {isString ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
      </div>
    </div>
  );
}

function IntegrityItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-zinc-500 font-bold uppercase tracking-wider">{label}:</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

function DriftItem({ label, detected }: { label: string, detected: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-zinc-500 font-bold uppercase tracking-wider">{label}:</span>
      {detected ? (
        <span className="text-orange-500 font-bold uppercase px-1.5 bg-orange-500/10">DETECTED</span>
      ) : (
        <span className="text-green-500 font-bold uppercase">CLEAN</span>
      )}
    </div>
  );
}
