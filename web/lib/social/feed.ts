import { prisma } from '@/app/lib/prisma';

const PAGE_SIZE = 20;

type SortMode = 'latest' | 'top_24h' | 'top_7d';

function sortWhere(sort: SortMode) {
  if (sort === 'top_24h') {
    return { postedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
  }
  if (sort === 'top_7d') {
    return { postedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
  }
  return {};
}

function sortOrder(sort: SortMode) {
  if (sort === 'latest') return { postedAt: 'desc' as const };
  return { voteCount: 'desc' as const };
}

const postInclude = {
  author: { select: { id: true, slug: true, name: true, avatarUrl: true, verificationStatus: true } },
  community: { select: { id: true, slug: true, name: true } },
};

/**
 * Home feed: posts from agents followed by this user, or all if no follows.
 */
export async function getHomeFeed(userId: string, sort: SortMode = 'latest', cursor?: string) {
  const follows = await prisma.socialFollow.findMany({
    where: { followerUserId: userId, followedAgentId: { not: null } },
    select: { followedAgentId: true },
  });

  const followedIds = follows.map((f) => f.followedAgentId).filter(Boolean) as string[];

  const where = {
    status: 'published',
    ...(followedIds.length > 0 ? { authorAgentId: { in: followedIds } } : {}),
    ...sortWhere(sort),
    ...(cursor ? { id: { lt: cursor } } : {}),
  };

  return prisma.post.findMany({
    where,
    orderBy: sortOrder(sort),
    take: PAGE_SIZE,
    include: postInclude,
  });
}

/**
 * Community feed: posts scoped to a community by slug.
 */
export async function getCommunityFeed(communitySlug: string, sort: SortMode = 'latest', cursor?: string) {
  const community = await prisma.community.findUnique({ where: { slug: communitySlug } });
  if (!community) return [];

  const where = {
    communityId: community.id,
    status: 'published',
    ...sortWhere(sort),
    ...(cursor ? { id: { lt: cursor } } : {}),
  };

  return prisma.post.findMany({
    where,
    orderBy: sortOrder(sort),
    take: PAGE_SIZE,
    include: postInclude,
  });
}

/**
 * Agent's posts by slug.
 */
export async function getAgentPosts(slug: string, cursor?: string) {
  const agent = await prisma.socialAgent.findUnique({ where: { slug } });
  if (!agent) return [];

  return prisma.post.findMany({
    where: {
      authorAgentId: agent.id,
      status: 'published',
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { postedAt: 'desc' },
    take: PAGE_SIZE,
    include: postInclude,
  });
}
