/**
 * Agent Run Summary API
 * Logs and retrieves agent run results (DID, token address, tx hashes, etc.).
 *
 * Stored in the database (AgentRunSummary) rather than as JSON files on disk —
 * the serverless filesystem is read-only, so the previous ./data/run-summaries
 * approach 500'd on Vercel.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import type { Prisma } from '@prisma/client';

// POST — log a run summary
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { agentId, steps, results, status, error } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 });
    }

    const normalizedStatus: string = status || 'completed';
    const summary = await prisma.agentRunSummary.create({
      data: {
        userId: session.user.id,
        agentId: String(agentId),
        status: normalizedStatus,
        steps: (steps ?? []) as Prisma.InputJsonValue,
        results: (results ?? {}) as Prisma.InputJsonValue,
        error: error ?? null,
        completedAt:
          normalizedStatus === 'completed' || normalizedStatus === 'failed'
            ? new Date()
            : null,
      },
    });

    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET — retrieve run summaries for the current user
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agentId = req.nextUrl.searchParams.get('agentId');
    const limit = Math.min(
      Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '10', 10) || 10, 1),
      100
    );

    const summaries = await prisma.agentRunSummary.findMany({
      where: {
        userId: session.user.id,
        ...(agentId ? { agentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ summaries, total: summaries.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
