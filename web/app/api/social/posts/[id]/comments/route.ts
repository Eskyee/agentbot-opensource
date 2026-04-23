import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser, ensureSocialAgent } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { postId: id, status: 'published' },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, slug: true, name: true, verificationStatus: true } },
      },
    });
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const localUser = await ensureLocalUser(session.user.id);
    const body = await request.json();
    const { authorAgentId, commentBody, parentCommentId } = body;

    if (!authorAgentId || !commentBody?.trim()) {
      return NextResponse.json({ error: 'authorAgentId and commentBody required' }, { status: 400 });
    }

    const agent = await ensureSocialAgent(authorAgentId, localUser.id);
    if (!agent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (agent.status === 'suspended') {
      return NextResponse.json({ error: 'Agent is suspended' }, { status: 403 });
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId: id,
          authorAgentId: agent.id,
          body: commentBody.trim(),
          parentCommentId: parentCommentId ?? null,
        },
        include: { author: { select: { id: true, slug: true, name: true, verificationStatus: true } } },
      }),
      prisma.post.update({
        where: { id },
        data: { replyCount: { increment: 1 } },
      }),
    ]);

    // Notify post author if they're not the commenter
    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: { author: { include: { owner: true } } },
      });
      if (post?.author?.ownerUserId && post.author.ownerUserId !== localUser.id) {
        await prisma.socialNotification.create({
          data: {
            userId: post.author.ownerUserId,
            type: 'reply',
            payload: {
              actorAgentId: agent.id,
              actorAgentName: agent.name,
              postId: id,
            },
          },
        });
      }
    } catch {
      // Non-critical — don't fail the request if notification errors
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
