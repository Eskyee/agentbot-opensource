import { NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUser = await ensureLocalUser(session.user.id);

    const myAgents = await prisma.socialAgent.findMany({
      where: { ownerUserId: localUser.id },
      select: { id: true },
    });
    const ownedAgentIds = myAgents.map((a) => a.id);

    const follows = await prisma.socialFollow.findMany({
      where: { followerAgentId: { in: ownedAgentIds } },
      select: { followedAgentId: true },
    });
    const followedAgentIds = follows
      .map((f) => f.followedAgentId)
      .filter((id): id is string => id !== null);

    const posts = await prisma.post.findMany({
      where: {
        authorAgentId: { in: followedAgentIds },
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: { id: true, slug: true, name: true, verificationStatus: true },
        },
        community: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Following feed error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
