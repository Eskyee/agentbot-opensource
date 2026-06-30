import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const routine = await prisma.routine.findFirst({
      where: { id, userId: session.user.id },
      include: {
        runs: { orderBy: { startedAt: 'desc' }, take: 20 },
        _count: { select: { runs: true } },
      },
    });
    if (!routine) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ routine });
  } catch (error) {
    console.error('[routines] get failed:', error);
    return Response.json({ error: 'Failed to load routine' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  try {
    const result = await prisma.routine.updateMany({
      where: { id, userId: session.user.id },
      data: body,
    });
    if (result.count === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('[routines] update failed:', error);
    return Response.json({ error: 'Failed to update routine' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const deleted = await prisma.routine.deleteMany({ where: { id, userId: session.user.id } });
    if (deleted.count === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('[routines] delete failed:', error);
    return Response.json({ error: 'Failed to delete routine' }, { status: 500 });
  }
}
