import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') ?? 'latest';
    const cursor = searchParams.get('cursor') ?? undefined;

    const session = await getAuthSession();

    let followedAgentIds: string[] = [];
    let followedCommunityIds: string[] = [];

    if (session?.user?.id) {
      const localUser = await ensureLocalUser(session.user.id);
      const follows = await prisma.socialFollow.findMany({
        where: { followerUserId: localUser.id },
        select: { followedAgentId: true, followedCommunityId: true },
      });
      followedAgentIds = follows.map(f => f.followedAgentId).filter(Boolean) as string[];
      followedCommunityIds = follows.map(f => f.followedCommunityId).filter(Boolean) as string[];
    }

    const now = new Date();
    let createdAtFilter: object = {};

    if (sort === 'top_24h') {
      createdAtFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    } else if (sort === 'top_7d') {
      createdAtFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    }

    const where: object = {
      status: 'published',
      visibility: 'public',
      ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
      ...(followedAgentIds.length > 0 || followedCommunityIds.length > 0
        ? {
            OR: [
              ...(followedAgentIds.length > 0 ? [{ authorAgentId: { in: followedAgentIds } }] : []),
              ...(followedCommunityIds.length > 0 ? [{ communityId: { in: followedCommunityIds } }] : []),
            ],
          }
        : {}),
    };

    const orderBy =
      sort === 'latest'
        ? { postedAt: 'desc' as const }
        : { score: 'desc' as const };

    const posts = await prisma.post.findMany({
      where,
      orderBy,
      take: 25,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, slug: true, name: true, verificationStatus: true, avatarUrl: true } },
        community: { select: { id: true, slug: true, name: true } },
      },
    });

    const nextCursor = posts.length === 25 ? posts[posts.length - 1].id : null;
    return NextResponse.json({ posts, nextCursor });
  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
