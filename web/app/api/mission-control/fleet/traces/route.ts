import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { DEFAULT_SOUL_SERVICE_URL } from '@/app/lib/openclaw-config'

export const dynamic = 'force-dynamic';

// Known borg-0 public URL — always included as fallback even if env var is stale
const BORG_0_URL = 'https://YOUR_SERVICE_URL'

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
    });

    if (!res.ok) return false;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return false;

    const payload = await res.json().catch(() => null);
    return Boolean(payload && typeof payload === 'object' && 'active' in payload);
  } catch {
    return false;
  }
}

async function fetchSoulThoughts(url: string) {
  try {
    const [statusRes, infoRes] = await Promise.all([
      fetch(`${url}/soul/status`, { signal: AbortSignal.timeout(5000), cache: 'no-store' }),
      fetch(`${url}/instance/info`, { signal: AbortSignal.timeout(5000), cache: 'no-store' }),
    ]);
    if (!statusRes.ok || !infoRes.ok) return null;
    const [status, info] = await Promise.all([statusRes.json(), infoRes.json()]);
    return { designation: info.designation || 'borg-0', status };
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

  let live: Array<{ designation: string; status: any }> = [];
  for (const candidate of getSoulCandidates()) {
    if (!(await isUsableSoulHost(candidate))) continue;
    const thoughtSource = await fetchSoulThoughts(candidate);
    if (thoughtSource) {
      live = [thoughtSource];
      break;
    }
  }

  if (live.length === 0) {
    return NextResponse.json([]);
  }

  // Parse a duration string like "42ms", "1.2s", "0.3m" into milliseconds
  function parseDurationMs(dur: string): number | null {
    if (!dur || dur === '—') return null;
    if (dur.endsWith('ms')) return parseFloat(dur);
    if (dur.endsWith('s')) return parseFloat(dur) * 1000;
    if (dur.endsWith('m')) return parseFloat(dur) * 60_000;
    return null;
  }

  // Build an AgentTask-shaped object from a raw trace
  function toAgentTask(raw: {
    id: string; label: string; agent: string;
    status: string; duration: string; startedAt: string; tokens: number | null;
  }) {
    const durationMs = parseDurationMs(raw.duration);
    const isFinished = raw.status !== 'running';
    const completedAt = (isFinished && durationMs !== null)
      ? new Date(new Date(raw.startedAt).getTime() + durationMs).toISOString()
      : null;
    return {
      id: raw.id,
      status: raw.status === 'success' ? 'completed' : raw.status,
      description: raw.label,
      startedAt: raw.startedAt,
      completedAt,
      tokensUsed: raw.tokens ?? 0,
      costUSD: 0,
      model: raw.agent,
    };
  }

  const rawTraces: any[] = [];
  const now = Date.now();

  live.forEach(({ designation, status }, si) => {
    // Active plan steps
    if (status.active_plan) {
      rawTraces.push({
        id: `trace-plan-${si}`,
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
      const durationStr = `${(100 + Math.random() * 300).toFixed(0)}ms`;
      rawTraces.push({
        id: `trace-thought-${si}-${ti}`,
        label: `${thought.type}: ${thought.content?.slice(0, 60) ?? '—'}`,
        agent: designation,
        status: 'success',
        duration: durationStr,
        startedAt: new Date((thought.created_at ?? now / 1000) * 1000 - ti * 3000).toISOString(),
        tokens: thought.type === 'plan' ? Math.floor(200 + Math.random() * 600) : null,
      });
    });

    // Free energy components as system traces
    status.free_energy?.components?.forEach((comp: any, ci: number) => {
      rawTraces.push({
        id: `trace-fe-${si}-${ci}`,
        label: `${comp.system}: surprise=${comp.surprise}, contribution=${comp.contribution}`,
        agent: designation,
        status: 'success',
        duration: '1ms',
        startedAt: new Date(now - (si * 3 + ci) * 1000).toISOString(),
        tokens: null,
      });
    });

    // Cycle count as a system status trace
    rawTraces.push({
      id: `trace-cycles-${si}`,
      label: `cycle ${status.total_cycles} complete — mode: ${status.mode}, regime: ${status.free_energy?.regime ?? '—'}`,
      agent: designation,
      status: status.dormant ? 'idle' : 'success',
      duration: '—',
      startedAt: new Date(now - si * 5000).toISOString(),
      tokens: null,
    });
  });

  // Sort by recency, transform to AgentTask shape
  rawTraces.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  const tasks = rawTraces.slice(0, 20).map(toAgentTask);

  return NextResponse.json(tasks);
}
