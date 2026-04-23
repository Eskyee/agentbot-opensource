'use server'

import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { ensureLocalUser } from '@/lib/social/identity'
import { revalidatePath } from 'next/cache'

/**
 * Toggle follow status for an agent
 */
export async function toggleFollowAgent(targetAgentId: string) {
  const session = await getAuthSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const localUser = await ensureLocalUser(session.user.id)
  
  const myAgents = await prisma.socialAgent.findMany({
    where: { ownerUserId: localUser.id },
  })
  
  if (myAgents.length === 0) {
    throw new Error('You need a registered agent to follow others')
  }

  const myAgent = myAgents[0]
  const followerAgentId = myAgent.id

  if (followerAgentId === targetAgentId) {
    throw new Error('Cannot follow your own agent')
  }

  const existing = await prisma.socialFollow.findFirst({
    where: { followerAgentId, followedAgentId: targetAgentId },
  })

  if (existing) {
    await prisma.socialFollow.delete({ where: { id: existing.id } })
  } else {
    const targetAgent = await prisma.socialAgent.findUnique({ where: { id: targetAgentId } })
    if (!targetAgent) throw new Error('Target agent not found')

    await prisma.socialFollow.create({
      data: { followerAgentId, followedAgentId: targetAgentId },
    })

    // Notify
    if (targetAgent.ownerUserId) {
      await prisma.socialNotification.create({
        data: {
          userId: targetAgent.ownerUserId,
          type: 'follow',
          payload: { actorAgentId: followerAgentId, actorAgentName: myAgent.name },
        },
      })
    }
  }

  revalidatePath(`/social/agents/${targetAgentId}`)
  return { following: !existing }
}

/**
 * Toggle community membership
 */
export async function toggleJoinCommunity(idOrSlug: string) {
  const session = await getAuthSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const localUser = await ensureLocalUser(session.user.id)

  const community = await prisma.community.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    }
  })

  if (!community) throw new Error('Community not found')
  const communityId = community.id

  const existing = await prisma.communityMembership.findUnique({
    where: { communityId_userId: { communityId, userId: localUser.id } },
  })

  if (existing) {
    await prisma.$transaction([
      prisma.communityMembership.delete({ where: { id: existing.id } }),
      prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      }),
    ])
  } else {
    await prisma.$transaction([
      prisma.communityMembership.create({
        data: { communityId, userId: localUser.id },
      }),
      prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      }),
    ])
  }

  revalidatePath('/social')
  revalidatePath(`/social/c/${community.slug}`)
  return { joined: !existing }
}

/**
 * Vote on a post
 */
export async function votePost(postId: string, value: number) {
  const session = await getAuthSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (value !== 1 && value !== -1) throw new Error('Invalid vote value')

  const localUser = await ensureLocalUser(session.user.id)

  const existing = await prisma.socialVote.findFirst({
    where: { postId, userId: localUser.id },
  })

  if (existing) {
    if (existing.value === value) {
      // Remove vote if same value (toggle off)
      await prisma.$transaction([
        prisma.socialVote.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { voteCount: { decrement: value } } }),
      ])
      revalidatePath('/social')
      return { voteCount: (await prisma.post.findUnique({ where: { id: postId } }))?.voteCount || 0, voted: false }
    } else {
      // Switch vote
      const diff = value - existing.value
      await prisma.$transaction([
        prisma.socialVote.update({ where: { id: existing.id }, data: { value } }),
        prisma.post.update({ where: { id: postId }, data: { voteCount: { increment: diff } } }),
      ])
    }
  } else {
    // New vote
    await prisma.$transaction([
      prisma.socialVote.create({ data: { postId, userId: localUser.id, value } }),
      prisma.post.update({ where: { id: postId }, data: { voteCount: { increment: value } } }),
    ])
  }

  revalidatePath('/social')
  revalidatePath(`/social/p/${postId}`)
  const updated = await prisma.post.findUnique({ where: { id: postId }, select: { voteCount: true } })
  return { voteCount: updated?.voteCount || 0, voted: true }
}
