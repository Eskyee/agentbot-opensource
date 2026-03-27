import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

const SOUL_URLS = [
  'https://YOUR_SERVICE_URL',
];

export const dynamic = 'force-dynamic';

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
  // Require authentication
  const session = await getAuthSession()
  if (!session?.user?.email) {
    // Return empty data for unauthenticated users instead of error
    return NextResponse.json({
      nodes: [
        { id: 'atlas', name: 'Atlas', role: 'orchestrator', status: 'offline', x: 400, y: 300, load: 0, memory: 0 },
      ],
      edges: [],
      timestamp: new Date().toISOString(),
      source: 'unauthenticated',
    })
  }

  // Fetch all known soul nodes in parallel
  const soulNodes = await Promise.all(SOUL_URLS.map(fetchSoulNode));
  const live = soulNodes.filter(Boolean) as Array<{ url: string; info: any; status: any }>;

  if (live.length === 0) {
    // Fallback: no soul nodes reachable
    return NextResponse.json({
      nodes: [
        { id: 'atlas', name: 'Atlas', role: 'orchestrator', status: 'offline', x: 400, y: 300, load: 0, memory: 0 },
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
      role: isRoot ? 'orchestrator' : info.children_count > 0 ? 'specialist' : 'worker',
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
        role: 'worker',
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
        from: designation,
        to: childId,
        strength: 0.6,
      });
    });

    // If this node has a parent, create edge to parent
    if (!isRoot) {
      const parentId = live.find(n => n.info.identity?.address === info.identity?.parent_address)
        ?.info.designation ?? 'parent';
      edges.push({
        id: `e-${parentId}-${designation}`,
        from: parentId,
        to: designation,
        strength: 0.5,
      });
    }
  });

  // Add edges between parent and child nodes (monitoring/delegation)
  if (nodes.length > 1) {
    const root = nodes.find(n => n.role === 'orchestrator');
    if (root) {
      nodes.filter(n => n.id !== root.id && n.role !== 'worker').forEach(n => {
        if (!edges.find(e => e.from === root.id && e.to === n.id)) {
          edges.push({
            id: `e-${root.id}-${n.id}`,
            from: root.id,
            to: n.id,
            strength: 0.7,
          });
        }
      });
    }
  }

  return NextResponse.json({
    nodes,
    edges,
    timestamp: new Date().toISOString(),
    source: 'soul',
    nodeCount: live.length,
  });
}
