'use client'

import { useState, useEffect, useRef } from 'react'
import { Network, RefreshCw, Users, GitBranch, Server, ExternalLink, Activity, Globe, CheckCircle, Radio, Signal, Link2 } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface NetworkNode {
  id: string
  name: string
  did: string
  peerId: string
  url: string
  version: string
  location: { lat: number; lng: number }
  status: 'online' | 'offline'
  repos: number
  agents: number
  pushes: number
  peers: { did: string; url: string; lastSeen: string }[]
  lastSeen: string
}

interface NetworkEvent {
  id: string
  time: string
  type: 'PUSH' | 'GOSSIP' | 'PEER' | 'AGENT'
  source: string
  message: string
  details?: string
}

interface NetworkStats {
  nodesReachable: number
  totalNodes: number
  activeLinks: number
  recentEvents: number
  repos: number
  agents: number
  pushes: number
}

export default function GitlawbNetworkPage() {
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [events, setEvents] = useState<NetworkEvent[]>([])
  const [stats, setStats] = useState<NetworkStats>({
    nodesReachable: 3,
    totalNodes: 3,
    activeLinks: 4,
    recentEvents: 0,
    repos: 1734,
    agents: 1462,
    pushes: 527,
  })
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const eventsEndRef = useRef<HTMLDivElement>(null)

  const fetchNetworkData = async () => {
    setLoading(true)
    try {
      setNodes([
        {
          id: 'node-1',
          name: 'node.gitlawb.com',
          did: 'did:key:z6Mkicjkc95VcFx38Xg2SvFV2ENsu3dLDoWborjPGVodHXoH',
          peerId: '12D3KooWJ8FTHLfbEkXprCACu7qhBazEKzr3ber4JQ3KsGHiRHAe',
          url: 'https://node.gitlawb.com',
          version: 'v0.3.8',
          location: { lat: 37.8, lng: -122.4 },
          status: 'online',
          repos: 1647,
          agents: 1294,
          pushes: 527,
          peers: [
            { did: 'z6MkpiDEro4zvBKj', url: 'node.gitlawb.com', lastSeen: '59s ago' },
            { did: 'z6MkgsdzGqLoA4xs', url: 'node.gitlawb.com', lastSeen: '59s ago' },
            { did: 'z6MkrV8ktCUnTzT5', url: 'node2.gitlawb.com', lastSeen: '59s ago' },
            { did: 'z6MkkcRJLaDryG3t', url: 'node.gitlawb.com', lastSeen: '59s ago' },
            { did: 'z6Mkicjkc95VcFx3', url: 'node.gitlawb.com', lastSeen: '59s ago' },
          ],
          lastSeen: '59s ago',
        },
        {
          id: 'node-2',
          name: 'node2.gitlawb.com',
          did: 'did:key:z6MkrV8ktCUnTzT5mEUzSTJdcj6tgBRqkLinRkGL2JrBKJwg',
          peerId: '12D3KooWPHSkY8bC5fg5vWhXgLsyHRzMRce6hkkkD17UeX3CRrto',
          url: 'https://node2.gitlawb.com',
          version: 'v0.1.0',
          location: { lat: 34.0, lng: -118.2 },
          status: 'online',
          repos: 87,
          agents: 167,
          pushes: 0,
          peers: [
            { did: 'z6MknndwexV9umgQ', url: 'node.gitlawb.com', lastSeen: '31s ago' },
            { did: 'z6MkiYSDKCnDDohT', url: 'node3.gitlawb.com', lastSeen: '31s ago' },
          ],
          lastSeen: '31s ago',
        },
        {
          id: 'node-3',
          name: 'node3.gitlawb.com',
          did: 'did:key:z6MkiYSDKCnDDohTz2udk5PNWr11fq9xe39k5dWwBHa9Q9K9',
          peerId: '12D3KooWJRUs56r1oQqUhzYYwEkpjF1KoDM6RdrVFRs4udLnFA3u',
          url: 'https://node3.gitlawb.com',
          version: 'v0.2.9',
          location: { lat: 35.7, lng: 139.7 },
          status: 'online',
          repos: 0,
          agents: 1,
          pushes: 0,
          peers: [
            { did: 'z6MkrV8ktCUnTzT5', url: 'node2.gitlawb.com', lastSeen: '1m ago' },
          ],
          lastSeen: '1m ago',
        },
      ])

      setEvents([
        { id: '1', time: '15:50:02', type: 'PUSH', source: 'gitlawb-node-2', message: 'refs/heads/dev → 12bc33e' },
        { id: '2', time: '15:49:59', type: 'PEER', source: 'gitlawb-node-2', message: 'node.gitlawb.com reachable' },
        { id: '3', time: '15:49:55', type: 'GOSSIP', source: 'gitlawb-node-2', message: 'heartbeat · 2 topics active' },
        { id: '4', time: '15:49:51', type: 'PUSH', source: 'node', message: 'refs/heads/main → e7d892a' },
        { id: '5', time: '15:50:06', type: 'GOSSIP', source: 'node', message: 'propagated 2 refs to 1 peer' },
        { id: '6', time: '15:50:20', type: 'AGENT', source: 'node', message: 'did:key:z6Mk…c3f registered' },
      ])

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch network data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNetworkData()
    const interval = setInterval(fetchNetworkData, 30000)
    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PUSH': return <GitBranch className="h-3 w-3 text-green-400" />
      case 'GOSSIP': return <Signal className="h-3 w-3 text-blue-400" />
      case 'PEER': return <Link2 className="h-3 w-3 text-purple-400" />
      case 'AGENT': return <Users className="h-3 w-3 text-orange-400" />
      default: return <Activity className="h-3 w-3 text-zinc-400" />
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Gitlawb Network"
        icon={<Network className="h-5 w-5 text-purple-400" />}
      />

      <DashboardContent>
        {/* Operator Surface - Hero Stats */}
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Radio className="h-4 w-4 text-green-400 animate-pulse" />
              OPERATOR SURFACE
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          {/* Top Row - Status Indicators */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-green-400">
                {stats.nodesReachable}/{stats.totalNodes}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Nodes Reachable</div>
            </div>
            <div className="text-center p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-blue-400">{stats.activeLinks}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Active Links</div>
            </div>
            <div className="text-center p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-orange-400">{stats.recentEvents}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Recent Ref Events</div>
            </div>
            <div className="text-center p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-purple-400">4</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Links</div>
            </div>
          </div>

          {/* Network Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-zinc-800 p-4 text-center">
              <div className="text-3xl font-bold text-white">{stats.totalNodes}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Nodes Live</div>
            </div>
            <div className="border border-zinc-800 p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.repos.toLocaleString()}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Repos Mirrored</div>
            </div>
            <div className="border border-zinc-800 p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{stats.agents.toLocaleString()}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Agents Registered</div>
            </div>
          </div>
        </div>

        {/* Topology - Visual Links */}
        <div className="border border-zinc-800 mb-6">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-zinc-400" />
              TOPOLOGY — Realtime globe view of node placement and live peer routes
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center gap-8">
              {nodes.map((node, idx) => (
                <div key={node.id} className="flex items-center">
                  <div className={`text-center ${idx > 0 ? 'mr-8' : ''}`}>
                    <div className="w-16 h-16 rounded-full border-2 border-green-500 bg-green-900/20 flex items-center justify-center mb-2">
                      <Server className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="text-sm text-white font-bold">{node.name.replace('.gitlawb.com', '')}</div>
                    <div className="text-xs text-zinc-500">{node.version}</div>
                    <div className="text-xs text-green-400">● Online</div>
                  </div>
                  {idx < nodes.length - 1 && (
                    <div className="flex items-center mx-4">
                      <div className="h-0.5 w-8 bg-zinc-700"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="h-0.5 w-8 bg-zinc-700"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Feed - Network Log */}
        <div className="border border-zinc-800 mb-6">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400 animate-pulse" />
              $GITLAWB/NETWORK-LOG — LIVE
            </h3>
          </div>
          <div className="bg-black p-4 font-mono text-xs max-h-64 overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 py-1 hover:bg-zinc-900/50">
                <span className="text-zinc-600">{event.time}</span>
                {getEventIcon(event.type)}
                <span className="text-zinc-400">{event.source}</span>
                <span className="text-white">{event.message}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 py-1">
              <span className="text-zinc-600">--:--:--</span>
              <div className="h-3 w-16 bg-green-500/50"></div>
            </div>
          </div>
        </div>

        {/* Node Registry */}
        <div className="border border-zinc-800 mb-6">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Server className="h-4 w-4 text-zinc-400" />
              NODE REGISTRY — Identity, transport, topics, and peer reachability per node
            </h3>
          </div>
          
          <div className="divide-y divide-zinc-800">
            {nodes.map((node) => (
              <div key={node.id} className="p-6">
                {/* Node Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${node.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{node.name}</h4>
                      <span className="text-zinc-500 text-xs">{node.version} • {node.location.lat}°, {node.location.lng}°</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-bold uppercase ${
                      node.status === 'online' 
                        ? 'bg-green-900 text-green-400' 
                        : 'bg-red-900 text-red-400'
                    }`}>
                      {node.status}
                    </span>
                    <a
                      href={node.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 border border-zinc-800">
                    <div className="text-xl font-bold text-green-400">{node.repos.toLocaleString()}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Repos</div>
                  </div>
                  <div className="text-center p-3 border border-zinc-800">
                    <div className="text-xl font-bold text-purple-400">{node.agents.toLocaleString()}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Agents</div>
                  </div>
                  <div className="text-center p-3 border border-zinc-800">
                    <div className="text-xl font-bold text-orange-400">{node.pushes}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Pushes</div>
                  </div>
                  <div className="text-center p-3 border border-zinc-800">
                    <div className="text-xl font-bold text-blue-400">{node.peers.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Peers</div>
                  </div>
                </div>

                {/* DID & Peer ID */}
                <div className="space-y-3 text-xs font-mono mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 w-12">DID</span>
                    <code className="text-purple-400 flex-1">{node.did}</code>
                    <button 
                      onClick={() => copyToClipboard(node.did)}
                      className="text-zinc-600 hover:text-white p-1"
                    >
                      📋
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 w-12">PEER ID</span>
                    <code className="text-blue-400 flex-1">{node.peerId}</code>
                    <button 
                      onClick={() => copyToClipboard(node.peerId)}
                      className="text-zinc-600 hover:text-white p-1"
                    >
                      📋
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 w-12">GOSSIPSUB</span>
                    <code className="text-green-400">gitlawb/ref-updates/v1</code>
                  </div>
                </div>

                {/* Known Peers */}
                <div className="border-t border-zinc-800 pt-4">
                  <div className="text-xs text-zinc-500 mb-2">KNOWN PEERS ({node.peers.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {node.peers.map((peer, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-zinc-900 text-xs">
                        <span className="text-purple-400">{peer.did.substring(0, 12)}...</span>
                        <span className="text-zinc-600">{peer.url}</span>
                        <span className="text-zinc-500">{peer.lastSeen}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Readout */}
        <div className="border border-zinc-800 mb-6">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-white font-bold">NETWORK READOUT</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400 mb-1">Fully Connected</div>
              <div className="text-xs text-zinc-500">Federation Status</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-1">3 of 3</div>
              <div className="text-xs text-zinc-500">Nodes Reporting</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400 mb-1">4</div>
              <div className="text-xs text-zinc-500">Peer Routes Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400 mb-1">Simulated</div>
              <div className="text-xs text-zinc-500">Event Feed</div>
            </div>
          </div>
        </div>

        {/* Operators Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {nodes.map((node) => (
            <div key={node.id} className="border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold">{node.name}</span>
                <span className="text-green-400 text-xs">REACHABLE</span>
              </div>
              <div className="text-xs text-zinc-500">
                {node.peers.length} peers
              </div>
            </div>
          ))}
        </div>

        {/* External Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="https://gitlawb.com/node/repos"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-800 bg-zinc-900/50 p-4 hover:border-purple-600 transition-colors"
          >
            <GitBranch className="h-6 w-6 text-purple-400 mb-2" />
            <h4 className="text-white font-bold text-sm">Browse Repos</h4>
            <p className="text-zinc-500 text-xs mt-1">1647 repos on network</p>
          </a>
          <a
            href="https://gitlawb.com/node/peers"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-800 bg-zinc-900/50 p-4 hover:border-blue-600 transition-colors"
          >
            <Users className="h-6 w-6 text-blue-400 mb-2" />
            <h4 className="text-white font-bold text-sm">Peer Connectivity</h4>
            <p className="text-zinc-500 text-xs mt-1">P2P routing info</p>
          </a>
          <a
            href="https://gitlawb.com/node/tasks"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-800 bg-zinc-900/50 p-4 hover:border-green-600 transition-colors"
          >
            <Activity className="h-6 w-6 text-green-400 mb-2" />
            <h4 className="text-white font-bold text-sm">Agent Tasks</h4>
            <p className="text-zinc-500 text-xs mt-1">Delegated work</p>
          </a>
          <a
            href="https://gitlawb.com/node/events"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-800 bg-zinc-900/50 p-4 hover:border-orange-600 transition-colors"
          >
            <Signal className="h-6 w-6 text-orange-400 mb-2" />
            <h4 className="text-white font-bold text-sm">Ref Events</h4>
            <p className="text-zinc-500 text-xs mt-1">Live event stream</p>
          </a>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}