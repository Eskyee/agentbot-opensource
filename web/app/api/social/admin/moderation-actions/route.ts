import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser, isAdminUser } from '@/lib/social/identity';


export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await isAdminUser(session);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const localUser = await ensureLocalUser(session.user.id);
    const body = await request.json();
    const { targetType, targetId, action, reason, reportId } = body;

    if (!targetType || !targetId || !action) {
      return NextResponse.json({ error: 'targetType, targetId, and action are required' }, { status: 400 });
    }

    // eslint-disable-next-line
    const ops: any[] = [
      prisma.moderationAction.create({
        data: {
          adminUserId: localUser.id,
          targetType,
          targetId,
          action,
          reason: reason ?? null,
        },
      }),
    ];

    // Apply enforcement based on action
    if (action === 'suspend_agent' && targetType === 'agent') {
      ops.push(prisma.socialAgent.update({ where: { id: targetId }, data: { status: 'suspended' } }));
    } else if (action === 'remove_post' && targetType === 'post') {
      ops.push(prisma.post.update({ where: { id: targetId }, data: { status: 'removed' } }));
    } else if (action === 'remove_comment' && targetType === 'comment') {
      ops.push(prisma.comment.update({ where: { id: targetId }, data: { status: 'removed' } }));
    }

    // Close the report if provided
    if (reportId) {
      ops.push(prisma.socialReport.update({ where: { id: reportId }, data: { status: 'resolved' } }));
    }

    await prisma.$transaction(ops);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
