import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { triggerType = 'manual', payload } = body;

  try {
    const automation = await prisma.automation.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!automation) return Response.json({ error: 'Not found' }, { status: 404 });
    if (automation.status !== 'active')
      return Response.json({ error: 'Automation is paused' }, { status: 400 });

    if (automation.invocationLimit && automation.invocationWindow) {
      const windowMs = parseWindow(automation.invocationWindow);
      const windowStart = new Date(Date.now() - windowMs);
      const recentRuns = await prisma.automationRun.count({
        where: { automationId: automation.id, startedAt: { gte: windowStart } },
      });
      if (recentRuns >= automation.invocationLimit)
        return Response.json({ error: 'Invocation limit reached' }, { status: 429 });
    }

    const run = await prisma.automationRun.create({
      data: {
        automationId: automation.id,
        triggerType,
        triggerPayload: payload || null,
        status: 'running',
      },
    });
    await prisma.automation.update({
      where: { id: automation.id },
      data: { lastFiredAt: new Date(), fireCount: { increment: 1 } },
    });

    return Response.json({ runId: run.id, status: 'running', message: 'Automation triggered.' });
  } catch (error) {
    console.error('[automations] trigger failed:', error);
    return Response.json({ error: 'Failed to trigger automation' }, { status: 500 });
  }
}

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(m|h|d)$/);
  if (!match) return 3600000;
  const [, num, unit] = match;
  const n = parseInt(num);
  if (unit === 'm') return n * 60 * 1000;
  if (unit === 'd') return n * 24 * 60 * 60 * 1000;
  return n * 60 * 60 * 1000;
}
