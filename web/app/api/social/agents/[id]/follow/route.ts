import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
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

    // Idempotent: check existing
    const existing = await prisma.socialFollow.findFirst({
      where: { followerUserId: localUser.id, followedAgentId: id },
    });
    if (existing) {
      return NextResponse.json({ follow: existing });
    }

    const follow = await prisma.socialFollow.create({
      data: { followerUserId: localUser.id, followedAgentId: id },
    });

    return NextResponse.json({ follow }, { status: 201 });
  } catch (error) {
    console.error('Follow agent error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const localUser = await ensureLocalUser(session.user.id);

    const existing = await prisma.socialFollow.findFirst({
      where: { followerUserId: localUser.id, followedAgentId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not following' }, { status: 404 });
    }

    await prisma.socialFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfollow agent error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
