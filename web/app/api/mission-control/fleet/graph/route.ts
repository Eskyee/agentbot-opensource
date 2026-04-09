import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { DEFAULT_SOUL_SERVICE_URL, DEFAULT_SOUL_DASHBOARD_URL } from '@/app/lib/openclaw-config'

export const dynamic = 'force-dynamic';

function normalizeNodeStatus(raw: unknown): 'active' | 'idle' | 'offline' {
  const value = String(raw ?? '').toLowerCase();
  if (!value) return 'offline';
  if (['active', 'running', 'healthy', 'up', 'ready'].includes(value)) return 'active';
  if (['idle', 'dormant', 'deploying', 'starting', 'warming'].includes(value)) return 'idle';
  return 'offline';
}

// Known borg-0 public URL — always included as fallback even if env var is stale
const BORG_0_URL = 'https://borg-0-production.up.railway.app'

function getSoulCandidates() {
  const candidates = [DEFAULT_SOUL_SERVICE_URL, BORG_0_URL]
    .map((value) => value?.trim())
    .filter(Boolean) as string[]

  return [...new Set(candidates)]
}

async function isUsableSoulHost(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/soul/status`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })

    if (!res.ok) return false

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return false

    const payload = await res.json().catch(() => null)
    return Boolean(payload && typeof payload === 'object' && 'active' in payload)
  } catch {
    return false
  }
}

async function fetchSoulNode(url: string) {
  try {
    const [infoRes, statusRes] = await Promise.all([
      fetch(`${url}/instance/info`, { signal: AbortSignal.timeout(5000), cache: 'no-store' }),
      fetch(`${url}/soul/status`, { signal: AbortSignal.timeout(5000), cache: 'no-store' }),
    ]);
    if (!infoRes.ok || !statusRes.ok) return null;
    const [info, status] = await Promise.all([infoRes.json(), statusRes.json()]);
    return { url, info, status };
  } catch {
    return null;
  }
}

async function getWorkingSoulNode() {
  for (const candidate of getSoulCandidates()) {
    if (await isUsableSoulHost(candidate)) {
      const node = await fetchSoulNode(candidate)
      if (node) {
        return {
          node,
          serviceUrl: candidate,
          degraded: candidate !== DEFAULT_SOUL_SERVICE_URL,
        }
      }
    }
  }

  throw new Error(`No healthy soul host found from: ${getSoulCandidates().join(', ')}`)
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
      stats: { totalAgents: 1, activeAgents: 0, idleAgents: 0, offlineAgents: 1 },
      dashboardUrl: DEFAULT_SOUL_DASHBOARD_URL,
    })
  }

  let live: Array<{ url: string; info: any; status: any }> = []
  let serviceUrl = DEFAULT_SOUL_SERVICE_URL
  let degraded = false

  try {
    const result = await getWorkingSoulNode()
    live = [result.node]
    serviceUrl = result.serviceUrl
    degraded = result.degraded
  } catch (error: any) {
    return NextResponse.json({
      nodes: [
        { id: 'atlas', name: 'Atlas', role: 'orchestrator', status: 'offline', x: 400, y: 300, load: 0, memory: 0 },
      ],
      edges: [],
      timestamp: new Date().toISOString(),
      source: 'degraded',
      degraded: true,
      detail: error?.message ?? 'Soul service unavailable',
      stats: { totalAgents: 1, activeAgents: 0, idleAgents: 0, offlineAgents: 1 },
      serviceUrl: DEFAULT_SOUL_SERVICE_URL,
      dashboardUrl: DEFAULT_SOUL_DASHBOARD_URL,
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
      status: status.dormant ? 'idle' : status.active ? 'active' : 'offline',
      x: isRoot ? 400 : 200 + (i * 200),
      y: isRoot ? 300 : 150 + (i * 100),
      load,
      memory,
      fitness,
      walletAddress: info.identity?.address,
      children: info.children_count,
      endpoints: info.endpoints?.length ?? 0,
      cycles: status.total_cycles,
      uptime: info.uptime_seconds,
      version: info.version,
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
        status: normalizeNodeStatus(child.status),
        x: isRoot ? 200 + (ci * 200) : 400,
        y: isRoot ? 450 : 300,
        load: 0,
        memory: 0,
        fitness: 0,
        walletAddress: child.address,
        url: child.url,
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

  const stats = nodes.reduce((acc, node) => {
    acc.totalAgents += 1;
    if (node.status === 'active') acc.activeAgents += 1;
    else if (node.status === 'idle') acc.idleAgents += 1;
    else acc.offlineAgents += 1;
    return acc;
  }, { totalAgents: 0, activeAgents: 0, idleAgents: 0, offlineAgents: 0 });

  return NextResponse.json({
    nodes,
    edges,
    timestamp: new Date().toISOString(),
    source: degraded ? 'soul-fallback' : 'soul',
    degraded,
    nodeCount: live.length,
    stats,
    serviceUrl,
    dashboardUrl: DEFAULT_SOUL_DASHBOARD_URL,
  });
}
