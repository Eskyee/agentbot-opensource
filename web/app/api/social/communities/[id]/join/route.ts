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

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const existing = await prisma.communityMembership.findUnique({
      where: { communityId_userId: { communityId: id, userId: localUser.id } },
    });
    if (existing) {
      return NextResponse.json({ membership: existing });
    }

    const [membership] = await prisma.$transaction([
      prisma.communityMembership.create({
        data: { communityId: id, userId: localUser.id },
      }),
      prisma.community.update({
        where: { id },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error('Join community error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
