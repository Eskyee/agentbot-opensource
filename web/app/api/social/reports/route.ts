import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const localUser = await ensureLocalUser(session.user.id);
    const body = await request.json();
    const { postId, commentId, reportedAgentId, reason, details } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }
    if (!postId && !commentId && !reportedAgentId) {
      return NextResponse.json({ error: 'One of postId, commentId, or reportedAgentId is required' }, { status: 400 });
    }

    const report = await prisma.socialReport.create({
      data: {
        reporterUserId: localUser.id,
        postId: postId ?? null,
        commentId: commentId ?? null,
        reportedAgentId: reportedAgentId ?? null,
        reason: reason.trim(),
        details: details?.trim() ?? null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
