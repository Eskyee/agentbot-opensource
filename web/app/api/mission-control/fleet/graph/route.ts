import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

const SOUL_URLS = [
  'https://borg-0-production.up.railway.app',
  'https://borg-0-3-production.up.railway.app',
];

async function fetchSoulNode(url: string) {
  try {
    const [infoRes, statusRes] = await Promise.all([
      fetch(`${url}/instance/info`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${url}/soul/status`, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (!infoRes.ok || !statusRes.ok) return null;
    const [info, status] = await Promise.all([infoRes.json(), statusRes.json()]);
    return { url, info, status };
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

<<<<<<< HEAD
  const nodes = [
    { id: 'atlas',      name: 'Atlas',      role: 'orchestrator', status: 'active',  x: 400, y: 300, load: 72, memory: 58 },
    { id: 'watchtower', name: 'Watchtower', role: 'monitor',     status: 'active',  x: 200, y: 150, load: 18, memory: 22 },
    { id: 'djbot',      name: 'DJ Bot',     role: 'specialist',  status: 'active',  x: 600, y: 150, load: 44, memory: 61 },
    { id: 'swarm1',     name: 'Swarm-1',   role: 'worker',      status: 'idle',    x: 200, y: 450, load:  3, memory: 12 },
    { id: 'swarm2',     name: 'Swarm-2',   role: 'worker',      status: 'active',  x: 600, y: 450, load: 55, memory: 38 },
  ]

  const edges = [
    { id: 'e1', from: 'atlas',      to: 'watchtower', strength: 0.8 },
    { id: 'e2', from: 'atlas',      to: 'djbot',      strength: 0.7 },
    { id: 'e3', from: 'atlas',      to: 'swarm1',     strength: 0.5 },
    { id: 'e4', from: 'atlas',      to: 'swarm2',     strength: 0.6 },
    { id: 'e5', from: 'watchtower', to: 'swarm1',     strength: 0.4 },
    { id: 'e6', from: 'watchtower', to: 'swarm2',     strength: 0.5 },
  ]
=======
  // Fetch all known soul nodes in parallel
  const soulNodes = await Promise.all(SOUL_URLS.map(fetchSoulNode));
  const live = soulNodes.filter(Boolean) as Array<{ url: string; info: any; status: any }>;

  if (live.length === 0) {
    // Fallback: no soul nodes reachable
    return NextResponse.json({
      nodes: [
        { id: 'atlas', name: 'Atlas', type: 'coordinator', status: 'offline', x: 400, y: 300, load: 0, memory: 0 },
      ],
      edges: [],
      timestamp: new Date().toISOString(),
      source: 'fallback',
    });
  }

  // Build nodes from real soul data
  const nodes: any[] = [];
  const edges: any[] = [];

  live.forEach((node, i) => {
    const { info, status, url } = node;
    const isRoot = !info.identity?.parent_address;
    const designation = info.designation || `node-${i}`;
    const fitness = Math.round((info.fitness?.total ?? 0) * 100);
    const load = status.active_plan
      ? Math.round((status.active_plan.current_step / Math.max(status.active_plan.total_steps, 1)) * 100)
      : status.dormant ? 5 : 15;
    const memory = status.cortex?.total_experiences
      ? Math.min(Math.round(status.cortex.total_experiences / 100), 100)
      : 30;

    nodes.push({
      id: designation,
      name: designation,
      type: isRoot ? 'coordinator' : info.children_count > 0 ? 'specialist' : 'worker',
      status: status.dormant ? 'idle' : status.active ? 'active' : 'stale',
      x: isRoot ? 400 : 200 + (i * 200),
      y: isRoot ? 300 : 150 + (i * 100),
      load,
      memory,
      fitness,
      walletAddress: info.identity?.address,
      children: info.children_count,
      endpoints: info.endpoints?.length ?? 0,
      cycles: status.total_cycles,
      regime: status.free_energy?.regime,
      freeEnergy: status.free_energy?.F,
      url,
    });

    // Add children as sub-nodes
    info.children?.forEach((child: any, ci: number) => {
      const childId = child.instance_id?.slice(0, 8) ?? `child-${ci}`;
      nodes.push({
        id: childId,
        name: `Clone-${childId}`,
        type: 'worker',
        status: child.status === 'running' ? 'active' : 'stale',
        x: isRoot ? 200 + (ci * 200) : 400,
        y: isRoot ? 450 : 300,
        load: 30,
        memory: 20,
        fitness: 40,
        walletAddress: child.address,
      });
      edges.push({
        id: `e-${designation}-${childId}`,
        source: designation,
        target: childId,
        type: 'spawns',
      });
    });

    // If this node has a parent, create edge to parent
    if (!isRoot) {
      const parentId = live.find(n => n.info.identity?.address === info.identity?.parent_address)
        ?.info.designation ?? 'parent';
      edges.push({
        id: `e-${parentId}-${designation}`,
        source: parentId,
        target: designation,
        type: 'spawns',
      });
    }
  });

  // Add edges between parent and child nodes (monitoring/delegation)
  if (nodes.length > 1) {
    const root = nodes.find(n => n.type === 'coordinator');
    if (root) {
      nodes.filter(n => n.id !== root.id && n.type !== 'worker').forEach(n => {
        if (!edges.find(e => e.source === root.id && e.target === n.id)) {
          edges.push({
            id: `e-${root.id}-${n.id}`,
            source: root.id,
            target: n.id,
            type: 'delegates',
          });
        }
      });
    }
  }
>>>>>>> e6f87ab763da088d2c178af5f2b12e09e4194141

  return NextResponse.json({
    nodes,
    edges,
    timestamp: new Date().toISOString(),
    source: 'soul',
    nodeCount: live.length,
  });
}
