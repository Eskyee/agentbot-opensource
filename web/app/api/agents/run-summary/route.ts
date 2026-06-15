/**
 * Agent Run Summary API
 * Logs and retrieves agent run results (DID, token address, tx hashes, etc.)
 * Inspired by 1Claw's run-summary.json pattern.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const SUMMARIES_DIR = join(process.cwd(), 'data', 'run-summaries');

async function ensureDir() {
  if (!existsSync(SUMMARIES_DIR)) {
    await mkdir(SUMMARIES_DIR, { recursive: true });
  }
}

type RunSummary = {
  id: string;
  agentId: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  steps: RunStep[];
  results: Record<string, unknown>;
  error: string | null;
};

type RunStep = {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  output: Record<string, unknown> | null;
  error: string | null;
};

// POST — log a run summary
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { agentId, steps, results, status, error } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 });
    }

    const summary: RunSummary = {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      userId: session.user.email,
      startedAt: new Date().toISOString(),
      completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
      status: status || 'completed',
      steps: steps || [],
      results: results || {},
      error: error || null,
    };

    await ensureDir();
    const filePath = join(SUMMARIES_DIR, `${summary.id}.json`);
    await writeFile(filePath, JSON.stringify(summary, null, 2));

    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET — retrieve run summaries for the current user
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDir();
    const agentId = req.nextUrl.searchParams.get('agentId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);

    const { readdirSync } = await import('fs');
    const files = readdirSync(SUMMARIES_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    const summaries: RunSummary[] = [];
    for (const file of files) {
      try {
        const data = JSON.parse(await readFile(join(SUMMARIES_DIR, file), 'utf-8'));
        if (data.userId === session.user.email) {
          if (!agentId || data.agentId === agentId) {
            summaries.push(data);
          }
        }
      } catch {}
    }

    return NextResponse.json({ summaries, total: summaries.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
