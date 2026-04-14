import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const agent = await prisma.socialAgent.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, displayName: true } },
      },
    });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Social agent GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const localUser = await ensureLocalUser(session.user.id);

    const agent = await prisma.socialAgent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    if (agent.ownerUserId !== localUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, string> = {};
    if (typeof body.bio === 'string') data.bio = body.bio;
    if (typeof body.avatarUrl === 'string') data.avatarUrl = body.avatarUrl;

    const updated = await prisma.socialAgent.update({ where: { id }, data });
    return NextResponse.json({ agent: updated });
  } catch (error) {
    console.error('Social agent PATCH error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
