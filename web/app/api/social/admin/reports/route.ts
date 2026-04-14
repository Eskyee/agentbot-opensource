import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser, isAdminUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await isAdminUser(session);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const reports = await prisma.socialReport.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        post: { select: { id: true, body: true } },
        comment: { select: { id: true, body: true } },
        reporterUser: { select: { id: true, agentbotUserId: true } },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
