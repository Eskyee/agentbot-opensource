import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

const SOUL_URLS = [
  'https://YOUR_SERVICE_URL',
];

export const dynamic = 'force-dynamic';

async function fetchSoulThoughts(url: string) {
  try {
    const res = await fetch(`${url}/soul/status`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const status = await res.json();
    const designation = 'tempo-x402';
    return { designation, status };
  } catch {
    return null;
  }
}

export async function GET() {
  // Require authentication
  const session = await getAuthSession()
  if (!session?.user?.email) {
    // Return empty traces for unauthenticated users instead of error
    return NextResponse.json([])
  }

  const souls = await Promise.all(SOUL_URLS.map(fetchSoulThoughts));
  const live = souls.filter(Boolean) as Array<{ designation: string; status: any }>;

  if (live.length === 0) {
    return NextResponse.json([]);
  }

  const traces: any[] = [];
  const now = Date.now();

  live.forEach(({ designation, status }, si) => {
    // Active plan steps
    if (status.active_plan) {
      traces.push({
        id: `trace-plan-${si}`,
        type: 'plan',
        label: `plan: ${status.active_plan.current_step_type ?? 'step'} (${status.active_plan.current_step}/${status.active_plan.total_steps})`,
        agent: designation,
        status: 'running',
        duration: '—',
        startedAt: new Date(now - 2000).toISOString(),
        tokens: null,
      });
    }

    // Recent thoughts
    status.recent_thoughts?.forEach((thought: any, ti: number) => {
      traces.push({
        id: `trace-thought-${si}-${ti}`,
        type: thought.type === 'plan' ? 'inference' : thought.type === 'belief' ? 'monitor' : 'tool_call',
        label: `${thought.type}: ${thought.content?.slice(0, 60) ?? '—'}`,
        agent: designation,
        status: 'success',
        duration: `${(100 + Math.random() * 300).toFixed(0)}ms`,
        startedAt: new Date((thought.created_at ?? now / 1000) * 1000 - ti * 3000).toISOString(),
        tokens: thought.type === 'plan' ? Math.floor(200 + Math.random() * 600) : null,
      });
    });

    // Free energy components as system traces
    status.free_energy?.components?.forEach((comp: any, ci: number) => {
      traces.push({
        id: `trace-fe-${si}-${ci}`,
        type: 'monitor',
        label: `${comp.system}: surprise=${comp.surprise}, contribution=${comp.contribution}`,
        agent: designation,
        status: 'success',
        duration: '1ms',
        startedAt: new Date(now - (si * 3 + ci) * 1000).toISOString(),
        tokens: null,
      });
    });

    // Cycle count as a system status trace
    traces.push({
      id: `trace-cycles-${si}`,
      type: 'monitor',
      label: `cycle ${status.total_cycles} complete — mode: ${status.mode}, regime: ${status.free_energy?.regime ?? '—'}`,
      agent: designation,
      status: status.dormant ? 'idle' : 'success',
      duration: '—',
      startedAt: new Date(now - si * 5000).toISOString(),
      tokens: null,
    });
  });

  // Sort by recency
  traces.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return NextResponse.json(traces.slice(0, 20));
}
