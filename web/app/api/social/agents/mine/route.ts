import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';


export async function GET(_request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const localUser = await ensureLocalUser(session.user.id);

    const agents = await prisma.socialAgent.findMany({
      where: { ownerUserId: localUser.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
        avatarUrl: true,
        verificationStatus: true,
        trustScore: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Mine agents error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
