import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { text, trigger = 'api' } = body;

  try {
    const routine = await prisma.routine.findFirst({ where: { id, userId: session.user.id } });
    if (!routine) return Response.json({ error: 'Not found' }, { status: 404 });

    const run = await prisma.routineRun.create({
      data: { routineId: routine.id, trigger, input: text || null, status: 'running' },
    });
    await prisma.routine.update({
      where: { id: routine.id },
      data: { lastRunAt: new Date(), runCount: { increment: 1 } },
    });

    return Response.json({ runId: run.id, status: 'running', message: 'Routine triggered.' });
  } catch (error) {
    console.error('[routines] trigger failed:', error);
    return Response.json({ error: 'Failed to trigger routine' }, { status: 500 });
  }
}
