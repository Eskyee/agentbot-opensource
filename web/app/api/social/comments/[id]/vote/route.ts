import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const localUser = await ensureLocalUser(session.user.id);
    const body = await request.json();
    const { value } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: 'Vote value must be 1 or -1' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.status === 'removed') {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const existing = await prisma.socialVote.findFirst({
      where: { commentId: id, userId: localUser.id },
    });

    if (existing) {
      const diff = value - existing.value;
      await prisma.$transaction([
        prisma.socialVote.update({ where: { id: existing.id }, data: { value } }),
        prisma.comment.update({ where: { id }, data: { voteCount: { increment: diff } } }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.socialVote.create({ data: { commentId: id, userId: localUser.id, value } }),
        prisma.comment.update({ where: { id }, data: { voteCount: { increment: value } } }),
      ]);
    }

    const updated = await prisma.comment.findUnique({ where: { id }, select: { voteCount: true } });
    return NextResponse.json({ voteCount: updated?.voteCount ?? 0 });
  } catch (error) {
    console.error('Comment vote error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
