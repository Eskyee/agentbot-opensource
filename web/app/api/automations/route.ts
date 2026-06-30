import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';

let prisma: any = null;
async function getPrisma() {
  if (!prisma) {
    const mod = await import('@/app/lib/prisma');
    prisma = mod.prisma;
  }
  return prisma;
}

export const maxDuration = 300;

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getPrisma();
    const automations = await db.automation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { runs: true } } },
    });

    return Response.json({ automations });
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return Response.json({ automations: [], setupRequired: true });
    }
    console.error('[automations] list failed:', error);
    return Response.json({ error: 'Failed to load automations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    name,
    description,
    triggers,
    conditions,
    action,
    mcpServers,
    acuLimit,
    invocationLimit,
    invocationWindow,
  } = body;

  if (!name || !triggers || !action) {
    return Response.json({ error: 'Name, triggers, and action required' }, { status: 400 });
  }

  try {
    const db = await getPrisma();
    const automation = await db.automation.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        triggers,
        conditions: conditions || [],
        action,
        mcpServers: mcpServers || [],
        acuLimit: acuLimit || null,
        invocationLimit: invocationLimit || null,
        invocationWindow: invocationWindow || null,
      },
    });

    return Response.json({ automation });
  } catch (error) {
    console.error('[automations] create failed:', error);
    return Response.json({ error: 'Failed to create automation' }, { status: 500 });
  }
}
