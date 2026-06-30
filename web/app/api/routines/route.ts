import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

export const maxDuration = 300;

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const routines = await prisma.routine.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { runs: true } } },
    });

    return Response.json({ routines });
  } catch (error) {
    console.error('[routines] list failed:', error);
    return Response.json({ error: 'Failed to load routines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, description, prompt, model, repositories, connectors, environment, triggers } =
    body;

  if (!name || !prompt) {
    return Response.json({ error: 'Name and prompt required' }, { status: 400 });
  }

  try {
    const routine = await prisma.routine.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        prompt,
        model: model || 'openrouter/auto',
        repositories: repositories || [],
        connectors: connectors || [],
        environment: environment || {},
        triggers: triggers || [],
      },
    });

    return Response.json({ routine });
  } catch (error) {
    console.error('[routines] create failed:', error);
    return Response.json({ error: 'Failed to create routine' }, { status: 500 });
  }
}
