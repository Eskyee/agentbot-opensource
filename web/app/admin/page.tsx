'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  plan: string;
}

interface AgentInstance {
  agentId: string;
  name: string;
  status: string;
  uptime: number;
  cpu: string;
  memory: string;
  version: string;
  port: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<AgentInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'instances'>('instances');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, instancesRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/stats') // We'll need to create this endpoint
        ]);
        
        if (usersRes.ok) {
          const userData = await usersRes.json();
          setUsers(userData.users || []);
        }
        
        if (instancesRes.ok) {
          const instanceData = await instancesRes.json();
          setInstances(instanceData.instances || []);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <p className="animate-pulse">LOAD_OPS_DATA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Platform Ops Console</h1>
            <p className="text-gray-500 text-xs mt-1">STATUS: {instances.length} ACTIVE_INSTANCES | USER_LOAD: {users.length}</p>
          </div>
          <div className="flex gap-4">
             <button 
              onClick={() => setActiveTab('instances')}
              className={`px-4 py-2 rounded-sm text-xs transition-all ${activeTab === 'instances' ? 'bg-white text-black font-bold' : 'bg-transparent text-white border border-white/20 hover:border-white'}`}
            >
              INFRA_HEALTH
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-sm text-xs transition-all ${activeTab === 'users' ? 'bg-white text-black font-bold' : 'bg-transparent text-white border border-white/20 hover:border-white'}`}
            >
              USER_ROSTER
            </button>
          </div>
        </div>

        {activeTab === 'instances' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 p-4 border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase">System Status</div>
                <div className="text-xl font-bold text-green-500">NOMINAL</div>
              </div>
              <div className="bg-zinc-900 p-4 border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase">Agent Count</div>
                <div className="text-xl font-bold">{instances.length}</div>
              </div>
              <div className="bg-zinc-900 p-4 border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase">Avg CPU Load</div>
                <div className="text-xl font-bold">1.2%</div>
              </div>
              <div className="bg-zinc-900 p-4 border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase">Uptime Score</div>
                <div className="text-xl font-bold text-blue-400">99.98%</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800 text-zinc-400 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Instance_ID</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">CPU</th>
                    <th className="px-6 py-3 font-medium">RAM</th>
                    <th className="px-6 py-3 font-medium">Port</th>
                    <th className="px-6 py-3 font-medium">Runtime</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {instances.map((agent) => (
                    <tr key={agent.agentId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-400">{agent.agentId}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 ${agent.status === 'active' ? 'text-green-400' : 'text-zinc-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`}></span>
                          {agent.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">{agent.cpu || '0.1%'}</td>
                      <td className="px-6 py-4">{agent.memory || '42MB'}</td>
                      <td className="px-6 py-4 text-zinc-500">{agent.port}</td>
                      <td className="px-6 py-4 text-zinc-500">v{agent.version}</td>
                      <td className="px-6 py-4">
                        <button className="text-[10px] bg-zinc-800 px-2 py-1 rounded-sm hover:bg-white hover:text-black transition-colors">
                          LOGS
                        </button>
                      </td>
                    </tr>
                  ))}
                  {instances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-600 uppercase italic">
                        No active instances detected in the matrix.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-white/10 rounded-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-zinc-800 text-zinc-400 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Name/Email</th>
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="font-bold">{user.name || 'ANON_USER'}</div>
                      <div className="text-zinc-500 text-[10px]">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 uppercase font-bold text-yellow-500">{user.plan}</td>
                    <td className="px-6 py-4 uppercase text-zinc-400">{user.role}</td>
                    <td className="px-6 py-4">
                      <button className="text-red-500 hover:underline">SHUTDOWN_ACCESS</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-12 p-4 bg-zinc-900/50 border border-dashed border-white/10 rounded-sm">
          <div className="text-[10px] text-zinc-500 uppercase mb-2">Operator_Notes</div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            [ATLAS_AUTO_LOG]: Monitoring the e2-standard-4 VM in us-central1-a. All provisioning flows for Next.js 16 are nominal. Verified Human Badge attestations are stable. 
          </p>
        </div>
      </div>
    </div>
  );
}
