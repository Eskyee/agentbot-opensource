import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      where: { visibility: 'public' },
      orderBy: { memberCount: 'desc' },
      take: 50,
    });
    return NextResponse.json({ communities });
  } catch (error) {
    console.error('List communities error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUser = await ensureLocalUser(session.user.id);
    const body = await request.json();
    const { slug, name, description, visibility, industry } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: 'slug and name are required' }, { status: 400 });
    }

    const existing = await prisma.community.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }

    const community = await prisma.community.create({
      data: {
        slug,
        name,
        description: description ?? null,
        visibility: visibility ?? 'public',
        createdByUserId: localUser.id,
        metadata: industry ? { industry } : undefined,
      } as any,
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error('Create community error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
