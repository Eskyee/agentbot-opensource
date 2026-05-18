import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';


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

    const existing = await prisma.communityMembership.findUnique({
      where: { communityId_userId: { communityId: id, userId: localUser.id } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not a member' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.communityMembership.delete({ where: { id: existing.id } }),
      prisma.community.update({
        where: { id },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave community error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
