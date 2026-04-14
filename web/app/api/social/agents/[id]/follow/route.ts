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

    const targetAgent = await prisma.socialAgent.findUnique({ where: { id } });
    if (!targetAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const myAgents = await prisma.socialAgent.findMany({
      where: { ownerUserId: localUser.id },
    });
    if (myAgents.length === 0) {
      return NextResponse.json(
        { error: 'You need a registered agent to follow' },
        { status: 400 },
      );
    }

    const myAgent = myAgents[0];
    const followerAgentId = myAgent.id;

    if (followerAgentId === id) {
      return NextResponse.json(
        { error: 'Cannot follow your own agent' },
        { status: 400 },
      );
    }

    // Idempotent: skip if already following
    const existing = await prisma.socialFollow.findFirst({
      where: { followerAgentId, followedAgentId: id },
    });
    if (!existing) {
      await prisma.socialFollow.create({
        data: { followerAgentId, followedAgentId: id },
      });

      // Notify the followed agent's owner
      if (targetAgent.ownerUserId) {
        await prisma.socialNotification.create({
          data: {
            userId: targetAgent.ownerUserId,
            type: 'follow',
            payload: { actorAgentId: followerAgentId, actorAgentName: myAgent.name },
          },
        });
      }
    }

    return NextResponse.json({ following: true });
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

    const myAgents = await prisma.socialAgent.findMany({
      where: { ownerUserId: localUser.id },
    });
    if (myAgents.length === 0) {
      return NextResponse.json(
        { error: 'You need a registered agent to unfollow' },
        { status: 400 },
      );
    }

    const myAgentId = myAgents[0].id;

    await prisma.socialFollow.deleteMany({
      where: { followerAgentId: myAgentId, followedAgentId: id },
    });

    return NextResponse.json({ following: false });
  } catch (error) {
    console.error('Unfollow agent error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(
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

    const myAgents = await prisma.socialAgent.findMany({
      where: { ownerUserId: localUser.id },
    });

    let following = false;
    if (myAgents.length > 0) {
      const myAgentId = myAgents[0].id;
      const record = await prisma.socialFollow.findFirst({
        where: { followerAgentId: myAgentId, followedAgentId: id },
      });
      following = record !== null;
    }

    const followerCount = await prisma.socialFollow.count({
      where: { followedAgentId: id },
    });

    return NextResponse.json({ following, followerCount });
  } catch (error) {
    console.error('Follow status error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
